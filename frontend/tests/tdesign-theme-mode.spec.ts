import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it } from "vitest";
import { useTDesignThemeMode } from "@/plugin/tdesign";
import { useSettingsStore } from "@/store/settings";

describe("useTDesignThemeMode", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.documentElement.removeAttribute("theme-mode");
  });

  it("derives manual custom themes from their declared light or dark label", async () => {
    const settingsStore = useSettingsStore();
    settingsStore.theme = { auto: false, name: "darkblue", dark: "dark", light: "light" };
    useTDesignThemeMode();

    await nextTick();
    expect(document.documentElement.getAttribute("theme-mode")).toBe("dark");

    settingsStore.theme.name = "lightblue";
    await nextTick();
    expect(document.documentElement.getAttribute("theme-mode")).toBe("light");

    settingsStore.theme.name = "mocha";
    await nextTick();
    expect(document.documentElement.getAttribute("theme-mode")).toBe("light");
  });

  it("uses the OS preference when automatic mode is enabled", async () => {
    const settingsStore = useSettingsStore();
    settingsStore.theme = { auto: true, name: "darkblue", dark: "dark", light: "light" };
    useTDesignThemeMode();

    await nextTick();
    expect(document.documentElement.getAttribute("theme-mode")).toBe("light");
  });
});
