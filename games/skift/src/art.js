import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const PALETTE={ink:'#202d36',blue:'#234ce7',yellow:'#ffda44',paper:'#fff7df',coral:'#f0805e',mint:'#90b9a1',metal:'#567581',dark:'#324b59'};
const materials=new Map(), geometries=new Map();
export function material(color,emissive=false) {
  const key=`${color}:${emissive}`;
  if(!materials.has(key)){
    const m=new T.MeshStandardMaterial({color,roughness:.72,metalness:.08,emissive:emissive?color:'#000000',emissiveIntensity:emissive?.6:0});
    m.userData.shared=true;materials.set(key,m);
  }
  return materials.get(key);
}
function geo(key,create){if(!geometries.has(key)){const g=create();g.userData.shared=true;geometries.set(key,g);}return geometries.get(key);}
const box=()=>geo('box',()=>new RoundedBoxGeometry(1,1,1,2,.09));
const cylinder=()=>geo('cylinder',()=>new T.CylinderGeometry(1,1,1,24));
const sphere=()=>geo('sphere',()=>new T.SphereGeometry(1,20,12));
const unitPlane=()=>geo('plane',()=>new T.PlaneGeometry(1,1));
function mesh(parent,g,color,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(g,typeof color==='string'?material(color):color);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export const block=(p,c,x,y,z,w,h,d)=>mesh(p,box(),c,x,y,z,w,h,d);
export const cyl=(p,c,x,y,z,r,h)=>mesh(p,cylinder(),c,x,y,z,r,h,r);
export const ball=(p,c,x,y,z,r)=>mesh(p,sphere(),c,x,y,z,r,r,r);
export function torus(p,c,x,y,z,r,t=.08){const g=geo(`torus:${r}:${t}`,()=>new T.TorusGeometry(r,t,6,36));return mesh(p,g,c,x,y,z);}
export function ring(p,c,x,z,r,t=.055){const m=torus(p,c,x,.035,z,r,t);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;}
export function pipe(p,c,points,r=.15){const path=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a)));const g=new T.TubeGeometry(path,Math.max(12,points.length*6),r,6,false);return mesh(p,g,c,0,0,0);}
export function label(p,text,x,y,z,w=3,h=.7,color=PALETTE.paper,ink=PALETTE.ink) {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=Math.max(64,Math.round(512*h/w));
  const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`800 ${Math.round(canvas.height*.63)}px Arial`;
  ctx.fillText(text,256,canvas.height*.52,480);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const mat=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide});
  return mesh(p,unitPlane(),mat,x,y,z,w,h,1);
}
/** Merge authored static art by material. Keep actors, signals and fans separate. */
export function batch(group) {
  group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(), buckets=new Map();
  group.traverse(child=>{if(!child.isMesh)return;const m=child.material;const id=m.uuid;
    if(!buckets.has(id))buckets.set(id,{material:m,geos:[]});
    const transform=new T.Matrix4().multiplyMatrices(inverse,child.matrixWorld);
    const geometry=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();
    buckets.get(id).geos.push(geometry.applyMatrix4(transform));
  });
  group.clear();
  for(const {material:mat,geos} of buckets.values()){
    const merged=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());
    const m=new T.Mesh(merged,mat);m.castShadow=true;m.receiveShadow=true;group.add(m);
  }
  return group;
}
function bolt(p,x,y,z){cyl(p,PALETTE.dark,x,y,z,.075,.07);block(p,PALETTE.paper,x,y+.039,z,.06,.009,.013);}
function planter(p,x,z,s=1){cyl(p,PALETTE.coral,x,.27,z,.55*s,.5);cyl(p,'#455c47',x,.54,z,.44*s,.03);
  for(let i=0;i<4;i++){const a=i*2.4;const stem=cyl(p,'#618263',x+Math.cos(a)*.15,.9+i*.09,z+Math.sin(a)*.15,.045,.8);stem.rotation.z=Math.sin(a)*.28;
    const leaf=ball(p,i%2?'#91ad72':'#6c976c',x+Math.cos(a)*.32,1.25+i*.09,z+Math.sin(a)*.32,.29*s);leaf.scale.y*=1.65;leaf.rotation.z=a*.3;}}
function crate(p,o){
  block(p,PALETTE.metal,o.x,.58,o.z,o.w*.92,1.15,o.d*.92);
  block(p,PALETTE.paper,o.x,1.18,o.z,o.w*.87,.16,o.d*.87);
  for(const dx of [-.34,.34])block(p,PALETTE.yellow,o.x+o.w*dx,.69,o.z,o.w*.07,1.35,o.d*.98);
  const l=label(p,'CAUTION',o.x,.55,o.z+o.d*.465,Math.min(1.65,o.w*.65),.3,PALETTE.yellow);l.rotation.y=0;
}
function tank(p,o,dynamics){
  const r=Math.min(o.w,o.d)*.4;
  block(p,PALETTE.dark,o.x,.2,o.z,o.w,.4,o.d);
  const count=o.d>4?2:1;
  for(let i=0;i<count;i++){
    const z=o.z+(i-(count-1)/2)*o.d*.46;
    cyl(p,PALETTE.paper,o.x,1.2,z,r,2.1);cyl(p,PALETTE.blue,o.x,.36,z,r*1.05,.18);cyl(p,PALETTE.blue,o.x,2.18,z,r*1.03,.18);
    const top=ball(p,PALETTE.mint,o.x,2.24,z,r*.86);top.scale.y=.33;
    for(let j=0;j<4;j++)block(p,PALETTE.dark,o.x-r*.68+j*r*.45,1.1,z+r*.96,.12,.8,.075);
    pipe(p,PALETTE.coral,[[o.x+r*.7,2.2,z],[o.x+r*1.1,2.5,z],[o.x+r*1.35,1.6,z],[o.x+r*1.35,.2,z]],.10);
    const f=new T.Group();f.position.set(o.x,2.52,z);cyl(f,PALETTE.dark,0,0,0,.16,.18);
    for(let j=0;j<4;j++){const b=block(f,PALETTE.blue,Math.sin(j*Math.PI/2)*r*.4,0,Math.cos(j*Math.PI/2)*r*.4,r*.6,.045,.22);b.rotation.y=-j*Math.PI/2;}
    batch(f);dynamics.add(f);f.userData.spin=.7;
  }
}
function turbine(p,o,dynamics){
  block(p,PALETTE.paper,o.x,.2,o.z,o.w,.4,o.d);
  block(p,PALETTE.blue,o.x,1,o.z,o.w*.9,1.7,o.d*.83);
  cyl(p,PALETTE.yellow,o.x,1.91,o.z,1.65,.22);cyl(p,PALETTE.dark,o.x,2.05,o.z,1.38,.18);
  const f=new T.Group();f.position.set(o.x,2.2,o.z);
  cyl(f,PALETTE.paper,0,0,0,.4,.3);
  for(let j=0;j<6;j++){const a=j*Math.PI/3,b=block(f,PALETTE.mint,Math.sin(a)*.8,0,Math.cos(a)*.8,.6,.15,.9);b.rotation.y=a+.4;}
  batch(f);dynamics.add(f);f.userData.spin=.6;
  const plate=label(p,'O—Y / POWER WORKS',o.x,1,o.z+o.d*.422,3,.55);plate.rotation.y=0;
  for(let j=0;j<3;j++){cyl(p,PALETTE.dark,o.x-1.6+j*.42,1.9,o.z-1.1,.11,.45);}
}
export function buildDistrict(level) {
  const root=new T.Group(),staticArt=new T.Group(),dynamicArt=new T.Group();root.add(staticArt,dynamicArt);
  const p=staticArt;
  block(p,PALETTE.dark,0,-1.75,0,28.1,.65,24.1);
  block(p,level.edge,0,-.95,0,28,1.1,24);
  block(p,level.color,0,-.18,0,28.15,.42,24.15);
  // The cut-away base makes the world a physical desk-sized mechanism.
  for(let x=-12;x<=12;x+=3){block(p,PALETTE.dark,x,-1.06,12.01,1.5,.6,.08);block(p,PALETTE.paper,x,-.92,12.08,.09,.3,.03);}
  for(let z=-9;z<=9;z+=3)block(p,PALETTE.dark,14.01,-1,z,.08,.6,1.2);
  // Painted walkways and inset deck seams, not a visually noisy grid.
  block(p,'#cbd0af',-10,.045,0,2.6,.035,21);
  block(p,'#cbd0af',0,.046,8,24,.03,2.6);
  block(p,'#cbd0af',10,.047,-2,2.6,.03,16);
  for(let z=-10;z<=10;z+=1.4)block(p,PALETTE.paper,-8.55,.07,z,.06,.025,.55);
  for(let x=-12;x<=12;x+=1.4)block(p,PALETTE.paper,x,.07,6.55,.55,.025,.06);
  for(let x=-7;x<=7;x+=7)block(p,'#8fa48e',x,.047,-1,.018,.016,20);
  // Small perimeter markers leave the playfield readable at mobile scale.
  for(let x=-12;x<=12;x+=4)for(const z of [-11.5,11.5]){
    block(p,PALETTE.dark,x,.19,z,.42,.35,.4);block(p,PALETTE.yellow,x,.40,z,.38,.08,.36);
    bolt(p,x,.05,z+.65);
  }
  for(const x of [-13.5,13.5])for(let z=-8;z<=8;z+=4){cyl(p,PALETTE.paper,x,.25,z,.11,.55);ball(p,PALETTE.yellow,x,.6,z,.12);}
  pipe(p,PALETTE.blue,[[-12,-.4,12.3],[-8,-.4,12.4],[-7,-.9,12.4],[-1,-.9,12.4],[0,-.4,12.4],[8,-.4,12.4]],.12);
  pipe(p,PALETTE.coral,[[14.3,-.1,-8],[14.4,-.1,-3],[14.4,-1.3,-1],[14.4,-1.3,7]],.17);
  for(const o of level.obstacles){if(o.type==='tank')tank(p,o,dynamicArt);else if(o.type==='turbine')turbine(p,o,dynamicArt);else crate(p,o);}
  const sign=label(p,`SKIFT / ${level.number}`,0,-.94,12.105,4,.75,PALETTE.paper);sign.rotation.y=0;
  const floorLabel=label(p,level.number,-5,.085,-3,3.1,2.1,level.color,level.edge);floorLabel.rotation.x=-Math.PI/2;
  for(const [x,z] of [[-12.5,-10.5],[12.4,10.3],[-12.7,10.6],[12.2,-10.7]])planter(p,x,z,.8);
  // Freestanding loop sculpture is a visual landmark, outside the playable deck.
  const sculpture=torus(p,PALETTE.coral,-11,2.2,-12.6,1.55,.24);sculpture.rotation.y=.3;
  cyl(p,PALETTE.dark,-11,.4,-12.6,.75,.7);
  for(const h of level.hazards){
    block(p,PALETTE.dark,h.x,.06,h.z,h.w+.25,.12,h.d+.3);
    for(let x=h.x-h.w/2;x<h.x+h.w/2;x+=.6){const b=block(p,PALETTE.yellow,x,.14,h.z,.25,.015,h.d+.24);b.rotation.y=.45;}
  }
  batch(staticArt);
  return {root,staticArt,dynamicArt};
}
function blob(parent,size=1.35) {
  const key='blob';
  if(!materials.has(key)){
    const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');
    const gradient=ctx.createRadialGradient(32,32,2,32,32,31);gradient.addColorStop(0,'rgba(23,39,34,.32)');gradient.addColorStop(1,'rgba(23,39,34,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
    const m=new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false});m.userData.shared=true;materials.set(key,m);
  }
  const m=mesh(parent,unitPlane(),materials.get(key),0,.065,0,size,size,1);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;
}
export function robot() {
  const g=new T.Group();
  const body=new T.Group();g.add(body);
  block(body,PALETTE.blue,0,.8,0,.84,.9,.7);
  ball(body,PALETTE.paper,0,1.08,.02,.43).scale.y=.57;
  block(body,PALETTE.dark,0,.97,.353,.65,.29,.08);
  for(const x of [-.18,.18])block(body,material('#dcfcf0',true),x,.99,.403,.13,.065,.03);
  block(body,PALETTE.yellow,0,.75,.38,.15,.12,.045);
  block(body,PALETTE.coral,0,.77,-.41,.52,.6,.20);
  for(const x of [-.53,.53]){ball(body,PALETTE.paper,x,.75,0,.16);block(body,PALETTE.blue,x,.5,.04,.21,.30,.22);}
  for(const x of [-.33,.33]){const wheel=cyl(body,PALETTE.dark,x,.23,0,.25,.19);wheel.rotation.z=Math.PI/2;const hub=cyl(body,PALETTE.paper,x+(x<0?-.11:.11),.23,0,.11,.02);hub.rotation.z=Math.PI/2;}
  cyl(body,PALETTE.dark,.22,1.45,-.08,.025,.58);ball(body,material(PALETTE.yellow,true),.22,1.76,-.08,.105);
  batch(body);g.userData.body=body;
  blob(g);g.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  const halo=ring(g,PALETTE.blue,0,0,.67,.035);g.userData.halo=halo;
  return g;
}
export function sentinel(type) {
  const g=new T.Group(),b=new T.Group();g.add(b);
  const color=type==='shooter'?PALETTE.yellow:type==='charger'?PALETTE.coral:'#d97157';
  const size=type==='charger'?1.15:.9;
  cyl(b,PALETTE.dark,0,.3,0,.42*size,.2);
  ball(b,color,0,.77,0,.54*size).scale.y=.8;
  block(b,PALETTE.dark,0,.84,.45*size,.67*size,.2,.09);
  block(b,material('#fff0ca',true),0,.84,.52*size,type==='charger'?.4:.18,.07,.02);
  for(const x of [-.54,.54]){block(b,PALETTE.dark,x*size,.55,0,.17,.17,.68);}
  if(type==='shooter'){const gun=cyl(b,PALETTE.dark,0,.83,.65,.095,.5);gun.rotation.x=Math.PI/2;}
  if(type==='charger'){for(const x of [-.35,.35])block(b,PALETTE.paper,x,1.16,.3,.13,.35,.12);}
  batch(b);g.userData.body=b;blob(g,1.5);g.traverse(o=>{if(o.isMesh)o.castShadow=false;});return g;
}
export function cell() {
  const g=new T.Group();
  cyl(g,PALETTE.dark,0,.14,0,.55,.22);ring(g,PALETTE.blue,0,0,.76,.065);
  const b=new T.Group();b.position.y=.4;g.add(b);
  block(b,PALETTE.blue,0,.5,0,.55,.8,.55);block(b,PALETTE.paper,0,.94,0,.42,.08,.42);
  block(b,material(PALETTE.yellow,true),0,.5,.3,.20,.42,.028);
  block(b,PALETTE.paper,0,.09,0,.42,.08,.42);batch(b);g.userData.body=b;return g;
}
export function scrap() {const g=new T.Group();const r=torus(g,PALETTE.yellow,0,.6,0,.18,.07);g.userData.body=r;return g;}
export function extraction() {
  const g=new T.Group();
  cyl(g,PALETTE.dark,0,.08,0,1.3,.14);cyl(g,PALETTE.paper,0,.18,0,1.08,.1);
  const ringMesh=ring(g,PALETTE.blue,0,0,1.5,.07);
  for(const x of [-1.35,1.35]){block(g,PALETTE.blue,x,1.1,0,.22,2.2,.24);block(g,PALETTE.paper,x,1.15,.145,.06,1.6,.025);}
  block(g,PALETTE.blue,0,2.18,0,2.85,.26,.24);
  const flag=label(g,'→',0,2.19,.14,1.15,.6,PALETTE.yellow);
  g.userData.ring=ringMesh;g.userData.flag=flag;return g;
}
export function boss() {
  const g=new T.Group(),rotor=new T.Group();g.add(rotor);
  cyl(g,PALETTE.dark,0,.35,0,1.75,.65);cyl(g,PALETTE.paper,0,.71,0,1.64,.12);
  const core=ball(g,material(PALETTE.coral,true),0,1.85,0,.88);g.userData.core=core;
  for(let i=0;i<3;i++){
    const ringMesh=torus(rotor,i===1?PALETTE.yellow:PALETTE.blue,0,1.85,0,1.15+i*.23,.13);
    ringMesh.rotation.set(i*.8+.35, i*1.1, .35);
  }
  for(let i=0;i<4;i++){const a=i*Math.PI/2;block(g,PALETTE.blue,Math.sin(a)*1.45,1.25,Math.cos(a)*1.45,.45,2.3,.45);}
  g.userData.rotor=rotor;return g;
}
export function disposeTree(root) {
  const gs=new Set(),ms=new Set();
  root.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)gs.add(o.geometry);if(o.material&&!o.material.userData.shared)ms.add(o.material);});
  gs.forEach(g=>g.dispose());ms.forEach(m=>{m.map?.dispose();m.dispose();});root.clear();
}
