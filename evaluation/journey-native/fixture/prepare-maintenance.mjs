import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(process.argv[2]); const file=path.join(root,'saved-jobs.json');
if(fs.existsSync(file)) throw new Error('Refuse to overwrite maintenance data');
const operations=[['add',{id:'preserved-done',title:'Old radio'}],['finish',{id:'preserved-done'}],['add',{id:'preserved-open',title:'Old lamp'}]];
let origin='created-through-initial-implementation'; const observations=[];
for(const [command,payload] of operations){ const r=spawnSync(process.execPath,[path.join(root,'app.mjs'),file,command,JSON.stringify(payload)],{encoding:'utf8',timeout:1500,maxBuffer:16384}); observations.push({command,status:r.status,stdout:r.stdout,stderr:r.stderr}); if(r.status!==0){origin='operator-fixture-after-initial-failure';break;} }
const expected={version:1,jobs:[{id:'preserved-done',title:'Old radio',status:'done'},{id:'preserved-open',title:'Old lamp',status:'open'}]};
try{assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),expected);}catch{origin='operator-fixture-after-initial-failure';}
if(origin!=='created-through-initial-implementation') fs.writeFileSync(file,JSON.stringify(expected));
const record={format:1,origin,observations,expected}; fs.writeFileSync(path.join(root,'operator-setup.json'),JSON.stringify(record,null,2)+'\n'); process.stdout.write(JSON.stringify(record)+'\n');
