import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PW_PORT ?? 3115);
// Locally Playwright's own browser download can be unavailable: set PW_CHANNEL=msedge (or chrome) to use an installed one.
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } },
  ],
  // Tests run against the production build (`npm run build` first): that is what visitors get.
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // deterministic admin tests: the default code, a test secret, and no GitHub (so nothing real is ever touched)
    env: {
      ADMIN_CODE: 'gkds1993',
      ADMIN_JWT_SECRET: 'playwright-test-secret-not-for-production',
      ADMIN_CODE_RESET: '',
      GITHUB_TOKEN: '',
      GITHUB_OWNER: '',
      GITHUB_REPO: '',
    },
    timeout: 120_000,
  },
});
