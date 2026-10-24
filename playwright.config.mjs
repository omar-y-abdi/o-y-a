import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.mjs'],
  fullyParallel: true,
  workers: process.env.PLAYWRIGHT_WORKERS ? Number(process.env.PLAYWRIGHT_WORKERS) : process.env.CI ? 4 : '75%',
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  maxFailures: process.env.CI ? 20 : 5,
  reporter: process.env.CI ? [['line'], ['json', { outputFile: 'output/playwright/results.json' }]] : 'line',
  use: {
    browserName: 'chromium',
    ...(process.env.CHROMIUM_PATH ? {} : { channel: process.env.PW_CHANNEL || 'chrome' }),
    headless: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    acceptDownloads: true,
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } : undefined,
  },
  outputDir: 'output/playwright/artifacts',
  projects: [
    { name: 'chromium', grepInvert: /@webgl/ },
    // Software-rendered worlds share CI's CPU; finish other cases first.
    { name: 'chromium-webgl', grep: /@webgl/, workers: 1, dependencies: ['chromium'] },

    // The studio editor and mail preview images need every engine; other email cases skip there.
    { name: 'firefox', testMatch: ['cms-editor.spec.mjs', 'cms-email.spec.mjs'], use: { browserName: 'firefox', channel: '', launchOptions: {} } },
    { name: 'webkit', testMatch: ['cms-editor.spec.mjs', 'cms-email.spec.mjs'], use: { browserName: 'webkit', channel: '', launchOptions: {} } },
  ],
});
