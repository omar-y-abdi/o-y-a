import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await page.goto(process.env.SKIFT_URL||'http://127.0.0.1:8787/play/skift/?qa=1');await page.waitForFunction(()=>window.__SKIFT__);await page.locator('#start-button').click();
 await page.mouse.move(610,340);await page.mouse.down({button:'right'});await page.waitForTimeout(120);
 assert.ok((await page.evaluate(()=>__SKIFT__.snapshot())).dashCooldown>0);
 await page.mouse.down({button:'left'});await page.waitForTimeout(120);
 assert.ok((await page.evaluate(()=>__SKIFT__.snapshot())).pulseCooldown>0,'a second mouse button must activate its ability while the first is held');
 await page.mouse.up({button:'left'});await page.waitForTimeout(1150);
 assert.ok((await page.evaluate(()=>__SKIFT__.snapshot())).dashCooldown>0,'releasing pulse must not cancel a held dash button');
 await page.mouse.up({button:'right'});await page.waitForTimeout(1300);assert.equal((await page.evaluate(()=>__SKIFT__.snapshot())).dashCooldown,0);
 await writeFile('evidence/mouse-input.json',JSON.stringify({chordedButtons:true,independentRelease:true}));console.log('PASS chorded mouse buttons and independent release');
}finally{await browser.close();}
