import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/playwrite', 
  fullyParallel: false, 
  reporter: 'html', 
  timeout: 60000,
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000/',
    trace: 'on-first-retry', 
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});