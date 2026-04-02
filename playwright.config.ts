import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.TEST_URL || "http://127.0.0.1:3000"

export default defineConfig({
  testDir: "./src/playwright",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  outputDir: "public/test-results",
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  reporter: [
    ["html", { outputFolder: "public/playwright-report", open: "never" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "on",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  webServer: process.env.TEST_URL
    ? undefined
    : {
        command: "yarn dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
})
