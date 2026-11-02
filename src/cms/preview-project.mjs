// This is a transport projection, never a security decision. The server checks
// the selected target and determines card-bank use from validated DOM facts.
export function previewPayload(project, type, id) {
  if (!project || ![1, 2].includes(project.schemaVersion) || !Array.isArray(project.pages) || !Array.isArray(project.cards)) throw new TypeError('Förhandsvisningens projekt saknas.');
  const win = type === 'win', selected = (win ? project.cards : project.pages).filter(item => item?.id === id);
  if (!['win', 'page'].includes(type) || selected.length !== 1) throw new TypeError('Förhandsvisningen behöver ett entydigt valt innehåll.');
  const pages = win ? [] : selected.map(({ facts: _facts, ...page }) => page);
  const cards = win ? selected : /data-machine/i.test(pages[0].html + (project.frame?.html ?? '')) ? project.cards : [];
  return { project: { schemaVersion: win ? 2 : project.schemaVersion, pages, cards, runtime: project.runtime, theme: project.theme, resources: project.resources, ...(!win ? project.schemaVersion === 2 ? { frame: project.frame, ...(project.frameConflicts ? { frameConflicts: project.frameConflicts } : {}) } : { sharedContent: project.sharedContent, ...(project.frameVersion === undefined ? {} : { frameVersion: project.frameVersion }) } : {}) }, ...(win ? { cardId: id } : { pageId: id }) };
}
