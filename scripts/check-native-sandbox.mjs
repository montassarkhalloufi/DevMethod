import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { verifyFixture } from './hosts/checks.mjs';
const root=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'devmethod-sandbox-probe-'));
const worker=path.join(root,'worker');fs.mkdirSync(worker);const sentinel=path.join(root,'sentinel');fs.writeFileSync(sentinel,'fictional sentinel');
try {
  const code=`const fs=require('node:fs'),net=require('node:net'),assert=require('node:assert/strict');assert.throws(()=>fs.readFileSync(${JSON.stringify(sentinel)}));assert.throws(()=>fs.writeFileSync('forbidden.txt','x'));const socket=net.connect({host:'127.0.0.1',port:9});socket.on('error',e=>{assert.equal(e.code,'EPERM');console.log('read/write/network denied');});`;
  const result=verifyFixture(worker,['-e',code]); assert.equal(result.status,0,result.stdout+result.stderr);console.log(result.stdout.trim());
}finally{fs.rmSync(root,{recursive:true,force:true});}
