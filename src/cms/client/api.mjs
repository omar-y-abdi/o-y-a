export class ApiError extends Error {
  constructor(message, status = 0, details) { super(message); this.status = status; this.details = details; }
  get definitive() { return this.status >= 400 && this.status < 500 && this.status !== 408; }
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
  if (!response.ok) throw new ApiError(result.error ?? 'Åtgärden kunde inte slutföras.', response.status, result.details);
  return result;
}

export async function upload(file, id) {
  const response = await fetch('/admin/api/upload', { method: 'POST', credentials: 'same-origin', redirect: 'error', headers: { 'Content-Type': 'application/octet-stream', 'X-CMS-Request': '1', 'X-CMS-Upload-Id': id, 'X-CMS-Filename': encodeURIComponent(file.name) }, body: file });
  const result = await response.json();
  if (!response.ok) throw new ApiError(result.error ?? 'Filen kunde inte laddas upp.', response.status);
  return result;
}
