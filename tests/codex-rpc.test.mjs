import test from 'node:test';
import assert from 'node:assert/strict';
import {startCodexRpc} from '../scripts/hosts/codex-rpc.mjs';
const start=(code,timeoutMs=2000)=>startCodexRpc({cwd:process.cwd(),command:process.execPath,args:['-e',code],timeoutMs});
test('stdio RPC correlates replies and rejects server errors without hanging',async()=>{
 const rpc=start(`require('readline').createInterface({input:process.stdin}).on('line',l=>{const m=JSON.parse(l);console.log(JSON.stringify(m.method==='fail'?{id:m.id,error:{message:'denied'}}:{id:m.id,result:{ok:true}}));});`);
 try{assert.deepEqual(await rpc.call('ok'),{ok:true});await assert.rejects(rpc.call('fail'),/denied/);}finally{rpc.close();}
 await assert.rejects(rpc.call('after'),/closed/);
});
test('malformed stream, premature exit and deadline reject pending calls',async()=>{
 for(const code of [`console.log('invalid');setInterval(()=>{},1000)`,`process.exit(1)`,`setInterval(()=>{},1000)`]){
  const rpc=start(code,250);try{await assert.rejects(rpc.call('pending'));}finally{rpc.close();}
 }
});
