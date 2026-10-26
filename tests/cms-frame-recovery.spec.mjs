import { test as base, expect } from '@playwright/test';
import { legacyInitial } from '../.generated/cms-seed.mjs';
import { chooseFrame } from '../src/cms/frame-converter.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { waitCanvas } from './helpers/cms-browser-qa.mjs';

const divergentTagline = 'En äldre footer som bara finns på en sida.';
const test = base.extend({
  runtime: async ({}, use) => {
    const legacy = structuredClone(legacyInitial);
    delete legacy.sharedContent;
    for (const page of legacy.pages) page.html = page.html.replace(/ data-cms-shared="footer\.tagline"/g, '');
    legacy.pages[0].html = legacy.pages[0].html.replace(/Lite hjärna\. Lite hjärta\.<br[^>]*>Ganska mycket nyfikenhet\./, divergentTagline);
    expect(legacy.pages[0].html).toContain(divergentTagline);
    const runtime = await cmsRuntime({ project: legacy });
    try { await use(runtime); }
    finally { await runtime.close(); }
  },
});
test.setTimeout(90_000);

async function openRepair(page, context, runtime) {
  await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(runtime.url + '/admin/');
  const form = page.locator('[data-shared-content-repair]');
  await expect(form).toBeVisible({ timeout: 30_000 });
  await expect(form.locator('input[type=radio]')).toHaveCount(2);
  return { form, submit: form.locator('button[type=submit]'), error: form.locator('[data-shared-content-error]'), choices: form.locator('input[type=radio]') };
}

for (const failure of ['lost response', 'unreadable successful response']) {
  test(`frame repair replays its frozen choice after a committed Save with ${failure}`, async ({ page, context, runtime }) => {
    const payloads = [], acknowledgements = [];
    await page.route('**/admin/api/save', async route => {
      payloads.push(route.request().postData());
      const response = await route.fetch();
      acknowledgements.push({ status: response.status(), body: await response.json() });
      if (payloads.length === 1) {
        if (failure === 'lost response') await route.abort('failed');
        else await route.fulfill({ status: 200, contentType: 'application/json', body: '{' });
      } else await route.fulfill({ response });
    });
    const { form, submit, error, choices } = await openRepair(page, context, runtime);
    await choices.last().check();
    await submit.click();
    await expect(error).toContainText('Anslutningen bröts');
    await expect(submit).toHaveText('Försök spara samma val igen');
    for (const choice of await choices.all()) await expect(choice).toBeDisabled();
    const committed = await readSite(runtime.db);
    expect(committed.version).toBe(2);
    expect(acknowledgements[0].status).toBe(200);
    expect(committed.project.frame).toEqual(JSON.parse(payloads[0]).project.frame);
    await page.keyboard.press('Escape');
    await expect(form).toBeVisible();
    await submit.click();
    await expect(form).toBeHidden();
    await waitCanvas(page);
    expect(payloads).toHaveLength(2);
    expect(payloads[1]).toBe(payloads[0]);
    expect(acknowledgements[1]).toMatchObject({ status: 200, body: { version: 2, replayed: true } });
    expect((await readSite(runtime.db)).version).toBe(2);
    expect((await runtime.db.prepare('SELECT count(*) AS count FROM cms_revisions').first()).count).toBe(2);
  });
}

test('confirmed frame repair retries only the state read, including a definitive read failure', async ({ page, context, runtime }) => {
  let saves = 0, stateReads = 0;
  await page.route('**/admin/api/save', async route => { saves++; await route.continue(); });
  await page.route('**/admin/api/state', async route => {
    stateReads++;
    if (stateReads === 2) await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Tillfälligt läsfel.' }) });
    else if (stateReads === 3) await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Logga in igen.' }) });
    else await route.continue();
  });
  const { form, submit, error, choices } = await openRepair(page, context, runtime);
  await submit.click();
  await expect(error).toHaveText('Tillfälligt läsfel.');
  await expect(submit).toHaveText('Läs in den aktuella versionen');
  for (const choice of await choices.all()) await expect(choice).toBeDisabled();
  expect((await readSite(runtime.db)).version).toBe(2);
  await submit.click();
  await expect(error).toHaveText('Logga in igen.');
  await expect(submit).toHaveText('Läs in den aktuella versionen');
  for (const choice of await choices.all()) await expect(choice).toBeDisabled();
  await submit.click();
  await expect(form).toBeHidden();
  await waitCanvas(page);
  expect(saves).toBe(1);
  expect(stateReads).toBe(4);
  expect((await readSite(runtime.db)).version).toBe(2);
});

test('an unverified historical identity preserves the frozen frame choice and retry body', async ({ page, context, runtime }) => {
  const payloads = [];
  await page.route('**/admin/api/save', async route => {
    payloads.push(route.request().postData());
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    if (payloads.length === 1) await route.fulfill({ status: 409, json: {
      error: 'Sparförsöket finns redan som version 2. Jämför med historiken.',
      details: { saveIdentityUnverified: true, recordedVersion: 2 },
    } });
    else await route.fulfill({ response });
  });
  const { form, submit, error, choices } = await openRepair(page, context, runtime);
  await choices.last().check();
  await submit.click();
  await expect(error).toContainText('finns redan som version 2');
  await expect(submit).toHaveText('Försök spara samma val igen');
  for (const choice of await choices.all()) await expect(choice).toBeDisabled();
  await submit.click();
  await expect(form).toBeHidden();
  expect(payloads).toHaveLength(2);
  expect(payloads[1]).toBe(payloads[0]);
  expect((await readSite(runtime.db)).version).toBe(2);
});

test('a definitive frame Save refusal allows a corrected choice and a new attempt', async ({ page, context, runtime }) => {
  const payloads = [];
  await page.route('**/admin/api/save', async route => {
    payloads.push(route.request().postDataJSON());
    if (payloads.length === 1) await route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ error: 'Välj en annan variant.' }) });
    else await route.continue();
  });
  const { form, submit, error, choices } = await openRepair(page, context, runtime);
  await choices.first().check();
  await submit.click();
  await expect(error).toHaveText('Välj en annan variant.');
  for (const choice of await choices.all()) await expect(choice).toBeEnabled();
  expect((await readSite(runtime.db)).version).toBe(1);
  await choices.last().check();
  await submit.click();
  await expect(form).toBeHidden();
  await waitCanvas(page);
  expect(payloads).toHaveLength(2);
  expect(payloads[1].requestId).not.toBe(payloads[0].requestId);
  expect(payloads[1].project.frame).not.toEqual(payloads[0].project.frame);
  expect((await readSite(runtime.db)).project.frame).toEqual(payloads[1].project.frame);
});

for (const uncertain of [false, true]) test(`a real concurrent publication reconciles a ${uncertain ? 'previously uncertain' : 'stale'} frame choice`, async ({ page, context, runtime }) => {
  const { form, submit, error, choices } = await openRepair(page, context, runtime);
  await choices.last().check();
  const payloads = [];
  await page.route('**/admin/api/save', async route => {
    payloads.push(route.request().postData());
    if (uncertain && payloads.length === 1) await route.abort('failed');
    else await route.continue();
  });
  if (uncertain) {
    await submit.click();
    await expect(error).toContainText('Anslutningen bröts');
    for (const choice of await choices.all()) await expect(choice).toBeDisabled();
    expect((await readSite(runtime.db)).version).toBe(1);
  }
  const stateResponse = await runtime.mf.dispatchFetch(runtime.url + '/admin/api/state', { headers: { Cookie: `CF_Authorization=${await runtime.token()}` } });
  expect(stateResponse.status).toBe(200);
  const state = await stateResponse.json();
  const conflict = state.project.frameConflicts[0];
  const project = chooseFrame(state.project, conflict.options[0].value, conflict.key);
  const concurrent = await publishSite(runtime.db, { project, baseVersion: 1, requestId: crypto.randomUUID(), actor: runtime.email });
  expect(concurrent.version).toBe(2);
  let failRead = true;
  await page.route('**/admin/api/state', async route => {
    if (failRead) { failRead = false; await route.abort('failed'); }
    else await route.continue();
  });
  await submit.click();
  await expect(error).toContainText('annan flik');
  await expect(submit).toHaveText('Läs in den aktuella versionen');
  for (const choice of await choices.all()) await expect(choice).toBeDisabled();
  await submit.click();
  await expect(error).toContainText('Anslutningen bröts');
  await expect(form).toBeVisible();
  for (const choice of await choices.all()) await expect(choice).toBeDisabled();
  await submit.click();
  await expect(form).toBeHidden();
  await waitCanvas(page);
  expect(payloads).toHaveLength(uncertain ? 2 : 1);
  if (uncertain) expect(payloads[1]).toBe(payloads[0]);
  const stored = await readSite(runtime.db);
  expect(stored.version).toBe(2);
  expect(stored.project.frame).toEqual(project.frame);
});
