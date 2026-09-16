import { describe, expect, it } from 'vitest';
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
      createElement(tag) { expect(tag).toBe('a'); events.push('create'); return link; },
      body: { append(node) { expect(node).toBe(link); events.push('append'); } },
    };
    const urlApi = {
      createObjectURL(blob) { expect(blob).toBe('blob'); events.push('url'); return 'blob:test'; },
      revokeObjectURL(url) { expect(url).toBe('blob:test'); events.push('revoke'); },
    };
    let scheduled;
    const schedule = fn => { scheduled = fn; events.push('schedule'); };

    startBlobDownload('blob', 'card.png', { documentRef, urlApi, schedule });

    expect(link.href).toBe('blob:test');
    expect(link.download).toBe('card.png');
    expect(events).toEqual(['url', 'create', 'append', 'click', 'remove', 'schedule']);
    scheduled();
    expect(events).toEqual(['url', 'create', 'append', 'click', 'remove', 'schedule', 'revoke']);
  });
});
