import { shiftLink } from '../content/skift.mjs';
import { attribute, elements } from './html-tree.mjs';
import { parseFragment, serialize } from 'parse5';
import { HttpError } from './http.mjs';
import { validateHtml, rekeyHtml, hasSignatureKeys } from './validation.mjs';
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

// Fingerprint of a known seed copy: exact UTF-16 length plus a 53-bit cyrb53
// hash. Synchronous, because every read-time normalizer is synchronous.
export function fingerprint(text){
  let h1=0xdeadbeef,h2=0x41c6ce57;
  for(let i=0;i<text.length;i++){const ch=text.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}
  h1=Math.imul(h1^h1>>>16,2246822507)^Math.imul(h2^h2>>>13,3266489909);
  h2=Math.imul(h2^h2>>>16,2246822507)^Math.imul(h1^h1>>>13,3266489909);
  return {length:text.length,hash:4294967296*(2097151&h2)+(h1>>>0)};
}

// /developers/ HTML exactly as earlier releases seeded it. The owner never
// edited such a copy, so reads serve the current template instead (A1a).
// v185 (production head since 2026-10-11), proven by tests/cms-template-drift.
export const STALE_DEVELOPERS_HTML=[{length:15246,hash:8298929461772957}];
const isStaleDevelopers=html=>STALE_DEVELOPERS_HTML.some(entry=>entry.length===html.length&&entry.hash===fingerprint(html).hash);
export function refreshDevelopersPage(page,template){
  // Seeded copies have empty CSS; owner CSS targets the stale copy's node keys.
  if(!template?.html||!page||page.id!==template.id||typeof page.html!=='string'||page.css||!isStaleDevelopers(page.html))return page;
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
export function refreshDevelopers(input,seed){
  seed=seed.legacy??seed;
  if(!input||!Array.isArray(input.pages)||!seed.footerPage)return input;
  const pages=input.pages.map(page=>refreshDevelopersPage(page,seed.footerPage));
  return pages.every((page,index)=>page===input.pages[index])?input:{...input,pages};
}

// Stored pages from older builds carry positional keys; trusted stored HTML is
// re-keyed after the steps that read its raw bytes and keys.
function rekeyPages(project){
  if(!Array.isArray(project?.pages)||!project.pages.some(page=>typeof page?.html==='string'&&!hasSignatureKeys(page.html)))return project;
  return {...project,pages:project.pages.map(page=>typeof page?.html==='string'?{...page,html:rekeyHtml(page.html)}:page)};
}
export function normalizeStoredProject(input,seed={},initial={}){
  seed=seed.legacy??seed;
  return rekeyPages(normalizeStoredPages(refreshDevelopers(input,seed),seed,initial));
}
export function normalizeClientProject(input,seed={}){
  return normalizeStoredPages(input,seed.legacy??seed,{});
}
function normalizeStoredPages(input,seed,initial){
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
      const nodeKey=seed.sharedSlots?.[page.id]?.[key]??seed.sharedSlots?.[page.sourceId]?.[key]??(marker&&attr(marker,'data-cms-node'));
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


export const FOOTER_VERSION = 1;
const LINK = '<a href="/developers/">För utvecklare</a>';
// PR #10 migration. Signature keys do not shift, so only the link is added;
// validateProject then checks the result against the current contracts.
// Only pre-PR #10 pages qualify: unmarked and still positionally keyed. An
// unmarked page with signature keys comes from a current build.
export function normalizeFooterPage(page) {
  if (page.footerVersion !== undefined && page.footerVersion !== FOOTER_VERSION) throw new HttpError(422, 'Sidfotens version stöds inte.');
  if (page.footerVersion === FOOTER_VERSION || typeof page.html !== 'string' || hasSignatureKeys(page.html)) return page;
  const tree = parseFragment(page.html, { scriptingEnabled: true });
  // Legal pages hold a first privacy button in div.legal-actions: use the one
  // whose parent is a nav inside a footer.
  const inFooter = node => { for (let parent = node.parentNode; parent; parent = parent.parentNode) if (parent.tagName === 'footer') return true; return false; };
  const nav = elements(tree).find(node => attribute(node, 'data-privacy-open') !== undefined && node.parentNode?.tagName === 'nav' && inFooter(node))?.parentNode;
  if (!nav || elements(nav).some(node => node.tagName === 'a' && attribute(node, 'href') === '/developers/')) return { ...page, footerVersion: FOOTER_VERSION };
  const link = parseFragment(LINK).childNodes[0];
  link.parentNode = nav;
  nav.childNodes.unshift(link);
  return { ...page, html: serialize(tree), footerVersion: FOOTER_VERSION };
}

export function normalizeFooterProject(input, seed) {
  seed = seed.legacy ?? seed;
  if (!input || !Array.isArray(input.pages)) return input;
  let changed = false;
  const pages = input.pages.map(page => {
    if (!page || typeof page !== 'object') return page;
    const normalized = normalizeFooterPage(page);
    changed ||= normalized !== page;
    return normalized;
  });
  if (!changed) return input;
  // The new footer must point to a page that is also editable and publishable.
  // Once marked, subsequent owner edits/deletions are not re-added on reads.
  if (seed.footerPage && !pages.some(page => page?.path === seed.footerPage.path || page?.id === seed.footerPage.id)) pages.push({ ...structuredClone(seed.footerPage), footerVersion: FOOTER_VERSION });
  return { ...input, pages };
}


// The link uses a fixed identity outside the signature keys.
export function normalizeSkiftPage(page, definition) {
  const links = definition?.contracts?.filter(contract => ['skift-nav', 'skift-nav-mobile'].includes(contract.key)) ?? [];
  if (!links.length || typeof page.html !== 'string') return page;
  // A page that already carries every link identity needs no migration and is
  // returned without parsing it on each public read.
  if (links.every(link => page.html.includes(`data-cms-node="${link.key}"`))) return page;
  const tree = parseFragment(page.html, { scriptingEnabled: true });
  const nodes = elements(tree);
  const missing = links.filter(link => !nodes.some(node => attr(node, 'data-cms-node') === link.key));
  if (!missing.length) return page;
  // Check a re-keyed copy: stored pages from older builds carry positional keys.
  // The output keeps the page's own keys; Save validates them afterwards.
  validateHtml(rekeyHtml(page.html), definition.contracts.filter(contract => !missing.some(link => link.key === contract.key)));
  for (const link of missing) {
    const menu = nodes.find(node => (attr(node, 'class') ?? '').split(/\s+/).includes(link.containerClass));
    if (!menu) throw new HttpError(422, 'Sidans toppmeny saknas.');
    const anchor = parseFragment(shiftLink(false, link.key === 'skift-nav-mobile')).childNodes[0];
    anchor.attrs.push({ name: 'data-cms-node', value: link.key });
    anchor.parentNode = menu;
    const workshop = menu.childNodes.findIndex(node => node.tagName === 'a' && attr(node, 'href') === '/verkstad/');
    menu.childNodes.splice(workshop < 0 ? menu.childNodes.length : workshop + 1, 0, anchor);
  }
  return { ...page, html: serialize(tree) };
}

// The game page is code-owned: the build at SKIFT_PATH is always served, so a
// stored copy is dropped on read and on save instead of shadowing template fixes.
export function normalizeSkiftProject(input, seed) {
  seed = seed.legacy ?? seed;
  if (!input || !Array.isArray(input.pages)) return input;
  const pages = input.pages.filter(page => page?.id !== 'skift').map(page => {
    if (!page || typeof page !== 'object') return page;
    const definition = seed.pages?.find(item => item.id === page.id) ?? seed.pages?.find(item => item.id === page.sourceId) ?? seed.blank;
    return normalizeSkiftPage(page, definition);
  });
  let runtime = input.runtime;
  if (runtime && typeof runtime === 'object' && !Array.isArray(runtime)) {
    const missing = Object.entries(seed.runtime ?? {}).filter(([key]) => key.startsWith('runtime.skift.') && !Object.hasOwn(runtime, key));
    if (missing.length) runtime = { ...Object.fromEntries(missing), ...runtime };
  }
  return runtime === input.runtime && pages.length === input.pages.length && pages.every((page, index) => page === input.pages[index]) ? input : { ...input, pages, runtime };
}
