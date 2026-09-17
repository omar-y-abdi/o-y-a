export class ManagedSvgReconcileError extends Error {
  constructor(message = 'SVG-källan och derivatet är committade, men utkastet ändrades samtidigt. Slutför synkningen innan du lämnar resursen.') {
    super(message);
    this.name = 'ManagedSvgReconcileError';
    this.code = 'managed-svg-reconcile';
  }
}

export async function saveManagedSvgOperation({ source, baseVersion, operation = null, project, unchanged, onOperation, stage, rasterize, upload, prepare, finalize, apply, complete, clean }) {
  let current = operation;
  let version = baseVersion;
  const update = value => { current = value; onOperation(value); };

  async function reconcileCommitted() {
    const committedSource = current.svg ?? source;
    const before = project();
    const finalized = await finalize({ operationId: current.id, project: before });
    update({ ...finalized.operation, svg: finalized.svg ?? committedSource });
    if (!unchanged(before)) throw new ManagedSvgReconcileError();
    apply(finalized.project, finalized);
    const completed = await complete({ operationId: current.id });
    update({ ...completed.operation, svg: finalized.svg ?? committedSource });
    version = finalized.asset.version;
    return { finalized, completed, committedSource };
  }

  if (current?.state === 'committed') {
    const reconciled = await reconcileCommitted();
    if (reconciled.committedSource === source) {
      clean(reconciled.finalized, reconciled.completed);
      return { ...reconciled.finalized, operation: reconciled.completed.operation };
    }
    current = null;
  }

  if (!current || !['staged', 'prepared'].includes(current.state) || current.svg && current.svg !== source) {
    current = { id: crypto.randomUUID(), state: 'staged', svg: source };
  }

  const staged = await stage({ operationId: current.id, baseVersion: version, svg: current.svg ?? source });
  update({ ...staged.operation, svg: staged.svg });

  if (current.state === 'staged') {
    const file = await rasterize(current.svg ?? source);
    const derivative = await upload(file, current.id);
    const prepared = await prepare({ operationId: current.id, derivativeId: derivative.id });
    update({ ...prepared.operation, svg: current.svg ?? source });
  }

  const reconciled = await reconcileCommitted();
  clean(reconciled.finalized, reconciled.completed);
  return { ...reconciled.finalized, operation: reconciled.completed.operation };
}
