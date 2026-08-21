<template>
  <nav class="tab-bar-wrapper" :aria-label="t('navBar.pagesTitle.sub')">
    <THeadMenu v-model="activeRoute" class="tab-bar-wrapper__menu">
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
    </THeadMenu>
  </nav>
</template>

<script setup lang="ts">
import { LinkIcon, SettingIcon, ToolsIcon } from "tdesign-icons-vue-next";
import { HeadMenu as THeadMenu, MenuItem as TMenuItem } from "tdesign-vue-next";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const route = useRoute();
const { t } = useI18n();
const routeList = ["/subs", "/tools", "/my"] as const;
const activeRoute = computed(() => routeList.find(path => route.path === path) ?? "");
</script>

<style scoped lang="scss">
.tab-bar-wrapper {
  position: fixed;
  z-index: 101;
  right: 0;
  bottom: 0;
  left: 0;
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--td-bg-color-container, var(--tab-bar-color));
  border-top: 1px solid var(--td-component-stroke, var(--divider-color));
}

.tab-bar-wrapper__menu {
  justify-content: center;
  min-height: 56px;
  background: transparent;
}

:deep(.t-head-menu__inner) {
  justify-content: space-evenly;
}

:deep(.t-menu__item) {
  flex: 1;
  justify-content: center;
}
</style>
