import { defineConfig, devices } from "@playwright/test";

const webBaseUrl = process.env.PLAYWRIGHT_WEB_BASE_URL ?? "http://127.0.0.1:3100";
const apiBaseUrl = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:3333";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: webBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: webBaseUrl,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      STOCK_CONTROL_API_URL: apiBaseUrl,
      WEB_SESSION_SECRET: process.env.WEB_SESSION_SECRET ?? "playwright-web-session-secret"
    }
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
