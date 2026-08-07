import { defineConfig, devices } from "@playwright/test";

const PORT = 3900;
const baseURL = `http://localhost:${PORT}`;

// PLAYWRIGHT_CHROMIUM_PATH lets a sandboxed/offline environment point at a
// pre-installed browser binary instead of the one `npx playwright install`
// would otherwise download. Leave it unset to use the normal managed browser.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
