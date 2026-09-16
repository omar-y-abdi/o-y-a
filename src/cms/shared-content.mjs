import { parseFragment, serialize } from 'parse5';
import { HttpError } from './http.mjs';
import { validateHtml } from './validation.mjs';

export const DEFAULT_SHARED_CONTENT=Object.freeze({'footer.tagline':'Lite hjärna. Lite hjärta.<br>Ganska mycket nyfikenhet.'});
const KEY=/^[a-z][a-z0-9.-]{0,79}$/;
function fail(message){throw new HttpError(422,message);}
function attr(node,name){return node.attrs?.find(item=>item.name===name)?.value;}
function walk(node,visit){visit(node);for(const child of node.childNodes??[])walk(child,visit);}
export function normalizeSharedValue(value){
  if(typeof value!=='string'||value.length>10000)fail('Gemensamt innehåll är ogiltigt.');
  const wrapped=validateHtml(`<span>${value}</span>`);
  const root=parseFragment(wrapped).childNodes.find(node=>node.tagName==='span');
  if(!root)fail('Gemensamt innehåll är ogiltigt.');
  walk(root,node=>{if(node.attrs)node.attrs=node.attrs.filter(item=>item.name!=='data-cms-node');});
  return serialize(root);
}
export function normalizeSharedContent(input,seed={}){
  const base={...(seed.sharedContent??DEFAULT_SHARED_CONTENT)};
  if(input===undefined||input===null)return Object.fromEntries(Object.entries(base).map(([key,value])=>[key,normalizeSharedValue(value)]));
  if(typeof input!=='object'||Array.isArray(input)||Object.keys(input).length>100)fail('Gemensamt innehåll är ogiltigt.');
  for(const [key,value] of Object.entries(input)){if(!KEY.test(key))fail('Gemensamt innehåll har en ogiltig nyckel.');base[key]=normalizeSharedValue(value);}
  return base;
}
export function validateSharedInstances(pages,sharedContent,{publication=true,requiredEverywhere=[]}={}){
  const seen=new Map();
  for(const page of pages){
    const tree=parseFragment(page.html);
    walk(tree,node=>{
      const key=attr(node,'data-cms-shared'); if(!key)return;
      if(!KEY.test(key)||!Object.hasOwn(sharedContent,key))fail('Sidan använder en okänd gemensam innehållsplats.');
      const value=normalizeSharedValue(serialize(node));
      if(publication&&value!==sharedContent[key])fail(`Det gemensamma innehållet ${key} skiljer sig mellan sidor.`);
      seen.set(key,(seen.get(key)??0)+1);
    });
  }
  if(publication)for(const key of requiredEverywhere)if((seen.get(key)??0)!==pages.length)fail(`Det gemensamma innehållet ${key} måste finnas på alla sidor.`);
  return seen;
}
