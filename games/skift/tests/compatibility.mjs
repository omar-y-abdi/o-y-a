import {chromium,firefox,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const results=[];
for(const [name,engine] of [['chrome',chromium],['webkit',webkit],['firefox',firefox]]){
 const browser=await engine.launch({headless:true,...(name==='chrome'?{channel:'chrome'}:{})});
 try{
  for(const viewport of [{width:1280,height:720},{width:320,height:640}]){
   const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto(process.env.SKIFT_URL||'http://127.0.0.1:8787/play/skift/?qa=1');await page.waitForFunction(()=>window.__SKIFT__);
    const widths=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(widths.scroll<=widths.inner,JSON.stringify(widths));
    for(const selector of ['.brand','.site-header nav','#start-button']){const box=await page.locator(selector).boundingBox();assert.ok(box.x>=0&&box.x+box.width<=viewport.width+1,selector+' overflows');}
    await page.screenshot({path:`evidence/${name}-${viewport.width}-title.png`});
    await page.locator('#start-button').click();const a=await page.evaluate(()=>__SKIFT__.snapshot());
    await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('d');
    await page.keyboard.down('j');await page.waitForTimeout(100);await page.keyboard.up('j');
    const b=await page.evaluate(()=>__SKIFT__.snapshot());assert.equal(b.mode,'play');assert.ok(Math.hypot(b.player.x-a.player.x,b.player.z-a.player.z)>1);assert.ok(b.pulseCooldown>0);
    await page.screenshot({path:`evidence/${name}-${viewport.width}-play.png`});
    await page.keyboard.press('Escape');assert.equal((await page.evaluate(()=>__SKIFT__.snapshot())).mode,'pause');
    await page.locator('#modal [data-action="resume"]').click();assert.equal((await page.evaluate(()=>__SKIFT__.snapshot())).mode,'play');assert.deepEqual(errors,[]);
    results.push({browser:name,version:browser.version(),viewport,pass:true});console.log('PASS',name,viewport.width);
   }catch(e){results.push({browser:name,viewport,pass:false,error:String(e),errors});console.error('FAIL',name,viewport.width,String(e));await page.screenshot({path:`evidence/${name}-${viewport.width}-failure.png`}).catch(()=>{});}
   finally{await page.close();}
  }
 }finally{await browser.close();}
}
await writeFile('evidence/compatibility.json',JSON.stringify(results,null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
