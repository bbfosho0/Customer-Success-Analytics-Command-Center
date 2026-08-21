import { defineConfig } from "@playwright/test";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.01,
    },
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  outputDir: "test-results",
  snapshotPathTemplate: "{testDir}/visual/__screenshots__/{projectName}/{testFileName}/{arg}{ext}",
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "storybook",
      testMatch: /visual\/.*\.spec\.ts/,
      use: {
        baseURL: "http://127.0.0.1:6006",
        viewport: { width: 1440, height: 1000 },
        colorScheme: "dark",
        deviceScaleFactor: 1,
      },
    },
    {
      name: "app",
      testMatch: /e2e\/.*\.spec\.ts/,
      use: {
        baseURL: "http://127.0.0.1:3000",
        viewport: { width: 1440, height: 1000 },
        colorScheme: "dark",
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: [
    {
      command: "npm run storybook -- --ci --host 127.0.0.1",
      url: "http://127.0.0.1:6006",
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
});
