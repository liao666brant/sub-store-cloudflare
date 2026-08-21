<template>
  <div class="app-layout-wrapper">
    <router-view />
  </div>
  <TabBar v-if="shouldShowTabBar" />
</template>

<script setup lang="ts">
import TabBar from "@/components/TabBar.vue";
import { useWideScreenNarrowMode } from "@/hooks/useWideScreenNarrowMode";

const { shouldShowTabBar } = useWideScreenNarrowMode();
</script>

<style scoped lang="scss">
.app-layout-wrapper {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 16px 0;
  overflow: auto;
  overscroll-behavior: contain;

  @media screen and (max-width: 767px) {
    padding-bottom: calc(72px + env(safe-area-inset-bottom));
  }
}
</style>
