import { computed, ref, watchEffect, type ComputedRef } from "vue";

type EditorForm = Record<string, unknown>;
type PickerColumn = { readonly text: string; readonly value: string };
export type EditorTemplate = {
  readonly displayName?: string;
  readonly name: string;
  readonly readonly?: boolean;
  readonly target?: string;
};

type Options = {
  readonly editType: string;
  readonly form: EditorForm;
  readonly getTemplates: () => Promise<unknown>;
  readonly isChinese: ComputedRef<boolean>;
  readonly translate: (key: string) => string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const stringsFromPicker = (payload: unknown): string[] => {
  if (!isRecord(payload) || !Array.isArray(payload.selectedValue)) return [];
  return payload.selectedValue.filter((value): value is string => typeof value === "string");
};

const templatesFromResponse = (response: unknown): EditorTemplate[] => {
  if (!isRecord(response) || !isRecord(response.data) || response.data.status !== "success") return [];
  const payload = response.data.data;
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((template): EditorTemplate[] => {
    if (!isRecord(template) || typeof template.name !== "string") return [];
    return [{
      name: template.name,
      displayName: typeof template.displayName === "string" ? template.displayName : undefined,
      readonly: template.readonly === true,
      target: typeof template.target === "string" ? template.target : undefined,
    }];
  });
};

export const useEditorSelectors = (options: Options) => {
  const subFailureModeOptions = computed(() => {
    const prefix = "editorPage.subConfig.basic.ignoreFailedRemoteSub";
    return [
      { value: "disabled", label: options.translate(`${prefix}.disabled`), note: options.translate(`${prefix}.disabledNote`) },
      { value: "skip", label: options.translate(`${prefix}.skip`), note: options.translate(`${prefix}.skipNote`) },
    ];
  });
  const subFailureModeValue = computed(() => {
    return options.form.ignoreFailedRemoteSub === false || options.form.ignoreFailedRemoteSub == null ? "disabled" : "skip";
  });
  const subFailureModeColumns = computed<PickerColumn[]>(() => subFailureModeOptions.value.map(option => ({
    text: option.note
      ? options.isChinese.value ? `${option.label}（${option.note}）` : `${option.label} (${option.note})`
      : option.label,
    value: option.value,
  })));
  const subFailureModeLabel = computed(() => subFailureModeOptions.value.find(option => option.value === subFailureModeValue.value)?.label ?? "");
  const showSubFailureModePicker = ref(false);
  const selectedSubFailureMode = ref<string[]>([]);
  const openSubFailureModePicker = (): void => {
    selectedSubFailureMode.value = [subFailureModeValue.value];
    showSubFailureModePicker.value = true;
  };
  const handleSubFailureModeConfirm = (payload: unknown): void => {
    const nextValue = stringsFromPicker(payload)[0] ?? subFailureModeColumns.value[0]?.value ?? "disabled";
    selectedSubFailureMode.value = [nextValue];
    options.form.ignoreFailedRemoteSub = nextValue;
    showSubFailureModePicker.value = false;
  };

  const templateOptions = ref<EditorTemplate[]>([]);
  const showTemplatePicker = ref(false);
  const selectedTemplateValue = ref<string[]>([]);
  const selectedTemplate = computed(() => templateOptions.value.find(template => template.name === options.form.templateId));
  const selectedTemplateLabel = computed(() => selectedTemplate.value?.displayName ?? selectedTemplate.value?.name ?? String(options.form.templateId || "ACL4SSR Mihomo"));
  const templateColumns = computed<PickerColumn[]>(() => templateOptions.value.map(template => {
    const category = template.readonly
      ? options.translate("editorPage.subConfig.basic.template.builtIn")
      : options.translate("editorPage.subConfig.basic.template.custom");
    return { text: `${template.displayName ?? template.name}（${category} · ${template.target ?? "mihomo"}）`, value: template.name };
  }));
  const openTemplatePicker = (): void => {
    selectedTemplateValue.value = [String(options.form.templateId || templateColumns.value[0]?.value || "acl4ssr-mihomo")];
    showTemplatePicker.value = true;
  };
  const handleTemplateConfirm = (payload: unknown): void => {
    const nextValue = stringsFromPicker(payload)[0] ?? templateColumns.value[0]?.value ?? "acl4ssr-mihomo";
    selectedTemplateValue.value = [nextValue];
    options.form.templateId = nextValue;
    showTemplatePicker.value = false;
  };

  watchEffect(async () => {
    if (options.editType !== "collections" || templateOptions.value.length > 0) return;
    templateOptions.value = templatesFromResponse(await options.getTemplates());
  });

  return {
    handleSubFailureModeConfirm,
    handleTemplateConfirm,
    openSubFailureModePicker,
    openTemplatePicker,
    selectedSubFailureMode,
    selectedTemplate,
    selectedTemplateLabel,
    selectedTemplateValue,
    showSubFailureModePicker,
    showTemplatePicker,
    subFailureModeColumns,
    subFailureModeLabel,
    templateColumns,
  };
};
