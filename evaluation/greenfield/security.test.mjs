import test from 'node:test';
import {request as rawRequest} from 'node:http';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const project=path.resolve(process.env.PROJECT_DIR || 'examples/pocket-tasks');
const {createTaskServer}=await import(pathToFileURL(path.join(project,'server.mjs')));
test('independent origin, host and media-type non-mutation checks',async t=>{
 const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'pocket-trust-'));const server=createTaskServer({dataFile:path.join(dir,'tasks.json')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}`;
 t.after(async()=>{await new Promise(resolve=>{server.close(resolve);server.closeIdleConnections?.();});fs.rmSync(dir,{recursive:true,force:true});});
 const send=headers=>new Promise((resolve,reject)=>{
  const req=rawRequest(url+'/api/tasks',{method:'POST',headers},response=>{response.resume();response.on('end',()=>resolve({status:response.statusCode}));});
  req.on('error',reject);if(headers.host)assert.equal(req.getHeader('host'),headers.host);req.end(JSON.stringify({title:'Rejected mutation'}));
 });
 for(const headers of [
  {origin:'https://untrusted.example','content-type':'text/plain'},
  {origin:'https://untrusted.example','content-type':'application/json'},
  {origin:'null','content-type':'application/json'},
  {'sec-fetch-site':'cross-site','content-type':'application/json'},
  {host:`untrusted.example:${server.address().port}`,'content-type':'application/json'}
 ])assert.equal((await send(headers)).status,403,JSON.stringify(headers));
 assert.equal((await send({'content-type':'text/plain'})).status,415);
 assert.deepEqual(await (await fetch(url+'/api/tasks')).json(),{tasks:[]});
 assert.equal((await send({origin:url,'content-type':'application/json'})).status,201);
});
