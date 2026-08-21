import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? "../.omo/evidence/tdesign-vue-next-migration/task-1-playwright/runs/unmanaged/test-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"], ["json", { outputFile: process.env.PLAYWRIGHT_REPORT_PATH ?? "../.omo/evidence/tdesign-vue-next-migration/task-1-playwright/runs/unmanaged/report.json" }]],
  use: {
    baseURL,
    trace: "on",
    screenshot: "off",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "pnpm exec vite --host 127.0.0.1 --port 4173 --base /",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 60_000,
  },
  timeout: 30_000,
});
