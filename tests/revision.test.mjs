import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
const CARDS=JSON.parse(readFileSync('public/data/cards.json','utf8'));
const read = path => readFile(path, 'utf8');
test('approved identity is retained while the OY pictogram is removed', async () => {
  const h = await read('dist/index.html');
  assert.match(h, /Teknik med hjärna/);
  assert.match(h, /02 \/ MÄNNISKAN BAKOM KNAPPEN/);
  assert.match(h, /human-card/);
  assert.ok(!h.includes('id-monogram'));
  assert.match(h, /curiosity-drawing/);
});
test('back to top targets the real page start, not main below the header', async () => {
  const h = await read('dist/index.html');
  assert.match(h, /id="top"/);
  assert.match(h, /href="#top" data-back-top/);
  assert.ok(!h.includes('class="footer-back" href="#main"'));
});
test('contact respects privacy and does not repeat the page introduction', async () => {
  const h = await read('dist/kontakt/index.html');
  assert.match(h, /data-contact-form/);
  assert.match(h, /Öppna kuvertet/);
  for (const text of ['@chalmers.se','Föredrar du ditt eget mejlprogram','Skicka ett<br>litet hej','En idé. En ordvits. En början','När du öppnar kuvertet laddas']) assert.ok(!h.includes(text),text);
  assert.ok(h.indexOf('data-contact-form') < h.indexOf('contact-options'));
  assert.match(h, /id="contact-message"[^>]*maxlength="4000"/);
  assert.ok(!/id="contact-message"[^>]*required/.test(h));
});
test('all four play stations exist, with no promotional inventory count', async () => {
  const h = await read('dist/verkstad/index.html');
  for (const n of ['01','02','03','04']) assert.match(h,new RegExp('round-number">'+n));
  for (const text of ['240','små lappar']) assert.ok(!h.includes(text));
  assert.match(h, /value="roast"/);
});
test('joke deck is expanded without breaking old stable card IDs', () => {
  assert.ok(CARDS.filter(c=>c.flavor==='joke').length >= 80);
  assert.ok(CARDS.filter(c=>c.flavor==='roast').length >= 30);
  assert.equal(new Set(CARDS.map(c=>c.text)).size, CARDS.length);
  for(const id of ['k01','j01','p01']) assert.ok(CARDS.some(c=>c.id===id));
});
test('the project additions and corrected education are actually rendered', async () => {
  const h = await read('dist/index.html');
  for (const p of ['/projekt/blade-blend/','/projekt/backhaul/']) assert.ok(h.includes(p));
  const a = await read('dist/om/index.html');
  for (const s of ['Chalmers','Automation and Mechatronics','Systems, Learning and Control','B.Sc.','Rebl Industries','Chalmers Teknologbolag']) assert.ok(a.includes(s), s);
});
test('private inbox does not appear in public HTML, scripts or metadata', async () => {
  async function walk(dir) {for(const e of await readdir(dir,{withFileTypes:true})) {const p=dir+'/'+e.name;if(e.isDirectory())await walk(p);else if(/\.(html|mjs|txt|xml|json)$/.test(p))assert.ok(!(await read(p)).includes('@chalmers.se'), p);}}
  await walk('dist');
});
test('page styles do not ship unrelated games or contact UI', async () => {
  for(const [route,forbidden] of [['kontakt','.memory-board'],['om','.letter-paper'],['verkstad','.letter-paper']]) {
    const h=await read(`dist/${route}/index.html`);
    const css=await read('dist'+h.match(/rel="stylesheet" href="([^"]+)"/)[1]);
    assert.ok(!css.includes(forbidden),`${route} loads unrelated ${forbidden} styles`);
  }
});
test('game 01 keeps the original decorative face and front receipt, not emotes or top ejection', async () => {
  for (const path of ['dist/index.html','dist/verkstad/index.html']) {
    const html = await read(path);
    assert.match(html, /<div class="machine-display" aria-hidden="true">/);
    assert.match(html, /<div class="joy-ball">/);
    assert.match(html, /class="printer-slot"/);
    assert.ok(!html.includes('data-face'));
    assert.ok(!html.includes('printer-top'));
    const css = await read('dist' + html.match(/rel="stylesheet" href="([^"]+)"/)[1]);
    assert.match(css, /animation:receipt-in \.55s var\(--ease\) both/);
    assert.ok(!css.includes('data-mood'));
    assert.ok(!css.includes('.receipt{animation:none'));
    assert.ok(!css.includes('data-print-phase'));
  }
});
