import { expect, test } from "@playwright/test";
import { installApiMocks } from "./fixtures";

const routes = [
  "/subs",
  "/my",
  "/tools",
  "/preview?url=/fixture-preview.txt&name=Fixture",
  "/404",
  "/edit/subs/demo-source",
  "/edit/collections/demo-collection",
] as const;

const labelPrecedesControl = (element: Element): boolean => {
  const item = element.closest(".t-form__item");
  const control = item?.querySelector(".t-form__controls");
  if (!control) return false;
  return element.getBoundingClientRect().bottom <= control.getBoundingClientRect().top;
};

test("fixture routes emit no console or page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", error => errors.push(error.message));

  await installApiMocks(page);
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("#app")).not.toBeEmpty();
  }

  expect(errors).toEqual([]);
});

test("mobile feedback clears navigation and template titles stay whole", async ({ page }) => {
  await installApiMocks(page, "success", { appearanceSetting: { showFloatingRefreshButton: false } });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/my");

  const templateTitle = page.getByText("Rule Templates", { exact: true });
  await expect(templateTitle).toBeVisible();
  await expect.poll(() => templateTitle.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true);

  await page.locator("button.nav-bar-wrapper__action").click();
  const notificationTitle = page.locator(".t-message.t-is-info strong").last();
  await expect.poll(() => notificationTitle.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
  const [notificationBox, tabBarBox] = await Promise.all([
    page.locator(".t-message.t-is-info").last().boundingBox(),
    page.locator(".tab-bar-wrapper").boundingBox(),
  ]);
  expect(notificationBox).not.toBeNull();
  expect(tabBarBox).not.toBeNull();
  if (!notificationBox || !tabBarBox) throw new Error("Expected mobile notification and tab bar");
  expect(notificationBox.y + notificationBox.height).toBeLessThanOrEqual(tabBarBox.y);
});

for (const width of [375, 768, 1280]) {
  test(`editor labels remain complete at ${width}px`, async ({ page }) => {
    await installApiMocks(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/edit/subs/demo-source");
    const sourceLabel = page.getByText("Custom Icon Use Original Color", { exact: true });
    await expect(sourceLabel).toBeVisible();
    await expect.poll(() => sourceLabel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect.poll(() => sourceLabel.evaluate(labelPrecedesControl)).toBe(true);

    await page.goto("/edit/collections/demo-collection");
    const collectionLabel = page.locator("label").filter({ hasText: /^Source failure handling$/ });
    await expect(collectionLabel).toBeVisible();
    await expect.poll(() => collectionLabel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect.poll(() => collectionLabel.evaluate(labelPrecedesControl)).toBe(true);
  });
}
