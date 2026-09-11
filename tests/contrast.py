"""Computed solid-colour text contrast audit. Not a full WCAG/axe certification.
Ignores decorative aria-hidden text, disabled controls and complex gradients.
Lists every limitation so a passing result is not mistaken for complete coverage.
"""
import json
import sys
import os
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
from render_support import load
ROOT=Path(__file__).resolve().parents[1]
PAGES=['/','/verkstad/','/om/','/projekt/furl/','/kontakt/','/integritet/','/kakor/','/villkor/','/tillganglighet/','/404.html']
SCRIPT='''() => {
 const rgba=s=>{const n=s.match(/[\\d.]+/g);return n? n.map(Number):[0,0,0,0]};
 const blend=(fg,bg)=>{const a=fg[3]??1;return [0,1,2].map(i=>fg[i]*a+bg[i]*(1-a)).concat(1)};
 const lum=c=>c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
 const rows=[];let skipped=0;
 for(const e of document.querySelectorAll('body *')){
  if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
  if(e.closest('[aria-hidden="true"],[hidden],:disabled,.sr-only,noscript,script,style')||!e.checkVisibility())continue;
  const style=getComputedStyle(e), rect=e.getBoundingClientRect();
  if(!rect.width||!rect.height)continue;
  const ancestors=[];let p=e,complex=false;
  while(p){const s=getComputedStyle(p);if(s.backgroundImage!=='none'||Number(s.opacity)<1)complex=true;ancestors.push(rgba(s.backgroundColor));p=p.parentElement}
  if(complex){skipped++;continue}
  let bg=[255,255,255,1];for(const c of ancestors.reverse())bg=blend(c,bg);
  const fg=blend(rgba(style.color),bg);const a=lum(fg),b=lum(bg);const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  const size=parseFloat(style.fontSize);const large=size>=24||(size>=18.66&&parseInt(style.fontWeight)>=700);
  rows.push({text:e.textContent.trim().slice(0,100),selector:e.tagName.toLowerCase()+'.'+e.className,ratio:Math.round(ratio*100)/100,required:large?3:4.5,pass:ratio>=(large?3:4.5),size});
 }
 return {rows,skippedComplexBackgrounds:skipped};
}'''
report=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox'])
 for path in PAGES:
  page=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');load(page,path)
  data=page.evaluate(SCRIPT);data['path']=path;report.append(data);page.close()
 b.close()
failed=[{'path':page['path'],**row} for page in report for row in page['rows'] if not row['pass']]
summary={'mode':'computed solid-colour contrast in local document rendering; not axe or certification','checked':sum(len(p['rows']) for p in report),'failures':failed,'pages':report}
(ROOT/'artifacts/contrast.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('Checked',summary['checked'],'text nodes; failures',len(failed))
print(json.dumps(failed,ensure_ascii=False,indent=2))
sys.exit(bool(failed))
