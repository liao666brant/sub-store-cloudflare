import type { Page, Route } from "@playwright/test";

type SettingsMode = "success" | "failure";
type FixtureOptions = {
  readonly appearanceSetting?: Partial<typeof settings.appearanceSetting>;
};

const success = (data: unknown) => ({ status: "success", data });

const source = {
  id: "demo-source",
  name: "Demo source",
  type: "local",
  content: "fixture node list",
  enabled: true,
  filters: [],
  meta: { tag: ["fixture"] },
};

const secondarySource = {
  id: "demo-source-secondary",
  name: "Demo source secondary",
  type: "local",
  content: "fixture node list two",
  enabled: true,
  filters: [],
  meta: { tag: ["fixture"] },
};

const collection = {
  id: "demo-collection",
  name: "Demo collection",
  sourceIds: ["demo-source"],
  templateId: "mihomo-basic",
  enabled: true,
  filters: [],
  meta: { tag: ["fixture"] },
};

const settings = {
  defaultUserAgent: "fixture-agent",
  defaultFlowUserAgent: "fixture-flow-agent",
  defaultTimeout: "3000",
  backendRequestConcurrency: "4",
  backendRequestConcurrencyWaitTime: "0",
  remoteCacheTtl: "60",
  remoteCacheStaleOnError: true,
  nodeInfoApiUrl: "",
  syncTime: 0,
  avatarUrl: "",
  theme: { auto: true, name: "light", dark: "dark", light: "light" },
  appearanceSetting: {
    isSimpleMode: true,
    isLeftRight: false,
    isShowIcon: false,
    isSubItemMenuFold: true,
    showFloatingAddButton: true,
    showFloatingRefreshButton: true,
    listPageViewMode: "dual-column",
    useNarrowModeOnWideScreen: false,
  },
};

const fulfillJson = (route: Route, body: unknown, status = 200) => route.fulfill({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

export const installApiMocks = async (
  page: Page,
  settingsMode: SettingsMode = "success",
  options: FixtureOptions = {},
) => {
  await page.route("**/fixture-preview.txt", route => route.fulfill({
    status: 200,
    contentType: "text/plain",
    body: "fixture preview output",
  }));

  await page.route(url => url.pathname.startsWith("/api/"), route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/env") {
      return fulfillJson(route, success({ backend: "cloudflare", version: "fixture", meta: { node: { env: {} } } }));
    }
    if (path === "/api/settings") {
      const settingsPayload = {
        ...settings,
        appearanceSetting: { ...settings.appearanceSetting, ...options.appearanceSetting },
      };
      return fulfillJson(route, settingsMode === "success" ? success(settingsPayload) : { status: "error", message: "fixture settings failure" });
    }
    if (path === "/api/sources") return fulfillJson(route, success([source, secondarySource]));
    if (path === "/api/collections") return fulfillJson(route, success([collection]));
    if (path === "/api/templates") return fulfillJson(route, success([
      { id: "mihomo-basic", name: "Mihomo basic", content: "proxies: []" },
      { id: "fixture-template", name: "Fixture template", content: "proxies: []" },
    ]));
    if (path === "/api/scripts") return fulfillJson(route, success([]));
    if (path === "/api/shares") return fulfillJson(route, success([]));
    if (path === "/api/recycle-bin") return fulfillJson(route, success([]));
    if (path === "/api/source/flow/demo-source") {
      return fulfillJson(route, success({ planName: "Fixture", remainingDays: 12, total: 1000, usage: { upload: 100, download: 200 } }));
    }
    if (path === "/api/sources/demo-source") return fulfillJson(route, success(source));
    if (path === "/api/sources/demo-source-secondary") return fulfillJson(route, success(secondarySource));
    if (path === "/api/collections/demo-collection") return fulfillJson(route, success(collection));
    if (path === "/api/proxy/parse" || path === "/api/rule/parse") {
      return fulfillJson(route, success({ content: "fixture converted output", parsed: 1, emitted: 1, skipped: 0 }));
    }
    if (path.startsWith("/api/link/")) return fulfillJson(route, success({ url: "/download/fixture" }));

    return fulfillJson(route, success({}));
  });
};
