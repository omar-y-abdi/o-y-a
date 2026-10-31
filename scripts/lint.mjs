import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { transform } from 'esbuild';
// esbuild does not validate regexp early errors. Browser-only modules,
// Playwright specs and these manual scripts are not loaded by the Node gates.
const v8Only = new Set(['scripts/smoke-live.mjs', 'scripts/cms-dev.mjs', 'scripts/test-cms-compat.mjs']);
const files = [];
async function walk(dir) { for(const item of await readdir(dir,{withFileTypes:true})) { const p=dir+'/'+item.name;if(item.isDirectory())await walk(p);else files.push(p); } }
for(const dir of ['src','scripts','tests'])await walk(dir);
let failed = false;
for(const file of files.filter(p=>p.endsWith('.mjs'))) {
  try {
    await transform(await readFile(file,'utf8'), { loader:'js', format:'esm', logLevel:'silent', sourcefile:file });
  } catch (error) { console.error(error.message); failed=true; }
  if(v8Only.has(file) || file.startsWith('src/client/') || /^tests\/[^/]+\.spec\.mjs$/.test(file)) {
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(result.status!==0){console.error(result.error ?? (result.stderr || `node --check failed for ${file}: ${result.signal ?? result.status}`));failed=true;}
  }
}
for(const file of files.filter(p=>p.startsWith('src/'))) {
  const text=await readFile(file,'utf8');
  if(/\u2014|\bdebugger\b|eval\(|new Function\(/.test(text)){console.error(`Forbidden production content in ${file}`);failed=true;}
}
if(failed)process.exit(1);
console.log(`Syntax and production-content checks passed for ${files.length} source/test files.`);
