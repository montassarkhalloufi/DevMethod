import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const root=path.resolve(process.argv[2]);
const record={format:1,criterion:'actual-session-continuity',outcome:'failed',origin:null,details:null};
try {
  const setup=JSON.parse(fs.readFileSync(path.join(root,'operator-setup.json'),'utf8'));
  record.origin=setup.origin;
  const file=path.join(root,'saved-jobs.json');
  const before=fs.readFileSync(file,'utf8');
  const r=spawnSync(process.execPath,[path.join(root,'app.mjs'),file,'list'],{encoding:'utf8',timeout:1500,maxBuffer:16384});
  assert.equal(r.status,0); assert.equal(r.stderr,'');
  assert.deepEqual(JSON.parse(r.stdout),setup.expected.jobs);
  assert.equal(fs.readFileSync(file,'utf8'),before);
  record.outcome=setup.origin==='created-through-initial-implementation'?'passed':'assisted';
} catch(error) {record.details=String(error.message).slice(0,700);}
process.stdout.write(JSON.stringify(record)+'\n');
process.exitCode=record.outcome==='failed'?1:0;
