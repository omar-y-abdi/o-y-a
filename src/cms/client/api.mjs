export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

export async function api(path, data) {
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
  if (!response.ok) throw new ApiError(result.error ?? 'Åtgärden kunde inte slutföras.', response.status);
  return result;
}

export async function upload(file, id) {
  const response = await fetch('/admin/api/upload', { method: 'POST', credentials: 'same-origin', redirect: 'error', headers: { 'Content-Type': 'application/octet-stream', 'X-CMS-Request': '1', 'X-CMS-Upload-Id': id, 'X-CMS-Filename': encodeURIComponent(file.name) }, body: file });
  const result = await response.json();
  if (!response.ok) throw new ApiError(result.error ?? 'Filen kunde inte laddas upp.', response.status);
  return result;
}

let database;
async function recoveryDb() {
  if (!database) database = new Promise((resolve, reject) => {
    const opening = indexedDB.open('oy-portfolio-studio', 1);
    opening.onupgradeneeded = () => opening.result.createObjectStore('drafts');
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
  });
  return database;
}

export async function recovery(identity, value) {
  const db = await recoveryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', value === undefined ? 'readonly' : 'readwrite');
    const store = tx.objectStore('drafts');
    const operation = value === undefined ? store.get(identity) : value === null ? store.delete(identity) : store.put(value, identity);
    let result;
    operation.onsuccess = () => { result = operation.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
