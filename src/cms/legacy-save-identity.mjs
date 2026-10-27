// A deliberately narrow adapter for the text() contract shipped in 80630c7.
// It never applies current policy, migrations, HTML normalization or defaults.
// A caller must still match the entire result against the historical hash.
export function trimLegacySaveMetadata(input) {
  if (input?.schemaVersion !== 1 || !Array.isArray(input.pages) || !Array.isArray(input.cards)) return null;
  const project = structuredClone(input);
  const trim = (record, name, max) => {
    const value = record?.[name];
    if (typeof value !== 'string' || !value.trim().length || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) return false;
    record[name] = value.trim();
    return true;
  };
  for (const page of project.pages) for (const [name, max] of [['id', 80], ['name', 80], ['title', 160], ['description', 320]]) if (!trim(page, name, max)) return null;
  for (const card of project.cards) if (!trim(card, 'text', 500)) return null;
  return project;
}
