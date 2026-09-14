import { legacyEditorDraft } from './legacy.mjs';
import { api, upload } from './api.mjs';
import { Backups } from './backups.mjs';
import { Draft } from './draft.mjs';
import { mergeProjects } from './merge.mjs';
import { runtimeView } from './runtime.mjs';
import { $, $$, escape, toast, dialog, confirmAction, field } from './dom.mjs';
import { createEditor } from './editor.mjs';
import { pageInspector, componentInspector, themeInspector } from './inspector.mjs';
import { pageList, assetNavigation, mediaGallery, winGallery, winFields, assetDetail, historyView, defaultWinDesign } from './library.mjs';
import { themeCss, assetFontCss } from '../theme.mjs';

let draft, identity, definitions, blank, assets = [], built;
let active, selected, current = { type: 'page', id: 'home' }, lastPage = 'home';
let library = 'pages', device = matchMedia('(max-width:760px)').matches ? 'mobile' : 'desktop', zoom = 100, locked = false, saving = false, themeMode = false;
let winFilter = 'all', winQuery = '', winLimit = 60, history, reviewVersion = null, replacement = null, archivedAssets = false;
let backups, previewSequence = 0;
let mediaItems = [], mediaNext = null, mediaSequence = 0, searchTimer;
const cacheAssets = items => { assets = [...new Map([...assets, ...items].map(asset => [asset.id, asset])).values()]; };
const page = () => draft.project.pages.find(item => item.id === lastPage) ?? draft.project.pages[0];
const card = () => draft.project.cards.find(item => item.id === current.id);

function status() {
  if (!draft) return;
  $('[data-action=save]').disabled = saving || !draft.dirty && !draft.pendingSave;
  $('[data-action=revert]').disabled = saving || !draft.dirty;
  $('[data-action=undo]').disabled = saving || !draft.undoStack.length;
  $('[data-action=redo]').disabled = saving || !draft.redoStack.length;
  $('#save-status').textContent = saving ? 'Sparar och publicerar…' : draft.dirty ? 'Utkast · inte publicerat' : draft.version ? `Alla ändringar sparade · v${draft.version}` : 'Originalversion · redo att redigera';
  $('[data-action=edit]').setAttribute('aria-pressed', String(!locked));
  $('[data-action=lock]').setAttribute('aria-pressed', String(locked));
  $('[data-action=edit]').classList.toggle('is-active', !locked);
  $('[data-action=lock]').classList.toggle('is-active', locked);
  $('.right-panel').inert = locked || device === 'compare';
}

function remember() {
  backups?.schedule();
}

function change(project, group = '') { draft.change(project, group); status(); remember(); }
function updatePage(id, values, group = `page-${id}`) {
  const previous = draft.project.pages.find(item => item.id === id);
  if (!previous) return;
  const next = { ...previous, ...values };
  if (JSON.stringify(previous) === JSON.stringify(next)) return;
  change({ ...draft.project, pages: draft.project.pages.map(item => item.id === id ? next : item) }, group);
  if (values.name) renderSidebar();
}
function updateCard(id, values) {
  change({ ...draft.project, cards: draft.project.cards.map(item => item.id === id ? { ...item, ...values } : item) }, `win-${id}`);
}

function renderSidebar() {
  $$('[data-library]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.library === library)));
  if (library === 'pages') pageList(draft.project.pages, current.type === 'page' ? current.id : '', $('#library-search').value);
  else assetNavigation(current.type, assets, draft.project.cards);
  $('[data-action=add-page]').hidden = library !== 'pages';
}

function clearEditor() {
  previewSequence++;
  selected = null;
  if (active) { const previous = active; active = null; previous.destroy(); }
  $('#styles-panel').replaceChildren();
  $('#traits-panel').replaceChildren();
  $('#layers-panel').replaceChildren();
  $('#blocks-panel').replaceChildren();
}

function setInspectorTab(tab = 'design') {
  $$('[data-inspector]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.inspector === tab)));
  $('#inspector-content').hidden = tab !== 'design';
  $('#layers-panel').hidden = tab !== 'layers';
  $('#blocks-panel').hidden = tab !== 'blocks';
}

function fit() {
  if (!active || locked || device === 'compare') return;
  const width = device === 'mobile' ? 390 : 1440;
  zoom = Math.max(15, Math.min(100, Math.floor(($('#canvas-stage').clientWidth - 48) / width * 100)));
  applyZoom();
}
function applyZoom() {
  if (!active) return;
  active.editor.Canvas.setZoom(zoom);
  const width = device === 'mobile' ? 390 : 1440;
  const stage = $('#canvas-stage');
  active.editor.Canvas.setCoords(Math.max(24, (stage.clientWidth - width * zoom / 100) / 2), 24);
  stage.style.setProperty('--cms-frame-height', `${Math.max(200, (stage.clientHeight - 48) / (zoom / 100))}px`);
  $('#zoom-value').value = `${zoom}%`;
  $('#viewport-size').textContent = `${device === 'mobile' ? 390 : 1440} × auto`;
}
function applyTheme() {
  const doc = active?.editor.Canvas.getDocument();
  if (!doc) return;
  let style = doc.querySelector('#cms-theme-preview');
  if (!style) { style = doc.createElement('style'); style.id = 'cms-theme-preview'; doc.head.append(style); }
  style.textContent = themeCss(draft.project.theme);
}

function winInputEvents() {
  $('#win-text')?.addEventListener('input', event => {
    const value = event.target.value;
    updateCard(current.id, { text: value });
    const target = active?.editor.getWrapper().find('[data-card-text]')[0];
    if (target) target.components(escape(value).replaceAll('\n', '<br>'));
  });
  $('#win-flavor')?.addEventListener('change', event => updateCard(current.id, { flavor: event.target.value }));
}

function inspect(component, editor) {
  selected = component;
  if (!component) {
    $('#selection-name').textContent = current.type === 'win' ? 'En liten vinst' : page().name;
    $('#selection-type').textContent = current.type === 'win' ? 'Text, form och känsla' : 'Sidans inställningar';
    if (current.type === 'win') { $('#custom-inspector').innerHTML = winFields(card()); $('#styles-panel').hidden = true; winInputEvents(); }
    else if (themeMode) themeInspector(draft.project.theme, assets, updateTheme);
    else pageInspector(page(), { update: (key, value) => updatePage(lastPage, { [key]: value }), addPage: () => newPage(page()), removePage: deletePage, protectedPage: ['/', '/404.html'].includes(page().path) });
    return;
  }
  themeMode = false;
  componentInspector(component, editor, { assets, pickImage, change: () => active?.flush(), onError: message => toast(message, true), extra: current.type === 'win' ? winFields(card()) : '' });
  if (current.type === 'win') winInputEvents();
  $('#selection-hint').textContent = `${component.getName()} · dra, redigera eller justera till höger.`;
}

function protectComponent(component) {
  component.set({ removable: false, copyable: false, toolbar: (component.get('toolbar') ?? []).filter(item => !['tlb-clone', 'tlb-delete'].includes(item.command)) });
}

function openPage(id, hash = '') {
  clearEditor();
  const item = draft.project.pages.find(entry => entry.id === id) ?? draft.project.pages[0];
  current = { type: 'page', id: item.id }; lastPage = item.id; library = 'pages'; themeMode = false; reviewVersion = null;
  $('#special-stage').hidden = true; $('#editor').hidden = false; $('#preview-stage').hidden = true;
  $('#canvas-label').textContent = item.name; $('#canvas-path').textContent = item.path; $('#document-name').textContent = 'Portfolio';
  $('#loading-state').hidden = false;
  setInspectorTab(); renderSidebar();
  document.body.classList.remove('show-pages');
  const definition = definitions.find(entry => entry.id === item.id || entry.id === item.sourceId) ?? blank;
  active = createEditor({ page: item, cssPath: built.styles[item.template] ?? built.styles.home, assets,
    onChange: values => updatePage(item.id, values), onSelect: inspect, onAssetPick: pickImage,
    onReady: editor => {
      for (const contract of definition?.contracts ?? []) {
        const component = editor.getWrapper().find(`[data-cms-node="${contract.key}"]`)[0];
        for (let node = component; node; node = node.parent()) protectComponent(node);
      }
      editor.getWrapper().find('h1').forEach(protectComponent);
      editor.getWrapper().find('[data-memory-symbol]').forEach(symbol => symbol.find('*').forEach(node => node.set({ selectable: false, hoverable: false, editable: false, draggable: false, removable: false, copyable: false })));
      editor.clearDirtyCount();
      editor.Canvas.getDocument().addEventListener('keydown', shortcuts, true);
      applyTheme(); $('#loading-state').hidden = true; setDevice(device, false); fit(); inspect(null, editor);
      if (hash) editor.Canvas.getDocument().getElementById(hash.slice(1))?.scrollIntoView();
      if (locked || device === 'compare') preview().catch(showError);
    },
  });
  status();
}

function openWin(id) {
  clearEditor(); current = { type: 'win', id }; library = 'assets'; themeMode = false; locked = false; reviewVersion = null;
  const win = card(); if (!win) return showSpecial('wins');
  const design = win.design ?? defaultWinDesign(win);
  $('#special-stage').hidden = true; $('#editor').hidden = false; $('#preview-stage').hidden = true; $('#loading-state').hidden = false;
  $('#canvas-label').textContent = 'Liten vinst'; $('#canvas-path').textContent = win.id; setInspectorTab(); renderSidebar();
  active = createEditor({ page: { ...design, id: win.id, path: '/verkstad/', bodyClass: 'page-win' }, cssPath: built.styles.home, assets,
    onChange: values => {
      const document = new DOMParser().parseFromString(values.html, 'text/html');
      document.querySelectorAll('[data-card-text] br').forEach(br => br.replaceWith('\n'));
      const text = document.querySelector('[data-card-text]')?.textContent ?? card().text;
      updateCard(id, { text, design: values });
    }, onSelect: inspect, onAssetPick: pickImage,
    onReady: editor => {
      editor.getWrapper().find('[data-card-text]').forEach(component => { for (let node = component; node; node = node.parent()) protectComponent(node); });
      editor.Canvas.getDocument().addEventListener('keydown', shortcuts, true); $('#loading-state').hidden = true; setDevice(device === 'compare' ? 'desktop' : device, false); fit(); inspect(null, editor);
    },
  });
  status();
}

function specialBase(type) {
  clearEditor(); current = { type }; locked = false; themeMode = false; reviewVersion = null; previewSequence++;
  $('#editor').hidden = true; $('#preview-stage').hidden = true; $('#special-stage').hidden = false; $('#loading-state').hidden = true;
  $('#styles-panel').hidden = true; $('#traits-panel').hidden = true; $('#custom-inspector').innerHTML = '';
  const guides = {
    media: ['Resurser', 'Välj en bild eller ett typsnitt för att se uppgifter och redigera filens användning.'],
    wins: ['Små vinster', 'Välj en vinst för att redigera text, kategori och hela dess visuella design.'],
    history: ['Tidigare versioner', 'Granska utan att ändra utkastet. Återställ läser in en version; Save publicerar den.'],
    runtime: ['Funktionstexter', 'Ändra svaren som webbplatsen visar. Behåll dynamiska värden inom klamrar.'],
    asset: ['Filens uppgifter', 'Bild, typsnitt och användning'],
  };
  $('#selection-name').textContent = guides[type][0]; $('#selection-type').textContent = 'Portfolio Studio';
  $('#custom-inspector').innerHTML = `<section class="inspector-section"><p>${guides[type][1]}</p></section>`;
  $('#canvas-path').textContent = ''; $('#viewport-size').textContent = 'BIBLIOTEK'; $('#selection-hint').textContent = 'Allt har sin plats. Även nästa idé.';
  setInspectorTab(); status();
}

async function showSpecial(type) {
  specialBase(type);
  if (type === 'media') { library = 'assets'; $('#canvas-label').textContent = 'Resurser'; await loadMedia(); }
  if (type === 'wins') { library = 'assets'; $('#canvas-label').textContent = 'Små vinster'; renderWins(); }
  if (type === 'history') {
    $('#canvas-label').textContent = 'Historik'; $('#special-stage').innerHTML = '<div class="empty-state" role="status">Hämtar tidigare kapitel…</div>';
    history = await api('history');
    if (current.type === 'history') historyView(history, draft.version);
  }
  if (type === 'runtime') {
    $('#canvas-label').textContent = 'Lekarnas texter';
    runtimeView(draft.project.runtime);
  }
  renderSidebar();
}

async function loadMedia(more = false) {
  const sequence = ++mediaSequence;
  const query = $('#library-search').value;
  const parameters = new URLSearchParams({ q: query, archived: archivedAssets ? '1' : '0', ...(more && mediaNext ? { cursor: mediaNext } : {}) });
  const result = await api('assets?' + parameters);
  if (sequence !== mediaSequence || current.type !== 'media') return;
  cacheAssets(result.items);
  mediaItems = more ? [...new Map([...mediaItems, ...result.items].map(asset => [asset.id, asset])).values()] : result.items;
  mediaNext = result.next;
  mediaGallery([...assets.filter(asset => asset.builtin), ...mediaItems], query, archivedAssets);
  if (mediaNext) $('#special-stage').insertAdjacentHTML('beforeend', '<button type="button" class="small-button" data-action="more-media" style="margin-top:24px">Visa fler filer</button>');
}

function renderWins() {
  winGallery(draft.project.cards, winFilter, winQuery, winLimit);
  $('#win-search').addEventListener('input', event => {
    const position = event.target.selectionStart;
    winQuery = event.target.value; winLimit = 60; renderWins();
    $('#win-search').focus(); if ($('#win-search').type === 'text') $('#win-search').setSelectionRange(position, position);
  });
}

async function showAsset(id) {
  specialBase('asset'); current.id = id; library = 'assets';
  const item = assets.find(asset => asset.id === id); if (!item) return;
  assetDetail(item); $('#canvas-label').textContent = 'Resurs'; $('#selection-name').textContent = 'Filens uppgifter'; $('#selection-type').textContent = item.mime; renderSidebar();
  const view = current;
  try {
    const { counts } = await api('resource-usage', { project: draft.project });
    if (current === view) $('#asset-usage').textContent = `${counts[item.src] ?? 0} referenser i aktuellt utkast. Äldre versioners filer bevaras.`;
  } catch (error) { if (current === view) $('#asset-usage').textContent = `Användningen kunde inte kontrolleras: ${error.message}`; }
}

function pickImage(select) {
  const images = assets.filter(asset => asset.mime.startsWith('image/') && !asset.archived);
  dialog(`<span class="dialog-eyebrow">FRÅN RESURSRUMMET</span><h2>En bild säger hej.</h2><p>Välj en bild. Fler kan laddas upp i resursbiblioteket.</p><div class="asset-grid">${images.map(asset => `<button type="button" class="asset-card" data-pick-image="${escape(asset.id)}"><div class="asset-image"><img src="${escape(asset.src)}" alt="${escape(asset.alt ?? '')}"></div><div class="asset-card-meta"><strong>${escape(asset.name)}</strong></div></button>`).join('')}</div><div class="dialog-buttons"><button type="button" class="small-button" data-action="close-dialog">Stäng</button></div>`);
  $('#dialog-content').querySelectorAll('[data-pick-image]').forEach(button => button.addEventListener('click', () => { select(assets.find(asset => asset.id === button.dataset.pickImage)); $('#studio-dialog').close(); }));
}

function updateTheme(key, value) { change({ ...draft.project, theme: { ...draft.project.theme, [key]: value } }, 'theme'); applyTheme(); }
function showTheme() { if (current.type !== 'page') openPage(lastPage); themeMode = true; active?.editor.select(); themeInspector(draft.project.theme, assets, updateTheme); setInspectorTab(); }

function setDevice(value, render = true) {
  device = value;
  status();
  $$('[data-device]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.device === value)));
  if (active && value !== 'compare') active.editor.setDevice(value === 'mobile' ? 'Mobil' : 'Dator');
  fit();
  if (render && (locked || value === 'compare')) preview().catch(showError);
  else if (render) { previewSequence++; $('#preview-stage').hidden = true; $('#editor').hidden = false; }
}

function editView() {
  locked = false; previewSequence++;
  if (!active) openPage(lastPage);
  if (device === 'compare') setDevice('desktop', false);
  $('#preview-stage').hidden = true; $('#editor').hidden = false; status(); fit();
}

async function preview(project = null, id = lastPage, label = '') {
  active?.flush();
  project ??= draft.project;
  const seq = ++previewSequence;
  const result = await api('preview', { project, ...(current.type === 'win' ? { cardId: current.id } : { pageId: id }) });
  if (seq !== previewSequence) return;
  $('#editor').hidden = true; $('#special-stage').hidden = true; $('#preview-stage').hidden = false;
  $('#preview-stage').replaceChildren();
  const sizes = device === 'compare' ? [1440, 390] : [device === 'mobile' ? 390 : 1440];
  const available = $('#canvas-stage').clientWidth - 48;
  for (const width of sizes) {
    const allocation = sizes.length === 2 ? available * (width === 1440 ? .66 : .3) : available;
    const scale = Math.min(1, allocation / width);
    const height = width === 390 ? 844 : 1000;
    const wrapper = document.createElement('div'); wrapper.className = 'preview-frame'; wrapper.style.width = `${Math.floor(width * scale)}px`; wrapper.style.height = `${Math.floor(height * scale) + 28}px`;
    const title = document.createElement('div'); title.className = 'preview-frame-label'; title.textContent = `${label || 'INTERAKTIV VY'} · ${width === 390 ? 'MOBIL' : 'DATOR'} · ${width} PX`;
    const frame = document.createElement('iframe'); frame.title = `${label || 'Förhandsvisning'} ${width === 390 ? 'mobil' : 'dator'}`; frame.setAttribute('data-cms-preview-frame', ''); frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups'); frame.style.width = `${width}px`; frame.style.height = `${height}px`; frame.style.transform = `scale(${scale})`; frame.srcdoc = result.html;
    wrapper.append(title, frame); $('#preview-stage').append(wrapper);
  }
  $('#viewport-size').textContent = sizes.join(' + ') + ' px';
  $('#selection-hint').textContent = label ? `${label}. Ditt aktuella utkast är orört.` : 'Låst vy. Prova sidan utan att flytta på något.';
}

async function save() {
  active?.flush();
  if (saving || !draft.dirty && !draft.pendingSave) return;
  saving = true; status();
  try {
    const intent = draft.project;
    for (let attempt = 0; attempt < 2; attempt++) {
      const pending = draft.beginSave();
      await backups.persist();
      const result = await api('save', pending);
      draft.acknowledge(pending.project, result.version);
      if (!draft.dirty || pending.project === intent || draft.project !== intent) break;
    }
    toast(draft.dirty ? 'Versionen sparades. Dina nyare ändringar finns kvar som utkast.' : `Version ${draft.version} är sparad och publicerad.`);
  } catch (error) {
    draft.rejectSave(error);
    showError(error);
  } finally { await backups.persist(); saving = false; status(); }
}

function exportDraft() {
  backups.export();
}

function showError(error) {
  toast(error.message ?? 'Åtgärden kunde inte slutföras. Ditt utkast finns kvar.', true);
  if (error.status === 409) dialog(`<span class="dialog-eyebrow">TVÅ FLIKAR. ETT MEDVETET VAL.</span><h2>En nyare version finns.</h2><p>Ditt utkast har bevarats. Inga ändringar skrevs över. Exportera en reservkopia, granska historiken eller behåll utkastet och fortsätt arbeta.</p><div class="dialog-buttons"><button type="button" class="small-button" data-action="export-draft">Exportera utkast</button><button type="button" class="small-button" data-action="history">Granska historik</button><button type="button" class="small-button primary" data-action="reconcile">Sammanför utkasten</button><button type="button" class="small-button" data-action="close-dialog">Stäng</button></div>`);
  if (error.status === 401 || error.status === 403 || error.status === 0) dialog(`<span class="dialog-eyebrow">UTKASTET FINNS KVAR</span><h2>Kontakten behöver förnyas.</h2><p>${escape(error.message)} Logga in i en ny flik om sessionen har gått ut, återvänd hit och försök spara igen.</p><div class="dialog-buttons"><button type="button" class="small-button" data-action="export-draft">Exportera utkast</button><a class="small-button primary" href="/admin/" target="_blank" rel="noopener noreferrer">Logga in igen ↗</a><button type="button" class="small-button" data-action="close-dialog">Stäng</button></div>`);
}

async function reconcile() {
  $('#studio-dialog').close(); active?.flush();
  const state = await api('state');
  active?.flush();
  const snapshot = draft.project;
  const result = mergeProjects(draft.saved, draft.project, state.project);
  if (result.conflicts.length && !await confirmAction({ title: 'Välj dina ändringar vid konflikt?', message: `Båda flikarna har ändrat samma innehåll: ${result.conflicts.join(', ')}. Dina versioner av dessa delar behålls. Övriga ändringar sammanförs. Granska utkastet före Save.`, action: 'Behåll mina vid konflikt' })) return;
  if (!unchangedSince(snapshot)) return;
  clearEditor(); draft = new Draft(state.project, state.version); change(result.project); assets = state.assets; openPage(lastPage); status(); remember();
  toast('Utkasten är sammanförda. Granska ändringarna och välj Save.');
}

async function revert() {
  active?.flush();
  const snapshot = draft.project;
  if (!await confirmAction({ title: 'Tillbaka till det sparade?', message: 'Osparade ändringar i detta utkast försvinner. Publicerad webbplats och historik påverkas inte.', action: 'Revert', danger: true })) return;
  const state = await api('state');
  if (!unchangedSince(snapshot)) return;
  clearEditor(); draft = new Draft(state.project, state.version); assets = state.assets; openPage(lastPage); status(); await backups.persist();
}

async function restore(version) {
  active?.flush();
  const snapshot = draft.project;
  if (!await confirmAction({ title: `Återställ version ${version}?`, message: 'Versionen läses in som utkast. Nuvarande utkast ersätts. Webbplatsen ändras först när du väljer Save; all historik bevaras.', action: 'Läs in utkast' })) return;
  const state = await api(`revision/${version}`);
  if (!unchangedSince(snapshot)) return;
  clearEditor(); change(state.project); draft.pendingSave = null; openPage(lastPage); toast(`Version ${version} finns nu som utkast. Save publicerar den på nytt.`);
}

function unchangedSince(snapshot) {
  active?.flush();
  if (draft.project === snapshot) return true;
  toast('Utkastet ändrades medan innehållet hämtades. Dina senaste ändringar är kvar. Försök åtgärden igen.', true);
  return false;
}

function newPage(source) {
  active?.flush();
  dialog(`<span class="dialog-eyebrow">PLATS FÖR NÅGOT NYTT</span><h2>${source ? 'En ny version av en idé.' : 'Din nästa sida.'}</h2>${field('Sidnamn', 'new-page-name', source ? `${source.name} kopia` : '')}${field('Adress, till exempel /ny-sida/', 'new-page-path', '')}<p id="page-dialog-error" class="inline-error" hidden></p><div class="dialog-buttons"><button type="button" class="small-button" data-action="close-dialog">Avbryt</button><button type="button" class="small-button primary" id="create-page">Skapa sida</button></div>`);
  $('#create-page').addEventListener('click', () => {
    const name = $('#new-page-name').value.trim(), path = $('#new-page-path').value.trim();
    if (!name || !/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+$/.test(path) || /^\/(admin|api|login|assets|media|data|cdn-cgi|cms-public)\//.test(path) || draft.project.pages.some(item => item.path === path)) { $('#page-dialog-error').hidden = false; $('#page-dialog-error').textContent = 'Ange ett namn och en ledig adress med avslutande snedstreck.'; return; }
    const id = crypto.randomUUID();
    const content = source ?? blank;
    const created = { ...content, id, path, sourceId: content.sourceId ?? content.id, name, title: `${name} | Omar Yusuf`, description: `Tankar, idéer och nyfikenhet från Omar Yusuf. ${name}.`, noindex: false };
    delete created.contracts;
    change({ ...draft.project, pages: [...draft.project.pages, created] }); $('#studio-dialog').close(); openPage(id);
  });
}

async function deletePage() {
  const item = page(); if (['/', '/404.html'].includes(item.path)) return;
  if (!await confirmAction({ title: `Ta bort ${item.name}?`, message: 'Sidan tas bort ur utkastet. Save publicerar ändringen. Tidigare versioner kan återställas från historiken.', action: 'Ta bort sida', danger: true })) return;
  clearEditor(); change({ ...draft.project, pages: draft.project.pages.filter(entry => entry.id !== item.id) }); openPage('home');
}

async function exportWin() {
  active?.flush();
  const id = current.id;
  const { project } = await api('validate', { project: draft.project });
  const win = project.cards.find(item => item.id === id);
  if (!win) return;
  const { renderWin, exportWin: exportCard, disposeWin } = await import('../../client/win.mjs');
  const host = document.createElement('div'), fonts = document.createElement('style');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:600px;pointer-events:none';
  fonts.textContent = assetFontCss(assets); document.head.append(fonts); document.body.append(host);
  try {
    renderWin(host, win);
    const url = URL.createObjectURL(await exportCard(host));
    const link = document.createElement('a'); link.href = url; link.download = `en-liten-vinst-${id}.png`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Förhandsbilden är skapad från vinstens riktiga design.');
  } finally { disposeWin(host); host.remove(); fonts.remove(); }
}

async function submitAsset(item, patch) {
  try {
    const updated = await api(`assets/${item.id}`, { ...patch, baseVersion: item.version });
    assets = assets.map(asset => asset.id === item.id ? updated : asset);
    toast('Filens uppgifter är sparade.');
    return patch.archived === true ? showSpecial('media') : showAsset(updated.id);
  } catch (error) {
    if (error.status !== 409 || !error.details?.asset) throw error;
    const latest = error.details.asset;
    dialog(`<span class="dialog-eyebrow">FILEN HAR NYARE UPPGIFTER</span><h2>Granska innan du skriver över.</h2><p>Ditt formulär finns kvar. Nu sparat: ${escape(latest.name)}, ${latest.archived ? 'arkiverad' : 'i biblioteket'}. Alternativtext: ${escape(latest.alt || '(tom)')}.</p><p>Dina val: ${escape(JSON.stringify(patch))}</p><div class="dialog-buttons"><button class="small-button" data-action="close-dialog">Behåll formuläret</button><button class="small-button" id="refresh-asset">Hämta aktuella uppgifter</button><button class="small-button primary" id="retry-asset">Tillämpa mina val</button></div>`);
    $('#refresh-asset').onclick = () => { assets = assets.map(asset => asset.id === item.id ? latest : asset); $('#studio-dialog').close(); showAsset(item.id); };
    $('#retry-asset').onclick = () => { $('#studio-dialog').close(); submitAsset(latest, patch).catch(showError); };
  }
}

async function perform(action) {
  if (!draft && action !== 'close-dialog') return;
  if (action === 'close-dialog') return $('#studio-dialog').close();
  if (action === 'save') return save();
  if (action === 'revert') return revert();
  if (action === 'reconcile') return reconcile();
  if (action === 'history' || action === 'restore') { $('#studio-dialog').close(); if (action === 'restore' && reviewVersion !== null) return restore(reviewVersion); return showSpecial('history'); }
  if (action === 'edit') return editView();
  if (action === 'lock') { if (locked) return editView(); if (!active) openPage(lastPage); locked = true; status(); return preview(); }
  if (action === 'undo' || action === 'redo') { active?.flush(); if (draft[action]()) { const view = { ...current }; clearEditor(); if (view.type === 'win') openWin(view.id); else openPage(lastPage); status(); remember(); } return; }
  if (action === 'collapse-left' || action === 'expand-left') { document.body.classList.toggle('is-left-collapsed', action === 'collapse-left'); return fit(); }
  if (action === 'toggle-pages') { document.body.classList.remove('show-properties'); document.body.classList.toggle('show-pages'); return; }
  if (action === 'toggle-properties') { document.body.classList.remove('show-pages'); document.body.classList.toggle('show-properties'); return; }
  if (action === 'zoom-in' || action === 'zoom-out') { zoom = Math.max(15, Math.min(150, zoom + (action === 'zoom-in' ? 10 : -10))); return applyZoom(); }
  if (action === 'fit') return fit();
  if (action === 'theme') return showTheme();
  if (action === 'runtime') return showSpecial('runtime');
  if (action === 'add-page') return newPage();
  if (action === 'upload') { replacement = null; return $('#file-input').click(); }
  if (action === 'toggle-archived') { archivedAssets = !archivedAssets; return showSpecial('media'); }
  if (action === 'more-media') return loadMedia(true);
  if (action === 'replace-asset') { replacement = assets.find(asset => asset.id === current.id); return $('#file-input').click(); }
  if (['save-asset', 'archive-asset', 'unarchive-asset'].includes(action)) {
    const item = assets.find(asset => asset.id === current.id);
    if (action === 'archive-asset' && !await confirmAction({ title: 'Arkivera filen?', message: 'Filen döljs i biblioteket. Publicerade sidor och historiska versioner behåller den.', action: 'Arkivera' })) return;
    const patch = action === 'save-asset' ? Object.fromEntries([['name', $('#asset-name').value], ['alt', $('#asset-alt').value]].filter(([key, value]) => value !== item[key])) : { archived: action === 'archive-asset' };
    if (!Object.keys(patch).length) return toast('Filens uppgifter är redan sparade.');
    return submitAsset(item, patch);
  }
  if (action === 'new-win') { const id = `win-${crypto.randomUUID()}`; change({ ...draft.project, cards: [...draft.project.cards, { id, flavor: 'kind', text: 'Du behöver inte vara färdig för att vara på väg.' }] }); return openWin(id); }
  if (action === 'more-wins') { const top = $('#special-stage').scrollTop; winLimit += 60; renderWins(); $('#special-stage').scrollTop = top; return; }
  if (action === 'export-win') return exportWin();
  if (action === 'export-draft') return exportDraft();
  if (action === 'backups') return backups.show();
}

function shortcuts(event) {
  if (!(event.metaKey || event.ctrlKey)) return;
  if (event.key.toLowerCase() === 's') { event.preventDefault(); event.stopPropagation(); save().catch(showError); }
  if (event.key.toLowerCase() === 'z' && !event.target.closest('input,textarea,[contenteditable=true]')) { event.preventDefault(); event.stopPropagation(); perform(event.shiftKey ? 'redo' : 'undo').catch(showError); }
}

document.addEventListener('click', event => {
  const button = event.target.closest('button,a[data-action]'); if (!button) return;
  Promise.resolve().then(async () => {
    if (button.dataset.action) return perform(button.dataset.action);
    if (button.dataset.pageId) return openPage(button.dataset.pageId);
    if (button.dataset.library) { library = button.dataset.library; $('#library-search').value = ''; renderSidebar(); if (library === 'assets') return showSpecial('media'); if (current.type !== 'page') return openPage(lastPage); }
    if (button.dataset.device) return setDevice(button.dataset.device);
    if (button.dataset.inspector) return setInspectorTab(button.dataset.inspector);
    if (button.dataset.special) return showSpecial(button.dataset.special);
    if (button.dataset.assetId) return showAsset(button.dataset.assetId);
    if (button.dataset.winId) return openWin(button.dataset.winId);
    if (button.dataset.winFilter) { winFilter = button.dataset.winFilter; winLimit = 60; return renderWins(); }
    if (button.dataset.restoreVersion) return restore(Number(button.dataset.restoreVersion));
    if (button.dataset.reviewVersion) {
      reviewVersion = Number(button.dataset.reviewVersion);
      const selectedVersion = reviewVersion, view = current;
      const historical = await api(`revision/${reviewVersion}`);
      if (current !== view || reviewVersion !== selectedVersion) return;
      return preview(historical.project, historical.project.pages.some(item => item.id === lastPage) ? lastPage : historical.project.pages[0].id, `VERSION ${reviewVersion}`);
    }
    if (button.dataset.moreHistory) { const older = await api(`history?before=${button.dataset.moreHistory}`); history = { items: [...history.items, ...older.items], next: older.next }; return historyView(history, draft.version); }
  }).catch(showError);
});
document.addEventListener('input', event => { if (event.target.dataset.copyKey) change({ ...draft.project, runtime: { ...draft.project.runtime, [event.target.dataset.copyKey]: event.target.value } }, `copy-${event.target.dataset.copyKey}`); });
document.addEventListener('keydown', shortcuts, true);
document.addEventListener('keydown', event => { if (event.key === 'Escape') document.body.classList.remove('show-pages', 'show-properties'); });
$('#library-search').addEventListener('input', () => { renderSidebar(); clearTimeout(searchTimer); if (current.type === 'media') searchTimer = setTimeout(() => loadMedia().catch(showError), 200); });
$('#file-input').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  const replacing = replacement; replacement = null;
  toast('Laddar upp filen…');
  try {
    const asset = await upload(file, crypto.randomUUID()); assets = [...assets, asset];
    if (replacing) {
      if (replacing.mime.startsWith('image/') !== asset.mime.startsWith('image/')) throw new Error('Filen laddades upp, men bild och typsnitt kan inte ersätta varandra.');
      active?.flush();
      const before = draft.project;
      const result = await api('replace-resource', { project: before, fromId: replacing.id, toId: asset.id });
      if (!unchangedSince(before)) { toast('Filen är uppladdad. Utkastet ändrades under ersättningen; välj ersättning igen.', true); return; }
      if (result.replacements) { change(result.project); cacheAssets(result.assets); toast('Filens referenser är ersatta i utkastet. Save uppdaterar webbplatsen.'); }
      else toast('Filen är uppladdad. Den gamla filen används inte i utkastet, så inget innehåll ersattes.');
    } else toast('Filen finns i biblioteket. Den blir offentlig när den används i en sparad sida.');
    showAsset(asset.id);
  } catch (error) { showError(error); }
  finally { event.target.value = ''; }
});
window.addEventListener('beforeunload', event => { if (draft?.dirty || draft?.pendingSave) { event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.data?.type !== 'oy-cms-navigate' || !$$('#preview-stage iframe').some(frame => frame.contentWindow === event.source)) return;
  const target = draft.project.pages.find(item => item.path === event.data.path);
  if (target) openPage(target.id, event.data.hash ?? '');
});
new ResizeObserver(() => { if (active && !locked && device !== 'compare') fit(); }).observe($('#canvas-stage'));

async function boot() {
  const state = await api('state');
  draft = new Draft(state.project, state.version); identity = state.identity; definitions = state.definitions; blank = state.blank; assets = state.assets; built = state.built;
  backups = new Backups(identity.email, {
    snapshot: () => draft,
    flush: () => active?.flush(),
    install: ({ project, pendingSave, base, version }) => {
      clearEditor(); draft = new Draft(base, version); draft.change(project); draft.pendingSave = pendingSave;
      openPage(lastPage); status();
    },
  });
  await backups.start();
  const legacy = legacyEditorDraft(state.project);
  if (legacy) {
    const original = { project: state.project, version: state.version, pendingSave: null };
    draft.change(legacy);
    $('#legacy-editor-note').hidden = false;
    $('#export-legacy-editor').onclick = () => backups.export(original);
  }
  $('#environment-badge').hidden = state.environment !== 'staging';
  $('.owner-avatar').title = `Inloggad som ${identity.email}. Logga ut.`;
  openPage(draft.project.pages[0].id); status();
  await backups.offer();
}

boot().catch(error => {
  if (draft) { showError(error); return; }
  $('#loading-state').hidden = false;
  $('#loading-state').innerHTML = `<h1>Studion kunde inte öppnas.</h1><p>${escape(error.message)}</p><a class="small-button primary" href="/admin/">Försök logga in igen ↗</a>`;
});
