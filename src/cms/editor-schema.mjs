import { HttpError } from './http.mjs';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const fail = () => { throw new HttpError(422, 'Editorprojektets struktur är ogiltig. Exportera originalutkastet och rätta formatet innan import.'); };

// Legacy GrapesJS data is checked on import, but is never an alternative source
// of published content. The editor reconstructs its model from validated HTML/CSS.
export function validateEditorShape(data) {
  if (!object(data) || data.cmsSchemaVersion !== undefined && data.cmsSchemaVersion !== 1) fail();
  let count = 0;
  function collection(value, member) {
    if (!Array.isArray(value) || value.length > 12000) fail();
    value.forEach(member);
  }
  function component(value, depth = 0) {
    if (++count > 12000 || depth > 64) fail();
    if (typeof value === 'string') return;
    if (!object(value)) fail();
    for (const field of ['tagName', 'type', 'content', 'src', 'href']) if (value[field] !== undefined && typeof value[field] !== 'string') fail();
    for (const field of ['attributes', 'style']) if (value[field] !== undefined && !object(value[field])) fail();
    if (value.attributes) for (const attribute of Object.values(value.attributes)) if (!['string', 'number', 'boolean'].includes(typeof attribute)) fail();
    if (value.components !== undefined && typeof value.components !== 'string') collection(value.components, child => component(child, depth + 1));
    if (value.classes !== undefined) collection(value.classes, item => { if (typeof item !== 'string' && (!object(item) || typeof item.name !== 'string')) fail(); });
    if (value.head !== undefined) component(value.head, depth + 1);
    if (value.docEl !== undefined) component(value.docEl, depth + 1);
  }
  function style(value) {
    if (!object(value) || value.style !== undefined && !object(value.style)) fail();
    if (value.selectors !== undefined) collection(value.selectors, item => { if (typeof item !== 'string' && (!object(item) || typeof item.name !== 'string')) fail(); });
  }
  if (data.pages !== undefined) collection(data.pages, page => {
    if (!object(page)) fail();
    if (page.component !== undefined) component(page.component);
    if (page.frames !== undefined) collection(page.frames, frame => {
      if (!object(frame)) fail();
      if (frame.component !== undefined) component(frame.component);
      if (frame.styles !== undefined) collection(frame.styles, style);
    });
  });
  if (data.components !== undefined && typeof data.components !== 'string') collection(data.components, value => component(value));
  if (data.styles !== undefined) collection(data.styles, style);
  for (const field of ['assets', 'symbols', 'dataSources']) if (data[field] !== undefined) collection(data[field], value => { if (!object(value)) fail(); });
  return data;
}
