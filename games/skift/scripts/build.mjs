import * as esbuild from 'esbuild';
import {mkdir,cp,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);
const dest='dist/play/skift';
await rm(dest,{recursive:true,force:true});
await mkdir(`${dest}/assets`,{recursive:true});
await cp('public',dest,{recursive:true,filter:source=>!path.basename(source).startsWith('.')});
await copyFile('index.html',`${dest}/index.html`);
await writeFile('dist/index.html','<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./play/skift/"><title>SKIFT</title><a href="./play/skift/">Spela SKIFT / Play SKIFT</a>');
const options={entryPoints:['src/main.js'],bundle:true,minify:true,sourcemap:true,target:['chrome100','safari15.4','firefox100'],outfile:`${dest}/assets/app.js`,legalComments:'linked',logLevel:'info'};
const licenses=[];
for(const [name,files] of [['three',['LICENSE']],['cannon-es',['LICENSE']],['howler',['LICENSE.md','LICENSE']],['esbuild',['LICENSE.md']]]){
  for(const f of files){try{licenses.push(`## ${name}\n\n${await readFile(`node_modules/${name}/${f}`,'utf8')}`);break;}catch{}}
}
await writeFile(`${dest}/THIRD-PARTY-LICENSES.txt`,licenses.join('\n\n'));
if(process.argv.includes('--serve')){
  const ctx=await esbuild.context(options);await ctx.watch();const server=await ctx.serve({host:'127.0.0.1',port:8787,servedir:'dist'});
  console.log(`SKIFT: http://${server.hosts[0]}:${server.port}/play/skift/`);
}else await esbuild.build(options);
