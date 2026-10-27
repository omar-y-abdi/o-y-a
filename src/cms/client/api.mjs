import { dialog, escape } from './dom.mjs';
import { chooseFrameClient } from './frame-project.mjs';

export class ApiError extends Error {
  constructor(message, status = 0, details) { super(message); this.status = status; this.details = details; }
  get definitive() { return this.status >= 400 && this.status < 500 && this.status !== 408 && !this.details?.saveIdentityUnverified; }
}

export async function send(url, { headers, ...init }, failure) {
  let response;
  try {
    response = await fetch(url, { ...init, credentials: 'same-origin', redirect: 'error', headers: { ...headers, 'X-Requested-With': 'XMLHttpRequest' } });
  } catch { throw new ApiError('Anslutningen bröts. Försök spara igen; samma version sparas inte två gånger.'); }
  let result;
  try { result = await response.json(); }
  catch {
    // A 2xx whose body broke leaves the outcome unknown: same as a lost connection.
    if (response.ok) throw new ApiError('Anslutningen bröts. Försök spara igen; samma version sparas inte två gånger.');
    throw new ApiError([401, 403].includes(response.status) ? 'Inloggningen har gått ut. Ditt utkast finns kvar.' : 'Svaret kunde inte bekräftas. Ditt utkast finns kvar.', response.status);
  }
  if (!response.ok) throw new ApiError(result.error ?? failure, response.status, result.details);
  return result;
}

const request = (path, data) => send(`/admin/api/${path}`, data === undefined ? { method: 'GET' } : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CMS-Request': '1' }, body: JSON.stringify(data) }, 'Åtgärden kunde inte slutföras.');

async function repairSharedContent(state, publish = true) {
  const conflicts = state.project?.frameConflicts;
  if (!Array.isArray(conflicts) || !conflicts.length) return state;
  const modal = document.querySelector('#studio-dialog');
  const groups = conflicts.map((conflict, groupIndex) => {
    const selected = Math.max(0, conflict.options.findIndex(option => JSON.stringify(option.value) === JSON.stringify(state.project.frame)));
    const title = conflict.key === 'footer.tagline' ? 'Sidfotens gemensamma text' : 'Webbplatsens gemensamma sidram';
    const options = conflict.options.map((option, optionIndex) => `<label class="inspector-field"><span><input type="radio" name="shared-conflict-${groupIndex}" value="${optionIndex}" ${optionIndex === selected ? 'checked' : ''}> <strong>${escape(option.label)}</strong></span><small>Används på: ${escape(option.pages.join(', '))}</small></label>`).join('');
    return `<fieldset class="inspector-section"><legend>${escape(title)}</legend>${options}</fieldset>`;
  }).join('');

  return new Promise(resolve => {
    dialog(`<span class="dialog-eyebrow">GEMENSAMT INNEHÅLL BEHÖVER ETT VAL</span><h2>Sidramen skiljer sig mellan sidor.</h2><p>Den äldre versionen innehåller flera varianter. Välj vilken som ska gälla överallt. ${publish ? 'Valet sparas som en ny version; den gamla versionen finns kvar i historiken.' : 'Valet läses in som utkast. Save publicerar det.'}</p><form data-shared-content-repair>${groups}<p data-shared-content-error role="alert"></p><div class="dialog-buttons"><button type="submit" class="small-button primary">Använd valt innehåll på alla sidor</button></div></form>`);
    const form = modal.querySelector('[data-shared-content-repair]');
    const errorNode = modal.querySelector('[data-shared-content-error]');
    const submit = form.querySelector('button[type=submit]');
    const fieldsets = [...form.querySelectorAll('fieldset')];
    let attempt = null, saved = false, conflicted = false;
    const preventCancel = event => event.preventDefault();
    const cleanup = () => modal.removeEventListener('cancel', preventCancel);
    modal.addEventListener('cancel', preventCancel);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submit.disabled) return;
      submit.disabled = true;
      submit.textContent = 'Samordnar…';
      errorNode.textContent = '';
      try {
        if (!attempt) {
          const choices = {};
          for (const [index, conflict] of conflicts.entries()) {
            const chosen = form.querySelector(`input[name="shared-conflict-${index}"]:checked`);
            if (!chosen || !conflict.options[Number(chosen.value)]) throw new Error('Välj en variant för varje gemensam del.');
            choices[conflict.key] = Number(chosen.value);
          }
          attempt = { project: chooseFrameClient(state.project, choices), baseVersion: state.version, requestId: crypto.randomUUID() };
        }
        // A lost response must replay exactly the same choice and identity.
        // A confirmed Save, or a definitive head conflict, only needs a fresh read.
        for (const fieldset of fieldsets) fieldset.disabled = true;
        if (publish && !saved && !conflicted) {
          try { await request('save', attempt); saved = true; }
          catch (error) {
            if (error.definitive) {
              if (error.status === 409) conflicted = true;
              else attempt = null;
            }
            throw error;
          }
        }
        const fresh = publish ? await request('state') : { ...state, project: attempt.project };
        cleanup();
        modal.close();
        resolve(fresh.project?.frameConflicts?.length ? await repairSharedContent(fresh, publish) : fresh);
      } catch (error) {
        for (const fieldset of fieldsets) fieldset.disabled = Boolean(attempt);
        submit.disabled = false;
        submit.textContent = saved || conflicted ? 'Läs in den aktuella versionen' : attempt ? 'Försök spara samma val igen' : 'Använd valt innehåll på alla sidor';
        errorNode.textContent = error.message;
      }
    });
  });
}

export async function api(path, data, { choose = true } = {}) {
  const result = await request(path, data);
  if (choose && result.project?.frameConflicts?.length) return repairSharedContent(result, path === 'state' && data === undefined);
  return result;
}

export const upload = (file, id) => send('/admin/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-CMS-Request': '1', 'X-CMS-Upload-Id': id, 'X-CMS-Filename': encodeURIComponent(file.name) }, body: file }, 'Filen kunde inte laddas upp.');
