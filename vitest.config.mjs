import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/*.test.mjs'],
    pool: 'forks',
    fileParallelism: true,
    maxWorkers: process.env.CI ? 4 : '75%',
    testTimeout: 30_000,
    hookTimeout: 15_000,
  },
});
