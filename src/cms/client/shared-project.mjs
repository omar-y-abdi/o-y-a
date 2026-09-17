function fragment(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template;
}

function semanticInner(element) {
  const template = fragment(element.innerHTML);
  template.content.querySelectorAll('[data-cms-node]').forEach(node => node.removeAttribute('data-cms-node'));
  return template.innerHTML;
}

function sharedValues(html) {
  const template = fragment(html);
  const values = new Map();
  template.content.querySelectorAll('[data-cms-shared]').forEach(node => values.set(node.getAttribute('data-cms-shared'), semanticInner(node)));
  return values;
}

function propagate(html, key, value) {
  const template = fragment(html);
  template.content.querySelectorAll('[data-cms-shared]').forEach(node => {
    if (node.getAttribute('data-cms-shared') === key) node.innerHTML = value;
  });
  return template.innerHTML;
}

export function synchronizeSharedPageClient(project, pageId, nextPage) {
  let pages = project.pages.map(page => page.id === pageId ? nextPage : page);
  const sharedContent = { ...(project.sharedContent ?? {}) };
  for (const [key, value] of sharedValues(nextPage.html)) {
    if (sharedContent[key] === value) continue;
    sharedContent[key] = value;
    pages = pages.map(page => ({ ...page, html: propagate(page.html, key, value) }));
  }
  return { ...project, pages, sharedContent };
}
