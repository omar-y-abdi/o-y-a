import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sanitizeManagedSvg } from '../src/cms/svg.mjs';

const safe='<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><clipPath id="c"><circle cx="50" cy="50" r="40"/></clipPath></defs><g opacity=".9" clip-path="url(#c)"><rect width="100" height="100" fill="url(#g)"/><path d="M10 10L90 90" stroke="#123456" stroke-width="2"/></g></svg>';

test('managed SVG sanitizer preserves static vector geometry and local paint references',()=>{
  const result=sanitizeManagedSvg(safe);
  assert.match(result,/viewBox="0 0 100 100"/);
  assert.match(result,/linearGradient/);
  assert.match(result,/url\(#g\)/);
  assert.match(result,/clip-path="url\(#c\)"/);
});

test('managed SVG sanitizer rejects active or external content',()=>{
  for(const source of [
    '<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>',
    '<svg viewBox="0 0 1 1"><foreignObject><div>html</div></foreignObject></svg>',
    '<svg viewBox="0 0 1 1" onload="alert(1)"><path d="M0 0"/></svg>',
    '<svg viewBox="0 0 1 1"><image href="https://evil.test/x.png"/></svg>',
    '<svg viewBox="0 0 1 1"><animate attributeName="x"/></svg>',
    '<svg viewBox="0 0 1 1"><path style="filter:url(https://evil.test/x)"/></svg>',
  ]) assert.throws(()=>sanitizeManagedSvg(source));
});

test('managed SVG sanitizer requires a single bounded svg root and rejects unsafe references',()=>{
  assert.throws(()=>sanitizeManagedSvg('<svg><path d="M0 0"/></svg>'));
  assert.throws(()=>sanitizeManagedSvg('<svg viewBox="0 0 10 10"><path fill="url(https://evil.test/x)"/></svg>'));
  assert.throws(()=>sanitizeManagedSvg('<svg viewBox="0 0 10 10"></svg><svg viewBox="0 0 10 10"></svg>'));
});

test('only vector-like built-in artwork declares editable SVG sources', async()=>{
  const { resourceSlots }=await import('../src/content/resources.mjs');
  assert.equal(resourceSlots.icon.editableSrc,'/favicon.svg');
  assert.equal(resourceSlots.emailStatic.editableSrc,'/mail/omar-smile.svg');
  assert.equal(resourceSlots.social.editableSrc,undefined);
  assert.equal(resourceSlots.emailAnimated.editableSrc,undefined);
});

test('editable vector resource metadata keeps the existing raster derivative dimensions', async()=>{
  const { resourceSlots }=await import('../src/content/resources.mjs');
  for(const slot of [resourceSlots.icon,resourceSlots.emailStatic]){
    const png=await readFile(`public${slot.src}`);
    assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.equal(slot.width,png.readUInt32BE(16),slot.src);
    assert.equal(slot.height,png.readUInt32BE(20),slot.src);
  }
});

test('CMS seed carries sanitized editable SVG source only for managed vector built-ins', async()=>{
  const { seed }=await import('../.generated/cms-seed.mjs?svg-test='+Date.now());
  const icon=seed.assets.find(asset=>asset.slot==='icon');
  const mail=seed.assets.find(asset=>asset.slot==='emailStatic');
  assert.equal(icon.editableSrc,'/favicon.svg'); assert.match(icon.editableSvg,/^<svg/);
  assert.equal(mail.editableSrc,'/mail/omar-smile.svg'); assert.match(mail.editableSvg,/^<svg/);
  assert.equal(seed.assets.find(asset=>asset.slot==='social').editableSvg,undefined);
});
