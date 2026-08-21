import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/locales";
import { useSettingsStore } from "@/store/settings";

vi.mock("vue-clipboard3", () => ({ default: () => ({ toClipboard: vi.fn() }) }));
vi.mock("@/api/app", () => ({
  useCloudflareApi: () => ({
    getDownloadLink: vi.fn(),
    previewItem: vi.fn(),
    downloadSource: vi.fn(),
    createItem: vi.fn(),
    getOne: vi.fn(),
  }),
}));
vi.mock("@/components/PreviewPanel.vue", () => ({ default: { template: "<div />" } }));
vi.mock("@/views/CompareTable.vue", () => ({ default: { template: "<div />" } }));

import SubListItem from "@/components/SubListItem.vue";

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: "/", component: { template: "<div />" } },
    { path: "/edit/:type/:id", component: { template: "<div />" } },
  ],
});

describe("SubListItem", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("opens the folded menu and routes its edit action to the encoded source id", async () => {
    // Given: a non-simple source item with a folded action menu.
    const router = createTestRouter();
    await router.push("/");
    await router.isReady();
    const settingsStore = useSettingsStore();
    settingsStore.appearanceSetting.isSimpleMode = false;
    settingsStore.appearanceSetting.isSubItemMenuFold = true;
    const wrapper = mount(SubListItem, {
      props: {
        type: "sub",
        sub: {
          name: "demo source",
          displayName: "Demo source",
          source: "local",
          process: [],
          tag: [],
        },
      },
      global: {
        plugins: [router, i18n],
        stubs: {
          PreviewPanel: true,
          CompareTable: true,
        },
      },
    });

    // When: the user expands the menu and activates edit.
    await wrapper.get('button[aria-label="Expand quick actions"]').trigger("click");
    await wrapper.get('button[aria-label="Edit"]').trigger("click");

    // Then: the current source editor route preserves URI encoding.
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe("/edit/subs/demo%20source"));
  });

  it("opens the existing confirmation dialog before deleting an item", async () => {
    // Given: a source item whose actions are visible.
    const router = createTestRouter();
    await router.push("/");
    await router.isReady();
    const settingsStore = useSettingsStore();
    settingsStore.appearanceSetting.isSimpleMode = false;
    settingsStore.appearanceSetting.isLeftRight = false;
    const wrapper = mount(SubListItem, {
      props: {
        type: "sub",
        sub: { name: "demo-source", displayName: "Demo source", source: "local", process: [], tag: [] },
      },
      global: {
        plugins: [router, i18n],
        stubs: {
          PreviewPanel: true,
          CompareTable: true,
        },
      },
    });

    // When: the explicit secondary action menu opens and delete is selected.
    await wrapper.get('button[aria-label="Expand quick actions"]').trigger("click");
    await wrapper.get('button[aria-label="Delete"]').trigger("click");

    // Then: deletion remains gated by the TDesign confirmation dialog state.
    expect(wrapper.vm.deleteDialogVisible).toBe(true);
  });

  it("exposes separate keyboard-accessible preview and comparison controls", async () => {
    const router = createTestRouter();
    await router.push("/");
    await router.isReady();
    const settingsStore = useSettingsStore();
    settingsStore.appearanceSetting.isShowIcon = true;
    const wrapper = mount(SubListItem, {
      props: {
        type: "sub",
        sub: { name: "keyboard-source", displayName: "Keyboard source", source: "local", process: [], tag: [] },
      },
      global: { plugins: [router, i18n], stubs: { PreviewPanel: true, CompareTable: true } },
    });

    await wrapper.get('button[aria-label="Copy/Preview a subscription"]').trigger("keydown.enter");
    expect(wrapper.vm.previewPanelVisible).toBe(true);
    await wrapper.get('button[aria-label="Preview"]').trigger("click");
    await vi.waitFor(() => expect(wrapper.vm.compareTableIsVisible).toBe(true));
  });
});
