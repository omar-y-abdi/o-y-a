import { parseFragment, serialize } from 'parse5';

function attr(node,name){ return node.attrs?.find(item=>item.name===name)?.value; }
function walk(node,visit){ visit(node); for(const child of node.childNodes??[]) walk(child,visit); }
function semanticInner(node) {
  const clone=parseFragment(serialize(node));
  walk(clone, child => { if (child.attrs) child.attrs=child.attrs.filter(item=>item.name!=='data-cms-node'); });
  return serialize(clone);
}
export function extractSharedValues(html) {
  const values=new Map(), tree=parseFragment(html);
  walk(tree,node=>{ const key=attr(node,'data-cms-shared'); if(key) values.set(key,semanticInner(node)); });
  return values;
}
export function propagateSharedValue(html,key,value) {
  const tree=parseFragment(html);
  walk(tree,node=>{
    if(attr(node,'data-cms-shared')!==key) return;
    const content=parseFragment(value);
    node.childNodes=content.childNodes;
    for(const child of node.childNodes) child.parentNode=node;
  });
  return serialize(tree);
}
export function synchronizeSharedPage(project,pageId,nextPage) {
  let pages=project.pages.map(page=>page.id===pageId?nextPage:page);
  const sharedContent={...(project.sharedContent??{})};
  const values=extractSharedValues(nextPage.html);
  for(const [key,value] of values){
    if(sharedContent[key]===value) continue;
    sharedContent[key]=value;
    pages=pages.map(page=>({...page,html:propagateSharedValue(page.html,key,value)}));
  }
  return {...project,pages,sharedContent};
}
