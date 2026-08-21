<template>
  <TCard class="settings-card" :title="t('myPage.templates.title')">
    <template #actions>
      <div class="card-actions">
        <input ref="templateFileInput" class="visually-hidden" type="file" accept="application/json,.json,.yaml,.yml,text/yaml" @change="importTemplateFromFile" />
        <TButton size="small" variant="outline" theme="primary" :loading="templateFileReading" :disabled="templateSaving" @click="openTemplateFilePicker">
          <template #icon><FileImportIcon /></template>
          {{ t("myPage.templates.importFile") }}
        </TButton>
        <TButton size="small" theme="primary" :disabled="templateFileReading || templateSaving" @click="openTemplateCreateDialog">
          <template #icon><AddIcon /></template>
          {{ t("myPage.templates.create") }}
        </TButton>
      </div>
    </template>
    <TList v-if="templates.length" split class="template-list">
      <TListItem v-for="template in templates" :key="template.name">
        <div class="template-copy">
          <strong>{{ template.displayName || template.name }}</strong>
          <span>{{ template.readonly ? t("myPage.templates.builtIn") : t("myPage.templates.custom") }} · {{ getTargetLabel(template.target || "mihomo") }}</span>
        </div>
        <template v-if="!template.readonly" #action>
          <div class="template-actions">
            <TButton size="small" variant="text" theme="primary" :disabled="templateSaving" @click="openTemplateEditDialog(template)">
              <template #icon><EditIcon /></template>
              {{ t("myPage.btn.edit") }}
            </TButton>
            <TButton size="small" variant="text" theme="danger" :loading="templateDeletingName === template.name" :disabled="templateSaving" @click="openTemplateDeleteDialog(template.name)">
              <template #icon><DeleteIcon /></template>
              {{ t("myPage.btn.delete") }}
            </TButton>
          </div>
        </template>
      </TListItem>
    </TList>
    <TEmpty v-else size="small" :description="t('myPage.templates.empty')" />
  </TCard>

  <TDialog v-model:visible="templateDialogVisible" :header="templateEditingId ? t('myPage.templates.editTitle') : t('myPage.templates.importTitle')" :cancel-btn="null" :confirm-btn="null" destroy-on-close prevent-scroll-through show-overlay class="template-dialog" @close="closeTemplateDialog">
    <TForm :data="templateForm" layout="vertical" class="template-form">
      <TFormItem :label="t('myPage.templates.idPlaceholder')"><TInput v-model.trim="templateForm.id" :disabled="Boolean(templateEditingId)" /></TFormItem>
      <TFormItem :label="t('myPage.templates.namePlaceholder')"><TInput v-model.trim="templateForm.name" /></TFormItem>
      <TFormItem :label="t('myPage.templates.target')"><TSelect v-model="templateForm.target" :options="templateTargetOptions" /></TFormItem>
    </TForm>
    <div class="template-editor"><CmView v-if="templateDialogVisible" :is-read-only="false" id="TemplateEditor" /></div>
    <div class="dialog-actions">
      <TButton variant="outline" :disabled="templateSaving" @click="closeTemplateDialog">{{ t("myPage.btn.cancel") }}</TButton>
      <TButton theme="primary" :loading="templateSaving" @click="saveTemplate"><template #icon><SaveIcon /></template>{{ t("myPage.templates.save") }}</TButton>
    </div>
  </TDialog>
  <TDialog v-model:visible="templateDeleteDialogVisible" :header="t('myPage.templates.deleteTitle')" :body="t('myPage.templates.deleteContent', { name: templateDeletingName })" :cancel-btn="t('myPage.btn.cancel')" :confirm-btn="t('myPage.btn.delete')" :confirm-loading="templateDeleteLoading" theme="danger" prevent-scroll-through show-overlay @confirm="deleteCustomTemplate" @close="closeTemplateDeleteDialog" />
</template>

<script lang="ts" setup>
import { AddIcon, DeleteIcon, EditIcon, FileImportIcon, SaveIcon } from "tdesign-icons-vue-next";
import { Button as TButton, Card as TCard, Dialog as TDialog, Empty as TEmpty, Form as TForm, FormItem as TFormItem, Input as TInput, List as TList, ListItem as TListItem, Select as TSelect } from "tdesign-vue-next";
import { computed, defineAsyncComponent, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useCloudflareApi } from "@/api/app";
import { TEMPLATE_TARGET_OPTIONS, getTargetLabel } from "@/constants/subscriptionTargets";
import { showNotify } from "@/plugin/tdesign";
import { useCodeStore } from "@/store/codeStore";

type TemplateSummary = {
  readonly name: string;
  readonly displayName?: string;
  readonly target?: string;
  readonly readonly?: boolean;
  readonly config?: unknown;
};

const CmView = defineAsyncComponent(() => import("@/views/editCode/cmView.vue"));
const TEMPLATE_EDITOR_ID = "TemplateEditor";
const cloudflareApi = useCloudflareApi();
const cmStore = useCodeStore();
const { t } = useI18n();
const templateFileInput = ref<HTMLInputElement | null>(null);
const templates = ref<readonly TemplateSummary[]>([]);
const templateFileReading = ref(false);
const templateSaving = ref(false);
const templateDialogVisible = ref(false);
const templateEditingId = ref("");
const templateDeleteDialogVisible = ref(false);
const templateDeletingName = ref("");
const templateDeleteLoading = ref(false);
const templateForm = reactive({ id: "", name: "", target: "mihomo" });
const templateTargetOptions = computed(() => TEMPLATE_TARGET_OPTIONS.map(option => ({ label: option.label, value: option.value })));
const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const fetchTemplates = async (): Promise<void> => {
  const response = await cloudflareApi.getTemplates();
  if (response?.data?.status === "success" && Array.isArray(response.data.data)) {
    templates.value = response.data.data;
    return;
  }
  throw new Error("load failed");
};

const openTemplateFilePicker = (): void => {
  templateFileInput.value?.click();
};

const resetTemplateForm = (): void => {
  templateEditingId.value = "";
  templateForm.id = "";
  templateForm.name = "";
  templateForm.target = "mihomo";
  cmStore.setEditCode(TEMPLATE_EDITOR_ID, "");
};

const openTemplateCreateDialog = (): void => {
  resetTemplateForm();
  templateDialogVisible.value = true;
};

const openTemplateEditDialog = (template: TemplateSummary): void => {
  templateEditingId.value = template.name;
  templateForm.id = template.name;
  templateForm.name = template.displayName || template.name;
  templateForm.target = template.target || "mihomo";
  cmStore.setEditCode(TEMPLATE_EDITOR_ID, JSON.stringify(template.config || {}, null, 2));
  templateDialogVisible.value = true;
};

const closeTemplateDialog = (): void => {
  if (!templateSaving.value) templateDialogVisible.value = false;
};

const importTemplateFromFile = async (event: Event): Promise<void> => {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  const file = input?.files?.[0];
  if (input) input.value = "";
  if (!file) return;
  templateFileReading.value = true;
  try {
    templateEditingId.value = "";
    templateForm.id = file.name.replace(/\.(json|ya?ml)$/i, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    templateForm.name = file.name.replace(/\.(json|ya?ml)$/i, "");
    templateForm.target = "mihomo";
    cmStore.setEditCode(TEMPLATE_EDITOR_ID, await file.text());
    templateDialogVisible.value = true;
  } catch (error) {
    showNotify({ type: "danger", title: t("myPage.templates.importFailed", { e: errorMessage(error) }) });
  } finally {
    templateFileReading.value = false;
  }
};

const saveTemplate = async (): Promise<void> => {
  const content = String(cmStore.EditCode[TEMPLATE_EDITOR_ID] || "");
  if (!templateForm.id || !content.trim()) {
    showNotify({ type: "danger", title: t("myPage.templates.validationRequired") });
    return;
  }
  templateSaving.value = true;
  try {
    const payload = { id: templateForm.id, name: templateForm.name || templateForm.id, target: templateForm.target, content };
    const response = templateEditingId.value ? await cloudflareApi.updateTemplate(templateEditingId.value, payload) : await cloudflareApi.createTemplate(payload);
    if (response?.data?.status !== "success") throw new Error("import failed");
    await fetchTemplates();
    templateDialogVisible.value = false;
    templateEditingId.value = "";
    showNotify({ type: "success", title: t("myPage.templates.saveSucceed") });
  } catch (error) {
    showNotify({ type: "danger", title: t("myPage.templates.saveFailed", { e: errorMessage(error) }) });
  } finally {
    templateSaving.value = false;
  }
};

const openTemplateDeleteDialog = (name: string): void => {
  templateDeletingName.value = name;
  templateDeleteDialogVisible.value = true;
};

const closeTemplateDeleteDialog = (): void => {
  if (!templateDeleteLoading.value) templateDeletingName.value = "";
};

const deleteCustomTemplate = async (): Promise<void> => {
  if (!templateDeletingName.value) return;
  templateDeleteLoading.value = true;
  try {
    const response = await cloudflareApi.deleteTemplate(templateDeletingName.value);
    if (response?.data?.status !== "success") throw new Error("delete failed");
    await fetchTemplates();
    templateDeleteDialogVisible.value = false;
    templateDeletingName.value = "";
    showNotify({ type: "success", title: t("myPage.templates.deleteSucceed") });
  } catch (error) {
    showNotify({ type: "danger", title: t("myPage.templates.deleteFailed", { e: errorMessage(error) }) });
  } finally {
    templateDeleteLoading.value = false;
  }
};

onMounted(() => {
  void fetchTemplates().catch(error => showNotify({ type: "danger", title: t("myPage.templates.loadFailed", { e: errorMessage(error) }) }));
});
</script>

<style lang="scss" scoped>
@import "./MyTemplateSettings.scss";
</style>
