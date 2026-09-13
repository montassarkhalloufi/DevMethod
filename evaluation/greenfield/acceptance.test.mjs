import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const project=path.resolve(process.env.PROJECT_DIR || 'examples/pocket-tasks');
const {createTaskServer}=await import(pathToFileURL(path.join(project,'server.mjs')));
const start=async dataFile=>{const server=createTaskServer({dataFile});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});return {server,url:`http://127.0.0.1:${server.address().port}`};};
const close=server=>new Promise((resolve,reject)=>{server.close(error=>error?reject(error):resolve());server.closeIdleConnections?.();});

test('independent greenfield contract',async t=>{
 const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'pocket-acceptance-'));
 const dataFile=path.join(dir,'tasks.json');let app=await start(dataFile);
 t.after(async()=>{await close(app.server);fs.rmSync(dir,{recursive:true,force:true});});
 const request=(route,method='GET',body)=>fetch(app.url+route,{method,...(body===undefined?{}:{headers:{'content-type':'application/json'},body:JSON.stringify(body)})});
 let id;
 await t.test('new app starts empty, creates trimmed task and persists fields',async()=>{
  assert.deepEqual(await (await request('/api/tasks')).json(),{tasks:[]});
  const response=await request('/api/tasks','POST',{title:'  Plan the demo  '});assert.equal(response.status,201);
  const {task}=await response.json();assert.equal(task.title,'Plan the demo');assert.equal(task.done,false);assert.equal(typeof task.id,'string');assert.ok(task.id);id=task.id;
 });
 await t.test('edits, completes, reopens and handles missing IDs',async()=>{
  let response=await request('/api/tasks/'+id,'PATCH',{title:'Ship the demo',done:true});assert.equal(response.status,200);assert.deepEqual((await response.json()).task,{id,title:'Ship the demo',done:true});
  response=await request('/api/tasks/'+id,'PATCH',{done:false});assert.equal((await response.json()).task.done,false);
  assert.equal((await request('/api/tasks/missing','PATCH',{done:true})).status,404);
  assert.equal((await request('/api/tasks/missing','DELETE')).status,404);
 });
 await t.test('invalid inputs and malformed JSON are rejected without mutations',async()=>{
  const before=await (await request('/api/tasks')).json();
  for(const body of [null,[],{}, {title:''},{title:'   '},{title:12},{title:'x'.repeat(121)}])assert.equal((await request('/api/tasks','POST',body)).status,400,JSON.stringify(body));
  for(const body of [null,[],{}, {done:'yes'},{title:null}])assert.equal((await request('/api/tasks/'+id,'PATCH',body)).status,400,JSON.stringify(body));
  const malformed=await fetch(app.url+'/api/tasks',{method:'POST',headers:{'content-type':'application/json'},body:'{broken'});assert.equal(malformed.status,400);assert.ok(await malformed.json());
  const large=await request('/api/tasks','POST',{title:'x'.repeat(17000)});assert.equal(large.status,413);
  assert.deepEqual(await (await request('/api/tasks')).json(),before);
 });
 await t.test('concurrent writes preserve unique tasks and literal HTML-looking text',async()=>{
  const results=await Promise.all(Array.from({length:12},(_,i)=>request('/api/tasks','POST',{title:'Parallel '+i})));
  assert.ok(results.every(r=>r.status===201));
  const literal='<img src=x onerror=alert(1)>';const response=await request('/api/tasks','POST',{title:literal});assert.equal(response.status,201);assert.equal((await response.json()).task.title,literal);
  const {tasks}=await (await request('/api/tasks')).json();assert.equal(tasks.length,14);assert.equal(new Set(tasks.map(t=>t.id)).size,14);
 });
 await t.test('restart restores data and delete persists',async()=>{
  const before=await (await request('/api/tasks')).json();await close(app.server);app=await start(dataFile);assert.deepEqual(await (await request('/api/tasks')).json(),before);
  assert.equal((await request('/api/tasks/'+id,'DELETE')).status,204);await close(app.server);app=await start(dataFile);assert.equal((await (await request('/api/tasks')).json()).tasks.length,13);
 });
 await t.test('serves a UI and protects nonpublic sources',async()=>{
  const page=await request('/');assert.equal(page.status,200);assert.match(page.headers.get('content-type'),/text\/html/);
  assert.equal((await request('/server.mjs')).status,404);assert.equal((await request('/BRIEF.md')).status,404);assert.equal((await request('/api/unknown')).status,404);
 });
 await t.test('malformed stored data never silently resets',async()=>{
  const corrupt=path.join(dir,'corrupt.json');fs.writeFileSync(corrupt,'not-json');let bad;
  try{bad=await start(corrupt);}catch(error){assert.ok(error instanceof Error);}
  if(bad){try{const response=await fetch(bad.url+'/api/tasks');assert.equal(response.status,500);}finally{await close(bad.server);}}
  assert.equal(fs.readFileSync(corrupt,'utf8'),'not-json');
 });
});
