import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { installApiMocks } from "./fixtures";

const viewports = [375, 768, 1280] as const;
const routes = [
  { id: "subs", path: "/subs", readySelector: ".subscriptions-page" },
  { id: "my", path: "/my", readySelector: ".my-page" },
  { id: "tools", path: "/tools", readySelector: ".tools-page" },
  { id: "preview", path: "/preview?url=/fixture-preview.txt&name=Fixture", readySelector: ".preview-page .cmview" },
  { id: "not-found", path: "/404", readySelector: ".t-empty__description" },
  { id: "edit-source", path: "/edit/subs/demo-source", readySelector: ".local-content-field" },
  { id: "edit-collection", path: "/edit/collections/demo-collection", readySelector: "label:has-text('Remarks')" },
] as const;

const screenshotPath = (route: string, width: number) => resolve(
  import.meta.dirname,
  "../../.omo/evidence/tdesign-vue-next-migration/task-1-playwright",
  `task-1-${route}-${width}.png`,
);

for (const viewport of viewports) {
  for (const route of routes) {
    test(`captures ${route.id} at ${viewport}px`, async ({ page }) => {
      // Given: a real Vite-served page with deterministic public API fixtures.
      await installApiMocks(page);
      await page.setViewportSize({ width: viewport, height: 900 });

      // When: the route is visited at the requested responsive breakpoint.
      await page.goto(route.path);
      await page.waitForFunction(() => document.querySelector("#app")?.children.length !== 0);
      await expect(page.locator(route.readySelector)).toBeVisible();

      // Then: the live route renders and leaves a screenshot plus Playwright trace.
      await expect(page.locator("#app")).not.toBeEmpty();
      const outputPath = screenshotPath(route.id, viewport);
      await mkdir(dirname(outputPath), { recursive: true });
      await page.screenshot({ path: outputPath, fullPage: true });
    });
  }
}

test("settings failure fixture reports an error and leaves the page usable", async ({ page }) => {
  // Given: the settings endpoint returns a non-success API response.
  await installApiMocks(page, "failure");

  // When: the settings route initializes through the real browser app.
  await page.goto("/my");
  await expect(page.locator(".t-message.t-is-error")).toHaveCount(1);

  // Then: the failure does not trap the page behind a loading/scroll overlay.
  await expect(page.locator("body")).not.toHaveCSS("overflow-y", "hidden");
  await expect(page.locator("#app")).not.toBeEmpty();
});
