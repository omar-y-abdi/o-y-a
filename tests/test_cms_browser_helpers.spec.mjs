import { test, expect, errors as playwrightErrors } from '@playwright/test';
import { mock } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { lockPreview, openAssets, saveAssetMetadata, seedRuntime, uploadFile } from './helpers/cms-browser-qa.mjs';
import { libraryBundle, libraryPage } from './helpers/cms-browser-library.mjs';

let runtime, api, bundle, record;
test.describe.configure({ mode: 'default', timeout: 60_000 });
test.beforeAll(async ({ playwright }) => {
  runtime = await cmsRuntime({ port: 0 });
  api = await playwright.request.newContext();
  await seedRuntime(runtime, api);
  bundle = await libraryBundle();
  const response = await api.post(runtime.url + '/admin/api/upload', {
    headers: { 'Cf-Access-Jwt-Assertion': await runtime.token(), Origin: runtime.url, 'Content-Type': 'application/octet-stream', 'X-CMS-Request': '1', 'X-CMS-Upload-Id': crypto.randomUUID(), 'X-CMS-Filename': 'font.woff2' },
    data: await readFile('tests/fixtures/dm-sans-latin-400-normal.woff2'),
  });
  expect(response.status(), await response.text()).toBe(201);
  record = await response.json();
  await response.dispose();
});
test.afterAll(async () => { try { await api?.dispose(); } finally { await runtime?.close(); } });

test('library fixture has no callbacks from a discarded editor', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await libraryPage(page, bundle, '<div id="special-stage"></div><div id="custom-inspector"></div>');
  // Removing an observed editor element schedules ResizeObserver delivery.
  // Two rendering turns expose that callback without an arbitrary sleep.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(errors).toEqual([]);
});

const count = fn => fn.mock.calls.length;
function responsePage(status = 200, id = 'asset-one') {
  const cachedBody = () => { throw new Error('Request content was evicted from inspector cache'); };
  const request = { method: () => 'POST', headers: () => ({ 'x-cms-upload-id': id }) };
  const response = { status: () => status, url: () => runtime.url + (status === 201 ? '/admin/api/upload' : '/admin/api/asset-metadata'), request: () => request, json: mock.fn(cachedBody), text: mock.fn(cachedBody), body: mock.fn(cachedBody), finished: mock.fn() };
  const form = { dispose: mock.fn() };
  const locator = { elementHandle: mock.fn(() => form), click: mock.fn(), setInputFiles: mock.fn(), waitFor: mock.fn() };
  const state = { status: () => 200, json: mock.fn(() => ({ assets: [] })), dispose: mock.fn() };
  const page = { locator: mock.fn(() => locator), waitForFunction: mock.fn(), request: { get: mock.fn(() => state) }, waitForResponse: mock.fn(predicate => { expect(predicate(response)).toBe(true); return Promise.resolve(response); }) };
  return { page, response, locator, state, form };
}

test.describe('LibraryNavigationTests', () => {
  test.beforeEach(async ({ page }) => {
    await libraryPage(page, bundle, '<button data-library="pages" aria-selected="true">Sidor</button><button data-library="assets" aria-selected="false">Bilder</button><button data-library="wins" data-special="wins" aria-selected="false">Vinster</button><div id="library-list"></div><div id="special-stage"></div><div id="custom-inspector"></div>');
    await page.evaluate(() => {
      window.fixture = { requests: 0, view: 'pages' };
      window.libraryFixture.pageList([{ id: 'home', name: 'Home', path: '/' }], 'home');
      const assets = () => window.libraryFixture.assetNavigation('media', [], []);
      const media = () => {
        window.fixture.view = 'media'; window.fixture.requests++; assets();
        setTimeout(() => { if (window.fixture.view === 'media') window.libraryFixture.mediaGallery([]); }, 180);
      };
      document.addEventListener('click', event => {
        const el = event.target.closest('button');
        if (!el) return;
        if (el.dataset.library === 'assets') {
          document.querySelector('[data-library=assets]').setAttribute('aria-selected', 'true');
          document.querySelector('[data-library=pages]').setAttribute('aria-selected', 'false');
          media();
        }
        if (el.dataset.special === 'media') media();
        if (el.dataset.library === 'wins' || el.dataset.special === 'wins') {
          window.fixture.view = 'wins'; window.libraryFixture.assetNavigation('wins', [], []); window.libraryFixture.winGallery([]);
        }
      });
    });
    page.setDefaultTimeout(700);
  });

  test('test_media_from_details_ignores_duplicate_back_button', async ({ page }) => {
    await page.evaluate(() => { window.libraryFixture.assetNavigation('asset', [], []); window.libraryFixture.assetDetail({ id: 'image', name: 'image.png', mime: 'image/png', src: '/image.png', alt: '' }); });
    expect(await page.locator('[data-special=media]').count()).toBe(2);
    await openAssets(page);
    await expect(page.locator('#special-stage [data-media-state=active]')).toBeVisible({ timeout: 700 });
    expect(await page.evaluate(() => window.fixture.requests)).toBe(1);
  });

  test('test_wins_opens_assets_from_initial_pages_tab', async ({ page }) => {
    expect(await page.locator('[data-library=wins]').count()).toBe(1);
    await openAssets(page, 'wins');
    await expect(page.locator('#special-stage #win-search')).toBeVisible({ timeout: 700 });
    expect(await page.evaluate(() => window.fixture.view)).toBe('wins');
    expect(await page.evaluate(() => window.fixture.requests)).toBe(0);
  });

  test('test_media_opens_from_pages_without_duplicate_fetch', async ({ page }) => {
    await openAssets(page);
    await expect(page.locator('#special-stage [data-media-state=active]')).toBeVisible({ timeout: 700 });
    expect(await page.evaluate(() => window.fixture.requests)).toBe(1);
  });

  async function previewFixture(page, { previous = true, newScript = true, replace = true } = {}) {
    await page.setContent('<button data-action="lock">Lock</button><div id="preview-stage"></div>', { waitUntil: 'domcontentloaded', timeout: 5000 });
    await page.evaluate(options => {
      const stage = document.querySelector('#preview-stage');
      const frame = (name, script) => {
        const element = document.createElement('iframe');
        element.srcdoc = '<html><head>' + (script ? '<script type="module" src="/assets/main.' + name + '.mjs"><' + '/script>' : '') + '</head><body>' + name + '</body></html>';
        return element;
      };
      if (options.previous) stage.append(frame('old', true));
      document.querySelector('[data-action=lock]').onclick = () => {
        if (options.replace) setTimeout(() => stage.replaceChildren(frame('new', options.newScript)), 250);
      };
    }, { previous, newScript, replace });
    if (previous) await expect(page.frameLocator('#preview-stage iframe').locator('script[src]')).toHaveCount(1, { timeout: 700 });
  }

  test('test_lock_preview_waits_for_new_frame_not_existing_compare_view', async ({ page }) => {
    await previewFixture(page);
    expect(await lockPreview(page, 1500)).toEqual(['/assets/main.new.mjs']);
  });

  test('test_lock_preview_rejects_new_document_without_main_script', async ({ page }) => {
    await previewFixture(page, { newScript: false });
    await expect(lockPreview(page, 1000)).rejects.toBeInstanceOf(playwrightErrors.TimeoutError);
  });

  test('test_lock_preview_rejects_stale_frame_when_render_never_completes', async ({ page }) => {
    await previewFixture(page, { replace: false });
    await expect(lockPreview(page, 1000)).rejects.toBeInstanceOf(playwrightErrors.TimeoutError);
  });

  test('test_lock_preview_also_waits_when_no_previous_frame_exists', async ({ page }) => {
    await previewFixture(page, { previous: false });
    expect(await lockPreview(page, 1500)).toEqual(['/assets/main.new.mjs']);
  });
});

test.describe('TransportOrderingTests', () => {
  test('test_metadata_save_waits_for_server_ack_and_form_replacement', async () => {
    const { page, response, locator, form } = responsePage(), seen = [];
    locator.click.mock.mockImplementation(() => { seen.push('click'); });
    page.waitForResponse.mock.mockImplementation(predicate => { expect(predicate(response)).toBe(true); return Promise.resolve(response).then(value => { seen.push('ack'); return value; }); });
    page.waitForFunction.mock.mockImplementation(() => { seen.push('render'); });
    await saveAssetMetadata(page);
    expect(seen).toEqual(['click', 'ack', 'render']);
    expect(page.waitForFunction.mock.calls[0].arguments[1]).toBe(form);
    expect(count(response.json)).toBe(0);
    expect(count(response.finished)).toBe(0);
  });

  test('test_metadata_conflict_is_not_counted_as_saved', async () => {
    const { page } = responsePage(409);
    await expect(saveAssetMetadata(page)).rejects.toThrow('409');
    expect(count(page.waitForFunction)).toBe(0);
  });

  test('test_upload_reads_persisted_metadata_without_response_body', async () => {
    const { page, response, locator, state } = responsePage(201);
    const asset = { id: 'asset-one', name: 'font.woff2', src: '/media/asset-one.woff2', mime: 'font/woff2' };
    state.json.mock.mockImplementation(() => ({ assets: [asset] }));
    expect(await uploadFile(page, 'font.woff2', runtime.url)).toEqual(asset);
    expect(count(response.json)).toBe(0);
    expect(count(response.body)).toBe(0);
    expect(locator.setInputFiles.mock.calls.map(call => call.arguments)).toEqual([['font.woff2']]);
    expect(page.request.get.mock.calls.map(call => call.arguments)).toEqual([[runtime.url + '/admin/api/state', { maxRetries: 2 }]]);
    expect(count(response.finished)).toBe(0);
    expect(count(state.dispose)).toBe(1);
  });

  test('test_rejected_upload_stops_without_retry_or_state_read', async () => {
    const { page, response, locator } = responsePage(422);
    response.url = () => runtime.url + '/admin/api/upload';
    await expect(uploadFile(page, 'font.woff2', runtime.url)).rejects.toThrow('422');
    expect(count(page.request.get)).toBe(0);
    expect(count(locator.setInputFiles)).toBe(1);
  });

  test('test_success_status_without_registered_asset_is_rejected', async () => {
    const { page, state } = responsePage(201);
    await expect(uploadFile(page, 'font.woff2', runtime.url)).rejects.toThrow('asset-one');
    expect(count(state.dispose)).toBe(1);
  });

  test('test_failed_state_read_is_not_mistaken_for_completed_upload', async () => {
    const { page, state } = responsePage(201);
    state.status = () => 503;
    await expect(uploadFile(page, 'font.woff2', runtime.url)).rejects.toThrow('503');
    expect(count(state.dispose)).toBe(1);
  });
});

test.describe('StateConnectionTests', () => {
  let server, origin, calls, resets, status, body, serverError, headers;
  test.beforeEach(async () => {
    calls = 0; resets = 0; status = 200; body = null; serverError = null;
    headers = { 'Cf-Access-Jwt-Assertion': await runtime.token() };
    server = createServer((request, response) => {
      calls++;
      if (calls <= resets) { request.socket.destroy(); return; }
      void (async () => {
        expect(request.method).toBe('GET');
        expect(request.url).toBe('/admin/api/state');
        const upstream = body === null && status === 200 ? await fetch(runtime.url + request.url, { headers }) : null;
        const payload = body ?? (upstream ? await upstream.text() : '{}');
        response.writeHead(upstream?.status ?? status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
        response.end(payload);
      })().catch(error => { serverError = error; response.destroy(error); });
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    origin = `http://127.0.0.1:${server.address().port}`;
  });
  test.afterEach(async () => {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    expect(serverError).toBeNull();
  });

  test('test_one_socket_reset_reads_committed_asset_without_reupload', async ({ request }) => {
    resets = 1;
    const fixture = responsePage(201, record.id);
    fixture.page.request = request;
    expect(await uploadFile(fixture.page, 'font.woff2', origin)).toEqual(record);
    expect(calls).toBe(2);
    expect(count(fixture.locator.setInputFiles)).toBe(1);
    expect(count(fixture.response.finished)).toBe(0);
  });

  test('test_two_socket_resets_are_bounded_and_read_only', async ({ request }) => {
    resets = 2;
    const fixture = responsePage(201, record.id);
    fixture.page.request = request;
    expect(await uploadFile(fixture.page, 'font.woff2', origin)).toEqual(record);
    expect(calls).toBe(3);
    expect(count(fixture.locator.setInputFiles)).toBe(1);
  });

  test('test_persistent_socket_failure_still_fails_after_three_attempts', async ({ request }) => {
    resets = 10;
    const fixture = responsePage(201, record.id);
    fixture.page.request = request;
    await expect(uploadFile(fixture.page, 'font.woff2', origin)).rejects.toThrow(/socket hang up|ECONNRESET/);
    expect(calls).toBe(3);
    expect(count(fixture.locator.setInputFiles)).toBe(1);
  });

  test('test_http_failure_is_not_retried_or_counted_as_upload_success', async ({ request }) => {
    for (const code of [401, 409, 422, 500, 503]) {
      await test.step(String(code), async () => {
        calls = 0; status = code;
        const fixture = responsePage(201, record.id);
        fixture.page.request = request;
        await expect(uploadFile(fixture.page, 'font.woff2', origin)).rejects.toThrow(String(code));
        expect(calls).toBe(1);
      });
    }
  });

  test('test_malformed_json_is_not_retried_or_treated_as_success', async ({ request }) => {
    body = '{';
    const fixture = responsePage(201, record.id);
    fixture.page.request = request;
    await expect(uploadFile(fixture.page, 'font.woff2', origin)).rejects.toBeInstanceOf(SyntaxError);
    expect(calls).toBe(1);
  });

  test('test_ui_not_ready_is_not_replaced_by_successful_api_read', async ({ request }) => {
    const fixture = responsePage(201, record.id);
    fixture.page.request = request;
    fixture.page.waitForFunction.mock.mockImplementation(() => { throw new Error('UI not ready'); });
    await expect(uploadFile(fixture.page, 'font.woff2', origin)).rejects.toThrow('UI not ready');
    expect(calls).toBe(0);
    expect(count(fixture.locator.setInputFiles)).toBe(1);
  });
});
