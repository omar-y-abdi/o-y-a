const OPERATIONS = new Set(['state', 'history', 'revision', 'assets', 'upload', 'recover', 'replace-resource', 'resource-usage', 'validate', 'preview', 'save', 'media', 'public']);

export function reportFailure(error, operation = '') {
  const requestId = crypto.randomUUID();
  // Driver messages and stacks can contain SQL parameters, draft text or
  // credentials. Classify locally; never serialize the exception or request.
  const message = String(error?.message ?? '');
  const code = /\bD1\b|D1_ERROR|SQLITE_/.test(message) ? 'storage-d1' : /\bR2\b|R2_ERROR/.test(message) ? 'storage-r2' : error instanceof TypeError ? 'type-error' : 'unexpected';
  console.error(JSON.stringify({ event: 'cms_failure', requestId, operation: OPERATIONS.has(operation) ? operation : 'admin', code }));
  return requestId;
}
