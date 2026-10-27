import { mapFrameCss } from './frame-css.mjs';

function fragment(html) {
  // Firefox serializes noscript text from a live-document template as escaped
  // markup. Keep parsing and serialization in the same inert document, as in
  // liveHtml(), so fallback markup/entities survive without decoding or repair.
  return new DOMParser().parseFromString(`<template>${html}</template>`, 'text/html').querySelector('template');
}

function editorFrame(frame, page) {
  const template = fragment(frame.html), forward = new Map(), reverse = new Map(), nodes = new Map();
  const used = new Set([...template.content.querySelectorAll('[id]'), ...fragment(page.html).content.querySelectorAll('[id]')].map(node => node.id));
  for (const pair of Object.values(page.frameIds ?? {})) if (pair[1] !== null) used.add(pair[1]);
  let serial = 0;
  for (const node of template.content.querySelectorAll('[data-cms-node]')) {
    const key = node.getAttribute('data-cms-node'), pair = Object.hasOwn(page.frameIds ?? {}, key) ? page.frameIds[key] : null;
    if (!pair || node.getAttribute('id') !== pair[0]) continue;
    let rendered = pair[1];
    if (rendered === null) { do { rendered = `frame-editor-${serial++}`; } while (used.has(rendered)); used.add(rendered); }
    node.id = rendered;
    nodes.set(key, { canonical: pair[0], rendered });
    forward.set(pair[0], { id: rendered });
    reverse.set(rendered, { id: pair[0] });
  }
  return { template, forward, reverse, nodes };
}

export function composeEditorPage(page, frame) {
  if (!frame) return page;
  const { template } = editorFrame(frame, page);
  template.content.querySelectorAll('.primary-nav a, .shift-link').forEach(link => {
    link.removeAttribute('aria-current');
    if (link.getAttribute('href') === page.path && (link.matches('.shift-link') || ['/om/', '/verkstad/'].includes(page.path))) link.setAttribute('aria-current', 'page');
  });
  const main = template.content.querySelector('main');
  if (!main) throw new Error('Sidramens plats för huvudinnehållet saknas.');
  main.replaceWith(fragment(page.html).content);
  return { ...page, html: template.innerHTML };
}

export function frameSnapshot(editor, frame, page) {
  const projection = editorFrame(frame, page);
  const owners = new Map();
  let baseline;
  const attached = component => { for (let node = component; node; node = node.parent()) if (node === editor.getWrapper()) return true; return false; };
  const owner = component => {
    for (let node = component; node; node = node.parent()) if (String(node.get('tagName')).toLowerCase() === 'main') return 'page';
    return 'frame';
  };
  const key = rule => rule.getAtRule() + '|' + rule.getSelectorsString();
  editor.setStyle(mapFrameCss(frame.css, projection.forward));
  const imported = new Map(editor.Css.getAll().models.map(rule => [key(rule), rule]));
  editor.Css.getAll().forEach(rule => owners.set(rule, 'frame'));
  const pageRules = editor.addStyle(page.css);
  for (const rule of pageRules) {
    if (imported.has(key(rule))) throw new Error('En CSS-regel används av både sidan och sidramen. Kontrollera utkastet innan du fortsätter.');
    owners.set(rule, 'page');
  }
  let linking = false, ready = false;
  function logo(component) {
    for (let node = component; node; node = node.parent()) if (node.getClasses().includes('brand-mark')) return node;
    return null;
  }
  function colourTarget(component, property) {
    const root = logo(component);
    if (!root) return null;
    const petals = ['fill', 'color'].includes(property) && (component === root || component.get('tagName') === 'polygon');
    const path = [];
    if (!petals) for (let node = component; node !== root; node = node.parent()) {
      const tag = node.get('tagName');
      const siblings = node.parent().components().models.filter(item => item.get('tagName') === tag);
      path.unshift(`> ${tag}:nth-of-type(${siblings.indexOf(node) + 1})`);
    }
    return { selector: ['.brand-mark', ...path].join(' '), property: petals ? 'color' : property, petals };
  }
  function linkColour(component, property, value, options = {}) {
    const target = colourTarget(component, property);
    if (!target) return;
    linking = true;
    try {
      const components = editor.getWrapper().find(target.selector);
      for (const match of components) {
        match.removeStyle(property);
        for (const rule of editor.Css.getRules(`#${CSS.escape(match.getId())}`)) {
          if (rule.getAtRule() === (options.atRuleType ? `@${options.atRuleType} ${options.atRuleParams}` : '') && rule.get('state') === (options.state ?? '')) rule.removeStyle(property);
        }
      }
      if (target.petals) for (const root of editor.getWrapper().find('.brand-mark')) {
        root.removeStyle('fill');
        for (const polygon of root.find('polygon')) { polygon.removeStyle('fill'); polygon.addAttributes({ fill: 'currentColor' }); }
      }
      const selector = target.selector + (options.state ? `:${options.state}` : '');
      const previous = editor.Css.getRule(selector, options)?.getStyle() ?? {};
      if (value) previous[target.property] = value; else delete previous[target.property];
      const rule = editor.Css.setRule(selector, previous, options);
      owners.set(rule, 'frame');
    } finally { linking = false; }
  }
  editor.on('styleable:change', (model, property) => {
    if (!ready || linking || !['color', 'fill', 'stroke'].includes(property)) return;
    const component = model.getComponent?.() ?? (model.components ? model : null);
    if (!logo(component)) return;
    linkColour(component, property, model.getStyle()[property], { atRuleType: model.get('atRuleType'), atRuleParams: model.get('mediaText'), state: model.get('state') });
  });
  editor.on('component:update:attributes', component => {
    if (!ready || linking || !logo(component)) return;
    for (const property of ['fill', 'stroke']) {
      const value = component.getAttributes()[property];
      if (value !== component.previous('attributes')?.[property] && value !== undefined && value !== 'currentColor') linkColour(component, property, value);
    }
  });
  return {
    bind() { for (const rule of editor.Css.getAll().models) { const component = rule.getComponent(); if (component) owners.set(rule, component); } ready = true; },
    capture(html) { baseline = this.snapshot(html); },
    clone(source, copy, run) {
      const before = new Set(editor.Css.getAll().models);
      run();
      for (const rule of editor.Css.getAll().models) if (!before.has(rule)) owners.set(rule, copy);
    },
    snapshot(html) {
      const template = fragment(html), mains = template.content.querySelectorAll('main');
      if (mains.length !== 1 || mains[0].parentNode !== template.content) throw new Error('Sidan behöver exakt ett huvudinnehåll på översta nivån.');
      const main = mains[0], pageHtml = main.outerHTML;
      main.replaceWith(document.createElement('main'));
      template.content.querySelectorAll('.primary-nav [aria-current], .shift-link[aria-current]').forEach(node => node.removeAttribute('aria-current'));
      for (const node of template.content.querySelectorAll('[data-cms-node]')) {
        const original = projection.nodes.get(node.getAttribute('data-cms-node'));
        if (original && node.getAttribute('id') === original.rendered) node.id = original.canonical;
      }
      const rules = { frame: [], page: [] };
      for (const rule of editor.Css.getAll().models) {
        if (rule.get('shallow')) continue;
        const component = rule.getComponent();
        const prior = owners.get(rule);
        const target = component ?? (typeof prior === 'object' ? prior : null);
        if (target && !attached(target)) continue;
        const kind = component ? owner(component) : typeof prior === 'object' ? owner(prior) : prior;
        if (!kind) throw new Error(`CSS-regeln ${rule.getSelectorsString()} saknar ägare. Ångra den senaste stiländringen innan du fortsätter.`);
        rules[kind].push(rule);
        if (component) owners.set(rule, component);
      }
      const value = { html: pageHtml, css: editor.getCss({ rules: rules.page, keepUnusedStyles: true }), project: null,
        frame: { html: template.innerHTML, css: mapFrameCss(editor.getCss({ rules: rules.frame, keepUnusedStyles: true }), projection.reverse) } };
      if (baseline && value.html === baseline.html && value.css === baseline.css) { value.html = page.html; value.css = page.css; }
      if (baseline && value.frame.html === baseline.frame.html && value.frame.css === baseline.frame.css) value.frame = frame;
      return value;
    },
  };
}

export function chooseFrameClient(project, choices) {
  const { frameConflicts, ...clean } = project;
  let frame = project.frame;
  for (const conflict of frameConflicts ?? []) {
    const option = conflict.options[choices[conflict.key]];
    if (!option) throw new Error('Välj en variant för varje gemensam del.');
    if (conflict.key === 'frame') frame = option.value;
    else {
      const template = fragment(frame.html), chosen = fragment(option.value.html);
      const target = [...template.content.querySelectorAll('[data-cms-shared]')].find(node => node.getAttribute('data-cms-shared') === conflict.key);
      const source = [...chosen.content.querySelectorAll('[data-cms-shared]')].find(node => node.getAttribute('data-cms-shared') === conflict.key);
      if (!target || !source) throw new Error('Den gemensamma textens plats saknas i sidramen.');
      target.innerHTML = source.innerHTML;
      frame = { ...frame, html: template.innerHTML };
    }
  }
  return { ...clean, frame };
}
