// These modules are extracted and built from the immutable deployed BASE by
// scripts/prepare-base-worker.mjs. Never replace them with current definitions.
export { seed as baseSeed, initial as baseInitial } from '../../.generated/base-worker/.generated/cms-seed.mjs';
export { validateProject as baseValidate } from '../../.generated/base-worker/src/cms/project.mjs';
export { publishSite as basePublish } from '../../.generated/base-worker/src/cms/store.mjs';
