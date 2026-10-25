import { SKIFT_PATH } from '../content/skift.mjs';

export const isSkiftPath = path => path === SKIFT_PATH || path === SKIFT_PATH.slice(0, -1);
