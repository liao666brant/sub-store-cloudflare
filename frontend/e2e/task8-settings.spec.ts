import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { installApiMocks } from "./fixtures";

const settings = {
  defaultUserAgent: "fixture-agent",
  defaultFlowUserAgent: "fixture-flow-agent",
  defaultTimeout: "3000",
  backendRequestConcurrency: "4",
  backendRequestConcurrencyWaitTime: "0",
  remoteCacheTtl: "60",
  remoteCacheStaleOnError: true,
  nodeInfoApiUrl: "",
  theme: { auto: true, name: "light", dark: "dark", light: "light" },
  appearanceSetting: {},
};

const evidencePath = (name: string): string => resolve(
  import.meta.dirname,
  "../../.omo/evidence/tdesign-vue-next-migration/task8-settings",
  name,
);

const capture = async (page: import("@playwright/test").Page, name: string): Promise<void> => {
  const path = evidencePath(name);
  await mkdir(dirname(path), { recursive: true });
  await page.screenshot({ path, fullPage: true });
};

for (const width of [375, 768, 1280] as const) {
  test(`settings renders without horizontal overflow at ${width}px`, async ({ page }) => {
    await installApiMocks(page);
    await page.addInitScript(() => localStorage.setItem("locale", "zh"));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/my");
    await page.locator(".my-page").waitFor();
    await expect(page.locator(".my-page")).toBeVisible();
    await expect(page.locator("#app main")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await capture(page, `responsive-${width}.png`);
  });
}

test("settings theme controls persist auto and manual theme payloads", async ({ page }) => {
  const savedThemes: unknown[] = [];
  await installApiMocks(page);
  await page.route("**/api/settings", route => {
    if (route.request().method() === "GET") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: settings }) });
    }
    const payload = route.request().postDataJSON();
    savedThemes.push(payload.theme);
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: { theme: payload.theme } }) });
  });

  await page.addInitScript(() => localStorage.setItem("locale", "en"));
  await page.goto("/my");
  await page.locator(".theme-form").waitFor();
  await page.getByText("Manual", { exact: true }).click();
  await page.locator(".theme-actions button").click();
  await expect.poll(() => savedThemes.length).toBe(1);
  expect(savedThemes[0]).toEqual({ auto: false, name: "light", dark: "dark", light: "light" });

  await page.getByText("Follow system", { exact: true }).click();
  await page.locator(".theme-actions button").click();
  await expect.poll(() => savedThemes.length).toBe(2);
  expect(savedThemes[1]).toEqual({ auto: true, name: "light", dark: "dark", light: "light" });
  await capture(page, "theme-success.png");
});

test("persisted custom themes render immediately and retain the exact auto pair", async ({ page }) => {
  const savedThemes: unknown[] = [];
  const persistedTheme = { auto: false, name: "darkblue", dark: "monokai", light: "mocha" };
  await installApiMocks(page);
  await page.route("**/api/settings", route => {
    if (route.request().method() === "GET") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: { ...settings, theme: persistedTheme } }) });
    }
    const payload = route.request().postDataJSON();
    savedThemes.push(payload.theme);
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: { theme: payload.theme } }) });
  });

  await page.addInitScript(() => localStorage.setItem("locale", "en"));
  await page.goto("/my");
  await expect(page.getByText("Manual", { exact: true }).locator("..")).toHaveClass(/t-is-checked/);
  await expect(page.locator(".theme-form .t-select input").first()).toHaveValue("Dark Blue - Keywos");

  await page.getByText("Follow system", { exact: true }).click();
  await page.locator(".theme-form .t-select").nth(0).click();
  await page.getByText("摩卡 - Peng-YM", { exact: true }).click();
  await page.locator(".theme-form .t-select").nth(1).click();
  await page.getByText("Monokai Pro - Peng-YM", { exact: true }).click();
  await page.locator(".theme-actions button").click();
  await expect.poll(() => savedThemes.length).toBe(1);
  expect(savedThemes[0]).toEqual({ auto: true, name: "darkblue", dark: "monokai", light: "mocha" });
  await capture(page, "theme-custom-persisted.png");
});

test("settings theme save failure clears loading and keeps the page usable", async ({ page }) => {
  await installApiMocks(page);
  await page.route("**/api/settings", route => {
    if (route.request().method() === "GET") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: settings }) });
    }
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "error" }) });
  });

  await page.goto("/my");
  await page.locator(".theme-form").waitFor();
  await page.locator(".theme-actions button").click();
  await expect(page.locator(".t-message.t-is-error")).toHaveCount(1);
  await expect(page.locator(".theme-actions .t-is-loading")).toHaveCount(0);
  await expect(page.locator(".my-page")).toBeVisible();
  await capture(page, "theme-failure.png");
});

test("template create and backup restore retain their payload contracts", async ({ page }) => {
  const templatePayloads: unknown[] = [];
  const backupPayloads: unknown[] = [];
  await installApiMocks(page);
  await page.route("**/api/templates", route => {
    if (route.request().method() === "GET") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: [] }) });
    }
    templatePayloads.push(route.request().postDataJSON());
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: {} }) });
  });
  await page.route("**/api/storage", route => {
    backupPayloads.push(route.request().postDataJSON());
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: {} }) });
  });

  await page.goto("/my");
  await page.getByText("New", { exact: true }).click();
  await page.locator(".template-dialog").waitFor();
  const inputs = page.locator(".template-form input");
  await inputs.nth(0).fill("custom-mihomo");
  await inputs.nth(1).fill("Custom Mihomo");
  await page.locator(".template-editor .cm-content").click();
  await page.keyboard.insertText("proxies: []");
  await page.getByText("Save template", { exact: true }).click();
  await expect.poll(() => templatePayloads.length).toBe(1);
  expect(templatePayloads[0]).toEqual({ id: "custom-mihomo", name: "Custom Mihomo", target: "mihomo", content: "proxies: []" });
  await expect(page.locator(".template-dialog")).toHaveCount(0);

  const backupInput = page.locator("input[type=file]").first();
  await backupInput.setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from("{\"version\":1}") });
  await page.getByText("Restore backup", { exact: true }).waitFor();
  await page.waitForTimeout(350);
  await capture(page, "backup-restore-confirmation.png");
  await page.getByText("Restore", { exact: true }).last().click();
  await expect.poll(() => backupPayloads.length).toBe(1);
  expect(backupPayloads[0]).toEqual({ content: "{\"version\":1}" });
});

test("template update and delete cover confirmation, loading, success, and failure recovery", async ({ page }) => {
  const templatePayloads: Array<{ method: string; path: string; body?: unknown }> = [];
  const templates = [
    { id: "editable-mihomo", name: "Editable Mihomo", target: "mihomo", content: "proxies: []" },
    { id: "delete-success", name: "Delete success", target: "mihomo", content: "proxies: []" },
    { id: "delete-failure", name: "Delete failure", target: "mihomo", content: "proxies: []" },
  ];
  let releaseDelete: (() => void) | undefined;
  const deleteSuccessGate = new Promise<void>(resolve => {
    releaseDelete = resolve;
  });

  await installApiMocks(page);
  await page.route("**/api/templates{,/**}", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "GET") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: templates }) });
    }

    templatePayloads.push({ method: request.method(), path, body: request.postDataJSON() });
    if (request.method() === "PATCH") {
      const index = templates.findIndex(template => `/api/templates/${template.id}` === path);
      templates[index] = request.postDataJSON() as (typeof templates)[number];
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: templates[index] }) });
    }

    if (path.endsWith("delete-failure")) {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "error" }) });
    }

    await deleteSuccessGate;
    const index = templates.findIndex(template => `/api/templates/${template.id}` === path);
    templates.splice(index, 1);
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "success", data: {} }) });
  });

  await page.goto("/my");
  const editableRow = page.locator(".template-list .t-list-item").filter({ hasText: "Editable Mihomo" });
  await editableRow.getByText("Edit", { exact: true }).click();
  await page.locator(".template-dialog").waitFor();
  await page.locator(".template-editor .cm-content").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("proxies: [updated]");
  await page.getByText("Save template", { exact: true }).click();
  await expect.poll(() => templatePayloads.length).toBe(1);
  expect(templatePayloads[0]).toEqual({
    method: "PATCH",
    path: "/api/templates/editable-mihomo",
    body: { id: "editable-mihomo", name: "Editable Mihomo", target: "mihomo", content: "proxies: [updated]" },
  });

  const deleteSuccessRow = page.locator(".template-list .t-list-item").filter({ hasText: "Delete success" });
  await deleteSuccessRow.getByText("Delete", { exact: true }).click();
  const deleteDialog = page.locator(".t-dialog").filter({ hasText: "Delete template delete-success?" });
  await expect(deleteDialog).toBeVisible();
  const deleteButton = deleteDialog.getByRole("button", { name: "Delete", exact: true });
  await deleteButton.click();
  await expect(deleteButton).toHaveClass(/t-is-loading/);
  await capture(page, "template-delete-loading.png");
  releaseDelete?.();
  await expect(deleteSuccessRow).toHaveCount(0);

  const deleteFailureRow = page.locator(".template-list .t-list-item").filter({ hasText: "Delete failure" });
  await deleteFailureRow.getByText("Delete", { exact: true }).click();
  const failureDialog = page.locator(".t-dialog").filter({ hasText: "Delete template delete-failure?" });
  const failureDeleteButton = failureDialog.getByRole("button", { name: "Delete", exact: true });
  await failureDeleteButton.click();
  await expect(page.locator(".t-message.t-is-error")).toHaveCount(1);
  await expect(failureDeleteButton).not.toHaveClass(/t-is-loading/);
  await expect(failureDialog).toBeVisible();
  await capture(page, "template-delete-failure.png");
  await failureDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".my-page")).toBeVisible();
});
