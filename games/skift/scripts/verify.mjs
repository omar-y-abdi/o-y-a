import {spawn} from 'node:child_process';
import {readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);
const env={...process.env};
if(existsSync('.browsers'))env.PLAYWRIGHT_BROWSERS_PATH??=path.join(root,'.browsers');
const run=(args,extra={})=>new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,args,{cwd:root,env:{...env,...extra},stdio:'inherit'});
  child.on('error',reject);child.on('exit',(code,signal)=>code===0?resolve():reject(new Error(`${args.join(' ')} failed (${signal||code})`)));
});
await run(['--test',...(await readdir('tests')).filter(f=>f.endsWith('.test.mjs')).map(f=>`tests/${f}`)]);
await run(['scripts/build.mjs']);
const server=spawn(process.platform==='win32'?'python':'python3',['start.py','--no-open','--port','0'],{cwd:root,stdio:['ignore','pipe','pipe']});
process.once('SIGINT',()=>{server.kill();process.exit(130);});
try{
  env.SKIFT_URL=await new Promise((resolve,reject)=>{
    let output='',errors='';const timer=setTimeout(()=>{server.kill();reject(new Error('Local preview did not start: '+errors));},20000);
    server.on('error',e=>{clearTimeout(timer);reject(e);});
    server.on('exit',code=>{clearTimeout(timer);reject(new Error(`Local preview exited (${code}): ${errors}`));});
    server.stderr.on('data',d=>{errors=(errors+d).slice(-4000);});
    server.stdout.on('data',d=>{output+=d;const match=output.match(/http:\/\/127\.0\.0\.1:\d+\/play\/skift\//);if(match){clearTimeout(timer);resolve(match[0]+'?qa=1');}});
  });
  for(const name of ['browser','input','lifecycle'])await run([`tests/${name}.mjs`]);
  if(!process.argv.includes('--quick')){
    for(const difficulty of ['normal','assist'])await run(['tests/campaign.mjs'],{DIFFICULTY:difficulty});
    for(const name of ['compatibility','performance'])await run([`tests/${name}.mjs`]);
  }
  console.log('SKIFT verification passed. Reports and screenshots: evidence/');
}finally{server.kill();}
