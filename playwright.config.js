import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'node tests/static-server.mjs',
    port: 4174,
    reuseExistingServer: true,
  },
});
