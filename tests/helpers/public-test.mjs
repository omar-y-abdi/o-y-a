import { test as base, expect } from '@playwright/test';
import { publicRuntime } from './cms-runtime.mjs';

export const test = base.extend({
  publicOrigin: [async ({}, use, workerInfo) => {
    if (workerInfo.project.use.baseURL) {
      await use(workerInfo.project.use.baseURL);
      return;
    }
    const runtime = await publicRuntime();
    try { await use(runtime.url); }
    finally { await runtime.close(); }
  }, { scope: 'worker' }],
  baseURL: async ({ publicOrigin }, use) => use(publicOrigin),
});
export { expect };
