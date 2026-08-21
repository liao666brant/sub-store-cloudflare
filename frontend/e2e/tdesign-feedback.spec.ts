import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { installApiMocks } from "./fixtures";

const viewports = [375, 768, 1280] as const;

const compareResult = {
  original: [{ id: "fixture-node", name: "Fixture original", type: "vless", server: "example.com", port: 443 }],
  processed: [{ id: "fixture-node", name: "Fixture processed", type: "vless", server: "example.com", port: 443 }],
};

const screenshotPath = (width: number): string => resolve(
  import.meta.dirname,
  "../../.omo/evidence/tdesign-vue-next-migration",
  `task-4-dialog-${width}.png`,
);

for (const width of viewports) {
  test(`opens and closes the node-names dialog without leaving the page scroll-locked at ${width}px`, async ({ page }) => {
    // Given: a real editor route whose compare request returns one node on both sides.
    await installApiMocks(page);
    await page.route("**/api/preview/source", route => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "success", data: compareResult }),
    }));
    await page.addInitScript(() => localStorage.setItem("locale", "zh"));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/edit/subs/demo-source");
    await expect(page.locator(".compare-btn")).toBeVisible();

    // When: a compare result opens the TDesign dialog and the user closes both overlay layers.
    await page.locator(".compare-btn").click();
    await expect(page.locator(".compare-page-wrapper")).toBeVisible();
    await page.locator("button.node-names-action").first().click();
    const nodeNamesDialog = page.locator(".preview-node-names-dialog");
    await expect(nodeNamesDialog).toBeVisible();
    await expect.poll(() => nodeNamesDialog.evaluate(
      element => getComputedStyle(element).paddingInlineStart,
    )).toBe(width <= 520 ? "16px" : "32px");
    const outputPath = screenshotPath(width);
    await mkdir(dirname(outputPath), { recursive: true });
    await page.screenshot({ path: outputPath, fullPage: true });
    await page.keyboard.press("Escape");
    await expect(nodeNamesDialog).toBeHidden();
    await page.locator(".compare-page-header .preview-leading button").first().click();

    // Then: dialog teardown and the compare overlay restore document scrolling.
    await expect(page.locator(".compare-page-wrapper")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => ({
      bodyOverflow: document.body.style.overflowY,
      htmlOverflow: document.documentElement.style.overflowY,
    }))).toEqual({ bodyOverflow: "", htmlOverflow: "" });
  });
}

test("a settings API failure produces one error and leaves no TDesign loading overlay", async ({ page }) => {
  // Given: the settings endpoint reports a controlled API failure.
  await installApiMocks(page, "failure");

  // When: the real settings page initializes.
  await page.goto("/my");
  await expect(page.locator(".t-message.t-is-error")).toHaveCount(1);

  // Then: one error is visible and no feedback overlay keeps the page unusable.
  await expect(page.locator(".t-loading--fullscreen")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("overflow-y", "hidden");
});

test("a refresh notification stays below the navigation title", async ({ page }) => {
  // Given: the settings page with its real navigation title and refresh action.
  await installApiMocks(page, "success", { appearanceSetting: { showFloatingRefreshButton: false } });
  await page.goto("/my");
  const title = page.locator(".nav-bar-wrapper__title");
  await expect(title).toBeVisible();

  // When: the user refreshes through the navigation action.
  await page.locator("button.nav-bar-wrapper__action").click();
  const notification = page.locator(".t-message.t-is-info").last();
  await expect(notification).toBeVisible();

  // Then: the message is placed below, rather than over, the title.
  const [titleBox, notificationBox] = await Promise.all([title.boundingBox(), notification.boundingBox()]);
  expect(titleBox).not.toBeNull();
  expect(notificationBox).not.toBeNull();
  if (!titleBox || !notificationBox) throw new Error("Expected visible navigation title and notification");
  expect(notificationBox.y).toBeGreaterThan(titleBox.y + titleBox.height);
  const outputPath = resolve(import.meta.dirname, "../../.omo/evidence/tdesign-vue-next-migration/task-4-refresh-notify.png");
  await mkdir(dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
});
