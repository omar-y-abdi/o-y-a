const DATABASE = 'oy-portfolio-studio';
const LOCK_PREFIX = 'oy-cms-draft:';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Reservlagringen blockeras av en annan flik.'));
  });
}

export class RecoveryStore {
  constructor(owner) {
    this.owner = owner;
    this.session = crypto.randomUUID();
    this.key = [owner, this.session];
    this.generation = 0;
    try {
      this.previous = sessionStorage.getItem('oy-cms-session:' + owner);
      sessionStorage.setItem('oy-cms-session:' + owner, this.session);
    } catch { /* Enumeration still provides recovery when sessionStorage is unavailable. */ }
  }
  async start() {
    this.db = await openDatabase();
    if (navigator.locks) {
      await new Promise((resolve, reject) => {
        this.lock = navigator.locks.request(LOCK_PREFIX + this.session, () => {
          resolve();
          return new Promise(release => { this.release = release; });
        }).catch(reject);
      });
    }
  }
  transaction(mode, run) {
    if (!this.db) return Promise.reject(new Error('Reservlagringen är inte tillgänglig.'));
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('drafts', mode);
      let result;
      run(transaction.objectStore('drafts'), value => { result = value; });
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
  async activeSessions() {
    const state = await navigator.locks?.query();
    return new Set((state?.held ?? []).filter(lock => lock.name.startsWith(LOCK_PREFIX)).map(lock => lock.name.slice(LOCK_PREFIX.length)));
  }
  async list() {
    const records = await this.transaction('readonly', (store, done) => {
      const result = [];
      const cursor = store.openCursor();
      cursor.onsuccess = () => {
        const item = cursor.result;
        if (!item) return done(result);
        const key = item.key, value = item.value;
        if ((Array.isArray(key) && key[0] === this.owner || key === this.owner) && value?.project && !value.deleted) result.push({ ...value, key, session: Array.isArray(key) ? key[1] : 'legacy', generation: value.generation ?? 0 });
        item.continue();
      };
    });
    const active = await this.activeSessions();
    return records.map(record => ({ ...record, active: active.has(record.session) })).sort((a, b) => Number(b.session === this.previous) - Number(a.session === this.previous) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }
  write(value) {
    const record = { ...(value ? structuredClone(value) : { deleted: true }), generation: ++this.generation, session: this.session, updatedAt: new Date().toISOString() };
    return this.transaction('readwrite', (store, done) => {
      const previous = store.get(this.key);
      previous.onsuccess = () => {
        if ((previous.result?.generation ?? -1) < record.generation) store.put(record, this.key);
        done(record);
      };
    });
  }
  async discard(record) {
    // A live editing tab owns its recovery copy. Another tab may copy it, but
    // cannot acknowledge or delete that tab's work.
    if ((await this.activeSessions()).has(record.session) && record.session !== this.session) return false;
    if (!navigator.locks && record.session !== this.session) return false;
    return this.transaction('readwrite', (store, done) => {
      const current = store.get(record.key);
      current.onsuccess = () => {
        if (current.result && (current.result.generation ?? 0) === record.generation) {
          store.put({ deleted: true, generation: record.generation + 1, updatedAt: new Date().toISOString() }, record.key);
          done(true);
        } else done(false);
      };
    });
  }
}

export function draftBackup(project, baseVersion, pendingSave = null, managedSvg = null) {
  return { format: 'oy-portfolio-draft', schemaVersion: 2, origin: location.origin, exportedAt: new Date().toISOString(), project, baseVersion, pendingSave, managedSvg };
}

export function readDraftBackup(value) {
  if (!value || value.format && value.format !== 'oy-portfolio-draft' || value.schemaVersion && ![1, 2].includes(value.schemaVersion) || !value.project || !Number.isSafeInteger(value.baseVersion) || value.baseVersion < 0) throw new Error('Filen är inte ett giltigt Portfolio Studio-utkast.');
  if (value.managedSvg && (typeof value.managedSvg.id !== 'string' || !Number.isSafeInteger(value.managedSvg.version) || value.managedSvg.version < 0 || typeof value.managedSvg.svg !== 'string' || value.managedSvg.svg.length > 512_000)) throw new Error('Reservkopians SVG-utkast är ogiltigt.');
  return value;
}
