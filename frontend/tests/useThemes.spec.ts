import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "@/store/settings";
import { useThemes } from "@/hooks/useThemes";

describe("useThemes", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.head.insertAdjacentHTML("beforeend", "<meta id=\"theme__color\">");
  });

  it("applies the persisted manual theme to document variables", async () => {
    // Given: a persisted manual dark theme.
    const settingsStore = useSettingsStore();
    settingsStore.theme = { auto: false, name: "dark", dark: "dark", light: "light" };

    // When: the theme hook initializes its reactive effect.
    const themes = useThemes();
    await nextTick();

    // Then: current mode and the document palette follow the persisted setting.
    expect(themes.currentMode()).toBe("dark");
    expect(document.documentElement.style.getPropertyValue("--background-color")).toBe("#121212");
    expect(document.getElementById("theme__color")?.getAttribute("content")).toBe("#121212");
  });

  it("groups every bundled theme into the overall picker and its light or dark picker", () => {
    // Given: default settings and the bundled theme modules.
    useSettingsStore();

    // When: the hook exposes picker options.
    const themes = useThemes();

    // Then: all themes are represented once, split by their declared label.
    expect(themes.pickerList.value).toHaveLength(8);
    expect(themes.pickerDarkList.value.length + themes.pickerLightList.value.length).toBe(8);
  });
});
