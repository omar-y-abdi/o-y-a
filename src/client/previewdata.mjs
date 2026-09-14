// Only a srcdoc frame created by the owner studio may read server preview data.
// Published documents always use the public, validated card/copy endpoints.
export function previewData(doc = globalThis.document) {
  if (!doc || doc.URL !== 'about:srcdoc' || doc.body?.dataset.cmsPreview !== 'true') return null;
  try {
    const frame = doc.defaultView.frameElement;
    if (!frame?.hasAttribute('data-cms-preview-frame') || !frame.ownerDocument.location.pathname.startsWith('/admin/')) return null;
    const nodes = doc.head.querySelectorAll('script#cms-preview-data[type="application/json"]');
    if (nodes.length !== 1 || doc.querySelectorAll('#cms-preview-data').length !== 1) return null;
    const value = JSON.parse(nodes[0].textContent);
    if (value.schemaVersion !== 1 || !Array.isArray(value.cards) || value.cards.length > 2000 || !value.runtime || Array.isArray(value.runtime) || typeof value.runtime !== 'object') return null;
    if (value.cards.some(card => !card || typeof card.id !== 'string' || typeof card.text !== 'string' || !['kind', 'joke', 'pause', 'roast'].includes(card.flavor) || card.design && (typeof card.design.html !== 'string' || typeof card.design.css !== 'string'))) return null;
    if (Object.values(value.runtime).some(text => typeof text !== 'string')) return null;
    return value;
  } catch { return null; }
}
