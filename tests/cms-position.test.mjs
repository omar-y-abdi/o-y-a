import test from 'node:test';
import assert from 'node:assert/strict';
import { configureVisualComponent } from '../src/cms/client/editor-policy.mjs';

function component(tagName) {
  let configured = null;
  return {
    get(key) { return key === 'tagName' ? tagName : undefined; },
    getAttributes() { return {}; },
    set(value) { configured = value; },
    configured() { return configured; },
  };
}

test('managed SVG root blocks lossy resize without changing normal SVG resize behavior', () => {
  const normalRoot = component('svg');
  configureVisualComponent(normalRoot);
  assert.equal(normalRoot.configured().resizable, true);

  const managedRoot = component('svg');
  configureVisualComponent(managedRoot, { managedSvg: true });
  assert.equal(managedRoot.configured().resizable, false);

  const group = component('g');
  configureVisualComponent(group, { managedSvg: true });
  assert.equal(typeof group.configured().resizable, 'object');
  assert.equal(typeof group.configured().resizable.updateTarget, 'function');
});
