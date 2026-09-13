import { spawn } from 'node:child_process';
import { codexEnvironment } from './codex.mjs';

/** Private stdio server, bounded lifetime. Never attaches to the desktop daemon. */
export function startCodexRpc({ cwd, timeoutMs = 120000, onEvent = () => {}, command = 'codex', args = ['app-server', '--stdio', '--disable', 'apps', '--disable', 'plugins', '--disable', 'remote_plugin'] }) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw new Error('Invalid RPC lifetime');
  const child = spawn(command, args,
    { cwd, env: codexEnvironment(), detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map(); let next = 0, buffer = '', bytes = 0, stopped = false;
  const kill = () => { try { process.platform === 'win32' ? child.kill('SIGKILL') : process.kill(-child.pid, 'SIGKILL'); } catch {} };
  function close(error = new Error('RPC server closed')) {
    if (stopped) return; stopped = true; clearTimeout(timer); process.removeListener('exit',kill); kill();
    for (const { reject } of pending.values()) reject(error); pending.clear();
  }
  process.once('exit',kill);
  const timer = setTimeout(() => close(new Error('RPC lifetime exceeded')), timeoutMs);
  function send(message) { if (stopped) throw new Error('RPC closed'); child.stdin.write(JSON.stringify(message)+'\n'); }
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    bytes += Buffer.byteLength(chunk); if (bytes > 2*1024*1024) return close(new Error('RPC output limit'));
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0,end); buffer = buffer.slice(end+1); if (!line.trim()) continue;
      try {
        const message = JSON.parse(line);
        if ('id' in message && !message.method) {
          const call = pending.get(message.id); if (!call) continue; pending.delete(message.id);
          message.error ? call.reject(new Error(JSON.stringify(message.error))) : call.resolve(message.result);
        } else if ('id' in message) {
          // Unattended probes never approve tool execution or fulfill external requests.
          send({ id: message.id, error: { code: -32601, message: 'Client requests disabled in probe' } });
        } else onEvent(message);
      } catch (error) { close(error); }
    }
  });
  child.stderr.on('data', chunk => { bytes += chunk.length; if (bytes > 2*1024*1024) close(new Error('RPC output limit')); });
  child.on('error', close); child.on('close', () => close()); child.stdin.on('error', close);
  return { close, notify: send, call(method, params = {}) {
    if (stopped) return Promise.reject(new Error('RPC closed'));
    const id = ++next;
    return new Promise((resolve,reject) => { pending.set(id,{resolve,reject}); send({ id, method, params }); });
  } };
}
