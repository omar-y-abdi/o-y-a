import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { seed, initial } from '../.generated/cms-seed.mjs';
import { validateProject, validateProjectWithReferences } from '../src/cms/project.mjs';
import { uploadAsset } from '../src/cms/assets.mjs';
import { publishSite, readSite, digest } from '../src/cms/store.mjs';
import { checkCompatibility } from '../src/cms/compatibility.mjs';
import { rasterFixtures } from './helpers/raster-fixtures.mjs';
import { readStudioHead } from '../src/cms/studio-store.mjs';
import { cpuMigrationStatus, applyCpuMigration } from '../src/cms/cpu-migration.mjs';
import { prepareCpuArtifact, readCpuSource, stageCpuArtifact } from '../scripts/cms-cpu-artifact.mjs';

// A file-based restore into a SECOND real D1/R2 instance, not an in-memory
// project clone. Hosted account snapshots still need the documented drill.
test('operations: D1 plus retained R2 backup restores current and historical publications with the matching Worker',{ timeout: 60000 },async()=>{
  const [source,target]=await Promise.all([cmsRuntime(),cmsRuntime()]);
  const directory=await mkdtemp(join(tmpdir(),'cms-drill-'));
  try {
    const bucket=await source.mf.getR2Bucket('CMS_MEDIA');
    const bytes=Buffer.from(rasterFixtures.png,'base64');
    const image=await uploadAsset({CMS_DB:source.db,CMS_MEDIA:bucket,CMS_IMAGES:await source.mf.getImagesBinding('CMS_IMAGES')},{id:crypto.randomUUID(),name:'Drill.png',alt:'A square',bytes});
    const original=structuredClone(initial);original.pages[0].html=original.pages[0].html.replace('</main>',`<img src="${image.src}" alt="A square"></main>`);
    const first=validateProjectWithReferences(original,seed,undefined,{origins:[source.url]});
    await publishSite(source.db,{project:first.project,references:first.references,baseVersion:0,requestId:crypto.randomUUID(),actor:'owner@example.test',studioKey:seed.studioKey,previewFrame:first.frame,origin:source.url});
    const migrationIdentity={buildKey:seed.studioKey,origin:source.url,actor:source.email};
    const prepareMigration=async()=>{
      const status=await cpuMigrationStatus(source.db,migrationIdentity);
      const artifact=await prepareCpuArtifact(await readCpuSource(source.db,status.version),status,{seed,initial});
      await stageCpuArtifact(source.db,artifact,{seed,initial},{readToday:0,writtenToday:0});
      return artifact;
    };
    const committedMigration=await prepareMigration();
    await applyCpuMigration(source.db,{operationId:committedMigration.operationId,artifactHash:committedMigration.artifactHash,action:'commit'},migrationIdentity);
    const next=structuredClone(original);next.pages[0].description='Recovered publication';
    const second=validateProjectWithReferences(next,seed,undefined,{origins:[source.url]});
    await publishSite(source.db,{project:second.project,references:second.references,baseVersion:1,requestId:crypto.randomUUID(),actor:'owner@example.test',studioKey:seed.studioKey,previewFrame:second.frame,origin:source.url});
    const pendingMigration=await prepareMigration();
    const tables={};
    for(const name of ['cms_head','cms_revisions','cms_rendered','cms_media','cms_revision_resource_indexed','cms_revision_resource_index','cms_studio_heads','cms_studio_text','cms_preview_facts','cms_cpu_migrations','cms_cpu_migration_rows']){
      const {results}=await source.db.prepare(`SELECT * FROM ${name}`).all();
      if(name==='cms_revisions')for(const row of results)row.project=Buffer.from(row.project).toString('base64');
      if(name==='cms_cpu_migrations')for(const row of results)if(row.source_project!==null)row.source_project=Buffer.from(row.source_project).toString('base64');
      tables[name]=results;
    }
    assert.ok(tables.cms_preview_facts.length>0,'backup includes real persisted frame/page proofs');
    assert.deepEqual(tables.cms_cpu_migrations.map(row=>row.state).sort(),['committed','ready']);
    assert.ok(tables.cms_cpu_migration_rows.length>0,'backup includes an actual sealed operation');
    const objects=[];let cursor;
    do {
      const list=await bucket.list({cursor});
      for(const item of list.objects){const object=await bucket.get(item.key);const content=new Uint8Array(await object.arrayBuffer());objects.push({key:item.key,bytes:Buffer.from(content).toString('base64'),sha256:await digest(content)});}
      cursor=list.truncated?list.cursor:undefined;
    }while(cursor);
    await writeFile(join(directory,'backup.json'),JSON.stringify({format:1,tables,objects}));
    const saved=JSON.parse(await readFile(join(directory,'backup.json'),'utf8'));
    await target.db.prepare('DELETE FROM cms_head').run();
    for(const name of ['cms_media','cms_revisions','cms_rendered','cms_head','cms_revision_resource_indexed','cms_revision_resource_index','cms_studio_heads','cms_studio_text','cms_preview_facts','cms_cpu_migrations','cms_cpu_migration_rows'])for(const row of saved.tables[name]){
      const keys=Object.keys(row), values=keys.map(key=>(name==='cms_revisions'&&key==='project'||name==='cms_cpu_migrations'&&key==='source_project')&&row[key]!==null?new Uint8Array(Buffer.from(row[key],'base64')):row[key]);
      await target.db.prepare(`INSERT INTO ${name} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).bind(...values).run();
    }
    const restoredBucket=await target.mf.getR2Bucket('CMS_MEDIA');
    for(const object of saved.objects){const content=Buffer.from(object.bytes,'base64');assert.equal(await digest(content),object.sha256);await restoredBucket.put(object.key,content);}
    assert.deepEqual(await readSite(target.db),await readSite(source.db));
    assert.deepEqual(await readStudioHead(target.db,seed.studioKey),await readStudioHead(source.db,seed.studioKey));
    assert.deepEqual((await target.db.prepare('SELECT * FROM cms_preview_facts ORDER BY target').all()).results,(await source.db.prepare('SELECT * FROM cms_preview_facts ORDER BY target').all()).results);
    for(const table of ['cms_cpu_migrations','cms_cpu_migration_rows'])assert.deepEqual((await target.db.prepare(`SELECT * FROM ${table} ORDER BY 1,2,3`).all()).results,(await source.db.prepare(`SELECT * FROM ${table} ORDER BY 1,2,3`).all()).results,'migration receipts, BLOB bytes and staged text restore exactly');
    assert.deepEqual(await readSite(target.db,1),await readSite(source.db,1));
    assert.equal((await checkCompatibility(target.db,{seed,initial})).compatible,true);
    assert.deepEqual(Buffer.from(await (await target.mf.dispatchFetch(target.url+image.src)).arrayBuffer()),bytes);
    const cookie='CF_Authorization='+await target.token();
    const migrationCall=artifact=>target.mf.dispatchFetch(target.url+'/admin/api/cpu-migration',{method:'POST',headers:{Cookie:cookie,Origin:target.url,'Content-Type':'application/json','X-CMS-Request':'1'},body:JSON.stringify({operationId:artifact.operationId,artifactHash:artifact.artifactHash,action:'commit'})});
    const restoredCopy=await readStudioHead(target.db,seed.studioKey);
    const migrationReplay=await migrationCall(committedMigration);
    assert.equal(migrationReplay.status,200,await migrationReplay.clone().text());
    assert.equal((await migrationReplay.json()).replayed,true,'committed receipt survives a later Save and restore');
    assert.equal((await migrationCall(pendingMigration)).status,409,'a sealed operation cannot commit at the copied database\'s new origin');
    assert.deepEqual(await readStudioHead(target.db,seed.studioKey),restoredCopy,'replay and stale-origin refusal never reapply the old copy');
    const historical=await readSite(target.db,1);
    const response=await target.mf.dispatchFetch(target.url+'/admin/api/save',{method:'POST',headers:{Cookie:cookie,Origin:target.url,'Content-Type':'application/json','X-CMS-Request':'1'},body:JSON.stringify({project:historical.project,baseVersion:2,requestId:crypto.randomUUID()})});
    assert.equal(response.status,200,await response.clone().text());
    assert.equal((await response.json()).version,3);
    const expected=validateProject(historical.project,seed,undefined,{origins:[target.url]});
    assert.deepEqual((await readSite(target.db)).project,expected);
    assert.deepEqual(JSON.parse((await readStudioHead(target.db,seed.studioKey)).parts.join('')),expected);
    assert.deepEqual((await readSite(target.db,1)).project,historical.project,'new origin-bound facts never rewrite historical content');
    const publicPage=await target.mf.dispatchFetch(target.url+'/');assert.equal(publicPage.status,200);assert.ok((await publicPage.text()).includes(image.src));
  } finally {await Promise.all([source.close(),target.close()]);await rm(directory,{recursive:true,force:true});}
});
