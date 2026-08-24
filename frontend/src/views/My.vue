<template>
  <div class="my-page-wrapper">
    <section class="profile-block">
      <div class="radio-wrapper">
        <span class="tag current">{{ env.runtime || env.backend || "Cloudflare" }}</span>
        <div class="storage-language-switch">
          <LanguageSwitcherButton />
        </div>
      </div>
      <div class="info">
        <div class="avatar-wrapper">
          <nut-avatar
            size="72"
            bg-color="var(--card-color)"
            :url="icon"
            class="auto-reverse"
          />
          <div class="name">
            <p class="title">{{ appName }}</p>
            <p class="des">
              <span class="des-line1">{{ t("myPage.profile.desc") }}</span>
              <span class="des-line2">{{ env.storage || "D1" }} · v{{ env.version || "-" }}</span>
            </p>
          </div>
        </div>
        <div class="actions">
          <input ref="fileInput" type="file" accept="application/json,.json" @change="restoreFromFile" />
          <nut-button plain type="primary" size="small" :loading="restoreIsLoading" @click="selectBackupFile">
            <font-awesome-icon v-if="!restoreIsLoading" icon="fa-solid fa-cloud-arrow-up" />
            {{ t("myPage.backup.restore") }}
          </nut-button>
          <nut-button type="primary" size="small" :loading="exportIsLoading" @click="exportBackup">
            <font-awesome-icon v-if="!exportIsLoading" icon="fa-solid fa-cloud-arrow-down" />
            {{ t("myPage.backup.export") }}
          </nut-button>
        </div>
      </div>
    </section>

    <section class="config-card storage-card">
      <div class="title-wrapper">
        <h1>{{ t("myPage.backup.title") }}</h1>
      </div>
      <p class="card-desc">{{ t("myPage.backup.desc") }}</p>
    </section>

    <section class="config-card">
      <div class="title-wrapper" @click="requestEditing ? cancelRequestEdit() : startRequestEdit()">
        <h1>{{ t("myPage.request.title") }}</h1>
        <div class="config-btn-wrapper">
          <template v-if="requestEditing">
            <nut-button class="cancel-btn" plain type="info" size="mini" :disabled="requestSaving" @click.stop="cancelRequestEdit">
              <font-awesome-icon icon="fa-solid fa-ban" />
              {{ t("myPage.btn.cancel") }}
            </nut-button>
            <nut-button class="save-btn" type="primary" size="mini" :loading="requestSaving" @click.stop="saveRequestSettings">
              <font-awesome-icon v-if="!requestSaving" icon="fa-solid fa-floppy-disk" />
              {{ t("myPage.btn.save") }}
            </nut-button>
          </template>
          <nut-icon v-else class="right-icon" name="right"></nut-icon>
        </div>
      </div>
      <div v-if="requestEditing" class="config-input-wrapper">
        <nut-input class="input" v-model="requestForm.defaultUserAgent" :placeholder="t('myPage.request.defaultUserAgent')" type="text" input-align="left" />
        <nut-input class="input" v-model="requestForm.defaultFlowUserAgent" :placeholder="t('myPage.request.defaultFlowUserAgent')" type="text" input-align="left" />
        <nut-input class="input" v-model="requestForm.defaultTimeout" :placeholder="t('myPage.request.defaultTimeout')" type="number" input-align="left" />
        <nut-input class="input" v-model="requestForm.backendRequestConcurrency" :placeholder="t('myPage.request.backendRequestConcurrency')" type="number" input-align="left" />
        <nut-input class="input" v-model="requestForm.backendRequestConcurrencyWaitTime" :placeholder="t('myPage.request.backendRequestConcurrencyWaitTime')" type="number" input-align="left" />
        <nut-input class="input" v-model="requestForm.remoteCacheTtl" :placeholder="t('myPage.request.remoteCacheTtl')" type="number" input-align="left" />
        <nut-input class="input" v-model="requestForm.nodeInfoApiUrl" :placeholder="t('myPage.request.nodeInfoApiUrl')" type="text" input-align="left" />
        <label class="boolean-setting">
          <input v-model="requestForm.remoteCacheStaleOnError" type="checkbox" />
          {{ t('myPage.request.remoteCacheStaleOnError') }}
        </label>
      </div>
      <p v-else class="card-desc">{{ requestSummary }}</p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { Dialog } from "@nutui/nutui";
import { useI18n } from "vue-i18n";

import LanguageSwitcherButton from "@/components/LanguageSwitcherButton.vue";
import { useSettingsApi } from "@/api/settings";
import { useBackend } from "@/hooks/useBackend";
import { useAppNotifyStore } from "@/store/appNotify";
import { useSettingsStore } from "@/store/settings";

const settingsStore = useSettingsStore();
const settingsApi = useSettingsApi();
const { showNotify } = useAppNotifyStore();
const { t } = useI18n();
const { icon, env } = useBackend();

const fileInput = ref<HTMLInputElement | null>(null);
const restoreIsLoading = ref(false);
const exportIsLoading = ref(false);
const requestEditing = ref(false);
const requestSaving = ref(false);

const requestForm = reactive({
  defaultUserAgent: "",
  defaultFlowUserAgent: "",
  defaultTimeout: "",
  backendRequestConcurrency: "",
  backendRequestConcurrencyWaitTime: "",
  remoteCacheTtl: "",
  remoteCacheStaleOnError: true,
  nodeInfoApiUrl: "",
});
const appName = computed(() => {
  return env.value?.app
    || env.value?.meta?.cloudflare?.env?.SUB_STORE_BACKEND_CUSTOM_NAME
    || "Sub-Store Cloudflare";
});
const requestSummary = computed(() => {
  return t("myPage.request.summary", {
    concurrency: settingsStore.backendRequestConcurrency || "3",
    timeout: settingsStore.defaultTimeout || "30000",
  });
});

const syncRequestForm = () => {
  requestForm.defaultUserAgent = settingsStore.defaultUserAgent || "";
  requestForm.defaultFlowUserAgent = settingsStore.defaultFlowUserAgent || "";
  requestForm.defaultTimeout = settingsStore.defaultTimeout || "";
  requestForm.backendRequestConcurrency = settingsStore.backendRequestConcurrency || "";
  requestForm.backendRequestConcurrencyWaitTime = settingsStore.backendRequestConcurrencyWaitTime || "";
  requestForm.remoteCacheTtl = settingsStore.remoteCacheTtl || "300";
  requestForm.remoteCacheStaleOnError = settingsStore.remoteCacheStaleOnError !== false;
  requestForm.nodeInfoApiUrl = settingsStore.nodeInfoApiUrl || "https://ipwho.is/{ip}";
};

const startRequestEdit = () => {
  syncRequestForm();
  requestEditing.value = true;
};

const cancelRequestEdit = () => {
  syncRequestForm();
  requestEditing.value = false;
};

const saveRequestSettings = async () => {
  requestSaving.value = true;
  try {
    const saved = await settingsStore.changeSettings({ ...requestForm });
    requestEditing.value = !saved;
  } finally {
    requestSaving.value = false;
  }
};

const selectBackupFile = () => {
  fileInput.value?.click();
};

const exportBackup = async () => {
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

const restoreFromFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  if (!file) return;

  Dialog({
    title: t("myPage.backup.restoreTitle"),
    content: t("myPage.backup.restoreContent"),
    popClass: "auto-dialog",
    okText: t("myPage.backup.restore"),
    cancelText: t("myPage.btn.cancel"),
    closeOnClickOverlay: true,
    onOk: async () => {
      restoreIsLoading.value = true;
      try {
        const content = await file.text();
        const res = await settingsApi.restoreSettings({ content });
        if (res?.data?.status !== "success") throw new Error("restore failed");
        await settingsStore.fetchSettings();
        showNotify({ type: "success", title: t("myPage.notify.restore.succeed") });
      } catch (error) {
        showNotify({ type: "danger", title: t("myPage.notify.restore.failedWithError", { e: errorMessage(error) }) });
      } finally {
        restoreIsLoading.value = false;
      }
    },
  });
};

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
</script>

<style lang="scss" scoped>
.my-page-wrapper {
  min-height: 100%;
  padding: var(--safe-area-side);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.profile-block {
  width: 100%;

  .radio-wrapper {
    display: flex;
    align-items: center;

    .tag {
      margin: 0 5px;
      padding: 7.5px 2.5px 4px;
      flex-shrink: 0;
      color: var(--second-text-color);
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    }

    .current {
      border-bottom: 1px solid var(--primary-color);
      color: var(--primary-color);
    }

    .storage-language-switch {
      margin-left: auto;
      flex-shrink: 0;
    }
  }

  .info {
    width: 100%;
    margin-bottom: 10px;
    padding: 12px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .avatar-wrapper {
    min-width: 0;
    max-width: 64%;
    display: flex;
    align-items: center;

    :deep(.nut-avatar) {
      background: var(--card-color);
    }
  }

  .name {
    min-width: 0;
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    font-size: 18px;
    font-weight: bold;
  }

  .title {
    margin: 0;
    overflow: hidden;
    color: var(--primary-text-color);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .des {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    color: var(--comment-text-color);
    font-size: 12px;
    font-weight: normal;
    line-height: 1.45;
  }

  .actions {
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;

    input {
      display: none;
    }

    svg {
      margin-right: 4px;
    }

    .nut-button {
      width: 116px;
      padding: 0 10px;
    }

    .nut-button--plain {
      background: transparent;
    }

    a {
      margin-top: 12px;
    }
  }
}

.config-card {
  width: 100%;
  border-radius: var(--item-card-radios);
  background: var(--card-color);
  color: var(--second-text-color);
  overflow: hidden;
}

.nut-icon {
  color: var(--lowest-text-color);
}

.right-icon {
  color: var(--comment-text-color);
}

.title-wrapper {
  min-height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--divider-color);
  cursor: pointer;

  h1 {
    margin: 0;
    font-size: 15px;
    color: var(--primary-text-color);
  }
}

.storage-card .title-wrapper {
  cursor: default;
}

.config-btn-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    display: none;
  }
}

.card-desc {
  margin: 0;
  padding: 12px 16px 16px;
  color: var(--comment-text-color);
  font-size: 12px;
  line-height: 1.6;
}

.config-input-wrapper {
  padding: 8px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .input {
    border-bottom: 1px solid var(--divider-color);
  }
}

.boolean-setting {
  min-height: 38px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--second-text-color);
  font-size: 13px;
}

@media screen and (max-width: 430px) {
  .profile-block {
    .info {
      align-items: flex-start;
    }

    .avatar-wrapper {
      max-width: calc(100% - 132px);
    }

    .actions {
      .nut-button {
        width: 104px;
        padding: 0 8px;
      }
    }
  }

  .title-wrapper {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 16px;
  }
}
</style>
