import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/playwright",
  fullyParallel: false,
  reporter: [["html", { outputFolder: "public/playwright-report" }]],
  use: {
    baseURL: process.env.TEST_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
