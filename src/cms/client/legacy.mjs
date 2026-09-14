// Keep the untouched server revision available for export. Old editor JSON is
// not loaded into GrapesJS; validated HTML/CSS remain the content authority.
export function legacyEditorDraft(project) {
  if (!project.pages.some(page => page.project != null) && !project.cards.some(card => card.design?.project != null)) return null;
  const draft = structuredClone(project);
  for (const page of draft.pages) page.project = null;
  for (const card of draft.cards) if (card.design) card.design.project = null;
  return draft;
}
