import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),state=()=>page.evaluate(()=>__SKIFT__.snapshot());
 await page.goto(process.env.SKIFT_URL||'http://127.0.0.1:8787/play/skift/?qa=1');await page.waitForFunction(()=>window.__SKIFT__);
 await page.waitForTimeout(10500);const idle=await state();await page.waitForTimeout(1200);assert.equal((await state()).perf.frames,idle.perf.frames);results.push('title animation sleeps after ten seconds');
 await page.locator('#start-button').click();await page.waitForFunction(()=>__SKIFT__.snapshot().dead,null,{timeout:20000});
 const dead=await state();assert.equal(dead.hp,0);assert.equal(dead.mode,'dead');assert.equal(dead.audio.music,false);
 await page.screenshot({path:'evidence/death-real-input.png'});await page.keyboard.press('Escape');assert.equal((await state()).mode,'dead');
 await page.locator('[data-action="retry"]').click();const retried=await state();assert.equal(retried.mode,'play');assert.equal(retried.hp,5);assert.equal(retried.score,0);assert.equal(retried.cells.length,0);assert.ok(retried.time<.5);results.push('real contact damage reaches death; retry restores the sector checkpoint');
 await page.keyboard.press('Escape');await page.locator('#modal [data-action="settings"]').click();await page.locator('[data-setting="difficulty"]').selectOption('assist');await page.reload();await page.waitForFunction(()=>window.__SKIFT__);await page.locator('#start-button').click();assert.equal((await state()).maxHp,5);results.push('changed next-run difficulty does not change a resumed standard run');
 const lost=await page.evaluate(()=>{const gl=document.querySelector('#world canvas').getContext('webgl2'),extension=gl.getExtension('WEBGL_lose_context');if(!extension)return false;extension.loseContext();return true;});
 assert.ok(lost,'context-loss test requires the standard testing extension');await page.locator('[data-action="reload"]').waitFor();await page.screenshot({path:'evidence/context-loss.png'});
 await page.locator('[data-action="reload"]').click();await page.waitForFunction(()=>window.__SKIFT__);assert.equal((await state()).mode,'menu');assert.equal(await page.locator('#new-button').isVisible(),true);results.push('lost WebGL context has a working reload path and retains the checkpoint');
 console.log(results.map(r=>'PASS '+r).join('\n'));
}finally{await writeFile('evidence/lifecycle.json',JSON.stringify(results,null,2));await browser.close();}
