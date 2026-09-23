// Snapshot the active editing DOM without replacing it. Resetting GrapesJS child
// models on each keystroke would detach the caret and disrupt native undo/IME.
export function liveHtml(editor, view) {
  const wrapper = editor.getWrapper();
  const active = view?.el?.isConnected;
  const html = wrapper.getInnerHTML(active ? { attributes(component, attributes) {
    return component === view.model ? { ...attributes, 'data-cms-capture': '' } : attributes;
  } } : undefined);
  const inert = new DOMParser().parseFromString(`<template>${html}</template>`, 'text/html');
  const template = inert.querySelector('template');
  const target = active && template.content.querySelector('[data-cms-capture]');
  if (target) {
    target.removeAttribute('data-cms-capture');
    target.innerHTML = view.getChildrenContainer().innerHTML;
    for (const element of target.querySelectorAll('*')) for (const attribute of [...element.attributes]) {
      if (attribute.name.startsWith('data-gjs-') || ['contenteditable', 'draggable'].includes(attribute.name)) element.removeAttribute(attribute.name);
    }
    for (const element of target.querySelectorAll('[class]')) for (const name of [...element.classList]) if (name.startsWith('gjs-')) element.classList.remove(name);
  }
  return template.innerHTML;
}
