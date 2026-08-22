<template>
  <ConfigProvider :global-config="tdesignConfig">
    <TLayout class="app-shell">
      <THeader class="app-shell__header" height="56px">
        <NavBar />
      </THeader>
      <TLayout class="app-shell__workspace">
        <TAside v-if="shouldShowSideBar" class="app-shell__aside" :width="sidebarWidth">
          <SideBar />
        </TAside>
        <TContent class="page-body">
          <router-view />
        </TContent>
      </TLayout>
    </TLayout>
  </ConfigProvider>
</template>

<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import SideBar from "@/components/SideBar.vue";
import { useWideScreenNarrowMode } from "@/hooks/useWideScreenNarrowMode";
import { useThemes } from "@/hooks/useThemes";
import { useTDesignConfig, useTDesignThemeMode } from "@/plugin/tdesign";
import { useGlobalStore } from "@/store/global";
import { SIDEBAR_EXPANDED_BREAKPOINT } from "@/store/system";
import { useSubsStore } from "@/store/subs";
import { getFlowsUrlList } from "@/utils/getFlowsUrlList";
import { initStores } from "@/utils/initApp";
import { useWindowSize } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { Aside as TAside, ConfigProvider, Content as TContent, Header as THeader, Layout as TLayout } from "tdesign-vue-next";
import { computed, onMounted, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

const subsStore = useSubsStore();
const globalStore = useGlobalStore();
const { shouldShowSideBar } = useWideScreenNarrowMode();
const { width: windowWidth } = useWindowSize();
const { locale } = useI18n();
const tdesignConfig = useTDesignConfig(() => String(locale.value));
const sidebarWidth = computed(() => windowWidth.value >= SIDEBAR_EXPANDED_BREAKPOINT ? "176px" : "64px");
const { subs, flows } = storeToRefs(subsStore);
const allLength = ref<number | null>(null);

useThemes();
useTDesignThemeMode();

onMounted(() => {
  void initStores(true, true, false);
});

watchEffect(() => {
  const flowKeys = getFlowsUrlList(subs.value).map(([url]) => url);
  allLength.value = flowKeys.length;
  globalStore.setFlowFetching(flowKeys.some(url => !(url in flows.value)));
});
</script>

<style lang="scss">
#app {
  min-height: 100dvb;
  width: 100%;
  overflow: hidden;
  font-family: "Roboto", "Noto Sans", Arial, "PingFang SC", "Source Han Sans SC", "Source Han Sans CN", "Microsoft YaHei", "ST Heiti", SimHei, sans-serif;
}

.app-shell {
  min-height: 100dvb;
  height: 100dvb;
  background: var(--td-bg-color-page);
}

.app-shell__header {
  flex: 0 0 56px;
  background: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-component-stroke);
}

.app-shell__workspace {
  min-height: 0;
  overflow: hidden;
}

.app-shell__aside {
  flex: 0 0 auto;
  overflow: hidden;
  background: var(--td-bg-color-container);
  border-right: 1px solid var(--td-component-stroke);
}

.page-body {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.page-body > * {
  flex: 1 1 auto;
  min-width: 0;
}

.page-body .editor-section-tabs {
  position: sticky;
  inset-inline: 0;
  width: auto;
  max-width: none;
  transform: none;
}
</style>
