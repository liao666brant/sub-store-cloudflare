<template>
  <Teleport to="#app" :disabled="Boolean(url)">
    <section class="preview-page" :class="{ 'preview-overlay': !url }">
      <header class="preview-header">
        <template v-if="url">
          <div class="subscription-link">
            <TButton variant="text" theme="primary" size="small" @click="copyUrl"><template #icon><FileCopyIcon /></template>{{ t('comparePage.subscriptionPreviewCopyLabel') }}</TButton>
            <a :href="url" target="_blank" rel="noreferrer">{{ url }}</a>
          </div>
        </template>
        <template v-else>
          <div class="header-actions">
            <TButton variant="text" shape="square" :aria-label="t('navBar.listSearch.close')" @click="clickClose"><template #icon><CloseIcon /></template></TButton>
            <TButton v-if="showRefresh" variant="text" shape="square" :aria-label="t('navBar.actions.refresh')" @click="emit('refresh')"><template #icon><RefreshIcon /></template></TButton>
          </div>
          <h1>{{ t('comparePage.title') }}</h1>
          <span />
        </template>
      </header>
      <cmView :is-read-only="false" id="subscriptionPreview" />
    </section>
  </Teleport>
</template>

<script lang="ts" setup>
import axios from "axios";
import { CloseIcon, FileCopyIcon, RefreshIcon } from "tdesign-icons-vue-next";
import { Button as TButton } from "tdesign-vue-next";
import { computed, watch, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { showNotify } from "@/plugin/tdesign";
import cmView from "@/views/editCode/cmView.vue";
import { useCodeStore } from "@/store/codeStore";
import { useRoute } from "vue-router";

const props = defineProps<{
  readonly previewData: { readonly processed?: string } | undefined;
  readonly name: string;
  readonly showRefresh?: boolean;
}>();
const emit = defineEmits<{ readonly closePreview: []; readonly refresh: [] }>();
const route = useRoute();
const { t } = useI18n();
const cmStore = useCodeStore();
const url = computed(() => typeof route.query.url === "string" ? route.query.url : "");
const showRefresh = computed(() => props.showRefresh !== false);
const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);
watchEffect(async () => {
  if (url.value) {
    try {
      cmStore.setEditCode("subscriptionPreview", "Loading...");
      const response = await axios.get(url.value, { responseType: "text", transformResponse: [data => data] });
      cmStore.setEditCode("subscriptionPreview", response.data || "");
    } catch (error) {
      const message = errorMessage(error);
      cmStore.setEditCode("subscriptionPreview", `Error: ${message}`);
      showNotify({ type: "danger", title: t("comparePage.subscriptionPreviewLoadFailed", { e: message }) });
    }
  }
  if (typeof route.query.name === "string") document.title = `${route.query.name} - Sub Store`;
});
watch(() => props.previewData?.processed, value => {
  if (!url.value && value != null) cmStore.setEditCode("subscriptionPreview", value);
}, { immediate: true });
const clickClose = (): void => emit("closePreview");
const copyUrl = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(url.value);
    showNotify({ type: "success", title: t("comparePage.subscriptionPreviewCopied", { url: url.value }) });
  } catch (error) {
    showNotify({ type: "danger", title: t("comparePage.subscriptionPreviewLoadFailed", { e: errorMessage(error) }) });
  }
};
</script>

<style lang="scss" scoped>
.preview-page {
  --preview-header-height: 56px;
  display: flex;
  width: 100%;
  height: calc(100dvb - 80px);
  flex-direction: column;
  overflow: hidden;
  background: var(--td-bg-color-page);
}

.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  height: 100dvb;
}

.preview-header {
  display: grid;
  min-height: var(--preview-header-height);
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: var(--app-space-control);
  padding-inline: var(--app-space-inline-safe);
  border-bottom: 1px solid var(--td-component-stroke);
  background: var(--td-bg-color-container);
}

.preview-header h1 {
  grid-column: 2;
  margin: 0;
  color: var(--td-text-color-primary);
  font-size: var(--td-font-size-title-medium);
}

.header-actions {
  display: flex;
  gap: var(--app-space-compact);
}

.subscription-link {
  display: flex;
  min-width: 0;
  grid-column: 1 / -1;
  align-items: center;
  gap: var(--app-space-compact);
}

.subscription-link a {
  overflow: hidden;
  color: var(--td-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.cmview) {
  min-block-size: 0;
  flex: 1;
}
</style>
