import {parseFragment,serialize} from 'parse5';
import {HttpError} from './http.mjs';
const ELEMENTS=new Set(['svg','g','path','circle','ellipse','rect','line','polyline','polygon','defs','linearGradient','radialGradient','stop','clipPath']);
const ATTRS=new Set(['xmlns','viewBox','width','height','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','fill','fill-opacity','fill-rule','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-opacity','opacity','transform','id','class','offset','stop-color','stop-opacity','gradientUnits','gradientTransform','clip-path','clipPathUnits','href','preserveAspectRatio']);
const SAFE_COLOR=/^(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+-]+\)|none|currentColor|transparent)$/i;
const SAFE_NUMBER=/^-?\d*\.?\d+(?:e[-+]?\d+)?(?:px|%|deg)?$/i;
const ref=value=>/^#[-\w:.]+$/.test(value)||/^url\(#[-\w:.]+\)$/.test(value);
function invalid(message='SVG-resursen innehåller osäkert eller ej stödd markup.') {throw new HttpError(422,message);}
export function sanitizeManagedSvg(source) {
 if(typeof source!=='string'||source.length<20||source.length>512*1024) invalid('SVG-resursen är tom eller för stor.');
 const tree=parseFragment(source,{scriptingEnabled:false}); const roots=(tree.childNodes??[]).filter(n=>n.tagName);
 if(roots.length!==1||roots[0].tagName!=='svg') invalid('SVG-resursen behöver exakt ett svg-rotelement.');
 const root=roots[0]; let nodes=0;
 function visit(node){
  if(!node.tagName)return;
  if(++nodes>5000||!ELEMENTS.has(node.tagName)) invalid(`SVG-elementet ${node.tagName} stöds inte.`);
  for(const attr of node.attrs??[]){
   if(/^on/i.test(attr.name)||!ATTRS.has(attr.name)) invalid(`SVG-attributet ${attr.name} stöds inte.`);
   const value=attr.value.trim();
   if(attr.name!=='xmlns'&&/(?:javascript:|data:|https?:|@import|expression\s*\()/i.test(value)) invalid();
   if(attr.name==='href'&&!ref(value)) invalid();
   if(['fill','stroke','stop-color'].includes(attr.name)&&!SAFE_COLOR.test(value)&&!ref(value)) invalid();
   if(attr.name==='clip-path'&&!ref(value)) invalid();
   if(['opacity','fill-opacity','stroke-opacity','stroke-width','offset'].includes(attr.name)&&!SAFE_NUMBER.test(value)) invalid();
  }
  for(const child of node.childNodes??[]) visit(child);
 }
 visit(root);
 const attrs=Object.fromEntries((root.attrs??[]).map(a=>[a.name,a.value]));
 const view=(attrs.viewBox??'').trim().split(/[\s,]+/).map(Number);
 if(view.length!==4||view.some(v=>!Number.isFinite(v))||view[2]<=0||view[3]<=0||view[2]>8192||view[3]>8192) invalid('SVG-resursens viewBox är ogiltig.');
 const number=value=>{const n=Number(String(value??'').replace(/px$/,''));return Number.isFinite(n)&&n>0?n:null};
 const width=number(attrs.width)??view[2],height=number(attrs.height)??view[3];
 if(width>8192||height>8192||width*height>32000000) invalid('SVG-resursens storlek är för stor.');
 // Ensure browser-independent namespace on serialization.
 if(!(root.attrs??[]).some(a=>a.name==='xmlns')) root.attrs.push({name:'xmlns',value:'http://www.w3.org/2000/svg'});
 return {svg:serialize(tree),width,height};
}
