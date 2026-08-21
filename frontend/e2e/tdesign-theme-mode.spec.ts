import { expect, test } from "@playwright/test";
import { installApiMocks } from "./fixtures";

test("custom dark theme configures the rendered TDesign root as dark", async ({ page }) => {
  await installApiMocks(page);
  await page.route("**/api/settings", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      status: "success",
      data: {
        theme: { auto: false, name: "darkblue", dark: "dark", light: "light" },
      },
    }),
  }));

  await page.goto("/my");

  await expect(page.locator("#app .my-page")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("theme-mode", "dark");
});
