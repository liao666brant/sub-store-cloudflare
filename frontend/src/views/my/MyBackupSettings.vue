<template>
  <div class="backup-controls">
    <input ref="backupFileInput" class="visually-hidden" type="file" accept="application/json,.json" @change="selectBackupForRestore" />
    <TButton size="small" variant="outline" theme="primary" :loading="restoreIsLoading" @click="openBackupFilePicker">
      <template #icon><CloudUploadIcon /></template>
      {{ t("myPage.backup.restore") }}
    </TButton>
    <TButton size="small" theme="primary" :loading="exportIsLoading" @click="exportBackup">
      <template #icon><CloudDownloadIcon /></template>
      {{ t("myPage.backup.export") }}
    </TButton>
    <TDialog v-model:visible="restoreDialogVisible" :header="t('myPage.backup.restoreTitle')" :body="t('myPage.backup.restoreContent')" :cancel-btn="t('myPage.btn.cancel')" :confirm-btn="t('myPage.backup.restore')" :confirm-loading="restoreIsLoading" theme="warning" prevent-scroll-through show-overlay @confirm="restoreFromBackup" @close="closeRestoreDialog" />
  </div>
</template>

<script lang="ts" setup>
import { CloudDownloadIcon, CloudUploadIcon } from "tdesign-icons-vue-next";
import { Button as TButton, Dialog as TDialog } from "tdesign-vue-next";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsApi } from "@/api/settings";
import { showNotify } from "@/plugin/tdesign";
import { useSettingsStore } from "@/store/settings";

const settingsStore = useSettingsStore();
const settingsApi = useSettingsApi();
const { t } = useI18n();
const backupFileInput = ref<HTMLInputElement | null>(null);
const backupFile = ref<File | null>(null);
const exportIsLoading = ref(false);
const restoreIsLoading = ref(false);
const restoreDialogVisible = ref(false);

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const openBackupFilePicker = (): void => {
  backupFileInput.value?.click();
};

const selectBackupForRestore = (event: Event): void => {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  const selectedFile = input?.files?.[0];
  if (input) input.value = "";
  if (!selectedFile) return;
  backupFile.value = selectedFile;
  restoreDialogVisible.value = true;
};

const closeRestoreDialog = (): void => {
  if (!restoreIsLoading.value) backupFile.value = null;
};

const exportBackup = async (): Promise<void> => {
  exportIsLoading.value = true;
  try {
    const response = await settingsApi.downloadBackup();
    const objectUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `sub-store-cloudflare-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    showNotify({ type: "danger", title: t("myPage.notify.backup.failedWithError", { e: errorMessage(error) }) });
  } finally {
    exportIsLoading.value = false;
  }
};

const restoreFromBackup = async (): Promise<void> => {
  if (!backupFile.value) return;
  restoreIsLoading.value = true;
  try {
    const response = await settingsApi.restoreSettings({ content: await backupFile.value.text() });
    if (response?.data?.status !== "success") throw new Error("restore failed");
    await settingsStore.fetchSettings();
    restoreDialogVisible.value = false;
    backupFile.value = null;
    showNotify({ type: "success", title: t("myPage.notify.restore.succeed") });
  } catch (error) {
    showNotify({ type: "danger", title: t("myPage.notify.restore.failedWithError", { e: errorMessage(error) }) });
  } finally {
    restoreIsLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.backup-controls {
  display: flex;
  align-items: center;
  gap: var(--app-space-control);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (max-width: 640px) {
  .backup-controls {
    inline-size: 100%;
    align-items: stretch;
  }

  .backup-controls :deep(.t-button) {
    flex: 1;
  }
}
</style>
