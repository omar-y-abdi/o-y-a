import { api } from './api.mjs';
import { $, dialog, escape, confirmAction, toast } from './dom.mjs';
import { RecoveryStore, draftBackup, readDraftBackup } from './recovery.mjs';

function download(value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'omar-studio-utkast.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export class Backups {
  constructor(owner, { snapshot, install, flush }) {
    this.store = new RecoveryStore(owner);
    this.snapshot = snapshot; this.install = install; this.flush = flush;
  }
  report(message, error = false) {
    $('#backup-status').textContent = message;
    if (error && !this.failed) toast(message + ' Exportera en kopia via Utkast & backup.', true);
    this.failed = error;
  }
  async start() {
    try { await this.store.start(); this.report('Reservutkast redo'); }
    catch { this.report('Reservlagring saknas i webbläsaren.', true); }
  }
  schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.persist(), 350);
  }
  async persist() {
    clearTimeout(this.timer);
    const draft = this.snapshot();
    try {
      const pending = draft.dirty || draft.pendingSave || draft.managedSvg;
      await this.store.write(pending ? { project: draft.project, version: draft.version, pendingSave: draft.pendingSave, managedSvg: draft.managedSvg ?? null } : null);
      this.report(pending ? 'Reservutkast sparat för denna flik' : 'Reservutkast redo');
      return true;
    } catch { this.report('Reservutkast kunde inte sparas.', true); return false; }
  }
  export(record) {
    this.flush();
    const source = record ?? this.snapshot();
    download(draftBackup(source.project, source.version, source.pendingSave, source.managedSvg ?? null));
  }
  async restore(record) {
    this.flush();
    const before = this.snapshot().project;
    try {
      const verified = await api('recover', { project: record.project, pendingSave: record.pendingSave });
      const base = await api(`revision/${record.version}`);
      this.flush();
      if (this.snapshot().project !== before) throw new Error('Utkastet ändrades medan återställningen kontrollerades. Dina senaste ändringar och reservkopian är kvar.');
      await this.install({ ...verified, base: base.project, version: record.version, managedSvg: record.managedSvg ?? null });
      // First commit the new session's independent copy, then acknowledge only
      // the exact generation accepted from an inactive recovery record.
      if (await this.persist() && record.key) await this.store.discard(record);
      $('#studio-dialog').close();
      toast(verified.warnings.length ? `Utkastet är återställt. Rätta före Save: ${verified.warnings.join(' ')}` : 'Utkastet är återställt. Granska före Save.', verified.warnings.length > 0);
    } catch (error) {
      dialog(`<span class="dialog-eyebrow">RESERVKOPIAN FINNS KVAR</span><h2>Utkastet kunde inte läsas säkert.</h2><p class="inline-error" role="alert">${escape(error.message)}</p><p>Originalet behålls tills du uttryckligen återställer eller tar bort det. Exportera för att rätta filen och importera igen. Vid utgången session: logga in i en ny flik och försök här igen.</p><div class="dialog-buttons"><button class="small-button" id="export-rejected">Exportera originalutkast</button><button class="small-button" data-action="close-dialog">Behåll och stäng</button></div>`);
      $('#export-rejected').onclick = () => this.export(record);
    }
  }
  async offer() {
    if (this.failed) return;
    const records = (await this.store.list()).filter(record => !record.active && record.session !== this.store.session);
    if (!records.length) return;
    if (records.length > 1) return this.show();
    if (await confirmAction({ title: 'En idé väntar på dig.', message: 'Ett lokalt utkast finns från en tidigare session. Återuppta det eller behåll det under Utkast & backup.', action: 'Återuppta utkast' })) await this.restore(records[0]);
  }
  async show() {
    this.flush();
    let records = [];
    try { records = (await this.store.list()).filter(record => record.session !== this.store.session); }
    catch { this.report('Reservlagringen kunde inte läsas.', true); }
    dialog(`<span class="dialog-eyebrow">DIN IDÉ. FLERA LIVLINOR.</span><h2>Utkast & backup</h2><p>Varje flik har en egen reservkopia. Export innehåller innehåll och referenser till filer. D1- och R2-backup hanteras separat enligt driftguiden.</p><div class="dialog-buttons"><button class="small-button primary" id="backup-export">Exportera aktuellt utkast</button><button class="small-button" id="backup-import">Importera utkast</button></div><p id="backup-import-error" class="inline-error" role="alert" hidden></p><input type="file" accept="application/json,.json" id="backup-file" hidden><div class="backup-list">${records.map((record, index) => `<section class="backup-row"><div><strong>${escape(record.project.pages?.[0]?.name || 'Utkast')}</strong><p>${escape(record.updatedAt ?? 'Tidigare session')} · basversion ${escape(record.version)}${record.active ? ' · öppen i annan flik' : ''}</p></div><div class="dialog-buttons"><button class="small-button" data-backup-open="${index}">Återuppta kopia</button><button class="small-button" data-backup-export="${index}">Exportera</button>${record.active ? '' : `<button class="small-button danger" data-backup-delete="${index}">Ta bort reservkopia</button>`}</div></section>`).join('') || '<p>Inga andra reservutkast.</p>'}</div><div class="dialog-buttons"><button class="small-button" data-action="close-dialog">Stäng</button></div>`);
    $('#backup-export').onclick = () => this.export();
    $('#backup-import').onclick = () => $('#backup-file').click();
    $('#backup-file').onchange = async event => {
      const file = event.target.files[0]; if (!file) return;
      try {
        if (file.size > 32 * 1024 * 1024) throw new Error('Reservkopian är större än 32 MB.');
        const data = readDraftBackup(JSON.parse(await file.text()));
        const expected = this.snapshot().project;
        if (!await confirmAction({ title: 'Läs in reservutkast?', message: `Innehållet ersätter det aktuella utkastet efter säkerhetskontroll. Exportera först om du vill behålla båda. Ursprung: ${data.origin ?? 'tidigare export'}. Save krävs för publicering.`, action: 'Kontrollera och läs in' })) return;
        this.flush();
        if (expected !== this.snapshot().project) throw new Error('Utkastet ändrades under importen. Försök igen.');
        await this.restore({ project: data.project, version: data.baseVersion, pendingSave: data.pendingSave, managedSvg: data.managedSvg ?? null });
      } catch (error) { toast(error.message, true); }
    };
    $('#dialog-content').querySelectorAll('[data-backup-export]').forEach(button => { button.onclick = () => this.export(records[Number(button.dataset.backupExport)]); });
    $('#dialog-content').querySelectorAll('[data-backup-open]').forEach(button => { button.onclick = async () => {
      const record = records[Number(button.dataset.backupOpen)];
      if (await confirmAction({ title: 'Återuppta reservutkast?', message: 'Denna fliks utkast ersätts efter säkerhetskontroll. Andra flikars arbete påverkas inte. Exportera först om du vill behålla båda.', action: 'Återuppta utkast' })) await this.restore(record);
    }; });
    $('#dialog-content').querySelectorAll('[data-backup-delete]').forEach(button => { button.onclick = async () => {
      const record = records[Number(button.dataset.backupDelete)];
      if (await confirmAction({ title: 'Ta bort denna reservkopia?', message: 'Endast den valda lokala kopian tas bort. Publicerad webbplats och andra flikars utkast påverkas inte.', action: 'Ta bort reservkopia', danger: true })) {
        if (!await this.store.discard(record)) toast('Kopian används eller ändrades. Hämta listan igen.', true);
        await this.show();
      }
    }; });
  }
}
