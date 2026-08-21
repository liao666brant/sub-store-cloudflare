import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWideScreenNarrowMode } from "@/hooks/useWideScreenNarrowMode";

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: "/subs", component: { template: "<div />" }, meta: { needTabBar: true } },
    { path: "/preview", component: { template: "<div />" }, meta: { needTabBar: false } },
    { path: "/my", component: { template: "<div />" }, meta: { needTabBar: true, hideSideBarInWideScreenNarrowMode: true } },
  ],
});

describe("useWideScreenNarrowMode", () => {
  it("shows the tab bar only on tab routes below the sidebar breakpoint", async () => {
    // Given: a narrow viewport on a tab route.
    const router = createTestRouter();
    await router.push("/subs");
    await router.isReady();

    // When: the responsive hook is mounted inside that route.
    const wrapper = mount({
      setup: () => useWideScreenNarrowMode(),
      template: "<div>{{ shouldShowTabBar }}</div>",
    }, { global: { plugins: [router] } });

    // Then: the tab bar remains visible.
    expect(wrapper.text()).toBe("true");
  });

  it("hides the sidebar on preview and on every narrow viewport", async () => {
    // Given: a preview route in jsdom's narrow viewport.
    const router = createTestRouter();
    await router.push("/preview");
    await router.isReady();
    const wrapper = mount({
      setup: () => useWideScreenNarrowMode(),
      template: "<div>{{ shouldShowSideBar }}</div>",
    }, { global: { plugins: [router] } });
    // When: route and viewport state are evaluated.
    await wrapper.vm.$nextTick();

    // Then: preview suppresses the sidebar, and narrow mode does too.
    expect(wrapper.text()).toBe("false");
    await router.push("/subs");
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe("false");
  });
});
