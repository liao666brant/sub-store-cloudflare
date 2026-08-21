import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getSettings: vi.fn(),
  setSettings: vi.fn(),
}));
const notify = vi.hoisted(() => vi.fn());
const feedback = vi.hoisted(() => ({ showLoading: vi.fn(), closeLoading: vi.fn() }));

vi.mock("@/api/settings", () => ({ useSettingsApi: () => api }));
vi.mock("@/store/appNotify", () => ({ useAppNotifyStore: () => ({ showNotify: notify }) }));
vi.mock("@/utils/requestConcurrency", () => ({ runFrontendRequestTask: (task: () => Promise<unknown>) => task() }));
vi.mock("@/plugin/tdesign", () => feedback);

import { useSettingsStore } from "@/store/settings";

const successResponse = {
  data: {
    status: "success",
    data: {
      defaultUserAgent: "fixture-agent",
      theme: { auto: false, name: "dark", dark: "dark", light: "light" },
      appearanceSetting: { listPageViewMode: "dual-column", useNarrowModeOnWideScreen: true },
    },
  },
};

describe("useSettingsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    api.getSettings.mockReset();
    api.setSettings.mockReset();
    notify.mockReset();
    feedback.showLoading.mockReset();
    feedback.closeLoading.mockReset();
  });

  it("hydrates settings and marks the store fetched when the API succeeds", async () => {
    // Given: a successful public settings response.
    api.getSettings.mockResolvedValue(successResponse);
    const settingsStore = useSettingsStore();

    // When: settings are fetched.
    await settingsStore.fetchSettings();

    // Then: server settings and local appearance cache are applied.
    expect(settingsStore.hasFetchedSettings).toBe(true);
    expect(settingsStore.defaultUserAgent).toBe("fixture-agent");
    expect(settingsStore.appearanceSetting.listPageViewMode).toBe("dual-column");
    expect(localStorage.getItem("appearanceSetting.useNarrowModeOnWideScreen")).toBe("1");
  });

  it("notifies and leaves the store unfetched when the API response is not successful", async () => {
    // Given: a non-success response from the settings endpoint.
    api.getSettings.mockResolvedValue({ data: { status: "error" } });
    const settingsStore = useSettingsStore();

    // When: settings are fetched.
    await settingsStore.fetchSettings();

    // Then: the failure is visible and no stale fetched marker remains.
    expect(settingsStore.hasFetchedSettings).toBe(false);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: "danger" }));
  });

  it("always removes the theme loading indicator after a failed theme save", async () => {
    // Given: a failed theme save response.
    api.setSettings.mockResolvedValue({ data: { status: "error" } });
    const settingsStore = useSettingsStore();

    // When: a theme is saved.
    await settingsStore.changeTheme({ theme: { auto: true, dark: "dark", light: "light" } });

    // Then: loading is closed and the user receives one failure notification.
    expect(feedback.showLoading).toHaveBeenCalledWith(expect.any(String), { cover: true, id: "theme__loading" });
    expect(feedback.closeLoading).toHaveBeenCalledWith("theme__loading");
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: "danger" }));
  });
});
