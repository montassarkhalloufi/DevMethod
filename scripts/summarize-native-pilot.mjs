import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2];if(!root)throw new Error('Usage: node scripts/summarize-native-pilot.mjs CAMPAIGN_ROOT');
const runs=fs.readdirSync(path.join(root,'ledger')).filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(root,'ledger',n))));
const totalTokens=runs.every(r=>r.usage)?runs.reduce((n,r)=>n+r.usage.inputTokens+r.usage.outputTokens,0):null;
const cells=['none','devmethod','bmad'].map(arm=>{const rs=runs.filter(r=>r.id.startsWith('matched-')&&r.arm===arm);return {arm,planned:3,executed:rs.length,notRun:3-rs.length,objectivePassed:rs.filter(r=>r.acceptance===true).length,objectiveFailed:rs.filter(r=>r.acceptance===false).length};});
console.log(JSON.stringify({format:1,kind:'bounded-native-pilot',runs:runs.map(({id,status,acceptance,usage,elapsedSeconds,review})=>({id,status,objectiveChecksPassed:acceptance,usage,elapsedSeconds,review})),cells,totalTokens,costUSD:null,limits:{maxRuns:12,timeoutSeconds:120,observedTokenStop:500000},limitation:'Calibration excluded from matched cells. Objective success is not behavioral review or proof of superiority. Unknown cost remains unavailable.'},null,2));
