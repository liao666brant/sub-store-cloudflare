<template>
  <section class="not-found-page">
    <TEmpty :description="description">
      <template #action>
        <TButton theme="primary" @click="goHome">
          {{ t("notFoundPage.desc") }}
        </TButton>
      </template>
    </TEmpty>
  </section>
</template>

<script setup lang="ts">
import { Button as TButton, Empty as TEmpty } from "tdesign-vue-next";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const isBackend = computed(() => /\/(api|download)\/.+/.test(route.fullPath));
const description = computed(() => isBackend.value ? t("notFoundPage.backendDesc") : t("notFoundPage.title"));

const goHome = (): void => {
  void router.push("/");
};
</script>

<style scoped lang="scss">
.not-found-page {
  display: grid;
  min-height: 100%;
  place-items: center;
  padding: var(--app-space-block, 24px);
  color: var(--td-text-color-primary, var(--primary-text-color));
}
</style>
