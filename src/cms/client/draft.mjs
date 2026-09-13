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
  }
  get dirty() { return this.project !== this.saved; }
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
    this.project = this.undoStack.pop();
    this.lastGroup = '';
    this.generation++;
    return true;
  }
  redo() {
    if (!this.redoStack.length) return false;
    this.undoStack.push(this.project);
    this.project = this.redoStack.pop();
    this.lastGroup = '';
    this.generation++;
    return true;
  }
  acknowledge(snapshot, version) {
    this.saved = JSON.stringify(snapshot) === JSON.stringify(this.project) ? this.project : snapshot;
    this.version = version;
    this.pendingSave = null;
  }
}
