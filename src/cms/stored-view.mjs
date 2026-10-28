// Ordinary reads have always discarded unused page editor JSON. Raw revision
// readers keep it for exact history/replay/migration identity. Share this small
// projection with canonical preparation so a cached view cannot reintroduce it.
export function storedProjectView(project) {
  for (const page of project.pages) page.project = null;
  return project;
}
