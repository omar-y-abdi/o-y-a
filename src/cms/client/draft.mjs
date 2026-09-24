import { applyProjectChanges, projectChanges } from '../project-changes.mjs';

export class Draft {
  constructor(project, version) {
    this.project = project;
    this.saved = project;
    this.version = version;
    this.undoStack = [];
    this.redoStack = [];
    this.generation = 0;
    this.lastGroup = '';
    this.lastChange = 0;
    this.pendingSave = null;
    this.pendingSnapshot = null;
  }
  get dirty() { return this.project !== this.saved; }
  beginSave() {
    if (!this.pendingSave) {
      const snapshot = structuredClone(this.project);
      const changes = projectChanges(this.saved, snapshot);
      if (!Object.keys(changes).length) { this.saved = this.project; return null; }
      this.pendingSnapshot = snapshot;
      this.pendingSave = this.version === 0
        ? { project: snapshot, baseVersion: 0, requestId: crypto.randomUUID() }
        : { changes, baseVersion: this.version, requestId: crypto.randomUUID() };
    }
    return this.pendingSave;
  }
  rejectSave(error) {
    if (error.definitive) { this.pendingSave = null; this.pendingSnapshot = null; }
  }
  restorePending(pendingSave) {
    this.pendingSave = pendingSave ?? null;
    if (!pendingSave) { this.pendingSnapshot = null; return; }
    this.pendingSnapshot = pendingSave.changes
      ? applyProjectChanges(this.saved, pendingSave.changes)
      : pendingSave.project ? structuredClone(pendingSave.project) : null;
    if (!this.pendingSnapshot) throw new TypeError('Invalid pending save.');
  }
  change(project, group = '') {
    if (project === this.project) return;
    const now = Date.now();
    if (!group || group !== this.lastGroup || now - this.lastChange > 800) {
      this.undoStack.push(this.project);
      if (this.undoStack.length > 50) this.undoStack.shift();
    }
    this.lastGroup = group;
    this.lastChange = now;
    this.redoStack = [];
    this.project = project;
    this.generation++;
  }
  undo() {
    if (!this.undoStack.length) return false;
    this.redoStack.push(this.project);
    const project = this.undoStack.pop();
    this.project = JSON.stringify(project) === JSON.stringify(this.saved) ? this.saved : project;
    this.lastGroup = '';
    this.generation++;
    return true;
  }
  redo() {
    if (!this.redoStack.length) return false;
    this.undoStack.push(this.project);
    const project = this.redoStack.pop();
    this.project = JSON.stringify(project) === JSON.stringify(this.saved) ? this.saved : project;
    this.lastGroup = '';
    this.generation++;
    return true;
  }
  acknowledge(snapshot, version, pendingSave) {
    if (!snapshot || !Number.isSafeInteger(version)) throw new TypeError('Invalid save acknowledgement.');
    this.saved = JSON.stringify(snapshot) === JSON.stringify(this.project) ? this.project : snapshot;
    this.version = version;
    if (this.pendingSave === pendingSave) { this.pendingSave = null; this.pendingSnapshot = null; }
  }
}
