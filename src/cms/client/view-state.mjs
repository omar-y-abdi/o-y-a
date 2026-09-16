export function centerOffset(stageWidth,_frameWidth,zoom=100){
  const scale=Math.max(.01,Number(zoom)||100)/100;
  // GrapesJS centers the unscaled frame first, then scales the whole frame
  // container from 0 0. Canvas coords are then applied in screen pixels, so
  // compensate only for the stage midpoint lost to scaling.
  return stageWidth*(1-scale)/2;
}
export function componentKey(component){
  if(!component)return null;
  const attrs=component.getAttributes?.()??{};
  if(attrs['data-cms-node'])return {kind:'cms',value:attrs['data-cms-node']};
  if(attrs.id)return {kind:'id',value:attrs.id};
  const value=[]; for(let node=component,parent=node.parent?.();parent;node=parent,parent=node.parent?.())value.unshift(node.index?.()??0);
  return {kind:'path',value};
}
function selector(value,name){return `[${name}="${String(value).replaceAll('\\','\\\\').replaceAll('"','\\"')}"]`;}
export function findComponentByKey(editor,key){
  if(!key)return null; const root=editor.getWrapper();
  if(key.kind==='cms')return root.find(selector(key.value,'data-cms-node'))[0]??null;
  if(key.kind==='id')return root.find(selector(key.value,'id'))[0]??null;
  if(key.kind==='path'){let node=root;for(const index of key.value){node=node?.components?.().at(index);if(!node)return null;}return node;}
  return null;
}
export function captureInspectorScroll(root=document){
  const panel=root.querySelector?.('.right-panel');
  return {right:panel?.scrollTop??0,custom:root.querySelector?.('#custom-inspector')?.scrollTop??0,styles:root.querySelector?.('#styles-panel')?.scrollTop??0,traits:root.querySelector?.('#traits-panel')?.scrollTop??0};
}
export function restoreInspectorScroll(snapshot,root=document){
  if(!snapshot)return; for(const [key,selector] of [['right','.right-panel'],['custom','#custom-inspector'],['styles','#styles-panel'],['traits','#traits-panel']]){const node=root.querySelector?.(selector);if(node)node.scrollTop=snapshot[key]??0;}
}
export function captureEditorView(editor,{device,zoom,tab}={}){
  if(!editor)return {device,zoom,tab,inspector:captureInspectorScroll()};
  const canvas=editor.Canvas, win=canvas.getWindow?.(), coords=canvas.getCoords?.()??{};
  return {device,zoom,tab,coords:{x:Number(coords.x??coords.left??0),y:Number(coords.y??coords.top??0)},scroll:{x:win?.scrollX??0,y:win?.scrollY??0},selected:componentKey(editor.getSelected?.()),inspector:captureInspectorScroll()};
}
export function restoreEditorView(editor,snapshot,{setTab}={}){
  if(!editor||!snapshot)return;
  if(snapshot.coords&&editor.Canvas.setCoords)editor.Canvas.setCoords(snapshot.coords.x,snapshot.coords.y);
  const win=editor.Canvas.getWindow?.(); if(win&&snapshot.scroll)win.scrollTo(snapshot.scroll.x,snapshot.scroll.y);
  const selected=findComponentByKey(editor,snapshot.selected); if(selected)editor.select(selected); else editor.select();
  if(setTab&&snapshot.tab)setTab(snapshot.tab);
  requestAnimationFrame(()=>restoreInspectorScroll(snapshot.inspector));
}
