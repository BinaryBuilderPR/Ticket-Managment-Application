import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: path.join(__dirname, 'e2e', 'tests'),
  testMatch: /.*\.spec\.ts/,
  outputDir: path.join(__dirname, 'e2e', 'test-results'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: path.join(__dirname, 'e2e', 'playwright-report'), open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: path.join(__dirname, 'e2e/global-setup.ts'),
  globalTeardown: path.join(__dirname, 'e2e/global-teardown.ts'),
  webServer: [
    {
      command: 'npx tsx src/server.ts',
      cwd: './server',
      port: 3001,
      env: {
        NODE_ENV: 'test',
        PORT: '3001',
        DATABASE_URL: 'postgresql://postgres:1234@localhost:5432/helpdesk_test?schema=public',
        SESSION_SECRET: 'e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8',
        BETTER_AUTH_SECRET: '1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e',
        CLIENT_URL: 'http://localhost:5174',
      },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --port 5174',
      cwd: './client',
      port: 5174,
      env: {
        VITE_API_TARGET: 'http://localhost:3001',
      },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
