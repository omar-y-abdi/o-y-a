import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { initial } from '../.generated/cms-seed.mjs';

for(const valid of [true,false])test(`R13: release CLI imports multiline SQL values and reports ${valid?'compatible':'incompatible'} retained content`,async()=>{
  const dir=await mkdtemp(join(tmpdir(),'cms-release-'));
  try {
    let sql='';for(const name of (await readdir('migrations')).filter(name=>name.endsWith('.sql')).sort())sql+=await readFile('migrations/'+name,'utf8')+'\n';
    const project=structuredClone(initial);if(!valid)project.pages[0].title='';
    const hex=gzipSync(JSON.stringify(project)).toString('hex');
    sql+=`INSERT INTO cms_revisions(version,request_id,base_version,actor,created_at,payload_hash,project,manifest,summary) VALUES (1,'${crypto.randomUUID()}',0,'owner@example.test','2026-09-14T00:00:00Z','fixture',X'${hex}','[]','A real line\nbreak; and ''quotes''');\nUPDATE cms_head SET version=1 WHERE id=1;\n`;
    const file=join(dir,'export.sql');await writeFile(file,sql);
    const result=spawnSync(process.execPath,['scripts/cms-check-release.mjs',file],{encoding:'utf8',timeout:30000});
    assert.equal(result.status,valid?0:1,result.stderr+'\n'+result.stdout);
    const report=JSON.parse(result.stdout);assert.equal(report.compatible,valid);assert.deepEqual(report.revisions.map(row=>row.version),[0,1]);
  }finally{await rm(dir,{recursive:true,force:true});}
});
