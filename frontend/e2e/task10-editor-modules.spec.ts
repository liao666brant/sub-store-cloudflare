import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { installApiMocks } from "./fixtures";

const evidencePath = (name: string): string =>
  resolve(
    import.meta.dirname,
    "../../.omo/evidence/tdesign-vue-next-migration/task-10-editor-modules",
    name,
  );

for (const width of [375, 768, 1280] as const) {
  test(`editor action controls retain a CJK-safe layout at ${width}px`, async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.addInitScript(() => localStorage.setItem("locale", "zh"));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/edit/subs/demo-source");
    await page.getByRole("tab", { name: "操作" }).click();
    await expect(page.locator(".editor-actions-content")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await mkdir(dirname(evidencePath(`actions-${width}.png`)), {
      recursive: true,
    });
    await page
      .locator(".editor-actions-content")
      .screenshot({ path: evidencePath(`actions-${width}.png`) });
  });

  test(`CodeMirror toolbar stays reachable at ${width}px`, async ({ page }) => {
    await installApiMocks(page);
    await page.addInitScript(() => localStorage.setItem("locale", "zh"));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/edit/subs/demo-source");
    const toolbar = page.locator(".cm-toolbar");
    await expect(toolbar).toBeVisible();
    await expect(toolbar.getByRole("button", { name: "撤销" })).toBeVisible();
    await expect(
      toolbar.getByRole("button", { name: "清空代码" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await mkdir(dirname(evidencePath(`codemirror-${width}.png`)), {
      recursive: true,
    });
    await toolbar.screenshot({ path: evidencePath(`codemirror-${width}.png`) });
  });
}

for (const width of [375, 768, 1280] as const) {
  test(`editor action tab receives pointer input at ${width}px`, async ({ page }) => {
    await installApiMocks(page);
    await page.addInitScript(() => localStorage.setItem("locale", "zh"));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/edit/subs/demo-source");

    const actionTab = page.getByRole("tab", { name: "操作" });
    const hitTest = await actionTab.evaluate(tab => {
      const rect = tab.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(centerX, centerY);
      return {
        withinViewport: centerX >= 0 && centerX <= window.innerWidth && centerY >= 0 && centerY <= window.innerHeight,
        tabReceivesPointer: hit === tab || tab.contains(hit),
      };
    });

    expect(hitTest).toEqual({ withinViewport: true, tabReceivesPointer: true });
    await actionTab.click();
    await expect(page.locator(".editor-actions-content")).toBeVisible();
  });
}

test("editor action controls validate regex and retain dirty input when editing is cancelled", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.addInitScript(() => localStorage.setItem("locale", "zh"));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/edit/subs/demo-source");
  await page.getByRole("tab", { name: "操作" }).click();
  await page.getByRole("button", { name: "正则过滤" }).click();
  const regexInput = page.getByPlaceholder("填入正则表达式");
  await expect(regexInput).toBeVisible();
  await regexInput.fill("[");
  await page.getByRole("button", { name: "Add regex" }).click();
  await expect(page.getByText("数据格式错误")).toBeVisible();
  await regexInput.fill("foo");
  await page.getByRole("button", { name: "Add regex" }).click();
  await expect(
    page.getByRole("button", { name: "Edit regex 1" }),
  ).toBeVisible();
  await regexInput.fill("draft");
  await page.getByRole("button", { name: "Edit regex 1" }).press("Enter");
  await expect(page.getByText(/输入框存在未保存的内容/)).toBeVisible();
  await page.getByRole("button", { name: "取消" }).last().click();
  await expect(regexInput).toHaveValue("draft");
  await expect(
    page.getByRole("button", { name: "Edit regex 1" }),
  ).toContainText("foo");
  await page.getByRole("button", { name: "Edit regex 1" }).press("Enter");
  await page.getByRole("button", { name: "确认" }).last().click();
  await expect(page.getByText(/输入框存在未保存的内容/)).toBeHidden();
  await expect(regexInput).toHaveValue("foo");
  await expect(page.getByRole("button", { name: "Edit regex 1" })).toBeHidden();
  await mkdir(dirname(evidencePath("regex-dirty-cancel-1280.png")), {
    recursive: true,
  });
  await page
    .locator(".editor-actions-content")
    .screenshot({ path: evidencePath("regex-dirty-cancel-1280.png") });
});

test("editor action radio, checkbox and duplicate controls remain keyboard-operable", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.addInitScript(() => localStorage.setItem("locale", "zh"));
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/edit/subs/demo-source");
  await page.getByRole("tab", { name: "操作" }).click();
  await page.getByRole("button", { name: "区域过滤" }).click();
  const regionCard = page.locator(".list-group-item").last();
  const enabledSwitch = regionCard.getByRole("switch", { name: "启用" });
  await expect(enabledSwitch).toBeChecked();
  await enabledSwitch.focus();
  await enabledSwitch.press("Space");
  await expect(enabledSwitch).not.toBeChecked();
  await regionCard.getByText("过滤模式", { exact: true }).click();
  const hk = regionCard.getByRole("checkbox", { name: /HK/ });
  await regionCard.getByText("🇭🇰 HK", { exact: true }).click();
  await expect(hk).toBeChecked();
  await page.getByRole("button", { name: "域名解析" }).click();
  const resolveCard = page.locator(".list-group-item").last();
  await resolveCard.getByText("自定义", { exact: true }).click();
  const doh = resolveCard.getByPlaceholder("目前仅支持 DoH");
  await doh.fill("https://dns.example/doh");
  await expect(doh).toHaveValue("https://dns.example/doh");
  await page.getByRole("button", { name: "节点去重" }).click();
  const duplicateCard = page.locator(".list-group-item").last();
  await duplicateCard.getByText("删除", { exact: true }).click();
  await expect(
    duplicateCard.getByRole("radio", { name: "删除" }),
  ).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await mkdir(dirname(evidencePath("action-inputs-768.png")), {
    recursive: true,
  });
  await page
    .locator(".editor-actions-content")
    .screenshot({ path: evidencePath("action-inputs-768.png") });
});

test("duplicate edit confirmation closes its TDesign dialog before replacing the draft", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.addInitScript(() => localStorage.setItem("locale", "zh"));
  await page.goto("/edit/subs/demo-source");
  await page.getByRole("tab", { name: "操作" }).click();
  await page.getByRole("button", { name: "节点去重" }).click();
  const duplicateCard = page.locator(".list-group-item").last();
  const fieldInput = duplicateCard.getByPlaceholder(/请输入 name/);
  await fieldInput.fill("draft");
  await duplicateCard
    .getByRole("button", { name: "Edit field 1" })
    .press("Enter");
  await expect(page.getByText(/输入框存在未保存的内容/)).toBeVisible();
  await page.getByRole("button", { name: "确认" }).last().click();
  await expect(page.getByText(/输入框存在未保存的内容/)).toBeHidden();
  await expect(fieldInput).toHaveValue("name");
  await expect(
    duplicateCard.getByRole("button", { name: "Edit field 1" }),
  ).toBeHidden();
});

test("resolve help and dirty regex leave both require explicit TDesign confirmation", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.addInitScript(() => {
    window.open = (url) => {
      document.body.dataset.externalUrl = String(url);
      return null;
    };
    localStorage.setItem("locale", "zh");
  });
  await page.goto("/edit/subs/demo-source");
  await page.getByRole("tab", { name: "操作" }).click();
  await page.getByRole("button", { name: "域名解析" }).click();
  const resolveCard = page.locator(".list-group-item").last();
  await resolveCard.getByRole("button", { name: /解析类型/ }).click();
  await expect(page.getByText("IP4P 地址格式")).toBeVisible();
  await page.getByRole("button", { name: "取消" }).last().click();
  await expect(page.locator("body")).not.toHaveAttribute("data-external-url");
  await resolveCard.getByRole("button", { name: /解析类型/ }).click();
  await page.getByRole("button", { name: "更多说明" }).click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-external-url",
    /github\.com\/heiher\/natmap/,
  );
  await page.getByRole("button", { name: "正则过滤" }).click();
  const regexInput = page.getByPlaceholder("填入正则表达式");
  await regexInput.fill("draft");
  await page.getByRole("link", { name: "订阅" }).click();
  await expect(page.getByText("有内容未保存")).toBeVisible();
  await page.getByRole("button", { name: "继续编辑" }).click();
  await expect(page).toHaveURL(/\/edit\/subs\/demo-source$/);
  await expect(regexInput).toHaveValue("draft");
  await mkdir(dirname(evidencePath("action-confirmations.png")), {
    recursive: true,
  });
  await page
    .locator(".editor-actions-content")
    .screenshot({ path: evidencePath("action-confirmations.png") });
});

test("CodeMirror clear and undo preserve the unsaved local-source text", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.addInitScript(() => localStorage.setItem("locale", "zh"));
  await page.goto("/edit/subs/demo-source");
  const editorContent = page.locator(".cm-editor .cm-content");
  await expect(editorContent).toContainText("fixture node list");
  await page.getByRole("button", { name: "清空代码" }).click();
  await expect(editorContent).toHaveText("");
  await page.getByRole("button", { name: "撤销" }).click();
  await expect(editorContent).toContainText("fixture node list");
});
