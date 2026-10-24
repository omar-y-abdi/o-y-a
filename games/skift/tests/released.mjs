/** Exercise the actual unpacked release without installing dependencies there. */
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = process.cwd();
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const archive = path.join(root, `SKIFT-${version}.zip`);
const temp = await mkdtemp(path.join(root, '.zip-smoke-'));
const python = process.platform === 'win32' ? 'python' : 'python3';
let server, browser;
const checks = [], errors = [];
try {
  const extracted = spawnSync(python, ['-c', 'import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', archive, temp]);
  assert.equal(extracted.status, 0, String(extracted.stderr));
  server = spawn(python, ['start.py', '--no-open', '--port', '0'], { cwd: path.join(temp, 'skift'), stdio: ['ignore', 'pipe', 'pipe'] });
  const url = await new Promise((resolve, reject) => {
    let out = ''; const timer = setTimeout(() => reject(new Error('Packaged server did not start')), 15000);
    server.on('error', reject); server.on('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}`)); });
    server.stdout.on('data', data => { out += data; const m = out.match(/http:\/\/127\.0\.0\.1:\d+\/play\/skift\//); if (m) { clearTimeout(timer); resolve(m[0]); } });
  });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push(String(e)));
  const responses = [];
  page.on('response', r => { if (r.status() >= 400) responses.push(`${r.status()} ${r.url()}`); });
  await page.goto(url + '?qa=1'); await page.waitForFunction(() => window.__SKIFT__);
  await page.locator('#start-button').click();
  const snapshot = () => page.evaluate(() => window.__SKIFT__.snapshot());
  const a = await snapshot();
  await page.keyboard.down('d'); await page.waitForTimeout(400); await page.keyboard.up('d');
  const b = await snapshot(); assert.ok(Math.hypot(a.player.x - b.player.x, a.player.z - b.player.z) > 1);
  checks.push('Unpacked build starts and movement works without node_modules in the extracted directory');
  await page.keyboard.press('Space'); await page.waitForTimeout(120); assert.ok((await snapshot()).dashCooldown > 0);
  await page.keyboard.press('j'); await page.waitForTimeout(120); assert.ok((await snapshot()).pulseCooldown > 0);
  checks.push('Dash and pulse work through real keyboard input');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100); const paused = await snapshot();
  await page.waitForTimeout(400); assert.equal((await snapshot()).time, paused.time);
  checks.push('Pause stops gameplay time in the packaged build');
  await page.setViewportSize({ width: 3840, height: 2160 }); await page.waitForTimeout(200);
  const render = (await snapshot()).render; assert.ok(render.width * render.height <= 1000000);
  checks.push('Packaged build retains the 4K pixel-budget correction');
  assert.deepEqual(errors, []); assert.deepEqual(responses, []);
  checks.push('No JavaScript errors or failed asset requests');
  const digest = createHash('sha256').update(await readFile(archive)).digest('hex');
  await writeFile('evidence/released-archive.json', JSON.stringify({ date: new Date().toISOString(), archive: path.basename(archive), sha256: digest, browser: browser.version(), checks, errors }, null, 2));
  console.log('PASS released ZIP:', digest); checks.forEach(c => console.log('PASS', c));
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) {
    server.kill(); await new Promise(resolve => server.once('exit', resolve));
  }
  await rm(temp, { recursive: true, force: true });
}
