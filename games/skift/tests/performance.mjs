import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try{
 const browserCDP=await browser.newBrowserCDPSession();
 const gpu=(await browserCDP.send('SystemInfo.getInfo')).gpu;
 for(const rate of [1,6]){
  const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();
  await context.addInitScript(()=>{localStorage.setItem('oy-skift-v1',JSON.stringify({version:1,settings:{quality:'eco',qualityChosen:true}}));}); // the frame budget below is the eco one
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  await cdp.send('Emulation.setCPUThrottlingRate',{rate});const began=performance.now();
  await page.goto(process.env.SKIFT_URL||'http://127.0.0.1:8787/play/skift/?qa=1');await page.waitForFunction(()=>window.__SKIFT__);
  const readyMs=performance.now()-began;await page.locator('#start-button').click();
  await page.keyboard.down('j');await page.keyboard.down('Space');await page.waitForTimeout(1500);
  const a=await page.evaluate(()=>__SKIFT__.snapshot()),start=performance.now();
  const ma=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  await page.waitForTimeout(10000);
  const wall=(performance.now()-start)/1000,b=await page.evaluate(()=>__SKIFT__.snapshot());
  const mb=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  await page.keyboard.up('j');await page.keyboard.up('Space');
  const result={cpuThrottle:rate,readyMs,wallSeconds:wall,framesPerSecond:(b.perf.frames-a.perf.frames)/wall,mainThreadTaskSeconds:mb.TaskDuration-ma.TaskDuration,jsHeapMB:mb.JSHeapUsedSize/1048576,state:b};
  results.push(result);console.log(JSON.stringify(result));
  assert.equal(b.mode,'play');assert.ok(result.framesPerSecond>=26,'eco frame rate must stay near the 30 FPS budget');
  await page.keyboard.press('Escape');await page.waitForTimeout(100);const paused=await page.evaluate(()=>__SKIFT__.snapshot());await page.waitForTimeout(1000);assert.equal((await page.evaluate(()=>__SKIFT__.snapshot())).perf.steps,paused.perf.steps);
  await context.close();
 }
 await writeFile('evidence/performance.json',JSON.stringify({recorded:new Date().toISOString(),browser:browser.version(),gpu:gpu.devices,results,limits:'CPU throttling does not emulate a slower GPU, limited physical RAM, battery drain or device temperature. JS heap is not total browser memory.'},null,2));
}finally{await browser.close();}
