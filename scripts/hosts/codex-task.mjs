import fs from 'node:fs';
import path from 'node:path';
import {startCodexRpc} from './codex-rpc.mjs';
import {meterCodexTree} from './codex-meter.mjs';
export async function runCodexTask({cwd,prompt,logFile,rpcFactory=startCodexRpc}) {
 const events=[],turns=new Map(),drained=[];let root,finish;const done=new Promise(resolve=>{finish=resolve;});
 const log=fs.openSync(logFile,'wx');
 const rpc=rpcFactory({cwd,onEvent(e){
  if(e.method==='account/rateLimits/updated')return;
  events.push(e);fs.writeSync(log,JSON.stringify(e)+'\n');const p=e.params;
  if(e.method==='turn/started')turns.set(p.threadId,p.turn.id);
  if(e.method==='turn/completed'){turns.delete(p.threadId);if(p.threadId===root)finish(p.turn.status);if(!turns.size)drained.splice(0).forEach(resolve=>resolve());}
 }});
 let cancelled=false;const cancel=()=>{cancelled=true;finish('cancelled');};process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
 let status='failed',error,timer;
 try{
  await rpc.call('initialize',{clientInfo:{name:'devmethod_comparison',version:'0.1.0'},capabilities:{experimentalApi:true}});if(cancelled){status='cancelled';throw new Error('Cancelled before thread start');}rpc.notify({method:'initialized'});
  const tmp=path.join(cwd,'.runtime/tmp');fs.mkdirSync(tmp,{recursive:true});
  const start=await rpc.call('thread/start',{cwd,model:'gpt-5.6-sol',ephemeral:true,approvalPolicy:'never',sandbox:'workspace-write',config:{'model_reasoning_effort':'low','features.multi_agent':true,'agents.max_threads':4,'agents.max_depth':1,'web_search':'disabled','features.apps':false,'features.plugins':false,'features.remote_plugin':false,'sandbox_workspace_write.writable_roots':[cwd,path.join(cwd,'.git')],'sandbox_workspace_write.network_access':false,'sandbox_workspace_write.exclude_tmpdir_env_var':true,'sandbox_workspace_write.exclude_slash_tmp':true,'shell_environment_policy.inherit':'core','shell_environment_policy.set':{TMPDIR:tmp,UV_OFFLINE:'1',UV_PYTHON_DOWNLOADS:'never'}}});root=start.thread.id;if(cancelled){status='cancelled';throw new Error('Cancelled before model dispatch');}
  await rpc.call('turn/start',{threadId:root,effort:'low',input:[{type:'text',text:prompt,text_elements:[]}]});
  status=await Promise.race([done,new Promise(resolve=>{timer=setTimeout(()=>resolve('timeout'),110000);})]);
  if(status==='completed'&&turns.size)status='incomplete';
  if(status==='timeout'||status==='cancelled'||turns.size){
   await Promise.allSettled([...turns].map(([threadId,turnId])=>rpc.call('turn/interrupt',{threadId,turnId})));
   if(turns.size){let drainTimer;try{await Promise.race([new Promise(resolve=>drained.push(resolve)),new Promise(resolve=>{drainTimer=setTimeout(resolve,1500);})]);}finally{clearTimeout(drainTimer);}}
  }
 }catch(e){error=e.message;}finally{clearTimeout(timer);process.removeListener('SIGINT',cancel);process.removeListener('SIGTERM',cancel);rpc.close();fs.closeSync(log);}
 return {status:status==='completed'?'exited':status,root,error,...meterCodexTree(events,root)};
}
