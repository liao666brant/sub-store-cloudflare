<template>
  <nav class="side-bar-wrapper" :aria-label="t('navBar.pagesTitle.sub')">
    <TMenu v-model="activeRoute" class="side-bar-wrapper__menu" :collapsed="!isExpanded" :width="176">
      <TMenuItem value="/subs" to="/subs" router-link>
        <template #icon><LinkIcon /></template>
        {{ t("tabBar.sub") }}
      </TMenuItem>
      <TMenuItem value="/tools" to="/tools" router-link>
        <template #icon><ToolsIcon /></template>
        {{ t("tabBar.tools") }}
      </TMenuItem>
      <TMenuItem value="/my" to="/my" router-link>
        <template #icon><SettingIcon /></template>
        {{ t("tabBar.my") }}
      </TMenuItem>
    </TMenu>
  </nav>
</template>

<script setup lang="ts">
import { LinkIcon, SettingIcon, ToolsIcon } from "tdesign-icons-vue-next";
import { Menu as TMenu, MenuItem as TMenuItem } from "tdesign-vue-next";
import { useWindowSize } from "@vueuse/core";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { SIDEBAR_EXPANDED_BREAKPOINT } from "@/store/system";

const route = useRoute();
const { t } = useI18n();
const { width: windowWidth } = useWindowSize();
const routeList = ["/subs", "/tools", "/my"] as const;
const activeRoute = computed(() => routeList.find(path => route.path === path) ?? "");
const isExpanded = computed(() => windowWidth.value >= SIDEBAR_EXPANDED_BREAKPOINT);
</script>

<style scoped lang="scss">
.side-bar-wrapper {
  height: 100%;
}

.side-bar-wrapper__menu {
  height: 100%;
  border: 0;
  background: transparent;
}

:deep(.t-default-menu__inner) {
  padding: var(--app-space-compact, 6px);
}
</style>
