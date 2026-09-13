import test from 'node:test';
import assert from 'node:assert/strict';
import { meterCodexTree } from '../scripts/hosts/codex-meter.mjs';
const usage=(threadId,inputTokens,outputTokens)=>({method:'thread/tokenUsage/updated',params:{threadId,tokenUsage:{total:{inputTokens,outputTokens}}}});
const end=threadId=>({method:'turn/completed',params:{threadId,turn:{id:'t'}}});
const child={method:'item/started',params:{threadId:'root',item:{type:'subAgentActivity',agentThreadId:'child'}}};
test('child discovery without thread/started; repeated cumulative updates are not added',()=>{
 const result=meterCodexTree([child,usage('root',10,1),usage('root',20,2),usage('child',5,1),end('child'),end('root')],'root');
 assert.deepEqual(result.usage,{inputTokens:25,outputTokens:3,costUSD:null});
});
test('unmetered, unfinished, unknown threads and resumed turns block accounting',()=>{
 const valid=[child,usage('root',10,1),usage('child',5,1),end('child'),end('root')];
 for(const events of [[child,usage('root',10,1),end('root')],valid.concat(usage('unknown',1,1)),valid.concat({method:'turn/started',params:{threadId:'child',turn:{id:'again'}}}),valid.concat(usage('child',-1,1))])assert.equal(meterCodexTree(events,'root').usage,null);
});
