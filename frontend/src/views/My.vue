<template>
  <div class="my-page">
    <header class="profile">
      <div class="profile__meta">
        <TTag theme="primary" variant="light">{{ env.runtime || env.backend || "Cloudflare" }}</TTag>
        <LanguageSwitcherButton class="profile__language" />
      </div>
      <div class="profile__content">
        <div class="profile__identity">
          <TAvatar :image="icon" :alt="appName" size="72px" shape="round" />
          <div class="profile__copy">
            <h1>{{ appName }}</h1>
            <p>{{ t("myPage.profile.desc") }}</p>
            <p>{{ env.storage || "D1" }} · v{{ env.version || "-" }}</p>
          </div>
        </div>
        <MyBackupSettings />
      </div>
    </header>

    <MyThemeSettings />

    <TCard class="settings-card" :title="t('myPage.backup.title')">
      <p class="card-description">{{ t("myPage.backup.desc") }}</p>
    </TCard>

    <MyTemplateSettings />

    <TCard class="settings-card" :title="t('myPage.request.title')">
      <template #actions>
        <div class="card-actions">
          <TButton v-if="requestEditing" size="small" variant="text" :disabled="requestSaving" @click="cancelRequestEdit">
            {{ t("myPage.btn.cancel") }}
          </TButton>
          <TButton v-if="requestEditing" size="small" theme="primary" :loading="requestSaving" @click="saveRequestSettings">
            <template #icon><SaveIcon /></template>
            {{ t("myPage.btn.save") }}
          </TButton>
          <TButton v-else size="small" variant="text" theme="primary" :aria-label="t('myPage.btn.edit')" @click="startRequestEdit">
            {{ t("myPage.btn.edit") }}
            <template #suffix><ChevronRightIcon /></template>
          </TButton>
        </div>
      </template>
      <TForm v-if="requestEditing" :data="requestForm" layout="vertical" class="request-form" @submit.prevent="saveRequestSettings">
        <TFormItem :label="t('myPage.request.defaultUserAgent')"><TInput v-model="requestForm.defaultUserAgent" /></TFormItem>
        <TFormItem :label="t('myPage.request.defaultFlowUserAgent')"><TInput v-model="requestForm.defaultFlowUserAgent" /></TFormItem>
        <TFormItem :label="t('myPage.request.defaultTimeout')"><TInput v-model="requestForm.defaultTimeout" type="number" /></TFormItem>
        <TFormItem :label="t('myPage.request.backendRequestConcurrency')"><TInput v-model="requestForm.backendRequestConcurrency" type="number" /></TFormItem>
        <TFormItem :label="t('myPage.request.backendRequestConcurrencyWaitTime')"><TInput v-model="requestForm.backendRequestConcurrencyWaitTime" type="number" /></TFormItem>
        <TFormItem :label="t('myPage.request.remoteCacheTtl')"><TInput v-model="requestForm.remoteCacheTtl" type="number" /></TFormItem>
        <TFormItem :label="t('myPage.request.nodeInfoApiUrl')"><TInput v-model="requestForm.nodeInfoApiUrl" /></TFormItem>
        <TFormItem :label="t('myPage.request.remoteCacheStaleOnError')"><TSwitch v-model="requestForm.remoteCacheStaleOnError" size="small" /></TFormItem>
      </TForm>
      <p v-else class="card-description">{{ requestSummary }}</p>
    </TCard>
  </div>
</template>

<script lang="ts" setup>
import { ChevronRightIcon, SaveIcon } from "tdesign-icons-vue-next";
import { Avatar as TAvatar, Button as TButton, Card as TCard, Form as TForm, FormItem as TFormItem, Input as TInput, Switch as TSwitch, Tag as TTag } from "tdesign-vue-next";
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import LanguageSwitcherButton from "@/components/LanguageSwitcherButton.vue";
import { useBackend } from "@/hooks/useBackend";
import { showNotify } from "@/plugin/tdesign";
import { useSettingsStore } from "@/store/settings";
import MyBackupSettings from "@/views/my/MyBackupSettings.vue";
import MyTemplateSettings from "@/views/my/MyTemplateSettings.vue";
import MyThemeSettings from "@/views/my/MyThemeSettings.vue";

const settingsStore = useSettingsStore();
const { t } = useI18n();
const { icon, env } = useBackend();
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
const appName = computed(() => env.value?.app || env.value?.meta?.cloudflare?.env?.SUB_STORE_BACKEND_CUSTOM_NAME || "Sub-Store Cloudflare");
const requestSummary = computed(() => t("myPage.request.summary", { concurrency: settingsStore.backendRequestConcurrency || "3", timeout: settingsStore.defaultTimeout || "30000" }));

const syncRequestForm = (): void => {
  requestForm.defaultUserAgent = settingsStore.defaultUserAgent || "";
  requestForm.defaultFlowUserAgent = settingsStore.defaultFlowUserAgent || "";
  requestForm.defaultTimeout = settingsStore.defaultTimeout || "";
  requestForm.backendRequestConcurrency = settingsStore.backendRequestConcurrency || "";
  requestForm.backendRequestConcurrencyWaitTime = settingsStore.backendRequestConcurrencyWaitTime || "";
  requestForm.remoteCacheTtl = settingsStore.remoteCacheTtl || "300";
  requestForm.remoteCacheStaleOnError = settingsStore.remoteCacheStaleOnError !== false;
  requestForm.nodeInfoApiUrl = settingsStore.nodeInfoApiUrl || "https://ipwho.is/{ip}";
};

const startRequestEdit = (): void => {
  syncRequestForm();
  requestEditing.value = true;
};

const cancelRequestEdit = (): void => {
  syncRequestForm();
  requestEditing.value = false;
};

const saveRequestSettings = async (): Promise<void> => {
  requestSaving.value = true;
  try {
    requestEditing.value = !(await settingsStore.changeSettings({ ...requestForm }));
  } catch {
    showNotify({ type: "danger", title: t("myPage.notify.save.configUpdateFailed") });
  } finally {
    requestSaving.value = false;
  }
};
</script>

<style lang="scss" scoped>
.my-page {
  min-block-size: 100%;
  padding: var(--app-space-inline-safe);
  padding-bottom: calc(var(--app-space-block) + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: var(--app-space-control);
}

.profile {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-standard);
}

.profile__meta,
.profile__content,
.card-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-control);
}

.profile__language {
  margin-inline-start: auto;
}

.profile__content {
  justify-content: space-between;
}

.profile__identity {
  display: flex;
  min-inline-size: 0;
  flex: 1;
  align-items: center;
  gap: var(--app-space-standard);
}

.profile__identity :deep(.t-avatar) {
  flex: 0 0 auto;
}

.profile__copy {
  min-inline-size: 0;
  flex: 1;
}

.profile__copy h1,
.profile__copy p,
.card-description {
  margin: 0;
}

.profile__copy h1 {
  overflow: hidden;
  color: var(--td-text-color-primary);
  font-size: var(--td-font-size-title-medium);
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile__copy p,
.card-description {
  color: var(--td-text-color-secondary);
  font-size: var(--td-font-size-body-small);
  line-height: 1.5;
}

.settings-card {
  background: var(--td-bg-color-container);
}

.settings-card :deep(.t-card__header) {
  align-items: center;
}

.card-description {
  max-inline-size: 72ch;
}

.request-form {
  margin-block-start: var(--app-space-standard);
}

@media (max-width: 640px) {
  .profile__content {
    flex-direction: column;
    align-items: stretch;
  }

  .card-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>
