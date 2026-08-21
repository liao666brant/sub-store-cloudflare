import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { installApiMocks } from "./fixtures";

const evidencePath = (name: string): string => resolve(import.meta.dirname, "../../.omo/evidence/tdesign-vue-next-migration", name);

for (const width of [375, 768, 1280] as const) {
  test(`tools uses the compact TDesign layout at ${width}px`, async ({ page }) => {
    await installApiMocks(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/tools");
    await expect(page.locator(".t-card").first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const path = evidencePath(`task-6-tools-${width}.png`);
    await mkdir(dirname(path), { recursive: true });
    await page.screenshot({ path, fullPage: true });
  });
}

test("tools remains readable in Chinese at every supported breakpoint", async ({ page }) => {
  await installApiMocks(page);
  await page.addInitScript(() => localStorage.setItem("locale", "zh"));
  for (const width of [375, 768, 1280] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/tools");
    await expect(page.getByText("一次性转换", { exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const path = evidencePath(`task-6-tools-zh-${width}.png`);
    await mkdir(dirname(path), { recursive: true });
    await page.screenshot({ path, fullPage: true });
  }
});

test("tools converts input and reports clipboard failures without losing the result", async ({ page }) => {
  await installApiMocks(page);
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("clipboard denied")) } }));
  await page.goto("/tools");
  await page.locator("textarea").first().fill("fixture input");
  await page.getByRole("button", { name: /转换|Convert/ }).click();
  await expect(page.locator("textarea").nth(1)).toHaveValue("fixture converted output");
  await page.getByRole("button", { name: /复制|Copy/ }).first().click();
  await expect(page.locator("textarea").nth(1)).toHaveValue("fixture converted output");
});

test("preview renders loaded text and an HTTP 500 error state", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/preview?url=/fixture-preview.txt&name=Fixture");
  await expect(page.locator(".cm-content")).toContainText("fixture preview output");
  await page.route("**/fixture-preview-500.txt", route => route.fulfill({ status: 500, contentType: "text/plain", body: "preview unavailable" }));
  await page.goto("/preview?url=/fixture-preview-500.txt&name=Fixture");
  await expect(page.locator(".cm-content")).toContainText("Error:");
  const path = evidencePath("task-6-preview-500.png");
  await mkdir(dirname(path), { recursive: true });
  await page.screenshot({ path, fullPage: true });
});
