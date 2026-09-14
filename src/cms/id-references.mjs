// HTML/SVG ID references shared by validation and subtree duplication.
export const ID_REFERENCES = new Set(['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-details', 'aria-errormessage', 'aria-activedescendant', 'for', 'headers', 'list', 'form']);

export function referencedIds(name, value) {
  if (ID_REFERENCES.has(name)) return value.trim().split(/\s+/).filter(Boolean);
  return [];
}
