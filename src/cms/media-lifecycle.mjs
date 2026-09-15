import { HttpError } from './http.mjs';
import { resourceReferences } from './resources.mjs';
import { readSite } from './store.mjs';

const ACTIONS = new Set(['archive','restore','trash','delete']);
const stateFrom = row => row?.trashed_at ? 'trash' : row?.archived_at ? 'archived' : 'active';
export const lifecycleState = row => stateFrom(row);

export async function historicalUsage(db, src) {
  const rows = await db.prepare('SELECT version FROM cms_revisions ORDER BY version DESC').all();
  let history=0; const versions=[];
  for (const row of rows.results) {
    const state=await readSite(db,row.version); const count=state ? resourceReferences(state.project).get(src)??0 : 0;
    if(count){history+=count;versions.push(row.version);}
  }
  return {history,versions};
}
export async function mediaUsage(db, project, src) {
  return {current:resourceReferences(project).get(src)??0,...await historicalUsage(db,src)};
}
const blocked=(usage,message)=>{throw new HttpError(409,message,{usage});};

export async function mutateUploadedLifecycle(env,id,{action,baseVersion,project}) {
  if(!ACTIONS.has(action)||!Number.isSafeInteger(baseVersion)||baseVersion<0) throw new HttpError(422,'Filens livscykeländring är ogiltig.');
  const row=await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id=?').bind(id).first();
  if(!row) throw new HttpError(404,'Filen finns inte.');
  if(row.version!==baseVersion) throw new HttpError(409,'Filen ändrades i en annan flik.',{asset:row});
  const src=`/media/${row.object_key}`, usage=await mediaUsage(env.CMS_DB,project,src);
  if(action==='trash'&&usage.current) blocked(usage,`Filen används ${usage.current} gånger i utkastet. Ta bort eller ersätt användningen först.`);
  if(action==='delete') {
    if(stateFrom(row)!=='trash') throw new HttpError(409,'Flytta filen till papperskorgen innan permanent radering.',{usage});
    if(usage.current||usage.history) blocked(usage,'Filen används av aktuellt innehåll eller sparad historik och kan inte raderas permanent.');
    const object=await env.CMS_MEDIA?.get(row.object_key); if(!object) throw new HttpError(409,'Filens bytes saknas i lagringen. Metadata behålls för återställning.',{usage});
    const bytes=new Uint8Array(await object.arrayBuffer());
    await env.CMS_MEDIA.delete(row.object_key);
    try {
      const result=await env.CMS_DB.prepare('DELETE FROM cms_media WHERE id=? AND version=?').bind(id,baseVersion).run();
      if(!result.meta?.changes) throw new HttpError(409,'Filen ändrades i en annan flik. Ingen metadata raderades.');
    } catch(error) {
      try { if(!(await env.CMS_MEDIA.head(row.object_key))) await env.CMS_MEDIA.put(row.object_key,bytes,{httpMetadata:{contentType:row.mime},customMetadata:{sha256:row.sha256}}); } catch {}
      throw error;
    }
    return {deleted:true,id};
  }
  const now=new Date().toISOString();
  const archived=action==='archive'?now:null, trashed=action==='trash'?now:null;
  const updated=await env.CMS_DB.prepare('UPDATE cms_media SET archived_at=?, trashed_at=?, version=version+1 WHERE id=? AND version=? RETURNING *').bind(archived,trashed,id,baseVersion).first();
  if(!updated) throw new HttpError(409,'Filen ändrades i en annan flik.');
  return updated;
}

export async function builtinStates(db) { return (await db.prepare('SELECT * FROM cms_builtin_resource_state').all()).results; }
export function applyBuiltinState(asset,row) {
  if(!row) return {...asset,version:0,state:'active',archived:false,trashed:false};
  if(row.deleted_at) return null;
  const state=stateFrom(row); return {...asset,name:row.name??asset.name,alt:row.alt??asset.alt,version:row.version,state,archived:state==='archived',trashed:state==='trash',replacementId:row.replacement_id??null};
}
export async function mutateBuiltinLifecycle(db,asset,{action,baseVersion,project}) {
  if(!asset?.builtin||!ACTIONS.has(action)||!Number.isSafeInteger(baseVersion)||baseVersion<0) throw new HttpError(422,'Originalresursens livscykeländring är ogiltig.');
  const row=await db.prepare('SELECT * FROM cms_builtin_resource_state WHERE src=?').bind(asset.src).first(); const current=row?.version??0;
  if(current!==baseVersion) throw new HttpError(409,'Originalresursen ändrades i en annan flik.');
  const usage=await mediaUsage(db,project,asset.src);
  if(action==='trash'&&usage.current) blocked(usage,`Originalresursen används ${usage.current} gånger i utkastet. Ersätt användningen först.`);
  if(action==='delete'&&(usage.current||usage.history)) blocked(usage,'Originalresursen används av aktuellt innehåll eller historik och kan inte tas bort ur CMS-katalogen.');
  if(action==='delete'&&stateFrom(row)!=='trash') throw new HttpError(409,'Flytta originalresursen till papperskorgen innan permanent borttagning.',{usage});
  const now=new Date().toISOString(),archived=action==='archive'?now:null,trashed=action==='trash'?now:null,deleted=action==='delete'?now:null;
  await db.prepare(`INSERT INTO cms_builtin_resource_state(src,version,archived_at,trashed_at,deleted_at) VALUES(?,1,?,?,?) ON CONFLICT(src) DO UPDATE SET archived_at=excluded.archived_at,trashed_at=excluded.trashed_at,deleted_at=excluded.deleted_at,version=cms_builtin_resource_state.version+1 WHERE cms_builtin_resource_state.version=?`).bind(asset.src,archived,trashed,deleted,baseVersion).run();
  const updated=await db.prepare('SELECT * FROM cms_builtin_resource_state WHERE src=?').bind(asset.src).first();
  if(!updated||updated.version!==baseVersion+1) throw new HttpError(409,'Originalresursen ändrades i en annan flik.');
  if(action==='delete') return {deleted:true,src:asset.src};
  return applyBuiltinState(asset,updated);
}
