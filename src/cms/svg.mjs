import { parseFragment, serializeOuter } from 'parse5';
import { HttpError } from './http.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ELEMENTS = new Set(['svg','g','path','circle','ellipse','rect','line','polyline','polygon','defs','linearGradient','radialGradient','stop','clipPath']);
const ATTRS = new Set([
  'xmlns','viewBox','width','height','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points',
  'fill','fill-opacity','fill-rule','stroke','stroke-width','stroke-opacity','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-dasharray','stroke-dashoffset',
  'opacity','transform','id','class','offset','stop-color','stop-opacity','gradientUnits','gradientTransform','fx','fy','spreadMethod','clip-path','clip-rule','preserveAspectRatio','role','aria-hidden','aria-label',
]);
const LOCAL_URL = /^url\(#[A-Za-z_][A-Za-z0-9_.:-]*\)$/;
const ID = /^[A-Za-z_][A-Za-z0-9_.:-]*$/;
const NUMBER = /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?(?:px|%)?$/i;

function fail(message='SVG-filen innehåller aktivt eller osäkert innehåll.') { throw new HttpError(422, message); }
function safeReference(value) {
  if (/url\s*\(/i.test(value)) return LOCAL_URL.test(value.trim());
  return !/(?:https?:|data:|javascript:|file:|\\|[<>])/i.test(value);
}
function validateViewBox(value) {
  const numbers=String(value??'').trim().split(/[\s,]+/).map(Number);
  if(numbers.length!==4||numbers.some(number=>!Number.isFinite(number))||numbers[2]<=0||numbers[3]<=0||numbers.some(number=>Math.abs(number)>1e7)) fail('SVG-filen behöver ett giltigt och begränsat viewBox.');
}
function validateAttribute(name,value) {
  if(name.toLowerCase().startsWith('on')||name==='style'||name==='href'||name==='xlink:href'||!ATTRS.has(name)) fail();
  if(name==='id'&&!ID.test(value)) fail('SVG-filen innehåller ett ogiltigt id.');
  if(name==='viewBox') validateViewBox(value);
  if(['width','height'].includes(name)&&value&&!NUMBER.test(value)) fail('SVG-filen har en ogiltig storlek.');
  if(name==='xmlns'&&value===SVG_NS)return;
  if(!safeReference(String(value))) fail();
}

export function sanitizeManagedSvg(source) {
  if(typeof source!=='string'||!source.trim()||source.length>512_000) fail('SVG-filen är tom eller för stor.');
  const fragment=parseFragment(source,{scriptingEnabled:false});
  const roots=(fragment.childNodes??[]).filter(node=>node.nodeName!=='#text'||node.value.trim()).filter(node=>node.nodeName!=='#comment');
  if(roots.length!==1||roots[0].tagName!=='svg'||roots[0].namespaceURI!==SVG_NS) fail('Resursen måste innehålla exakt en SVG-rot.');
  let count=0;
  const visit=node=>{
    if(node.tagName){
      count++; if(count>5000||node.namespaceURI!==SVG_NS||!ELEMENTS.has(node.tagName)) fail();
      for(const attr of node.attrs??[]) validateAttribute(attr.name,attr.value);
      if(node.tagName==='svg'){
        const attrs=Object.fromEntries((node.attrs??[]).map(attr=>[attr.name,attr.value]));
        validateViewBox(attrs.viewBox);
      }
    } else if(!['#text','#comment','#document-fragment'].includes(node.nodeName)) fail();
    for(const child of node.childNodes??[]) visit(child);
  };
  visit(roots[0]);
  return serializeOuter(roots[0]);
}
