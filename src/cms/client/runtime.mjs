import { defaultCopy } from '../../client/copy.mjs';
import { $, escape } from './dom.mjs';
const groups = { nav: 'Menyn', motion: 'Rörelser', privacy: 'Dataval och integritet', fold: 'Furl-demonstrationen', error: 'Om något inte startar', joy: 'Glädjemaskinen och bubblorna', memory: 'Memory', bubble: 'Bubblornas kommentarer', fika: 'Fikapausen', contact: 'Kontaktformuläret' };

export function runtimeView(copy) {
  $('#special-stage').innerHTML = '<div class="special-heading"><div><p class="special-kicker">NÄR WEBBPLATSEN SVARAR</p><h1>Lite röst i maskinen<span style="color:#234ce7">.</span></h1><p>Från första knapptrycket till sista bubblan. Ge svaren din egen röst.</p></div></div><div class="copy-search"><input type="search" id="copy-search" aria-label="Sök funktionstexter" placeholder="Sök ett ord eller ett meddelande…"></div><div id="copy-groups"></div>';
  function render(query = '') {
    $('#copy-groups').innerHTML = Object.entries(groups).map(([group, title]) => {
      const rows = Object.entries(copy).filter(([key, value]) => key.split('.')[1] === group && `${value} ${defaultCopy[key]} ${title}`.toLowerCase().includes(query.toLowerCase()));
      if (!rows.length) return '';
      return `<details class="copy-group" ${query || group === 'joy' ? 'open' : ''}><summary>${title}<span>${rows.length} texter</span></summary><div class="copy-grid">${rows.map(([key, value]) => {
        const original = defaultCopy[key] ?? value;
        const variables = [...new Set([...original.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(match => match[0]))];
        return `<div class="copy-row"><label for="copy-${escape(key)}">${escape(original)}</label><textarea id="copy-${escape(key)}" data-copy-key="${escape(key)}">${escape(value)}</textarea>${variables.length ? `<small>Behåll ${variables.map(escape).join(', ')}. Webbplatsen fyller i värdet.</small>` : ''}</div>`;
      }).join('')}</div></details>`;
    }).join('') || '<p class="inspector-help">Ingen text matchar sökningen.</p>';
  }
  render();
  $('#copy-search').addEventListener('input', event => render(event.target.value));
  // Keep the search view in sync with edits without replacing a focused field.
  $('#copy-groups').addEventListener('input', event => { if (event.target.dataset.copyKey) copy = { ...copy, [event.target.dataset.copyKey]: event.target.value }; });
}
