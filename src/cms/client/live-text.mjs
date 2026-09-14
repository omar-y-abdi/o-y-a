// Snapshot the active editing DOM without replacing it. Resetting GrapesJS child
// models on each keystroke would detach the caret and disrupt native undo/IME.
export function liveHtml(editor, view) {
  const wrapper = editor.getWrapper();
  if (!view?.el?.isConnected) return wrapper.getInnerHTML();
  const html = wrapper.getInnerHTML({ attributes(component, attributes) {
    return component === view.model ? { ...attributes, 'data-cms-capture': '' } : attributes;
  } });
  const template = document.createElement('template');
  template.innerHTML = html;
  const target = template.content.querySelector('[data-cms-capture]');
  if (!target) return html;
  target.removeAttribute('data-cms-capture');
  target.innerHTML = view.getChildrenContainer().innerHTML;
  for (const element of target.querySelectorAll('*')) for (const attribute of [...element.attributes]) {
    if (attribute.name.startsWith('data-gjs-') || ['contenteditable', 'draggable'].includes(attribute.name)) element.removeAttribute(attribute.name);
  }
  for (const element of target.querySelectorAll('[class]')) for (const name of [...element.classList]) if (name.startsWith('gjs-')) element.classList.remove(name);
  return template.innerHTML;
}
