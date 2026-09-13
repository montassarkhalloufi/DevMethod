// Native sandbox preflight, no model invocation. Run explicitly on macOS.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { startCodexRpc } from './hosts/codex-rpc.mjs';
export async function checkCodexGit() {
  if(process.platform!=='darwin')throw new Error('macOS preflight only');
  const cwd=fs.mkdtempSync('/private/tmp/devmethod-git-sandbox-');
  execFileSync('git',['init',cwd]);fs.writeFileSync(cwd+'/sentinel.txt','fictional\n');
  const rpc=startCodexRpc({cwd,timeoutMs:20000});const results=[];
  try {
    await rpc.call('initialize',{clientInfo:{name:'devmethod_probe',version:'0.1.0'},capabilities:{experimentalApi:true}});rpc.notify({method:'initialized'});
    for(const includeGit of [false,true]) {
      const result=await rpc.call('command/exec',{command:['git','add','sentinel.txt'],cwd,timeoutMs:5000,sandboxPolicy:{type:'workspaceWrite',writableRoots:includeGit?[cwd,cwd+'/.git']:[cwd],networkAccess:false,excludeTmpdirEnvVar:true,excludeSlashTmp:true}});
      results.push({includeGit,exitCode:result.exitCode});
    }
    if(results[0].exitCode===0||results[1].exitCode!==0)throw new Error('Unexpected Git sandbox result');
    return {gitMetadataWritable:true,results};
  }finally{rpc.close();fs.rmSync(cwd,{recursive:true,force:true});}
}
if(process.argv[1]?.endsWith('/check-codex-git.mjs')) console.log(JSON.stringify(await checkCodexGit()));
