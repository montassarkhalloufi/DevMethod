import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export function evaluateRoot(candidateRoot) {
  const root = path.resolve(candidateRoot);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cafe-acceptance-'));
  const verdicts = {}; const details = {}; let processes = 0;
  function call(file, command, payload, error) {
    const args = [path.join(root, 'app.mjs'), file, command];
    if (payload !== undefined) args.push(typeof payload === 'string' ? payload : JSON.stringify(payload));
    const observed = spawnSync(process.execPath, args, { encoding:'utf8', timeout:1500, maxBuffer:16384, cwd:root });
    processes++;
    assert.equal(observed.error, undefined, 'CLI must execute within the local bound');
    assert.equal(observed.signal, null, 'CLI must terminate normally');
    if (error) {
      assert.notEqual(observed.status, 0, 'error must return nonzero');
      assert.equal(observed.stdout, '', 'error stdout must be empty');
      assert.deepEqual(JSON.parse(observed.stderr), {error});
      return;
    }
    assert.equal(observed.status, 0, `CLI success required; stderr=${observed.stderr.slice(0,160)}`);
    assert.equal(observed.stderr, '', 'success stderr must be empty');
    return JSON.parse(observed.stdout);
  }
  function criterion(id, operation) {
    try { operation(); verdicts[id]='passed'; }
    catch(error) { verdicts[id]='failed'; details[id]=String(error.message).slice(0,700); }
  }
  const job = (id,title,status='open') => ({id,title,status});
  try {
    criterion('intake', () => {
      const file=path.join(temp,'intake.json');
      assert.deepEqual(call(file,'list'),[]);
      assert.deepEqual(call(file,'add',{id:'job-b',title:'  Kettle  '}),job('job-b','Kettle'));
      assert.deepEqual(call(file,'add',{id:'job-a',title:'Lamp'}),job('job-a','Lamp'));
      assert.deepEqual(call(file,'add',{id:'job-b',title:'Kettle'}),job('job-b','Kettle'));
      call(file,'add',{id:'job-b',title:'Different'},'conflict');
      assert.deepEqual(call(file,'list'),[job('job-a','Lamp'),job('job-b','Kettle')]);
      const before=fs.readFileSync(file,'utf8');
      for (const input of [{id:'BAD',title:'Lamp'},{id:'job-c',title:'  '},{id:'job-c',title:'x'.repeat(81)},{id:'job-c',title:'Lamp',unexpected:true}]) call(file,'add',input,'invalid-input');
      call(file,'add','{','invalid-input');
      call(file,'unknown',undefined,'invalid-input');
      assert.equal(fs.readFileSync(file,'utf8'),before);
    });
    criterion('finality', () => {
      const file=path.join(temp,'finality.json');
      call(file,'add',{id:'job-f',title:'Radio'});
      const done=job('job-f','Radio','done');
      assert.deepEqual(call(file,'finish',{id:'job-f'}),done);
      assert.deepEqual(call(file,'finish',{id:'job-f'}),done);
      assert.deepEqual(call(file,'add',{id:'job-f',title:'Radio'}),done);
      assert.deepEqual(call(file,'list'),[done]);
      const before=fs.readFileSync(file,'utf8');
      call(file,'finish',{id:'missing'},'not-found');
      assert.equal(fs.readFileSync(file,'utf8'),before);
    });
    criterion('durability', () => {
      const file=path.join(temp,'durability.json');
      call(file,'add',{id:'job-d',title:'Toaster'});
      assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),{version:1,jobs:[job('job-d','Toaster')]});
      assert.deepEqual(call(file,'list'),[job('job-d','Toaster')]);
      call(file,'finish',{id:'job-d'});
      assert.deepEqual(call(file,'list'),[job('job-d','Toaster','done')]);
      assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),{version:1,jobs:[job('job-d','Toaster','done')]});
    });
    criterion('integrity', () => {
      const file=path.join(temp,'corrupt.json');
      for (const bytes of ['{invalid',JSON.stringify({version:2,jobs:[]}),JSON.stringify({version:1,jobs:[job('job-a','Lamp','lost')]}),JSON.stringify({version:1,jobs:[job('job-a','Lamp'),job('job-a','Lamp')]})]) {
        fs.writeFileSync(file,bytes); call(file,'list',undefined,'invalid-data'); assert.equal(fs.readFileSync(file,'utf8'),bytes);
      }
      fs.writeFileSync(file,'{invalid');
      call(file,'add',{id:'job-n',title:'New'},'invalid-data');
      assert.equal(fs.readFileSync(file,'utf8'),'{invalid');
    });

  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
  return { format:1, stage:'initial', verdicts, details, processes, limits:'Separate sequential Node processes; no concurrency, power-loss, usability or model-comparison claim.' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result=evaluateRoot(process.argv[2] ?? '.');
  process.stdout.write(JSON.stringify(result)+'\n');
  process.exitCode=Object.values(result.verdicts).every(v=>v==='passed')?0:1;
}
