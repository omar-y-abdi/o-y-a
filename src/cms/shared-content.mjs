import { parseFragment, serialize } from 'parse5';
import { HttpError } from './http.mjs';
import { validateHtml } from './validation.mjs';
import { normalizeFooterProject, FOOTER_VERSION } from './footer.mjs';
import { normalizeSkiftProject } from './skift.mjs';
import { attribute as attr, walk, setInner } from './html-tree.mjs';

export const DEFAULT_SHARED_CONTENT=Object.freeze({'footer.tagline':'Lite hjärna. Lite hjärta.<br>Ganska mycket nyfikenhet.'});
const KEY=/^[a-z][a-z0-9.-]{0,79}$/;
function fail(message){throw new HttpError(422,message);}
function setAttr(node,name,value){
  node.attrs??=[]; const current=node.attrs.find(item=>item.name===name);
  if(current)current.value=value; else node.attrs.push({name,value});
}
function findNode(root,name,value){let found=null;walk(root,node=>{if(!found&&attr(node,name)===value)found=node;});return found;}
function sharedLabel(value){
  const root=parseFragment(value); let text='';
  walk(root,node=>{if(node.nodeName==='#text')text+=node.value; else if(node.tagName==='br')text+=' ';});
  text=text.replace(/\s+/g,' ').trim();
  return text.length>160?`${text.slice(0,157)}…`:text||'Tom text';
}
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

// Synchronous SHA-256 (FIPS 180-4): read-time normalizers are synchronous and
// crypto.subtle only resolves a Promise. Constants derive from the first primes.
const SHA_INITIAL=new Uint32Array(8),SHA_ROUND=new Uint32Array(64);
for(let n=2,count=0;count<64;n++){
  let prime=true;for(let d=2;d*d<=n;d++)if(n%d===0)prime=false;
  if(!prime)continue;
  if(count<8)SHA_INITIAL[count]=n**0.5*2**32|0;
  SHA_ROUND[count++]=n**(1/3)*2**32|0;
}
export function sha256(text){
  const bytes=new TextEncoder().encode(text),length=Math.ceil((bytes.length+9)/64)*64;
  const data=new Uint8Array(length);data.set(bytes);data[bytes.length]=0x80;
  const view=new DataView(data.buffer);
  view.setUint32(length-8,Math.floor(bytes.length/2**29));view.setUint32(length-4,bytes.length*8>>>0);
  const hash=SHA_INITIAL.slice(),w=new Uint32Array(64),rotr=(x,n)=>x>>>n|x<<32-n;
  for(let offset=0;offset<length;offset+=64){
    for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);
    for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=w[i-16]+(rotr(x,7)^rotr(x,18)^x>>>3)+w[i-7]+(rotr(y,17)^rotr(y,19)^y>>>10);}
    let [a,b,c,d,e,f,g,h]=hash;
    for(let i=0;i<64;i++){
      const t1=h+(rotr(e,6)^rotr(e,11)^rotr(e,25))+(e&f^~e&g)+SHA_ROUND[i]+w[i]|0;
      const t2=(rotr(a,2)^rotr(a,13)^rotr(a,22))+(a&b^a&c^b&c)|0;
      h=g;g=f;f=e;e=d+t1|0;d=c;c=b;b=a;a=t1+t2|0;
    }
    [a,b,c,d,e,f,g,h].forEach((value,i)=>{hash[i]+=value;});
  }
  return [...hash].map(word=>word.toString(16).padStart(8,'0')).join('');
}

// SHA-256 of /developers/ HTML exactly as earlier releases seeded it. The owner
// never edited such a copy, so reads serve the current template instead (A1a).
// v185 (production head since 2026-10-11), proven by tests/cms-template-drift.
export const STALE_DEVELOPERS_HTML=new Set(['d0be9a8b08f08e548ad938bd730d236350af1bab3f93e37742f5aca5ef2e097e']);
export function refreshDevelopersPage(page,template){
  if(!template?.html||!page||page.id!==template.id||typeof page.html!=='string'||!STALE_DEVELOPERS_HTML.has(sha256(page.html)))return page;
  // Publication kept shared values equal on every page; carry the copy's own.
  const stale=parseFragment(page.html),tree=parseFragment(template.html);
  walk(tree,node=>{
    const key=attr(node,'data-cms-shared'),source=key&&findNode(stale,'data-cms-shared',key);
    if(source)setInner(node,normalizeSharedValue(serialize(source)));
  });
  // Facts describe the stale HTML; the template is revalidated before reuse.
  const {facts,...rest}=page;
  return {...rest,html:serialize(tree),footerVersion:FOOTER_VERSION};
}
function refreshDevelopers(input,seed){
  if(!input||!Array.isArray(input.pages)||!seed.footerPage)return input;
  const pages=input.pages.map(page=>refreshDevelopersPage(page,seed.footerPage));
  return pages.every((page,index)=>page===input.pages[index])?input:{...input,pages};
}

export function normalizeStoredProject(input,seed={},initial={}){
  input=refreshDevelopers(input,seed);
  input=normalizeFooterProject(input,seed);
  if(!input||input.sharedContent!==undefined&&input.sharedContent!==null)return normalizeSkiftProject(input,seed);
  const required=Object.keys(seed.sharedContent??{});
  if(!required.length)return input;
  const project=structuredClone(input);
  const variants=new Map(required.map(key=>[key,new Map()]));
  const trees=[];
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
      const options=variants.get(key), pages=options.get(value)??[];
      pages.push(page.name||page.path||page.id);
      options.set(value,pages);
    }
    trees.push({page,legacy});
  }
  const values={}, conflicts=[];
  for(const key of required){
    const options=[...variants.get(key).entries()];
    if(!options.length)fail(`Den sparade versionen saknar gemensamt innehåll för ${key}.`);
    const preferred=seed.sharedContent?.[key]===undefined?null:normalizeSharedValue(seed.sharedContent[key]);
    const value=options.find(([candidate])=>candidate===preferred)?.[0]??options[0][0];
    values[key]=value;
    if(options.length>1)conflicts.push({key,options:options.map(([candidate,pages])=>({value:candidate,label:sharedLabel(candidate),pages}))});
  }
  for(const {page,legacy} of trees){
    for(const key of required){
      const target=findNode(legacy,'data-cms-shared',key);
      if(!target)fail(`Den sparade versionen saknar en kompatibel gemensam innehållsplats: ${key}.`);
      setInner(target,values[key]);
    }
    page.html=serialize(legacy);
  }
  project.sharedContent=normalizeSharedContent(values,seed);
  if(conflicts.length)project.sharedContentConflicts=conflicts;
  return normalizeSkiftProject(project,seed);
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
