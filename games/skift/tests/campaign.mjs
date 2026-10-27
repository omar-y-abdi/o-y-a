import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {LEVELS,blocked} from '../src/levels.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),events=[],errors=[];
page.on('pageerror',e=>errors.push(String(e)));const held=new Set();
async function keys(next){for(const k of held)if(!next.includes(k)){await page.keyboard.up(k);held.delete(k);}for(const k of next)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}}
const snap=()=>page.evaluate(()=>__SKIFT__.snapshot());
function route(level,start,target){
 const goal=[Math.round(target.x),Math.round(target.z)],first=[Math.round(start.x),Math.round(start.z)],queue=[first],seen=new Map([[first.join(),null]]);
 for(let i=0;i<queue.length;i++){const p=queue[i];if(p[0]===goal[0]&&p[1]===goal[1]){const path=[];let key=p.join();while(key){path.unshift(key.split(',').map(Number));key=seen.get(key);}return path.slice(1);}
  for(const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1]]){const n=[p[0]+dx,p[1]+dz],key=n.join();if(seen.has(key)||blocked(level,n[0],n[1],.85))continue;seen.set(key,p.join());queue.push(n);}}
 throw new Error('No route '+JSON.stringify({start,target}));
}
try{
 await page.goto(process.env.SKIFT_URL||'http://127.0.0.1:8787/play/skift/?qa=1');await page.waitForFunction(()=>window.__SKIFT__);
 await page.locator('[data-action="settings"]').first().click();await page.locator('[data-setting="difficulty"]').selectOption(process.env.DIFFICULTY||'assist');await page.locator('#modal .primary[data-action="close"]').click();await page.locator('#start-button').click();
 let lastGoal='',path=[],lastSector=-1,lastLog=0;const began=Date.now();
 while(Date.now()-began<180000){const s=await snap();
  if(s.mode==='won'){await keys([]);await page.screenshot({path:`evidence/campaign-win-${process.env.DIFFICULTY||'assist'}.png`});events.push({event:'won',state:s});break;}
  if(s.mode==='dead'){await keys([]);await page.screenshot({path:'evidence/campaign-death.png'});throw new Error('Campaign bot died: '+JSON.stringify(s));}
  if(s.mode==='sector'){await keys([]);await page.screenshot({path:`evidence/sector-${s.sector+1}-complete.png`});await page.keyboard.press('Escape');assert.equal((await snap()).mode,'sector');await page.locator(`[data-action="upgrade"][data-value="${s.sector===0?'pulse':'shield'}"]`).click();lastGoal='';continue;}
  if(s.sector!==lastSector){events.push({event:'sector',state:s});lastSector=s.sector;console.log('SECTOR',s.sector+1);await page.waitForTimeout(160);await page.screenshot({path:`evidence/sector-${s.sector+1}-play.png`});}
  let target=s.objective;if(target.kind==='boss')target={x:-3,z:-4,kind:'boss'};
  const goal=`${s.sector}:${target.kind}:${target.x}:${target.z}`;
  if(goal!==lastGoal){path=route(LEVELS[s.sector],s.player,target);lastGoal=goal;}
  while(path.length&&Math.hypot(path[0][0]-s.player.x,path[0][1]-s.player.z)<.75)path.shift();
  const next=path[0]||[target.x,target.z],dx=next[0]-s.player.x,dz=next[1]-s.player.z,d=Math.hypot(dx,dz),inputs=[];
  if(d>.35){const ix=(dx-dz)/Math.SQRT2,iy=(dx+dz)/Math.SQRT2;if(ix/d>.32)inputs.push('d');if(ix/d<-.32)inputs.push('a');if(iy/d>.32)inputs.push('s');if(iy/d<-.32)inputs.push('w');}
  if(s.enemies.some(e=>!e.dead&&Math.hypot(e.x-s.player.x,e.z-s.player.z)<3.5)||s.bullets>0||target.kind==='boss')inputs.push('j');
  if(target.kind==='boss'&&s.boss.wave>0&&Math.abs(Math.hypot(s.player.x,s.player.z+4)-s.boss.wave)<1.4&&s.dashCooldown===0){inputs.push('Space');lastGoal='';}
  await keys(inputs);await page.waitForTimeout(80);
  if(Date.now()-lastLog>3000){console.log('AT',s.sector,s.player,'HP',s.hp,'CELLS',s.cells.length,'BOSS',s.boss?.hp);lastLog=Date.now();}
 }
 const final=await snap();assert.equal(final.won,true,'campaign must reach the real victory screen');assert.deepEqual(errors,[]);
 console.log('CAMPAIGN COMPLETE',final.score,final.time,'seconds');
}finally{await keys([]).catch(()=>{});events.push({event:'final',state:await snap().catch(()=>null)});await writeFile(`evidence/campaign-${process.env.DIFFICULTY||'assist'}.json`,JSON.stringify({events,errors},null,2));await browser.close();}
