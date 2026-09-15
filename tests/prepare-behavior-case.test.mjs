import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { prepareBehaviorCase, resolveFreshDestination } from '../scripts/prepare-behavior-case.mjs';
import { suite } from '../scripts/evaluate-behavior.mjs';
function childEnv() { const env = {...process.env}; delete env.NODE_TEST_CONTEXT; return env; }
function temp(t) { const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'behavior-prepare-')); t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir; }
for (const c of suite.cases) test(`${c.id} materializes only pinned neutral fixture inputs`, t => {
  const directory = path.join(temp(t), 'case'); const result = prepareBehaviorCase(c.id, directory);
  assert.equal(result.status, 'prepared-not-run'); assert.equal(result.prompt,c.prompt);
  assert.ok(Object.keys(result.files).length);
  for (const [name, hash] of Object.entries(result.files)) {
    assert.equal(createHash('sha256').update(fs.readFileSync(path.join(directory,name))).digest('hex'),hash);
    assert.doesNotMatch(name, /oracle|expected|manifest\.json/i);
  }
  assert.equal(fs.existsSync(path.join(directory,'TASK.md')),false);
  assert.throws(()=>prepareBehaviorCase(c.id,directory),/already exists/);
});
test('closure baseline tests are green while concurrent calls violate actual capacity', async t => {
  const directory=path.join(temp(t),'case');prepareBehaviorCase('CLOSURE',directory);
  const child=spawnSync(process.execPath,['--test','tests/reservations.test.mjs'],{cwd:directory,encoding:'utf8',env:childEnv()});
  assert.equal(child.status,0,child.stderr);
  const {createReservations}=await import(pathToFileURL(path.join(directory,'api/reservations.ts')));
  const store=createReservations();let release;const gate=new Promise(resolve=>release=resolve);
  const calls=[store.reserve('first',()=>gate),store.reserve('second',()=>gate)]; release();
  const results=await Promise.all(calls);assert.equal(results.length,2);assert.equal(store.availability(),-1);
});
test('fake provider reproduces malformed output and applied-effect timeout without external service', async t => {
  const directory=path.join(temp(t),'case');prepareBehaviorCase('AI-POS',directory);
  const {createFakeProvider}=await import(pathToFileURL(path.join(directory,'api/fake-provider.mjs')));
  const provider=createFakeProvider();assert.throws(()=>JSON.parse('{broken'));
  assert.equal(await provider.generate('a','malformed'),'{broken');
  await assert.rejects(provider.generate('b','timeout-after-completion'),/TIMEOUT/);
  assert.equal(provider.completions.has('b'),true);
});
test('negative math control starts with a real failing deterministic assertion', t=> {
  const directory=path.join(temp(t),'case');prepareBehaviorCase('AI-NEG',directory);
  assert.equal(spawnSync(process.execPath,['--test','tests/math.test.mjs'],{cwd:directory,encoding:'utf8',env:childEnv()}).status,1);
});
test('resume and delivery operator prerequisites are explicit, not reported executed', t => {
  const parent=temp(t);const resume=prepareBehaviorCase('RESUME',path.join(parent,'resume'));
  assert.match(resume.operatorSteps.join(' '),/fresh session/);
  const delivery=prepareBehaviorCase('DELIVERY-POS',path.join(parent,'delivery'));
  assert.match(delivery.operatorSteps.join(' '),/without committing/);
  assert.equal(fs.existsSync(path.join(delivery.destination,'.git')),false);
});
test('destination traversal, relative paths and symbolic ancestors are refused', t => {
  const parent=temp(t);fs.symlinkSync(parent,path.join(parent,'link'));
  for(const destination of ['relative',path.join(parent,'link','case'),parent+'/a/../case']) assert.throws(()=>prepareBehaviorCase('CLOSURE',destination));
  assert.throws(()=>prepareBehaviorCase('UNKNOWN',path.join(parent,'case')),/Unknown/);
});
test('tampered sources and symbolic files cannot be prepared', t => {
  const parent=temp(t);const fixtureDirectory=path.join(parent,'fixtures');
  fs.cpSync(fileURLToPath(new URL('../evaluation/behavioral/fixtures/',import.meta.url)),fixtureDirectory,{recursive:true});
  const file=path.join(fixtureDirectory,'shared/README.md');fs.appendFileSync(file,'changed');
  assert.throws(()=>prepareBehaviorCase('CLOSURE',path.join(parent,'case'),{fixtureDirectory}),/hash mismatch/);
  assert.equal(fs.existsSync(path.join(parent,'case')),false);
  fs.unlinkSync(file);fs.symlinkSync(path.join(fixtureDirectory,'shared/CONTRACT.md'),file);
  assert.throws(()=>prepareBehaviorCase('CLOSURE',path.join(parent,'case'),{fixtureDirectory}),/Symbolic/);
});
test('manifest traversal and evaluator artifact injection are refused', t => {
  const parent=temp(t);const fixtureDirectory=path.join(parent,'fixtures');
  fs.cpSync(fileURLToPath(new URL('../evaluation/behavioral/fixtures/',import.meta.url)),fixtureDirectory,{recursive:true});
  const manifestFile=path.join(fixtureDirectory,'manifest.json');const initial=JSON.parse(fs.readFileSync(manifestFile));
  for(const name of ['../escape','oracle.json','expected-checks.json']) {
    const manifest=structuredClone(initial);const c=manifest.cases.find(c=>c.id==='CLOSURE');c.files[name]=c.files['README.md'];
    fs.writeFileSync(manifestFile,JSON.stringify(manifest));
    assert.throws(()=>prepareBehaviorCase('CLOSURE',path.join(parent,'case'),{fixtureDirectory}));
    assert.equal(fs.existsSync(path.join(parent,'case')),false);
  }
});

test('preparer CLI emits provenance only after successful copy and refuses reused destination', t => {
  const parent=temp(t); const destination=path.join(parent,'case');
  const command=fileURLToPath(new URL('../scripts/prepare-behavior-case.mjs',import.meta.url));
  const result=spawnSync(process.execPath,[command,'CLOSURE',destination],{encoding:'utf8',env:childEnv()});
  assert.equal(result.status,0,result.stderr);const record=JSON.parse(result.stdout);
  assert.equal(record.status,'prepared-not-run');assert.equal(record.caseId,'CLOSURE');assert.match(record.fixtureManifestSha256,/^[a-f0-9]{64}$/);
  const repeated=spawnSync(process.execPath,[command,'CLOSURE',destination],{encoding:'utf8',env:childEnv()});
  assert.equal(repeated.status,2);assert.equal(repeated.stdout,'');
});

test('destination lexical validation accepts native Windows paths without hiding traversal', () => {
  const win = path.win32;
  assert.equal(resolveFreshDestination('C:\\work\\fresh case',win), 'C:\\work\\fresh case');
  assert.equal(resolveFreshDestination('C:/work/fresh case',win), 'C:\\work\\fresh case');
  assert.equal(resolveFreshDestination('\\\\server\\share\\fresh',win), '\\\\server\\share\\fresh');
  for (const unsafe of ['C:\\work\\..\\case','C:/work/../case','C:\\work/../case','C:relative','\\root-relative','\\\\?\\C:\\work\\case','\\\\.\\C:\\work\\case','C:\\work\\case:stream']) {
    assert.throws(() => resolveFreshDestination(unsafe,win), undefined, unsafe);
  }
  assert.equal(resolveFreshDestination('/tmp/fresh case',path.posix),'/tmp/fresh case');
  for (const unsafe of ['relative','/tmp/../case','/tmp/a\\case']) assert.throws(() => resolveFreshDestination(unsafe,path.posix));
});
