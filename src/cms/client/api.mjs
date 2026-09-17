import { dialog, escape } from './dom.mjs';
import { applySharedContentClient } from './shared-project.mjs';

export class ApiError extends Error {
  constructor(message, status = 0, details) { super(message); this.status = status; this.details = details; }
  get definitive() { return this.status >= 400 && this.status < 500 && this.status !== 408; }
}

async function request(path, data) {
  let response;
  try {
    response = await fetch(`/admin/api/${path}`, {
      method: data === undefined ? 'GET' : 'POST',
      credentials: 'same-origin', redirect: 'error',
      headers: data === undefined ? {} : { 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
  } catch { throw new ApiError('Kontakten bröts. Ditt utkast finns kvar. Kontrollera anslutningen eller logga in igen.'); }
  let result;
  try { result = await response.json(); }
  catch { throw new ApiError('Svaret kunde inte bekräftas. Ditt utkast finns kvar.', response.status); }
  if (!response.ok) throw new ApiError(result.error ?? 'Åtgärden kunde inte slutföras.', response.status, result.details);
  return result;
}

async function repairSharedContent(state) {
  const conflicts = state.project?.sharedContentConflicts;
  if (!Array.isArray(conflicts) || !conflicts.length) return state;
  const modal = document.querySelector('#studio-dialog');
  const groups = conflicts.map((conflict, groupIndex) => {
    const selected = Math.max(0, conflict.options.findIndex(option => option.value === state.project.sharedContent?.[conflict.key]));
    const title = conflict.key === 'footer.tagline' ? 'Sidfotens gemensamma text' : conflict.key;
    const options = conflict.options.map((option, optionIndex) => `<label class="inspector-field"><span><input type="radio" name="shared-conflict-${groupIndex}" value="${optionIndex}" ${optionIndex === selected ? 'checked' : ''}> <strong>${escape(option.label)}</strong></span><small>Används på: ${escape(option.pages.join(', '))}</small></label>`).join('');
    return `<fieldset class="inspector-section"><legend>${escape(title)}</legend>${options}</fieldset>`;
  }).join('');

  return new Promise(resolve => {
    dialog(`<span class="dialog-eyebrow">GEMENSAM TEXT BEHÖVER ETT VAL</span><h2>Sidfoten skiljer sig mellan sidor.</h2><p>Den sparade versionen innehåller flera varianter av samma gemensamma text. Välj vilken variant som ska gälla överallt. Valet sparas som en ny version; den gamla versionen finns kvar i historiken.</p><form data-shared-content-repair>${groups}<p data-shared-content-error role="alert"></p><div class="dialog-buttons"><button type="submit" class="small-button primary">Använd vald text på alla sidor</button></div></form>`);
    const form = modal.querySelector('[data-shared-content-repair]');
    const errorNode = modal.querySelector('[data-shared-content-error]');
    const submit = form.querySelector('button[type=submit]');
    const preventCancel = event => event.preventDefault();
    const cleanup = () => modal.removeEventListener('cancel', preventCancel);
    modal.addEventListener('cancel', preventCancel);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      submit.disabled = true;
      submit.textContent = 'Samordnar…';
      errorNode.textContent = '';
      let project = state.project;
      for (const [index, conflict] of conflicts.entries()) {
        const chosen = form.querySelector(`input[name="shared-conflict-${index}"]:checked`);
        const option = conflict.options[Number(chosen?.value)];
        if (!option) {
          submit.disabled = false;
          submit.textContent = 'Använd vald text på alla sidor';
          errorNode.textContent = 'Välj en variant för varje gemensam text.';
          return;
        }
        project = applySharedContentClient(project, conflict.key, option.value);
      }
      try {
        await request('save', { project, baseVersion: state.version, requestId: crypto.randomUUID() });
        const fresh = await request('state');
        cleanup();
        modal.close();
        resolve(fresh.project?.sharedContentConflicts?.length ? await repairSharedContent(fresh) : fresh);
      } catch (error) {
        submit.disabled = false;
        submit.textContent = 'Använd vald text på alla sidor';
        errorNode.textContent = error.message;
      }
    });
  });
}

export async function api(path, data) {
  const result = await request(path, data);
  if (path === 'state' && data === undefined && result.project?.sharedContentConflicts?.length) return repairSharedContent(result);
  return result;
}

export async function upload(file, id) {
  const response = await fetch('/admin/api/upload', { method: 'POST', credentials: 'same-origin', redirect: 'error', headers: { 'Content-Type': 'application/octet-stream', 'X-CMS-Request': '1', 'X-CMS-Upload-Id': id, 'X-CMS-Filename': encodeURIComponent(file.name) }, body: file });
  const result = await response.json();
  if (!response.ok) throw new ApiError(result.error ?? 'Filen kunde inte laddas upp.', response.status);
  return result;
}
