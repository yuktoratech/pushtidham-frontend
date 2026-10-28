import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'line',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    env: { NEXT_PUBLIC_API_URL: 'http://localhost:3000/api/v1' },
  },
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
  },
});
