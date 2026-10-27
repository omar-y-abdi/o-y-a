import { loadCopy } from './copy.mjs';

globalThis.__OY_SKIFT_COPY__ = await loadCopy();
await import('/play/skift/assets/app.js');
