import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getOne = vi.hoisted(() => vi.fn());
const cancelFetchFlows = vi.hoisted(() => vi.fn());
const globalStore = vi.hoisted(() => ({ env: {}, savedPositions: {}, setSavedPositions: vi.fn() }));

vi.mock("@/api/app", () => ({ useCloudflareApi: () => ({ getOne }) }));
vi.mock("@/api/env", () => ({ useEnvApi: () => ({ getEnv: vi.fn() }) }));
vi.mock("@/store/global", () => ({ useGlobalStore: () => globalStore }));
vi.mock("@/store/subs", () => ({ useSubsStore: () => ({ cancelFetchFlows }) }));
vi.mock("@/utils/initApp", () => ({ initStores: vi.fn() }));
vi.mock("@/locales", () => ({ default: { global: { t: (key: string) => key } } }));
vi.mock("@/layout/AppLayout.vue", () => ({ default: { template: "<router-view />" } }));
vi.mock("@/views/Sub.vue", () => ({ default: { template: "<div />" } }));
vi.mock("@/views/SubEditor.vue", () => ({ default: { template: "<div />" } }));
vi.mock("@/views/NotFound.vue", () => ({ default: { template: "<div />" } }));

describe("editor route existence guard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getOne.mockReset();
    cancelFetchFlows.mockReset();
    globalStore.env = {};
    globalStore.savedPositions = {};
  });

  it("redirects missing source records to the not-found route", async () => {
    // Given: the source lookup rejects for a direct editor URL.
    getOne.mockRejectedValue(new Error("missing fixture record"));
    const { default: router } = await import("@/router");

    // When: the missing editor route is resolved.
    await router.push("/edit/subs/missing-source");
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe("/404"));

    // Then: the guard checked the source endpoint before redirecting.
    expect(getOne).toHaveBeenCalledWith("sub", "missing-source");
    // 动态导入 @/router 会拉起完整视图依赖，冷启动可超过 Vitest 默认 5s。
  }, 20000);

  it("allows untitled editor records without issuing a lookup", async () => {
    // Given: the built-in untitled source editor route.
    getOne.mockResolvedValue({ data: { status: "success" } });
    const { default: router } = await import("@/router");

    // When: the route is resolved.
    await router.push("/edit/subs/UNTITLED");
    await router.isReady();

    // Then: no existence request is made and the editor route remains active.
    expect(router.currentRoute.value.fullPath).toBe("/edit/subs/UNTITLED");
    expect(getOne).not.toHaveBeenCalled();
  }, 20000);
});
