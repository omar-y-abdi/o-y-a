import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startBlobDownload } from '../src/client/joy.mjs';

describe('card download', () => {
  it('attaches the anchor before clicking and removes it afterwards', () => {
    const events = [];
    const link = {
      href: '',
      download: '',
      click() { events.push('click'); },
      remove() { events.push('remove'); },
    };
    const documentRef = {
      createElement(tag) { assert.equal(tag, 'a'); events.push('create'); return link; },
      body: { append(node) { assert.equal(node, link); events.push('append'); } },
    };
    const urlApi = {
      createObjectURL(blob) { assert.equal(blob, 'blob'); events.push('url'); return 'blob:test'; },
      revokeObjectURL(url) { assert.equal(url, 'blob:test'); events.push('revoke'); },
    };
    let scheduled;
    const schedule = fn => { scheduled = fn; events.push('schedule'); };

    startBlobDownload('blob', 'card.png', { documentRef, urlApi, schedule });

    assert.equal(link.href, 'blob:test');
    assert.equal(link.download, 'card.png');
    assert.deepEqual(events, ['url', 'create', 'append', 'click', 'remove', 'schedule']);
    scheduled();
    assert.deepEqual(events, ['url', 'create', 'append', 'click', 'remove', 'schedule', 'revoke']);
  });
});
