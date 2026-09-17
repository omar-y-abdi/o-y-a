const LAYOUT_TAGS=new Set(['div','section','article','aside','main','header','footer','nav','p','h1','h2','h3','h4','h5','h6','ul','ol','li','figure','figcaption','blockquote','pre','span','a','button','img','svg','g']);
const CONTROL_TAGS=new Set(['input','select','textarea','option','form','label','fieldset']);
const LOW_LEVEL_SVG=new Set(['path','circle','ellipse','rect','line','polyline','polygon','defs','lineargradient','radialgradient','stop','clippath']);
function tagOf(component){return String(component?.get?.('tagName')??'div').toLowerCase();}
function functional(component){const attrs=component?.getAttributes?.()??{};return Object.keys(attrs).some(name=>name.startsWith('data-')&&!name.startsWith('data-cms-'));}
export function isResizableComponent(component){
  const tag=tagOf(component),type=component?.get?.('type');
  if(tag==='svg'||CONTROL_TAGS.has(tag)||LOW_LEVEL_SVG.has(tag)||functional(component))return false;
  return type==='image'||type==='text'||type==='link'||LAYOUT_TAGS.has(tag);
}
export function svgGroupResizeOptions(component){
  let base=null;
  return {
    onStart(_event,{el}){const rect=el.getBoundingClientRect();const box=el.getBBox?.();base={rect,box,transform:component.getAttributes?.().transform??''};},
    updateTarget(_el,rect,{store}){
      if(!base?.rect.width||!base?.rect.height||!base.box)return;
      const sx=Math.max(.01,rect.w/base.rect.width),sy=Math.max(.01,rect.h/base.rect.height),{x,y}=base.box;
      const scale=`translate(${x} ${y}) scale(${sx} ${sy}) translate(${-x} ${-y})`;
      component.addAttributes?.({transform:[base.transform,scale].filter(Boolean).join(' ')});
      if(store)base={...base,rect:{...base.rect,width:rect.w,height:rect.h}};
    },
  };
}
function parseLength(value){const match=String(value??'').trim().match(/^(-?\d+(?:\.\d+)?)px$/);return match?Number(match[1]):0;}
export function parseTranslate(value){
  const parts=String(value??'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length||parts[0]==='none')return [0,0];
  return [parseLength(parts[0]),parseLength(parts[1]??'0px')];
}
export function nudgeComponent(component,dx,dy,step=1){
  if(tagOf(component)==='g'){
    const attrs=component.getAttributes?.()??{},match=String(attrs['data-cms-translate']??'0 0').match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/),x=Number(match?.[1]??0),y=Number(match?.[2]??0),next=[x+dx*step,y+dy*step];
    const base=String(attrs.transform??'').replace(/\s*translate\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)\s*$/,'').trim();
    component.addAttributes?.({transform:[base,`translate(${next[0]} ${next[1]})`].filter(Boolean).join(' '),'data-cms-translate':`${next[0]} ${next[1]}`});
    return next;
  }
  const [x,y]=parseTranslate(component.getStyle?.().translate);
  component.addStyle({translate:`${x+dx*step}px ${y+dy*step}px`});
  return [x+dx*step,y+dy*step];
}
export function resetComponentPosition(component){
  if(tagOf(component)==='g'){const attrs=component.getAttributes?.()??{},base=String(attrs.transform??'').replace(/\s*translate\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)\s*$/,'').trim();component.addAttributes?.({transform:base});component.removeAttributes?.('data-cms-translate');return;}
  component.removeStyle('translate');
}
