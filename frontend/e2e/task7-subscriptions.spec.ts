import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { installApiMocks } from "./fixtures";

const evidencePath = (name: string): string => resolve(
  import.meta.dirname,
  "../../.omo/evidence/tdesign-vue-next-migration",
  name,
);

for (const width of [375, 768, 1280] as const) {
  test(`subscriptions stays readable in Chinese at ${width}px`, async ({ page }) => {
    await installApiMocks(page);
    await page.addInitScript(() => localStorage.setItem("locale", "zh"));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/subs");

    await expect(page.locator(".subscriptions-page")).toBeVisible();
    await expect(page.getByRole("button", { name: "fixture" })).toBeVisible();
    if (width === 1280) await expect(page.locator(".list-draggable.dual-column").first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    const path = evidencePath(`task-7-subs-zh-${width}.png`);
    await mkdir(dirname(path), { recursive: true });
    await page.screenshot({ path, fullPage: true });
  });
}

test("subscriptions keeps tag filtering and import failure recovery available", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/subs");

  await page.getByRole("button", { name: "fixture" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("sub-tag"))).toBe("fixture");

  await page.locator(".page-actions button").last().click();
  const upload = page.locator('input[type="file"]');
  await upload.setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("not json"),
  });
  await expect(upload).toHaveValue("");

  await upload.setInputFiles({
    name: "source.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ name: "imported", source: "local", process: [] })),
  });
  await expect(page.locator(".add-sub-panel")).toHaveCount(0);
});

test("subscriptions persist successful reordering and roll back a failed reorder without disabling actions", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/subs");
  const sourceItems = page.locator(".list-draggable").first().locator(".draggable-item");
  await expect(sourceItems).toHaveCount(2);

  const dragSecondSourceToFirst = async (): Promise<void> => {
    const sourceBox = await sourceItems.nth(1).boundingBox();
    const targetBox = await sourceItems.nth(0).boundingBox();
    if (!sourceBox || !targetBox) throw new Error("subscription drag targets are not visible");
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    // Sortable cancels a delayed drag on early pointer movement; its delay has no public DOM event.
    await page.waitForTimeout(250);
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 4, { steps: 12 });
    await page.mouse.up();
  };

  await dragSecondSourceToFirst();
  await expect(sourceItems.first()).toContainText("Demo source secondary");

  await page.route("**/api/sort/sources", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "error" }) }));
  await dragSecondSourceToFirst();
  await expect(sourceItems.first()).toContainText("Demo source secondary");
  await expect(page.getByRole("button", { name: "Edit" }).first()).toBeEnabled();
});
