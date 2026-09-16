import { test } from 'vitest';
import assert from 'node:assert/strict';
import { isResizableComponent, nudgeComponent, resetComponentPosition } from '../src/cms/client/position.mjs';
import { componentKey, findComponentByKey, centerOffset } from '../src/cms/client/view-state.mjs';

function component({tag='div',type='default',attrs={},style={},parent=null,index=0}={}) {
  let current={...style};
  return { get:key=>key==='tagName'?tag:key==='type'?type:undefined, getAttributes:()=>attrs, getStyle:()=>({...current}), addStyle:value=>{current={...current,...value};}, removeStyle:key=>{delete current[key];}, parent:()=>parent, index:()=>index, style:()=>current };
}

test('resize allowlist includes visual layout components but protects functional controls and low-level SVG shapes',()=>{
  assert.equal(isResizableComponent(component({tag:'p',type:'text'})),true);
  assert.equal(isResizableComponent(component({tag:'a',type:'link',attrs:{href:'/kontakt/'}})),true);
  assert.equal(isResizableComponent(component({tag:'img',type:'image'})),true);
  assert.equal(isResizableComponent(component({tag:'g'})),false);
  assert.equal(isResizableComponent(component({tag:'path'})),false);
  assert.equal(isResizableComponent(component({tag:'button',attrs:{'data-print':''}})),false);
  assert.equal(isResizableComponent(component({tag:'input'})),false);
});

test('nudge uses individual translate and preserves existing transform; reset removes only translate',()=>{
  const item=component({style:{transform:'rotate(4deg) scale(.9)',translate:'2px -3px'}});
  nudgeComponent(item,1,0); assert.equal(item.style().translate,'3px -3px'); assert.equal(item.style().transform,'rotate(4deg) scale(.9)');
  nudgeComponent(item,0,1,10); assert.equal(item.style().translate,'3px 7px');
  resetComponentPosition(item); assert.equal(item.style().translate,undefined); assert.equal(item.style().transform,'rotate(4deg) scale(.9)');
});

test('selection identity prefers stable cms node, then DOM id, then component path',()=>{
  const root=component({tag:'main'});
  const child=component({tag:'p',attrs:{'data-cms-node':'n42',id:'lead'},parent:root,index:2});
  assert.deepEqual(componentKey(child),{kind:'cms',value:'n42'});
  assert.deepEqual(componentKey(component({tag:'p',attrs:{id:'lead'},parent:root,index:2})),{kind:'id',value:'lead'});
  const fallback=component({tag:'p',parent:root,index:2});
  assert.deepEqual(componentKey(fallback),{kind:'path',value:[2]});
});

test('component identity lookup and center math are stable',()=>{
  const found={};
  const editor={getWrapper:()=>({find:selector=>selector.includes('n42')?[found]:[]})};
  assert.equal(findComponentByKey(editor,{kind:'cms',value:'n42'}),found);
  assert.equal(centerOffset(1000,390,100),0);
  assert.ok(Math.abs(centerOffset(1000,390,80)-100)<1e-9);
});

test('editor policy separates normal styling from color/effects mode and removes direct canvas move toolbar', async()=>{
  const { normalStyleSectors, websiteStyleSectors, configureVisualComponent }=await import('../src/cms/client/editor-policy.mjs');
  assert.ok(normalStyleSectors.some(sector=>sector.id==='position'));
  assert.ok(!websiteStyleSectors.some(sector=>sector.id==='position'));
  const props=websiteStyleSectors.flatMap(sector=>sector.buildProps??sector.properties??[]).map(prop=>typeof prop==='string'?prop:prop.property);
  for(const property of ['color','background-color','border-color','fill','stroke','box-shadow','text-shadow','filter']) assert.ok(props.includes(property),property);
  const values=new Map([['tagName','a'],['type','link'],['toolbar',null]]);
  const item={get:key=>values.get(key),set:(key,value)=>typeof key==='string'?values.set(key,value):Object.entries(key).forEach(([k,v])=>values.set(k,v)),getAttributes:()=>({href:'/kontakt/'}),parent:()=>({})};
  configureVisualComponent(item);
  assert.equal(values.get('resizable'),true);
  assert.deepEqual(values.get('toolbar'),[]);
});
