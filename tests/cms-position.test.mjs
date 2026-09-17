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

test('managed SVG root does not expose CSS-only resize while SVG groups keep persistent resize', () => {
  const root = component('svg');
  configureVisualComponent(root);
  assert.equal(root.configured().resizable, false);

  const group = component('g');
  configureVisualComponent(group);
  assert.equal(typeof group.configured().resizable, 'object');
  assert.equal(typeof group.configured().resizable.updateTarget, 'function');
});
