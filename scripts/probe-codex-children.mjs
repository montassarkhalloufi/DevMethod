// One explicitly bounded infrastructure probe, not a comparative result.
import fs from 'node:fs';
import path from 'node:path';
import { meterCodexTree } from './hosts/codex-meter.mjs';
import { startCodexRpc } from './hosts/codex-rpc.mjs';
import { reserveRun, recordRun } from './native-host.mjs';
const cancelling=process.argv.includes('--cancel');
const runId=cancelling?'children-cancel-preflight':'children-preflight';
const evidence=path.resolve('evaluation-private/comparison-v2'); fs.mkdirSync(evidence,{recursive:true});
const slot=reserveRun(path.join(evidence,'ledger'),runId);
const cwd=fs.mkdtempSync('/private/tmp/devmethod-child-probe-');
const log=fs.openSync(path.join(evidence,runId+'.jsonl'),'wx');
const events=[];const turns=new Map();let cancellation;
let root, done; const finished=new Promise(resolve=>{done=resolve;});
const totals=new Map(), children=new Set(), completed=new Set();
const rpc=startCodexRpc({cwd,onEvent(event){
 events.push(event);
 if(event.method==='account/rateLimits/updated')return;
 fs.writeSync(log,JSON.stringify(event)+'\n'); const p=event.params;
 if(p.item?.type==='subAgentActivity')children.add(p.item.agentThreadId);
 if(event.method==='thread/started' && p.thread.parentThreadId)children.add(p.thread.id);
 if(event.method==='thread/tokenUsage/updated')totals.set(p.threadId,p.tokenUsage.total);
 if(event.method==='turn/started')turns.set(p.threadId,p.turn.id);
 if(cancelling && !cancellation && event.method==='item/started' && p.item?.type==='commandExecution' && p.threadId!==root) {
   cancellation=Promise.all([...turns].map(([threadId,turnId])=>rpc.call('turn/interrupt',{threadId,turnId})));
   cancellation.catch(e=>done('interrupt-error: '+e.message));
 }
 if(event.method==='turn/completed') {completed.add(p.threadId); if(p.threadId===root)done(p.turn.status);}
}});
const abort=()=>{rpc.close();done('cancelled');};process.on('SIGINT',abort);process.on('SIGTERM',abort);
let status='failed',error;
try {
 await rpc.call('initialize',{clientInfo:{name:'devmethod_probe',version:'0.1.0'},capabilities:{experimentalApi:true}});rpc.notify({method:'initialized'});
 const result=await rpc.call('thread/start',{cwd,model:'gpt-5.6-sol',ephemeral:true,approvalPolicy:'never',sandbox:'read-only',config:{'model_reasoning_effort':'low','features.multi_agent':true,'agents.max_threads':2,'agents.max_depth':1,'features.apps':false,'features.plugins':false,'features.remote_plugin':false,'web_search':'disabled'},developerInstructions:'Infrastructure probe in a fictional empty directory. No file writes, network tools, external actions or purchases. Only the single requested child and its explicitly requested sleep command are authorized.'});
 root=result.thread.id;
 await rpc.call('turn/start',{threadId:root,effort:'low',input:[{type:'text',text:cancelling?'Spawn exactly one child to run the shell command sleep 30 and then answer CHILD_OK. Wait for the child and answer PARENT_OK. No other work or tools. This bounded delegation is authorized.':'Spawn exactly one child agent to answer CHILD_OK without using tools or spawning agents. Wait for that child to finish, then answer PARENT_OK. This bounded delegation is explicitly authorized.',text_elements:[]}]});
 let deadline; try {status=await Promise.race([finished,new Promise((_,reject)=>{deadline=setTimeout(()=>reject(new Error('Probe deadline')),110000);})]);}finally{clearTimeout(deadline);}
 if(cancelling && cancellation)await cancellation;
}catch(e){error=e.message;}finally{process.removeListener('SIGINT',abort);process.removeListener('SIGTERM',abort);rpc.close();fs.closeSync(log);}
const {usage}=meterCodexTree(events,root);
const record={status:status==='completed'||(cancelling && status==='interrupted')?'exited':'failed',probeStatus:status,cancellationRequested:Boolean(cancellation),usage,error,root,children:[...children],completed:[...completed],totals:Object.fromEntries(totals),note:'Observed per-thread totals; native accounting semantics still require review.'};recordRun(slot,record);console.log(JSON.stringify(record,null,2));
