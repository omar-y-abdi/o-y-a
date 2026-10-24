import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
const url=process.env.SKIFT_URL||'http://127.0.0.1:8787/play/skift/?qa=1';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[],errors=[],requests=[];
await mkdir('evidence',{recursive:true});
async function check(name,fn){try{await fn();results.push({name,pass:true});console.log('PASS',name);}catch(e){results.push({name,pass:false,error:String(e)});console.error('FAIL',name,String(e));}}
const state=p=>p.evaluate(()=>window.__SKIFT__.snapshot());
async function ready(p){await p.goto(url);await p.waitForFunction(()=>window.__SKIFT__);await p.waitForTimeout(250);}
async function rapidKey(p,code){await p.evaluate(code=>{const c=document.querySelector('#world canvas');for(const type of ['keydown','keyup'])c.dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));},code);await p.waitForTimeout(120);}
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push(r.url()));
 await ready(page);
 await check('title starts without console errors',async()=>{assert.equal((await state(page)).mode,'menu');assert.equal(await page.locator('#start-button').isEnabled(),true);await page.screenshot({path:'evidence/title-desktop.png'});});
 await page.locator('#start-button').click();
 await check('quick keyboard taps survive between frames',async()=>{await rapidKey(page,'KeyJ');assert.ok((await state(page)).pulseCooldown>0);await rapidKey(page,'Space');assert.ok((await state(page)).dashCooldown>0);});
 await check('keyboard movement changes world position',async()=>{const a=await state(page);await page.keyboard.down('d');await page.waitForTimeout(450);await page.keyboard.up('d');const b=await state(page);assert.ok(Math.hypot(b.player.x-a.player.x,b.player.z-a.player.z)>1.5);await page.screenshot({path:'evidence/play-desktop.png'});});
 await check('pause freezes simulation and does not spin a render loop',async()=>{await page.keyboard.press('Escape');await page.waitForTimeout(100);const a=await state(page);assert.equal(a.mode,'pause');await page.waitForTimeout(1100);const b=await state(page);assert.equal(b.time,a.time);assert.equal(b.perf.steps,a.perf.steps);assert.ok(b.perf.frames-a.perf.frames<=1);await page.screenshot({path:'evidence/pause-desktop.png'});});
 await check('settings persist and translated menus remain operable',async()=>{await page.locator('#modal [data-action="settings"]').click();await page.locator('[data-setting="language"]').selectOption('en');await page.locator('[data-setting="sound"]').uncheck();assert.equal((await state(page)).audio.music,false,'disabled audio must not keep the music loop running');assert.equal(await page.locator('html').getAttribute('lang'),'en');await page.locator('#modal .primary[data-action="close"]').click();await page.locator('#modal [data-action="resume"]').click();assert.equal((await state(page)).mode,'play');assert.equal((await state(page)).audio.music,false,'muted resume must leave the music loop paused');await page.reload();await page.waitForFunction(()=>window.__SKIFT__);assert.equal((await state(page)).settings.language,'en');assert.equal((await state(page)).settings.sound,false);assert.equal(await page.locator('#new-button').isVisible(),true);});
 await check('blur clears controls and pauses automatically',async()=>{await page.locator('#start-button').click();await page.keyboard.down('w');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.keyboard.up('w');assert.equal((await state(page)).mode,'pause');await page.locator('#modal [data-action="resume"]').click();const a=await state(page);await page.waitForTimeout(250);const b=await state(page);assert.ok(Math.hypot(b.player.x-a.player.x,b.player.z-a.player.z)<.05);});
 await check('restarting releases per-sector GPU resources',async()=>{await page.keyboard.press('Escape');await page.locator('#modal [data-action="menu"]').click();await page.waitForTimeout(100);const first=(await state(page)).render;for(let i=0;i<5;i++){await page.locator('#new-button').click();await page.keyboard.press('Escape');await page.locator('#modal [data-action="menu"]').click();}await page.waitForTimeout(200);const last=(await state(page)).render;assert.ok(last.geometries<=first.geometries+2,JSON.stringify({first,last}));assert.ok(last.textures<=first.textures+1);results.push({name:'renderer resource counts',first,last});});
 await check('game makes no third-party network requests',async()=>{assert.deepEqual(requests.filter(u=>!u.startsWith('http://127.0.0.1:')&&!u.startsWith('data:')),[]);assert.deepEqual(errors,[]);});
 await check('smooth render buffer follows devicePixelRatio at a constant CSS size',async()=>{
  await page.setViewportSize({width:1000,height:700});await page.waitForTimeout(200);
  assert.equal((await state(page)).settings.quality,'smooth');
  const setRatio=async value=>{await page.evaluate(v=>{Object.defineProperty(window,'devicePixelRatio',{configurable:true,get:()=>v});window.dispatchEvent(new Event('resize'));},value);await page.waitForTimeout(200);};
  await setRatio(2);let r=(await state(page)).render;
  assert.ok(Math.abs(r.width/1000-2)<.05&&r.width*r.height<=5200000,JSON.stringify(r));
  await setRatio(1);r=(await state(page)).render;
  assert.ok(Math.abs(r.width/1000-1)<.05,JSON.stringify(r));
 });
 await check('large viewports respect the pixel budget of each quality',async()=>{
  await page.setViewportSize({width:3840,height:2160});await page.waitForTimeout(200);
  const smooth=await state(page);assert.equal(smooth.settings.quality,'smooth','desktop default is smooth');assert.ok(smooth.render.width*smooth.render.height<=5200000,JSON.stringify(smooth.render));
  await page.evaluate(()=>{const key='oy-skift-v1',save=JSON.parse(localStorage.getItem(key)||'{"version":1}');save.settings={...save.settings,quality:'eco',qualityChosen:true};localStorage.setItem(key,JSON.stringify(save));});
  await page.reload();await page.waitForFunction(()=>window.__SKIFT__);await page.waitForTimeout(250);
  const eco=await state(page);assert.equal(eco.settings.quality,'eco','an explicit eco choice is kept');assert.ok(eco.render.width*eco.render.height<=1000000,JSON.stringify(eco.render));
 });
 await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(String(e)));await ready(phone);
 await check('portrait title fits a 390-pixel viewport',async()=>{await phone.screenshot({path:'evidence/title-mobile.png'});const box=await phone.locator('#start-button').boundingBox();assert.ok(box.y+box.height<790);assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);});
 await phone.locator('#start-button').tap();const cdp=await mobile.newCDPSession(phone);
 await check('multitouch movement and dash work together',async()=>{const pad=await phone.locator('#joystick').boundingBox(),dash=await phone.locator('#dash-control').boundingBox();assert.ok(pad);const origin={x:pad.x+pad.width/2,y:pad.y+pad.height/2,id:0};const move={...origin,x:origin.x+36};const a=await state(phone);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[origin]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[move]});await phone.waitForTimeout(300);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[move,{x:dash.x+dash.width/2,y:dash.y+dash.height/2,id:1}]});await phone.waitForTimeout(220);const b=await state(phone);assert.ok(b.dashCooldown>0);assert.ok(Math.hypot(b.player.x-a.player.x,b.player.z-a.player.z)>2);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await phone.waitForTimeout(150);const stopped=await state(phone);await phone.waitForTimeout(300);const later=await state(phone);assert.ok(Math.hypot(stopped.player.x-later.player.x,stopped.player.z-later.player.z)<.08);await phone.screenshot({path:'evidence/play-mobile.png'});});
 await check('landscape resize preserves playable state',async()=>{await phone.setViewportSize({width:844,height:390});await phone.waitForTimeout(300);assert.equal((await state(phone)).mode,'play');assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await phone.screenshot({path:'evidence/play-mobile-landscape.png'});});
 await check('compact touch layout keeps the HUD and controls inside the screen',async()=>{await phone.setViewportSize({width:320,height:640});await phone.waitForTimeout(200);for(const selector of ['.district-card','.run-card','#joystick','#dash-control','#pulse-control']){const b=await phone.locator(selector).boundingBox();assert.ok(b.x>=0&&b.x+b.width<=320,selector+' overflows');}await phone.screenshot({path:'evidence/play-mobile-compact.png'});});
 await mobile.close();
 const broken=await browser.newContext();await broken.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('blocked','SecurityError')};Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError')};});
 const privatePage=await broken.newPage();await ready(privatePage);
 await check('denied storage does not prevent playing',async()=>{await privatePage.locator('#start-button').click();assert.equal((await state(privatePage)).mode,'play');});await broken.close();
 const unsupported=await browser.newContext();await unsupported.addInitScript(()=>{const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:old.call(this,type,...args);};});
 const noGL=await unsupported.newPage();await noGL.goto(url);
 await check('missing WebGL shows an actionable fallback',async()=>{await noGL.locator('#modal[open]').waitFor();assert.ok((await noGL.locator('#modal').innerText()).includes('WebGL 2'));assert.equal(await noGL.locator('[data-action="reload"]').isVisible(),true);});await unsupported.close();
 await check('all tested live contexts remain free of JavaScript errors',async()=>assert.deepEqual(errors,[]));
}finally{await browser.close();await writeFile('evidence/browser-tests.json',JSON.stringify({date:new Date().toISOString(),results,errors},null,2));}
console.log(`${results.filter(r=>r.pass).length} passed; ${results.filter(r=>r.pass===false).length} failed`);
if(results.some(r=>r.pass===false))process.exitCode=1;
