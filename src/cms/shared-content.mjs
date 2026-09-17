import { parseFragment, serialize } from 'parse5';
import { HttpError } from './http.mjs';
import { validateHtml } from './validation.mjs';

export const DEFAULT_SHARED_CONTENT=Object.freeze({'footer.tagline':'Lite hjärna. Lite hjärta.<br>Ganska mycket nyfikenhet.'});
const KEY=/^[a-z][a-z0-9.-]{0,79}$/;
function fail(message){throw new HttpError(422,message);}
function attr(node,name){return node.attrs?.find(item=>item.name===name)?.value;}
function setAttr(node,name,value){
  node.attrs??=[]; const current=node.attrs.find(item=>item.name===name);
  if(current)current.value=value; else node.attrs.push({name,value});
}
function walk(node,visit){visit(node);for(const child of node.childNodes??[])walk(child,visit);}
function findNode(root,name,value){let found=null;walk(root,node=>{if(!found&&attr(node,name)===value)found=node;});return found;}
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

export function normalizeStoredProject(input,seed={},initial={}){
  if(!input||input.sharedContent!==undefined&&input.sharedContent!==null)return input;
  const required=Object.keys(seed.sharedContent??{});
  if(!required.length)return input;
  const project=structuredClone(input), values={};
  for(const page of project.pages??[]){
    const template=(initial.pages??[]).find(item=>item.id===page.id)||(initial.pages??[]).find(item=>item.id===page.sourceId)||seed.blank;
    if(!template?.html)fail('Den sparade versionen saknar en kompatibel sidmall.');
    const trusted=parseFragment(template.html), legacy=parseFragment(page.html);
    for(const key of required){
      const marker=findNode(trusted,'data-cms-shared',key);
      const nodeKey=marker&&attr(marker,'data-cms-node');
      const target=nodeKey&&findNode(legacy,'data-cms-node',nodeKey);
      if(!target)fail(`Den sparade versionen saknar en kompatibel gemensam innehållsplats: ${key}.`);
      setAttr(target,'data-cms-shared',key);
      const value=normalizeSharedValue(serialize(target));
      if(Object.hasOwn(values,key)&&values[key]!==value)fail(`Den sparade versionen har olika innehåll för ${key} mellan sidor.`);
      values[key]=value;
    }
    page.html=serialize(legacy);
  }
  project.sharedContent=normalizeSharedContent(values,seed);
  return project;
}
export function validateSharedInstances(pages,sharedContent,{publication=true,requiredEverywhere=[]}={}){
  const seen=new Map();
  for(const page of pages){
    const perPage=new Map(),tree=parseFragment(page.html);
    walk(tree,node=>{
      const key=attr(node,'data-cms-shared'); if(!key)return;
      if(!KEY.test(key)||!Object.hasOwn(sharedContent,key))fail('Sidan använder en okänd gemensam innehållsplats.');
      const value=normalizeSharedValue(serialize(node));
      if(publication&&value!==sharedContent[key])fail(`Det gemensamma innehållet ${key} skiljer sig mellan sidor.`);
      seen.set(key,(seen.get(key)??0)+1); perPage.set(key,(perPage.get(key)??0)+1);
    });
    if(publication)for(const key of requiredEverywhere)if((perPage.get(key)??0)!==1)fail(`Det gemensamma innehållet ${key} måste finnas exakt en gång på alla sidor.`);
  }
  return seen;
}
