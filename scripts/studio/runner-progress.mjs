import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { StringDecoder } from 'node:string_decoder';

const MAX_FILE_BYTES = 256 * 1024;
const MAX_LINE_BYTES = 16 * 1024;
const MAX_EVENTS = 500;
const labels = {
  command: 'Exécution d’une commande locale',
  write: 'Modification d’un fichier',
  read: 'Lecture d’un fichier déclarée par l’agent',
  search: 'Recherche de l’agent',
  message: 'Message de l’agent',
};

function parsedLine(line, onValue) {
  let value;
  try {
    value = JSON.parse(line);
  } catch {
    /* Ignore diagnostics. */
  }
  if (value && typeof value === 'object') onValue(value);
}

// Diagnostics and incomplete/oversized lines never become progress events.
export function jsonLines(onValue, maxLineBytes = MAX_LINE_BYTES) {
  const decoder = new StringDecoder('utf8');
  let pending = '',
    dropping = false;
  const receive = (chunk) => {
    const text = typeof chunk === 'string' ? chunk : decoder.write(chunk);
    const parts = text.split('\n');
    for (let index = 0; index < parts.length; index++) {
      if (!dropping) pending += parts[index];
      if (Buffer.byteLength(pending) > maxLineBytes) {
        pending = '';
        dropping = true;
      }
      if (index === parts.length - 1) continue;
      if (!dropping) parsedLine(pending, onValue);
      pending = '';
      dropping = false;
    }
  };
  // CLI EOF may terminate its final JSON record; file polling requires a newline.
  receive.end = () => receive(decoder.end() + '\n');
  return receive;
}

function shortText(value) {
  return typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= 160 &&
    !Array.from(value).some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
    ? value.trim()
    : null;
}

function localPath(directory, value) {
  if (typeof value !== 'string' || value.length > 500) return null;
  value = value.replaceAll('\\', '/');
  const app = path.join(directory, 'app');
  const absolute = path.isAbsolute(value) ? value : path.resolve(directory, value);
  const relative = path.relative(app, absolute).replaceAll('\\', '/');
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  if (relative.split('/').some((part) => part.startsWith('.') || !/^[\w .@()+-]+$/u.test(part)))
    return null;
  return relative;
}

function readPath(directory, value) {
  if (typeof value !== 'string') return null;
  value = value.replaceAll('\\', '/');
  if (path.isAbsolute(value) || value.split('/').includes('..')) return null;
  return localPath(directory, 'app/' + value);
}

function itemId(item, suffix = '') {
  if (typeof item.id !== 'string' || item.id.length > 256) return null;
  return (
    'cli-' +
    createHash('sha256')
      .update(JSON.stringify([item.id, suffix]))
      .digest('hex')
      .slice(0, 24)
  );
}

function itemStatus(event, item) {
  if (item.status === 'failed' || (Number.isInteger(item.exit_code) && item.exit_code !== 0))
    return 'failed';
  return event.type === 'item.completed' ? 'completed' : 'running';
}

function planEvent(value, native = false) {
  const items = native ? value.items : value.steps;
  if (!Array.isArray(items) || items.length < 1 || items.length > 40) return null;
  const steps = items.map((step, index) => ({
    id: native ? `step-${index + 1}` : step?.id,
    title: shortText(native ? step?.text : step?.title),
    status: native ? (step?.completed === true ? 'completed' : 'pending') : step?.status,
  }));
  if (
    steps.some(
      (step) =>
        typeof step.id !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,80}$/u.test(step.id) ||
        !step.title ||
        !['pending', 'running', 'completed', 'blocked'].includes(step.status),
    )
  )
    return null;
  if (new Set(steps.map((step) => step.id)).size !== steps.length) return null;
  const title = native ? 'Plan de l’agent' : shortText(value.title);
  return title ? { type: 'plan', title, steps } : null;
}

function cliActions(event, directory) {
  const item = event.item;
  const id = itemId(item);
  if (!id) return [];
  const status = itemStatus(event, item);
  if (item.type === 'file_change')
    return (Array.isArray(item.changes) ? item.changes : [])
      .slice(0, 80)
      .map((change) => localPath(directory, change?.path))
      .filter(Boolean)
      .map((file) => ({
        type: 'action',
        id: itemId(item, file),
        kind: 'write',
        label: labels.write,
        status,
        path: file,
      }));
  const kind = { command_execution: 'command', web_search: 'search', agent_message: 'message' }[
    item.type
  ];
  return kind ? [{ type: 'action', id, kind, label: labels[kind], status }] : [];
}

function fileReader(directory, onValue) {
  const file = path.join(directory, 'progress.jsonl');
  const decode = jsonLines(onValue);
  let offset = 0,
    identity = null,
    exhausted = false;
  return () => {
    if (exhausted) return;
    let fd;
    try {
      // Windows does not enforce O_NOFOLLOW. Compare the named file with the
      // opened descriptor before decoding, including replacement during open.
      const before = fs.lstatSync(file);
      if (!before.isFile()) {
        exhausted = true;
        return;
      }
      fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
      const stat = fs.fstatSync(fd);
      const after = fs.lstatSync(file);
      if (
        !after.isFile() ||
        before.dev !== stat.dev ||
        before.ino !== stat.ino ||
        after.dev !== stat.dev ||
        after.ino !== stat.ino
      ) {
        exhausted = true;
        return;
      }
      const key = `${stat.dev}:${stat.ino}`;
      if (
        !stat.isFile() ||
        stat.size > MAX_FILE_BYTES ||
        stat.size < offset ||
        (identity && identity !== key)
      ) {
        exhausted = true;
        return;
      }
      identity = key;
      const buffer = Buffer.alloc(stat.size - offset);
      const bytes = fs.readSync(fd, buffer, 0, buffer.length, offset);
      offset += bytes;
      decode(buffer.subarray(0, bytes));
    } catch (error) {
      if (error.code !== 'ENOENT') exhausted = true;
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
  };
}

export function createRunnerProgress({ directory, jobId, jobs, signal, timeoutMs, pollMs = 100 }) {
  let stopped = false,
    sequence = 0,
    filePlan = false,
    lastPlan = '';
  const actions = new Map();
  const publish = (event) => {
    if (stopped || signal.aborted || sequence >= MAX_EVENTS) return;
    const key = JSON.stringify(event);
    if (event.type === 'plan' && key === lastPlan) return;
    const previous = actions.get(event.id);
    if (
      event.type === 'action' &&
      (previous?.key === key ||
        previous?.event.status === 'failed' ||
        previous?.event.status === 'completed')
    )
      return;
    try {
      jobs.reportProgress({ jobId, eventId: `runner-${++sequence}`, event }, 'runner');
      if (event.type === 'plan') lastPlan = key;
      else actions.set(event.id, { key, event });
    } catch {
      /* Malformed, bounded or late progress must not relaunch or fail a job. */
    }
  };
  const readFile = fileReader(directory, (value) => {
    if (value.type === 'plan') {
      const plan = planEvent(value);
      if (plan) {
        filePlan = true;
        publish(plan);
      }
    } else if (value.type === 'action' && value.kind === 'read') {
      const file = readPath(directory, value.path);
      if (
        file &&
        typeof value.id === 'string' &&
        /^[a-zA-Z0-9_-]{1,80}$/u.test(value.id) &&
        ['running', 'completed', 'failed'].includes(value.status)
      )
        publish({
          type: 'action',
          id: `read-${value.id}`,
          kind: 'read',
          label: labels.read,
          status: value.status,
          path: file,
        });
    }
  });
  const poll = setInterval(readFile, pollMs);
  const deadline = setTimeout(() => stop(false), timeoutMs);
  poll.unref();
  deadline.unref();

  function stop(flush = true) {
    if (stopped) return;
    if (flush && !signal.aborted) readFile();
    stopped = true;
    clearInterval(poll);
    clearTimeout(deadline);
    signal.removeEventListener('abort', abort);
  }

  const abort = () => stop(false);
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) stop(false);
  return {
    onEvent(event) {
      if (
        stopped ||
        !['item.started', 'item.updated', 'item.completed'].includes(event?.type) ||
        !event.item
      )
        return;
      readFile();
      if (event.item.type === 'todo_list') {
        const plan = planEvent(event.item, true);
        if (!filePlan && plan) publish(plan);
      } else cliActions(event, directory).forEach(publish);
    },
    finish() {
      if (!stopped && !signal.aborted) readFile();
      stop(false);
    },
    stop,
  };
}
