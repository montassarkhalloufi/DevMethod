import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateRoot } from './maintenance-checks.mjs';
const [candidateRoot,mode,check]=process.argv.slice(2);
if(!candidateRoot || check!=='cafe-maintenance' || !['candidate','healthy','intake','finality','durability','integrity','category'].includes(mode)) throw new Error('Invalid evaluation invocation');
const root=mode==='candidate'?candidateRoot:path.join(path.dirname(fileURLToPath(import.meta.url)),'controls',mode);
const result=evaluateRoot(root);
process.stdout.write(JSON.stringify({format:1,check,verdicts:result.verdicts})+'\n');
