import fs from 'node:fs';
import path from 'node:path';
const fault = 'healthy';
const [file, command, raw, ...extra] = process.argv.slice(2);
const fail = (code) => { throw Object.assign(new Error(code), { code }); };
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const validId = (v) => typeof v === 'string' && /^[a-z][a-z0-9-]{0,31}$/.test(v);
const title = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
const known = (v, keys) => object(v) && Object.keys(v).every((k) => keys.includes(k));
function load() {
  if (!fs.existsSync(file)) return { version: 1, jobs: [] };
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) {
    if (fault === 'integrity') return { version: 1, jobs: [] };
    fail(error instanceof SyntaxError ? 'invalid-data' : 'storage-error');
  }
  if (!known(data, ['version', 'jobs']) || data.version !== 1 || !Array.isArray(data.jobs) || data.jobs.some((j) => !known(j, ['id', 'title', 'status', 'category']) || !validId(j.id) || !title(j.title, 80) || j.title !== j.title.trim() || !['open', 'done'].includes(j.status) || ('category' in j && (!title(j.category, 40) || j.category !== j.category.trim()))) || new Set(data.jobs.map((j) => j.id)).size !== data.jobs.length) fail('invalid-data');
  return data;
}
try {
  if (!file || !['list', 'add', 'finish'].includes(command) || extra.length || (command === 'list' ? raw !== undefined : raw === undefined)) fail('invalid-input');
  let input;
  if (command !== 'list') {
    try { input = JSON.parse(raw); } catch { fail('invalid-input'); }
    if (!known(input, command === 'add' ? ['id', 'title', 'category'] : ['id']) || !validId(input.id)) fail('invalid-input');
    if (command === 'add' && (!title(input.title, 80) || ('category' in input && !title(input.category, 40)))) fail('invalid-input');
    if (command === 'add') {
      input.title = input.title.trim();
      if ('category' in input) input.category = input.category.trim();
    }
  }
  const data = load();
  let result;
  if (command === 'list') result = data.jobs.toSorted((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  else {
    let job = data.jobs.find((j) => j.id === input.id);
    if (command === 'add') {
      if (job) {
        if (fault !== 'intake' && (job.title !== input.title || job.category !== input.category)) fail('conflict');
        if (fault === 'finality') job.status = 'open';
      } else {
        job = { id: input.id, title: input.title, status: 'open' };
        if ('category' in input && fault !== 'category') job.category = input.category;
        data.jobs.push(job);
      }
    } else {
      if (!job) fail('not-found');
      job.status = 'done';
    }
    result = job;
    if (fault !== 'durability') {
      const temp = path.resolve(`${file}.${process.pid}.tmp`);
      fs.writeFileSync(temp, JSON.stringify(data));
      fs.renameSync(temp, file);
    }
  }
  process.stdout.write(JSON.stringify(result) + '\n');
} catch (error) {
  const accepted = ['invalid-input', 'conflict', 'not-found', 'invalid-data', 'storage-error'];
  process.stderr.write(JSON.stringify({ error: accepted.includes(error.code) ? error.code : 'storage-error' }) + '\n');
  process.exitCode = 1;
}
