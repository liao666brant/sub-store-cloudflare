import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { installApiMocks } from "./fixtures";

const evidencePath = (name: string): string => resolve(
  import.meta.dirname,
  "../../.omo/evidence/tdesign-vue-next-migration/task-9-editor-shell",
  name,
);

const capture = async (page: import("@playwright/test").Page, name: string): Promise<void> => {
  const path = evidencePath(name);
  await mkdir(dirname(path), { recursive: true });
  await page.screenshot({ path, fullPage: true });
};

test("new remote source validates required fields before save", async ({ page }) => {
  const savedPayloads: unknown[] = [];
  await installApiMocks(page);
  await page.route("**/api/sources", route => {
    if (route.request().method() === "POST") savedPayloads.push(route.request().postDataJSON());
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: {} }) });
  });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.addInitScript(() => localStorage.setItem("locale", "zh"));
  await page.goto("/edit/subs/UNTITLED");
  await page.getByRole("button", { name: "保存" }).click();
  const dialog = page.locator(".t-dialog:visible");
  await expect(dialog).toContainText("提交出错！");
  await expect.poll(async () => (await dialog.boundingBox())?.width ?? 0).toBeGreaterThan(280);
  await expect.poll(() => savedPayloads.length).toBe(0);
  await expect(page.locator(".page-wrapper")).toBeVisible();
  await capture(page, "required-error-375.png");
  await page.keyboard.press("Escape");
  await expect(page.locator(".t-dialog:visible")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "保存" })).toBeFocused();
});

test("existing source retains its PATCH payload and data after a controlled save failure", async ({ page }) => {
  const savedPayloads: unknown[] = [];
  await installApiMocks(page);
  await page.route("**/api/sources/demo-source", route => {
    if (route.request().method() === "PATCH") savedPayloads.push(route.request().postDataJSON());
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "error", error: { message: "fixture failed" } }) });
  });
  await page.route("**/api/preview/source", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ status: "success", data: { original: [{ type: "vless" }] } }),
  }));
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/edit/subs/demo-source");
  const displayName = page.getByPlaceholder("The display name");
  await displayName.fill("Changed source");
  await page.getByRole("button", { name: /Save|保存/ }).click();
  await expect.poll(() => savedPayloads.length).toBe(1);
  expect(savedPayloads[0]).toMatchObject({ id: "demo-source", name: "Changed source", type: "local" });
  const notification = page.locator(".t-message.t-is-error");
  await expect(notification).toHaveCount(1);
  await expect.poll(async () => {
    const [messageBox, toolbarBox] = await Promise.all([
      notification.boundingBox(),
      page.locator(".bottom-btn-wrapper").boundingBox(),
    ]);
    if (!messageBox || !toolbarBox) return Number.POSITIVE_INFINITY;
    return messageBox.y + messageBox.height - toolbarBox.y;
  }).toBeLessThanOrEqual(-8);
  await expect(page.locator(".page-wrapper")).toBeVisible();
  await expect(displayName).toHaveValue("Changed source");
  await capture(page, "save-failure-768.png");
});

test("existing collection saves the API payload, selector changes, and cancellation without hidden writes", async ({ page }) => {
  const patches: unknown[] = [];
  await installApiMocks(page);
  await page.route("**/api/collections/demo-collection", route => {
    if (route.request().method() === "PATCH") patches.push(route.request().postDataJSON());
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: {} }) });
  });
  await page.goto("/edit/collections/demo-collection");
  const displayName = page.getByPlaceholder("The display name");
  await displayName.fill("Changed collection");

  await page.locator(".include-subs-trigger").click();
  const subscriptions = page.locator(".subs-checkbox");
  await expect(subscriptions).toHaveCount(2);
  await subscriptions.nth(1).click();

  await page.locator(".template-trigger").click();
  const picker = page.locator(".t-dialog:visible");
  await expect(picker).toBeVisible();
  await picker.getByRole("button", { name: /Cancel|取消/ }).click();
  await expect(picker).toHaveCount(0);
  await expect(displayName).toHaveValue("Changed collection");

  await page.locator(".template-trigger").click();
  await picker.getByRole("textbox", { name: "please select" }).click();
  await page.getByText("Fixture template", { exact: false }).click();
  await picker.getByRole("button", { name: /Confirm|确认/ }).click();
  await expect(picker).toHaveCount(0);

  await page.getByRole("button", { name: /Save|保存/ }).click();
  await expect.poll(() => patches.length).toBe(1);
  expect(patches[0]).toMatchObject({
    id: "demo-collection",
    name: "Changed collection",
    sourceIds: ["demo-source", "demo-source-secondary"],
    templateId: "fixture-template",
  });

  await page.goto("/edit/collections/demo-collection");
  await page.getByPlaceholder("The display name").fill("Discarded change");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/subs$/);
  expect(patches).toHaveLength(1);
});

test("source preview opens and closes without leaving scroll locked", async ({ page }) => {
  await installApiMocks(page);
  await page.route("**/api/preview/source", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ status: "success", data: { original: [], processed: [] } }),
  }));
  await page.goto("/edit/subs/demo-source");
  await page.getByRole("button", { name: /Preview|即时预览/ }).click();
  await expect(page.locator(".compare-page-wrapper")).toBeVisible();
  await page.getByRole("button", { name: "Close search" }).click();
  await expect(page.locator(".compare-page-wrapper")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => ({ html: document.documentElement.style.overflowY, body: document.body.style.overflowY }))).toEqual({ html: "", body: "" });
});

test("tag drawer closes on Escape without locking the editor page", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/edit/subs/demo-source");
  await page.locator(".tag-picker-trigger").click();
  await expect(page.locator(".t-drawer:visible")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".t-drawer:visible")).toHaveCount(0);
  await expect(page.locator(".page-wrapper")).toBeVisible();
});

for (const width of [375, 768, 1280] as const) {
  test(`collection selector is readable at ${width}px`, async ({ page }) => {
    await installApiMocks(page);
    await page.addInitScript(() => localStorage.setItem("locale", "zh"));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/edit/collections/demo-collection");
    await expect(page.locator(".page-wrapper")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await capture(page, `collection-${width}.png`);
    await page.goto("/edit/subs/demo-source");
    await expect(page.locator(".page-wrapper")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await capture(page, `source-${width}.png`);
  });
}
