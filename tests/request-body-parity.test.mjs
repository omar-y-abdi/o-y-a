import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/worker.mjs';
import { handleContact } from '../src/server/contact.mjs';
import { readJson } from '../src/cms/http.mjs';

const origin = 'https://omaryusuf.se';
const encoder = new TextEncoder();
const channels = [
  { name: 'cms', limit: 32, path: '/admin/api/save', declared: 'Innehållet är för stort.', invalid: 'Innehållet måste vara giltig JSON i UTF-8.', missing: 'Innehåll saknas.', oversized: 'Innehållet är för stort.' },
  { name: 'event', limit: 256, path: '/api/event', declared: 'Body too large', invalid: 'Invalid event', missing: 'Invalid event', oversized: 'Invalid event' },
  { name: 'contact', limit: 16384, path: '/api/contact', declared: 'Meddelandet kunde inte läsas.', invalid: 'Meddelandet kunde inte läsas.', missing: 'Meddelandet kunde inte läsas.', oversized: 'Meddelandet kunde inte läsas.' },
];

function streamRequest(channel, parts, length, failure) {
  let consumed = 0, cancelled = false;
  const stream = parts === null ? null : new ReadableStream({
    pull(controller) {
      if (failure) throw failure;
      if (consumed === parts.length) controller.close();
      else controller.enqueue(typeof parts[consumed] === 'string' ? encoder.encode(parts[consumed++]) : parts[consumed++]);
    },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const request = new Request(origin + channel.path, {
    method: 'POST', duplex: 'half', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-CMS-Request': '1', 'X-OY-Consent': 'v1', Cookie: 'oy_privacy=v1.allow', ...(length === undefined ? {} : { 'Content-Length': length }) },
    ...(stream ? { body: stream } : {}),
  });
  return { request, stream, get consumed() { return consumed; }, get cancelled() { return cancelled; } };
}

async function invoke(channel, request) {
  if (channel.name === 'cms') {
    try { return { status: 200, data: await readJson(request, channel.limit) }; }
    catch (error) { if (error.status) return { status: error.status, message: error.message }; throw error; }
  }
  let writes = 0;
  const response = channel.name === 'event'
    ? await worker.fetch(request, { ANALYTICS_ENABLED: 'true', ANALYTICS: { writeDataPoint() { writes++; } } })
    : await handleContact(request, {}, () => { throw new Error('A body check must not reach the provider'); });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, message: data?.error ?? data?.message, writes, data };
}

for (const channel of channels) {
  test(`${channel.name}: invalid or oversized declared length rejects before pulling the body`, async () => {
    for (const length of ['-1', '1.5', 'wrong', String(channel.limit + 1)]) {
      const input = streamRequest(channel, ['{}'], length);
      const result = await invoke(channel, input.request);
      assert.equal(result.status, 413);
      assert.equal(result.message, channel.declared);
      assert.equal(input.consumed, 0);
      assert.equal(input.stream.locked, false);
      assert.ok(!result.writes);
      await input.stream.cancel();
    }
  });

  test(`${channel.name}: actual bytes enforce the limit with missing or dishonest Content-Length`, async () => {
    for (const length of [undefined, '1']) {
      const input = streamRequest(channel, ['x'.repeat(channel.limit), 'x', 'not read'], length);
      const result = await invoke(channel, input.request);
      assert.equal(result.status, 413);
      assert.equal(result.message, channel.oversized);
      assert.equal(input.consumed, 2);
      assert.equal(input.cancelled, true);
      assert.equal(input.stream.locked, false);
      assert.ok(!result.writes);
    }
  });

  test(`${channel.name}: missing body and malformed UTF-8 retain distinct API errors`, async () => {
    const missing = await invoke(channel, streamRequest(channel, null).request);
    assert.equal(missing.status, 400);
    assert.equal(missing.message, channel.missing);
    for (const parts of [[], ['{'], [new Uint8Array([0xc3, 0x28])], ['{"value":"', new Uint8Array([0xc3, 0x28]), '"}']]) {
      const input = streamRequest(channel, parts);
      const result = await invoke(channel, input.request);
      assert.equal(result.status, 400);
      assert.equal(result.message, channel.invalid);
      assert.equal(input.stream.locked, false);
      assert.ok(!result.writes);
    }
  });

  test(`${channel.name}: stream failures release the reader and preserve error mapping`, async () => {
    for (const failure of [new Error('controlled body read failure'), new RangeError('controlled stream range error')]) {
      const input = streamRequest(channel, [], undefined, failure);
      if (channel.name === 'cms') await assert.rejects(invoke(channel, input.request), error => error === failure);
      else {
        const result = await invoke(channel, input.request);
        assert.equal(result.status, failure instanceof RangeError ? 413 : 400);
        assert.equal(result.message, channel.invalid);
        assert.ok(!result.writes);
      }
      assert.equal(input.stream.locked, false);
    }
  });
}

test('valid UTF-8 split across chunks is accepted without a character-based byte limit', async () => {
  const cms = channels[0], text = '{"name":"🙂å"}';
  const bytes = encoder.encode(text), input = streamRequest(cms, Array.from(bytes, byte => Uint8Array.of(byte)), String(bytes.length));
  assert.deepEqual(await invoke(cms, input.request), { status: 200, data: { name: '🙂å' } });
  assert.equal(input.stream.locked, false);
  const event = channels[1], accepted = await invoke(event, streamRequest(event, ['{"event":"joy",', '"page":"/"}']).request);
  assert.equal(accepted.status, 204);
  assert.equal(accepted.writes, 1);
  const contact = channels[2], validContact = JSON.stringify({ name: '🙂å', email: 'owner@example.test', message: 'Hej', website: '', token: 'local-fixture', submission: 'f0000000-0000-4000-8000-000000000001' });
  const contactResult = await invoke(contact, streamRequest(contact, Array.from(encoder.encode(validContact), byte => Uint8Array.of(byte))).request);
  assert.equal(contactResult.status, 503);
  assert.equal(contactResult.message, 'Postluckan är tillfälligt stängd. Försök igen senare.', 'valid contact input reaches configuration checking, never a real provider');
});

test('exact byte limit succeeds and one extra multibyte character fails', async () => {
  const cms = channels[0], exact = ' '.repeat(cms.limit - 2) + '{}';
  assert.deepEqual(await invoke(cms, streamRequest(cms, [exact]).request), { status: 200, data: {} });
  const result = await invoke(cms, streamRequest(cms, [exact.slice(1) + 'å']).request);
  assert.equal(result.status, 413);
});
