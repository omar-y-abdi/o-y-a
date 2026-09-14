import { $, escape, field } from './dom.mjs';
import { defaultTheme, fontFamilies } from '../theme.mjs';

export function pageInspector(page, { update, addPage, removePage, protectedPage }) {
  $('#custom-inspector').innerHTML = `<section class="inspector-section"><h2>Sidans innehåll</h2>${field('Namn i studion', 'page-name', page.name)}${field('Adress', 'page-path', page.path, { readonly: true })}${field('Titel för sök och delning', 'page-title', page.title)}${field('Beskrivning', 'page-description', page.description, { textarea: true })}<div class="inspector-actions"><button type="button" class="small-button" id="duplicate-page">Duplicera sida</button>${protectedPage ? '' : '<button type="button" class="small-button danger" id="delete-page">Ta bort sida</button>'}</div><p class="inspector-help">Klicka på text eller en form i arbetsytan för att redigera den direkt.</p></section>`;
  for (const key of ['name', 'title', 'description']) $(`#page-${key}`).addEventListener('input', event => update(key, event.target.value));
  $('#duplicate-page').addEventListener('click', addPage);
  $('#delete-page')?.addEventListener('click', removePage);
  $('#traits-panel').hidden = true;
  $('#styles-panel').hidden = true;
}

export function componentInspector(component, editor, { assets, pickImage, change, onError, extra = '' }) {
  $('#traits-panel').hidden = true;
  $('#styles-panel').hidden = false;
  const tag = component.get('tagName') ?? 'div';
  const attributes = component.getAttributes();
  const image = component.get('type') === 'image' || tag === 'img';
  const textTypes = new Set(['text', 'textnode', 'link']);
  const svg = ['svg', 'path', 'circle', 'rect', 'ellipse', 'line', 'polygon', 'polyline', 'g'].includes(tag);
  const textLike = textTypes.has(component.get('type')) && !component.find('img,svg,input,button').length;
  const label = component.getName();
  $('#selection-name').textContent = label;
  $('#selection-type').textContent = `${tag.toUpperCase()}${attributes.id ? ` · #${attributes.id}` : ''}`;
  $('#custom-inspector').innerHTML = `${extra}<section class="inspector-section"><h2>Valt element</h2>${textLike ? field('Text', 'element-text', component.getEl()?.textContent ?? '', { textarea: true }) : '<p class="inspector-help">Dra för att flytta. Använd handtagen för storlek, eller ange exakta värden nedan.</p>'}${tag === 'a' ? field('Länkadress', 'element-href', attributes.href ?? '/') : ''}${image ? `${field('Alternativtext', 'element-alt', attributes.alt ?? '')}<button type="button" class="small-button" id="choose-image">Byt bild</button>` : ''}<div class="inspector-actions" style="margin-top:12px"><button type="button" class="small-button" id="select-parent">Välj förälder</button>${component.get('copyable') === false ? '' : '<button type="button" class="small-button" id="duplicate-element">Duplicera</button>'}${component.get('removable') === false ? '' : '<button type="button" class="small-button danger" id="delete-element">Ta bort</button>'}</div>${component.get('removable') === false ? '<div class="inspector-lock">Funktionen är skyddad. Text och utseende kan redigeras; kopplingarna som får den att fungera bevaras.</div>' : ''}</section>`;
  if (svg) {
    const shape = document.createElement('section'); shape.className = 'inspector-section';
    shape.innerHTML = `<h2>Formens detaljer</h2>${['fill', 'stroke', 'stroke-width', ...(tag === 'svg' ? ['viewBox'] : [])].map(name => field({ fill: 'Fyllning', stroke: 'Kontur', 'stroke-width': 'Konturbredd', viewBox: 'Koordinatsystem' }[name], `shape-${name}`, attributes[name] ?? '')).join('')}`;
    $('#custom-inspector').append(shape);
    shape.querySelectorAll('input').forEach(input => input.addEventListener('change', event => { component.addAttributes({ [event.target.id.slice(6)]: event.target.value }); change(); }));
  }
  if (textLike) $('#element-text').value = component.getEl()?.innerText ?? component.getEl()?.textContent ?? '';
  $('#element-text')?.addEventListener('input', event => { component.components(escape(event.target.value).replaceAll('\n', '<br>')); change(); });
  const move = document.createElement('div'); move.className = 'inspector-actions';
  move.innerHTML = '<button type="button" class="small-button" id="move-up">Flytta upp</button><button type="button" class="small-button" id="move-down">Flytta ned</button>';
  $('#custom-inspector .inspector-section').append(move);
  for (const [id, offset] of [['move-up', -1], ['move-down', 1]]) $(`#${id}`).addEventListener('click', () => {
    const parent = component.parent(); if (!parent) return;
    const at = Math.max(0, Math.min(parent.components().length - 1, component.index() + offset));
    component.move(parent, { at }); change();
  });
  const advanced = document.createElement('details'); advanced.className = 'inspector-section advanced-style';
  advanced.innerHTML = `<summary>Fler stilegenskaper</summary>${field('CSS-egenskap', 'extra-property', '')}${field('Värde', 'extra-value', '')}<button type="button" class="small-button" id="apply-property">Tillämpa</button><p class="inspector-help">Till exempel aspect-ratio, object-fit eller text-shadow. Tomt värde tar bort din ändring.</p>`;
  $('#custom-inspector').append(advanced);
  $('#apply-property').addEventListener('click', () => {
    const property = $('#extra-property').value.trim(), value = $('#extra-value').value.trim();
    if (!/^(?:--)?[a-z][a-z0-9-]*$/.test(property) || value && !CSS.supports(property, value)) { onError('Ange en CSS-egenskap och ett värde som webbläsaren stöder.'); return; }
    if (value) component.addStyle({ [property]: value }); else component.removeStyle(property);
    change();
  });
  $('#element-href')?.addEventListener('change', event => {
    const value = event.target.value.trim();
    let allowed = value.startsWith('/') && !value.startsWith('//') || value.startsWith('#');
    try { allowed ||= ['https:', 'mailto:', 'tel:'].includes(new URL(value).protocol); } catch { /* Relative URLs are handled above. */ }
    if (!allowed || /[\u0000-\u0020\\]/.test(value)) { event.target.value = attributes.href ?? '/'; onError('Använd en intern länk, https, mailto eller tel.'); return; }
    component.addAttributes({ href: value }); change();
  });
  $('#element-alt')?.addEventListener('input', event => { component.addAttributes({ alt: event.target.value }); change(); });
  $('#choose-image')?.addEventListener('click', () => pickImage(asset => { component.set('src', asset.src); component.addAttributes({ src: asset.src, alt: asset.alt ?? '' }); change(); }));
  $('#select-parent').addEventListener('click', () => { if (component.parent()) editor.select(component.parent()); });
  $('#duplicate-element')?.addEventListener('click', () => {
    const copy = component.clone();
    component.parent().append(copy, { at: component.index() + 1 });
    editor.select(copy); change();
  });
  $('#delete-element')?.addEventListener('click', () => { component.remove(); change(); });
}

export function themeInspector(theme, assets, update) {
  const names = { paper: 'Papper', butter: 'Smörgult', yellow: 'Solgult', ink: 'Bläck', blue: 'Kobolt', blueDark: 'Mörk kobolt', coral: 'Korall', green: 'Grönt', muted: 'Sekundär text' };
  const fonts = [...Object.keys(fontFamilies).map(name => ({ value: name, name })), ...assets.filter(asset => asset.mime === 'font/woff2').map(asset => ({ value: `cms-font-${asset.id}`, name: asset.name }))];
  $('#custom-inspector').innerHTML = `<section class="inspector-section"><h2>Hela webbplatsen</h2><label class="inspector-field">Typsnitt<select id="theme-font">${fonts.map(font => `<option value="${escape(font.value)}" ${font.value === theme.fontFamily ? 'selected' : ''}>${escape(font.name)}</option>`).join('')}</select></label><div class="inspector-grid">${field('Grundstorlek · px', 'theme-size', theme.fontSize, { type: 'number' })}${field('Hörnradie · px', 'theme-radius', theme.radius, { type: 'number' })}</div></section><section class="inspector-section"><h2>Paletten</h2>${Object.entries(names).map(([key, name]) => `<label class="inspector-field">${name}<span class="field-color"><input type="color" data-theme-color="${key}" value="${escape(theme[key])}" aria-label="${name}"><input type="text" data-theme-hex="${key}" value="${escape(theme[key])}" aria-label="${name} hex"></span></label>`).join('')}<button type="button" class="small-button" id="reset-theme">Återgå till originalpaletten</button></section>`;
  $('#styles-panel').hidden = true;
  $('#traits-panel').hidden = true;
  $('#selection-name').textContent = 'Webbplatsens stil';
  $('#selection-type').textContent = 'Gemensamt för alla sidor';
  $('#theme-font').addEventListener('change', event => update('fontFamily', event.target.value));
  $('#theme-size').addEventListener('change', event => update('fontSize', Math.max(10, Math.min(32, Number(event.target.value)))));
  $('#theme-radius').addEventListener('change', event => update('radius', Math.max(0, Math.min(80, Number(event.target.value)))));
  document.querySelectorAll('[data-theme-color]').forEach(input => input.addEventListener('input', event => { const key = event.target.dataset.themeColor; document.querySelector(`[data-theme-hex="${key}"]`).value = event.target.value; update(key, event.target.value); }));
  document.querySelectorAll('[data-theme-hex]').forEach(input => input.addEventListener('change', event => { if (/^#[0-9a-f]{6}$/i.test(event.target.value)) { const key = event.target.dataset.themeHex; document.querySelector(`[data-theme-color="${key}"]`).value = event.target.value; update(key, event.target.value); } }));
  $('#reset-theme').addEventListener('click', () => { for (const [key, value] of Object.entries(defaultTheme)) update(key, value); themeInspector(defaultTheme, assets, update); });
}
