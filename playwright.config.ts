import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    // BASE_URL is set in CI when running against a real deployment (e.g. UAT).
    // Falls back to the local dev server for local runs and PR checks.
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Only spin up the dev server when NOT pointing at a real deployment.
  // When BASE_URL is set the tests hit the already-deployed environment directly.
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run dev --workspace=frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? 'http://localhost:3001/v1',
      VITE_CLOUDFRONT_DOMAIN: process.env.VITE_CLOUDFRONT_DOMAIN ?? 'https://test.cloudfront.net',
      VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID ?? 'test-client-id',
    },
  },
})
