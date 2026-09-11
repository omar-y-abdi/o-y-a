import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const files = [];
async function walk(dir) { for(const item of await readdir(dir,{withFileTypes:true})) { const p=dir+'/'+item.name;if(item.isDirectory())await walk(p);else files.push(p); } }
for(const dir of ['src','scripts','tests'])await walk(dir);
let failed = false;
for(const file of files.filter(p=>p.endsWith('.mjs'))) {
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0){console.error(result.stderr);failed=true;}
}
for(const file of files.filter(p=>p.startsWith('src/'))) {
  const text=await readFile(file,'utf8');
  if(/\u2014|\bdebugger\b|eval\(|new Function\(/.test(text)){console.error(`Forbidden production content in ${file}`);failed=true;}
}
if(failed)process.exit(1);
console.log(`Syntax and production-content checks passed for ${files.length} source/test files.`);
