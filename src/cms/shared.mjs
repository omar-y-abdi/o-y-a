import {parseFragment,serialize} from 'parse5';
import {HttpError} from './http.mjs';
export const sharedDefaults=Object.freeze({'footer.tagline':'Lite hjärna. Lite hjärta.<br>Ganska mycket nyfikenhet.'});
function attr(node,name){return node.attrs?.find(a=>a.name===name)?.value}
function setAttr(node,name,value){const found=node.attrs?.find(a=>a.name===name);if(found)found.value=value;else (node.attrs??=[]).push({name,value})}
function walk(node,fn){if(node.tagName)fn(node);for(const child of node.childNodes??[])walk(child,fn)}
export function sanitizeSharedMarkup(value){
 if(typeof value!=='string'||value.length>1000)throw new HttpError(422,'Gemensamt innehåll är ogiltigt.');
 const tree=parseFragment(value);let elements=0;walk(tree,node=>{if(node.tagName!=='br'||++elements>20)throw new HttpError(422,'Gemensamt innehåll får bara innehålla text och radbrytningar.');if(node.attrs?.length)throw new HttpError(422,'Gemensamma radbrytningar får inte ha attribut.');});
 return serialize(tree);
}
function inner(node){return serialize(node).replace(/\sdata-cms-node="[^"]*"/g,'');}
function markLegacy(tree){
 let marked=false;walk(tree,node=>{
  if(marked||node.tagName!=='p'||attr(node,'data-cms-shared'))return;
  const parent=node.parentNode;if(!parent?.tagName||!String(attr(parent,'class')??'').split(/\s+/).includes('footer-main'))return;
  if(inner(node).replace(/\s+/g,' ').trim()===sharedDefaults['footer.tagline']){setAttr(node,'data-cms-shared','footer.tagline');marked=true;}
 });return marked;
}
export function sharedValues(html,{markLegacyFooter=false}={}){
 const tree=parseFragment(html,{scriptingEnabled:true});if(markLegacyFooter)markLegacy(tree);const values={};walk(tree,node=>{const key=attr(node,'data-cms-shared');if(key){if(!Object.hasOwn(sharedDefaults,key))throw new HttpError(422,`Okänd gemensam innehållsplats: ${key}.`);const value=sanitizeSharedMarkup(inner(node));if(Object.hasOwn(values,key)&&values[key]!==value)throw new HttpError(422,`Gemensamt innehåll ${key} skiljer sig inom sidan.`);values[key]=value;}});return {html:serialize(tree),values};
}
export function setSharedValue(html,key,value){
  if(!Object.hasOwn(sharedDefaults,key))throw new HttpError(422,`Okänd gemensam innehållsplats: ${key}.`);
  const clean=sanitizeSharedMarkup(value),tree=parseFragment(html,{scriptingEnabled:true});let found=0;
  walk(tree,node=>{if(attr(node,'data-cms-shared')===key){const fragment=parseFragment(clean);node.childNodes=fragment.childNodes;for(const child of node.childNodes)child.parentNode=node;found++;}});
  if(!found)throw new HttpError(422,`Gemensamt innehåll ${key} saknar instans.`);return serialize(tree);
}
export function normalizeSharedProject(project){
 if(!project||!Array.isArray(project.pages))return project;
 const map={...sharedDefaults,...(project.sharedContent??{})};for(const key of Object.keys(map)){if(!Object.hasOwn(sharedDefaults,key))throw new HttpError(422,`Okänd gemensam innehållsplats: ${key}.`);map[key]=sanitizeSharedMarkup(map[key]);}
 const pages=project.pages.map(page=>{const found=sharedValues(page.html,{markLegacyFooter:true});for(const [key,value] of Object.entries(found.values)){if(project.sharedContent&&value!==map[key])throw new HttpError(422,`Gemensamt innehåll ${key} skiljer sig mellan sidor.`);if(!project.sharedContent)map[key]=value;}return {...page,html:found.html};});
 // All marked instances must equal the canonical map.
 for(const page of pages){const found=sharedValues(page.html);for(const [key,value] of Object.entries(found.values))if(value!==map[key])throw new HttpError(422,`Gemensamt innehåll ${key} skiljer sig mellan sidor.`);}
 return {...project,pages,sharedContent:map};
}
