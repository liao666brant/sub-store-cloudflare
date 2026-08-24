<template>
  <div class="config-page-wrapper">
    <section class="config-card">
      <div class="title-wrapper">
        <h1>{{ t("configPage.templates.title") }}</h1>
        <div class="storage-actions">
          <input ref="templateFileInput" type="file" accept="application/json,.json,.yaml,.yml,text/yaml" @change="importTemplateFromFile" />
          <nut-button plain type="primary" size="small" :loading="templateImporting" @click="selectTemplateFile">
            <font-awesome-icon v-if="!templateImporting" icon="fa-solid fa-file-import" />
            {{ t("configPage.templates.importFile") }}
          </nut-button>
          <nut-button type="primary" size="small" :loading="templateImporting" @click="openTemplateImport">
            <font-awesome-icon v-if="!templateImporting" icon="fa-solid fa-plus" />
            {{ t("configPage.templates.create") }}
          </nut-button>
        </div>
      </div>
      <div class="template-list">
        <div v-for="template in templates" :key="template.name" class="template-item">
          <div class="template-text">
            <span class="template-title">{{ template.displayName || template.name }}</span>
            <span class="template-meta">
              {{ template.readonly ? t("configPage.templates.builtIn") : t("configPage.templates.custom") }}
              · {{ getTargetLabel(template.target || "mihomo") }}
            </span>
          </div>
          <div class="template-actions">
            <nut-button plain type="primary" size="mini" @click="openTemplatePreview(template)">
              {{ t("configPage.btn.preview") }}
            </nut-button>
            <nut-button v-if="!template.readonly" plain type="primary" size="mini" @click="openTemplateEdit(template)">
              {{ t("configPage.btn.edit") }}
            </nut-button>
            <nut-button v-if="!template.readonly" plain type="danger" size="mini" @click="deleteCustomTemplate(template.name)">
              {{ t("configPage.btn.delete") }}
            </nut-button>
          </div>
        </div>
      </div>
    </section>

    <nut-popup v-model:visible="templateImportVisible" position="bottom" round closeable :style="{ height: '82vh' }">
      <div class="template-import-panel">
        <h2>{{ templateDialogTitle }}</h2>
        <nut-input class="input" v-model.trim="templateForm.id" :placeholder="t('configPage.templates.idPlaceholder')" input-align="left" :disabled="isPreviewing || Boolean(templateEditingId)" />
        <nut-input class="input" v-model.trim="templateForm.name" :placeholder="t('configPage.templates.namePlaceholder')" input-align="left" :disabled="isPreviewing" />
        <nut-cell class="template-target-trigger" :class="{ 'is-disabled': isPreviewing }" @click="openTemplateTargetPicker">
          <view class="nut-cell__title">{{ t("configPage.templates.target") }}</view>
          <view class="nut-cell__value">
            <nut-input
              :model-value="templateTargetLabel"
              :border="false"
              readonly
              :disabled="isPreviewing"
              input-align="right"
              right-icon="rect-right"
              @click-right-icon.stop="openTemplateTargetPicker"
            />
          </view>
        </nut-cell>
        <div class="template-content-editor">
          <CmView v-if="templateImportVisible" :is-read-only="isPreviewing" id="TemplateEditor" />
        </div>
        <nut-button v-if="!isPreviewing" block type="primary" :loading="templateImporting" @click="saveTemplate">
          {{ t("configPage.templates.save") }}
        </nut-button>
      </div>
    </nut-popup>
    <DesktopPicker
      v-model="selectedTemplateTargetValue"
      v-model:visible="templateTargetPickerVisible"
      :columns="templateTargetColumns"
      :title="t('configPage.templates.targetPickerTitle')"
      :cancel-text="t('configPage.btn.cancel')"
      :ok-text="t('specificWord.confirm')"
      @confirm="handleTemplateTargetConfirm"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, reactive, ref } from "vue";
import { Dialog } from "@nutui/nutui";
import { useI18n } from "vue-i18n";

import { useCloudflareApi } from "@/api/app";
import DesktopPicker from "@/components/DesktopPicker.vue";
import { useAppNotifyStore } from "@/store/appNotify";
import { useCodeStore } from "@/store/codeStore";
import { TEMPLATE_TARGET_OPTIONS, getTargetLabel } from "@/constants/subscriptionTargets";

const CmView = defineAsyncComponent(() => import("@/views/editCode/cmView.vue"));

const cloudflareApi = useCloudflareApi();
const cmStore = useCodeStore();
const { showNotify } = useAppNotifyStore();
const { t } = useI18n();
const TEMPLATE_EDITOR_ID = "TemplateEditor";

const templateFileInput = ref<HTMLInputElement | null>(null);
const templateImporting = ref(false);
const templateImportVisible = ref(false);
const templateEditingId = ref("");
const isPreviewing = ref(false);
const templateTargetPickerVisible = ref(false);
const templates = ref<any[]>([]);

const templateForm = reactive({
  id: "",
  name: "",
  target: "mihomo",
});
const selectedTemplateTargetValue = ref<string[]>([]);
const templateTargetColumns = computed(() => {
  return TEMPLATE_TARGET_OPTIONS.map((option) => ({
    text: option.label,
    value: option.value,
  }));
});
const templateTargetLabel = computed(() => {
  return getTargetLabel(templateForm.target);
});
const templateDialogTitle = computed(() => {
  if (isPreviewing.value) return t("configPage.templates.previewTitle");
  return templateEditingId.value ? t("configPage.templates.editTitle") : t("configPage.templates.importTitle");
});

const fetchTemplates = async () => {
  const res = await cloudflareApi.getTemplates();
  if (res?.data?.status === "success" && Array.isArray(res.data.data)) {
    templates.value = res.data.data;
  }
};

const selectTemplateFile = () => {
  templateFileInput.value?.click();
};

const openTemplateImport = () => {
  templateEditingId.value = "";
  isPreviewing.value = false;
  templateForm.id = "";
  templateForm.name = "";
  templateForm.target = "mihomo";
  cmStore.setEditCode(TEMPLATE_EDITOR_ID, "");
  templateImportVisible.value = true;
};

const openTemplatePreview = (template: any) => {
  templateEditingId.value = "";
  isPreviewing.value = true;
  templateForm.id = template.name;
  templateForm.name = template.displayName || template.name;
  templateForm.target = template.target || "mihomo";
  cmStore.setEditCode(TEMPLATE_EDITOR_ID, JSON.stringify(template.config || {}, null, 2));
  templateImportVisible.value = true;
};

const openTemplateEdit = (template: any) => {
  templateEditingId.value = template.name;
  isPreviewing.value = false;
  templateForm.id = template.name;
  templateForm.name = template.displayName || template.name;
  templateForm.target = template.target || "mihomo";
  cmStore.setEditCode(TEMPLATE_EDITOR_ID, JSON.stringify(template.config || {}, null, 2));
  templateImportVisible.value = true;
};

const importTemplateFromFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  if (!file) return;

  templateEditingId.value = "";
  isPreviewing.value = false;
  templateForm.id = file.name.replace(/\.(json|ya?ml)$/i, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  templateForm.name = file.name.replace(/\.(json|ya?ml)$/i, "");
  templateForm.target = "mihomo";
  cmStore.setEditCode(TEMPLATE_EDITOR_ID, await file.text());
  templateImportVisible.value = true;
};

const openTemplateTargetPicker = () => {
  if (isPreviewing.value) return;
  selectedTemplateTargetValue.value = [templateForm.target || "mihomo"];
  templateTargetPickerVisible.value = true;
};

const handleTemplateTargetConfirm = ({ selectedValue }) => {
  templateForm.target = selectedValue?.[0] || "mihomo";
  selectedTemplateTargetValue.value = [templateForm.target];
  templateTargetPickerVisible.value = false;
};

const saveTemplate = async () => {
  const content = String(cmStore.EditCode[TEMPLATE_EDITOR_ID] || "");
  if (!templateForm.id || !content.trim()) {
    showNotify({ type: "danger", title: t("configPage.templates.validationRequired") });
    return;
  }

  templateImporting.value = true;
  try {
    const payload = {
      id: templateForm.id,
      name: templateForm.name || templateForm.id,
      target: templateForm.target,
      content,
    };
    const res = templateEditingId.value
      ? await cloudflareApi.updateTemplate(templateEditingId.value, payload)
      : await cloudflareApi.createTemplate(payload);
    if (res?.data?.status !== "success") throw new Error("import failed");
    await fetchTemplates();
    templateImportVisible.value = false;
    templateEditingId.value = "";
    showNotify({ type: "success", title: t("configPage.templates.saveSucceed") });
  } catch (error) {
    showNotify({ type: "danger", title: t("configPage.templates.saveFailed", { e: errorMessage(error) }) });
  } finally {
    templateImporting.value = false;
  }
};

const deleteCustomTemplate = (name: string) => {
  Dialog({
    title: t("configPage.templates.deleteTitle"),
    content: t("configPage.templates.deleteContent", { name }),
    popClass: "auto-dialog",
    okText: t("configPage.btn.delete"),
    cancelText: t("configPage.btn.cancel"),
    closeOnClickOverlay: true,
    onOk: async () => {
      const res = await cloudflareApi.deleteTemplate(name);
      if (res?.data?.status === "success") {
        await fetchTemplates();
        showNotify({ type: "success", title: t("configPage.templates.deleteSucceed") });
      }
    },
  });
};

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

onMounted(fetchTemplates);
</script>

<style lang="scss" scoped>
.config-page-wrapper {
  min-height: 100%;
  padding: var(--safe-area-side);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.config-card {
  width: 100%;
  border-radius: var(--item-card-radios);
  background: var(--card-color);
  color: var(--second-text-color);
  overflow: hidden;
}

.title-wrapper {
  min-height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--divider-color);

  h1 {
    margin: 0;
    font-size: 15px;
    color: var(--primary-text-color);
  }
}

.storage-actions {
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    display: none;
  }
}

.template-list {
  display: flex;
  flex-direction: column;
}

.template-item {
  min-height: 54px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--divider-color);

  &:last-child {
    border-bottom: 0;
  }
}

.template-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.template-title,
.template-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-title {
  font-size: 14px;
  color: var(--primary-text-color);
}

.template-meta {
  font-size: 12px;
  color: var(--comment-text-color);
}

.template-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.template-import-panel {
  height: 100%;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--second-text-color);

  h2 {
    margin: 0 0 4px;
    font-size: 17px;
    color: var(--primary-text-color);
  }
}

.template-target-trigger {
  box-shadow: none;
  border-radius: var(--item-card-radios);
  background: var(--background-color);

  &.is-disabled {
    cursor: default;
    opacity: 0.65;
  }
}

.template-content-editor {
  flex: 1;
  min-height: 220px;
  border: 1px solid var(--divider-color);
  border-radius: var(--item-card-radios);
  background: var(--background-color);
  overflow: auto;

  :deep(.cmviewRef) {
    min-height: 220px;
  }

  :deep(.cm-editor) {
    min-height: 220px;
  }
}

@media screen and (max-width: 430px) {
  .title-wrapper {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 16px;
  }

  .storage-actions {
    flex-wrap: wrap;
  }

  .template-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .template-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
