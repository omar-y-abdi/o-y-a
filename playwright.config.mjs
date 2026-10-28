import { defineConfig } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT;
if (port && (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)) throw new Error('PLAYWRIGHT_PORT must be an integer between 1 and 65535; omit it for port-0 fixtures.');
const serverURL = port ? `http://127.0.0.1:${port}` : undefined;

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.mjs'],
  fullyParallel: true,
  workers: process.env.PLAYWRIGHT_WORKERS ? Number(process.env.PLAYWRIGHT_WORKERS) : process.env.CI ? 4 : '75%',
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  maxFailures: process.env.CI ? 20 : 5,
  reporter: process.env.CI ? [['line'], ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_FILE || 'output/playwright/results.json' }]] : 'line',
  use: {
    browserName: 'chromium',
    ...(process.env.CHROMIUM_PATH || !process.env.PW_CHANNEL ? {} : { channel: process.env.PW_CHANNEL }),
    headless: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    acceptDownloads: true,
    baseURL: process.env.BASE_URL || serverURL,
    trace: 'retain-on-failure',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } : undefined,
  },
  outputDir: 'output/playwright/artifacts',
  webServer: serverURL ? {
    command: 'node scripts/cms-dev.mjs --public-tests',
    url: serverURL + '/',
    env: { PORT: port },
    reuseExistingServer: false,
    timeout: 60_000,
  } : undefined,
  projects: [
    { name: 'chromium', grepInvert: /@webgl/ },
    // Named public scripts run this serial project after ordinary Chromium.
    { name: 'chromium-webgl', grep: /@webgl/, workers: 1 },

    // The studio editor, mail preview images and public startup need every engine; other email cases skip there.
    { name: 'firefox', testMatch: ['cms-editor.spec.mjs', 'cms-email.spec.mjs', 'public-startup.spec.mjs', 'cms-modules.spec.mjs', 'managed-svg-fidelity.spec.mjs'], use: { browserName: 'firefox', channel: '', launchOptions: {} } },
    { name: 'webkit', testMatch: ['cms-editor.spec.mjs', 'cms-email.spec.mjs', 'public-startup.spec.mjs', 'cms-modules.spec.mjs', 'managed-svg-fidelity.spec.mjs'], use: { browserName: 'webkit', channel: '', launchOptions: {} } },
  ],
});
