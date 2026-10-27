import { test, expect } from '@playwright/test';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { seedRuntime } from './helpers/cms-browser-qa.mjs';

let runtime, api;
test.describe.configure({ mode: 'default' });
test.beforeAll(async ({ playwright }) => {
  runtime = await cmsRuntime({ port: 0 });
  api = await playwright.request.newContext();
  await seedRuntime(runtime, api);
});
test.afterAll(async () => { try { await api?.dispose(); } finally { await runtime?.close(); } });

test('managed-svg-cross-engine-fidelity', async ({ page }, testInfo) => {
  const fixtures = {};
  for (const [key, path] of Object.entries({ iconPngData: '/apple-touch-icon.png', iconSvg: '/favicon.svg', mailPngData: '/mail/omar-smile.png', mailSvg: '/mail/omar-smile.svg' })) {
    const response = await api.get(runtime.url + path);
    expect(response.status(), path).toBe(200);
    fixtures[key] = key.endsWith('Data') ? 'data:image/png;base64,' + (await response.body()).toString('base64') : await response.text();
    await response.dispose();
  }
  await page.setViewportSize({ width: 600, height: 400 });
  const response = await page.goto(runtime.url + '/login/');
  expect(response.status()).toBe(200);
  await page.setContent('<!doctype html><canvas id="a"></canvas><canvas id="b"></canvas>');
  const result = await page.evaluate(async fixture => {
    async function image(src) { const img = new Image(); img.src = src; await img.decode(); return img; }
    async function compare(pngData, svg, width, height) {
      const blob = new Blob([svg], { type: 'image/svg+xml' }), url = URL.createObjectURL(blob);
      try {
        const [a, b] = await Promise.all([image(pngData), image(url)]), ca = document.querySelector('#a'), cb = document.querySelector('#b');
        ca.width = cb.width = width; ca.height = cb.height = height;
        ca.getContext('2d').drawImage(a, 0, 0, width, height); cb.getContext('2d').drawImage(b, 0, 0, width, height);
        const x = ca.getContext('2d').getImageData(0, 0, width, height).data, y = cb.getContext('2d').getImageData(0, 0, width, height).data;
        let total = 0;
        for (let i = 0; i < x.length; i += 4) total += Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]);
        return total / (width * height * 3 * 255);
      } finally { URL.revokeObjectURL(url); }
    }
    const icon = await compare(fixture.iconPngData, fixture.iconSvg, 180, 180);
    const mail = await compare(fixture.mailPngData, fixture.mailSvg, 192, 192);
    const changedIcon = await compare(fixture.iconPngData, fixture.iconSvg.replace('#ffda44', '#00aa88'), 180, 180);
    return { icon, mail, changedIcon };
  }, fixtures);
  expect(result.icon, JSON.stringify(result)).toBeLessThan(.006);
  expect(result.mail, JSON.stringify(result)).toBeLessThan(.02);
  expect(result.changedIcon, JSON.stringify(result)).toBeGreaterThan(.05);
  await testInfo.attach('managed-svg-metrics', { body: JSON.stringify(result), contentType: 'application/json' });
});
