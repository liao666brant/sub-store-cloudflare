import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { installApiMocks } from "./fixtures";

const viewports = [375, 768, 1280] as const;

const screenshotPath = (viewport: number): string => resolve(
  import.meta.dirname,
  "../../.omo/evidence/tdesign-vue-next-migration",
  `task-5-shell-${viewport}.png`,
);

const chineseScreenshotPath = (viewport: number): string => resolve(
  import.meta.dirname,
  "../../.omo/evidence/tdesign-vue-next-migration",
  `task-5-shell-zh-${viewport}.png`,
);

const navTitleScreenshotPath = (locale: "en" | "zh", viewport: number): string => resolve(
  import.meta.dirname,
  "../../.omo/evidence/tdesign-vue-next-migration",
  `task-5-nav-title-${locale}-${viewport}.png`,
);

const navTitleLocales = [
  { locale: "en", title: "Compatibility Tools" },
  { locale: "zh", title: "兼容工具" },
] as const;

for (const viewport of viewports) {
  test(`shell navigation remains keyboard-operable at ${viewport}px`, async ({ page }) => {
    await installApiMocks(page);
    await page.addInitScript(() => localStorage.setItem("locale", "zh"));
    await page.addInitScript(() => {
      const addEventListener = window.addEventListener;
      window.addEventListener = function (type, listener, options): void {
        if (type === "keydown" && options === true) {
          document.documentElement.dataset.task5KeydownCapture = "true";
        }
        addEventListener.call(this, type, listener, options);
      };
    });
    await page.setViewportSize({ width: viewport, height: 900 });
    await page.goto("/subs");

    const toolsLink = page.locator('a[href="/tools"]').first();
    await expect(toolsLink).toBeVisible();
    await toolsLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/tools$/);

    const settingsLink = page.locator('a[href="/my"]').first();
    await expect(settingsLink).toBeVisible();
    await settingsLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/my$/);

    await expect(page.locator("html")).not.toHaveAttribute("data-task5-keydown-capture", "true");

    const chineseOutputPath = chineseScreenshotPath(viewport);
    await mkdir(dirname(chineseOutputPath), { recursive: true });
    await page.screenshot({ path: chineseOutputPath, fullPage: true });

    await page.addInitScript(() => localStorage.setItem("locale", "en"));
    await page.reload();
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();

    const languageButton = page.locator("button.language-switch-button");
    await languageButton.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".language-switch-popup")).toBeVisible();
    await expect(page.locator(".language-switch-popup button").first()).toBeFocused();

    await languageButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.locator(".language-switch-popup")).toBeHidden();
    await expect(languageButton).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".language-switch-popup button").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator(".language-switch-popup")).toBeHidden();
    await expect(languageButton).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".language-switch-popup button").first()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "设置", exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("locale"))).toBe("zh");
    await expect(page.locator(".language-switch-popup")).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    const outputPath = screenshotPath(viewport);
    await mkdir(dirname(outputPath), { recursive: true });
    await page.screenshot({ path: outputPath, fullPage: true });
  });
}

for (const viewport of viewports) {
  test(`main content keeps a working vertical scroll owner at ${viewport}px`, async ({ page }) => {
    await installApiMocks(page);
    await page.setViewportSize({ width: viewport, height: 900 });
    await page.goto("/subs");
    await expect(page.locator(".subscriptions-page")).toBeVisible();

    // Given: tall content inside the page-level scroll owner (.app-layout-wrapper).
    await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.id = "scroll-reach-probe";
      probe.style.height = "3000px";
      document.querySelector(".subscriptions-page")!.appendChild(probe);
    });

    // When: the scroll owner scrolls to the bottom.
    const reachedBottom = await page.evaluate(async () => {
      const owner = document.querySelector(".app-layout-wrapper") as HTMLElement;
      owner.scrollTo({ top: owner.scrollHeight });
      await new Promise(resolve => setTimeout(resolve, 50));
      return owner.scrollTop + owner.clientHeight >= owner.scrollHeight - 1;
    });

    // Then: the bottom is reachable through the page owner, not the window.
    expect(reachedBottom).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.evaluate(() => document.getElementById("scroll-reach-probe")?.remove());
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

test("shell applies the persisted dark theme", async ({ page }) => {
  await installApiMocks(page);
  await page.route("**/api/settings", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      status: "success",
      data: {
        theme: { auto: false, name: "dark", dark: "dark", light: "light" },
      },
    }),
  }));
  await page.goto("/my");

  await expect(page.locator("html")).toHaveAttribute("theme-mode", "dark");
});

test("a missing edit record retains the existing not-found guard", async ({ page }) => {
  await installApiMocks(page);
  await page.route("**/api/sources/missing", route => route.fulfill({
    status: 404,
    contentType: "application/json",
    body: JSON.stringify({ status: "error", message: "missing fixture" }),
  }));
  await page.goto("/edit/subs/missing");

  await expect(page).toHaveURL(/\/404$/);
  await expect(page.locator(".t-empty__description")).toHaveText(/Oops! URL Error!|啊哦～ URL 错误！/);
});

for (const { locale, title: expectedTitle } of navTitleLocales) {
  for (const viewport of viewports) {
    test(`tools title remains readable in ${locale} at ${viewport}px`, async ({ page }) => {
    await installApiMocks(page);
    await page.addInitScript(value => localStorage.setItem("locale", value), locale);
    await page.setViewportSize({ width: viewport, height: 900 });
    await page.goto("/tools");

    const title = page.locator(".nav-bar-wrapper__title");
    await expect(title).toHaveText(expectedTitle);
    await expect.poll(() => title.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: navTitleScreenshotPath(locale, viewport), fullPage: true });
    });
  }
}
