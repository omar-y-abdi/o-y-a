import test from 'node:test';
import assert from 'node:assert/strict';
import { configureVisualComponent, responsiveResizeStyle } from '../src/cms/client/editor-policy.mjs';

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
  assert.deepEqual(normalRoot.configured().resizable, { currentUnit: 0, unitWidth: 'px', unitHeight: 'px' });

  const managedRoot = component('svg');
  configureVisualComponent(managedRoot, { managedSvg: true });
  assert.equal(managedRoot.configured().resizable, false);

  const group = component('g');
  configureVisualComponent(group, { managedSvg: true });
  assert.equal(typeof group.configured().resizable, 'object');
  assert.equal(typeof group.configured().resizable.updateTarget, 'function');
});

test('resize drag writes a responsive width and a height floor over auto', () => {
  assert.deepEqual(responsiveResizeStyle({ width: '521px', height: '571px' }, 'div'), { width: 'min(521px,100%)', 'min-height': '571px', height: 'auto' });
  assert.deepEqual(responsiveResizeStyle({ width: '300px', height: '200px' }, 'img'), { width: 'min(300px,100%)', height: 'auto' });
  assert.deepEqual(responsiveResizeStyle({ height: '40px', top: '5px' }, 'section'), { 'min-height': '40px', height: 'auto', top: '5px' });
  assert.deepEqual(responsiveResizeStyle({ width: 'auto', height: 'auto' }, 'div'), { width: 'auto', height: 'auto' });
  assert.deepEqual(responsiveResizeStyle({ width: '10px' }, 'div'), { width: 'min(10px,100%)' });
});

test('resize subtracts padding and borders only for content-box CSS lengths', () => {
  const box = { boxSizing: 'content-box', paddingLeft: '12px', paddingRight: '18px', borderLeftWidth: '3px', borderRightWidth: '4px', paddingTop: '10px', paddingBottom: '20px', borderTopWidth: '2px', borderBottomWidth: '3px' };
  const style = { width: '521px', height: '571px' };
  assert.deepEqual(responsiveResizeStyle(style, 'div', box), { width: 'min(484px,calc(100% - 37px))', 'min-height': '536px', height: 'auto' });
  assert.deepEqual(responsiveResizeStyle(style, 'div', { ...box, boxSizing: 'border-box' }), { width: 'min(521px,100%)', 'min-height': '571px', height: 'auto' });
  assert.deepEqual(responsiveResizeStyle({ height: '20px' }, 'div', box), { 'min-height': '0px', height: 'auto' });
  assert.deepEqual(responsiveResizeStyle(style, 'img', box), { width: 'min(484px,calc(100% - 37px))', height: 'auto' });
  assert.deepEqual(responsiveResizeStyle({ width: 'auto', height: 'auto' }, 'div', box), { width: 'auto', height: 'auto' });
  assert.deepEqual(style, { width: '521px', height: '571px' });
});

test('resizable options are not set on non-resizable components', () => {
  const input = component('input');
  configureVisualComponent(input);
  assert.equal(input.configured().resizable, false);
});

test('managed SVG makes inner shapes selectable and leaves page SVG alone', () => {
  const shape = (tagName, type) => { const c = component(tagName); const get = c.get; c.get = key => key === 'type' ? type : get(key); return c; };
  const inner = shape('path', 'svg-in');
  configureVisualComponent(inner, { managedSvg: true });
  assert.equal(inner.configured().selectable, true);
  assert.equal(inner.configured().hoverable, true);
  assert.equal(inner.configured().layerable, true);

  const pageIcon = shape('path', 'svg-in');
  configureVisualComponent(pageIcon);
  assert.equal('selectable' in pageIcon.configured(), false);

  const managedRoot = shape('svg', 'svg');
  configureVisualComponent(managedRoot, { managedSvg: true });
  assert.equal('selectable' in managedRoot.configured(), false);
});
