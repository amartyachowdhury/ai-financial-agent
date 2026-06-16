import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORT ?? '3000';
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'pnpm start' : 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: port,
      POSTGRES_URL:
        process.env.POSTGRES_URL ??
        'postgres://user:pass@localhost:5432/test',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? 'test-openai-key',
      FINANCIAL_DATASETS_API_KEY:
        process.env.FINANCIAL_DATASETS_API_KEY ?? 'test-fda-key',
      AUTH_SECRET: process.env.AUTH_SECRET ?? 'test-auth-secret',
    },
  },
});
