import { computed, ref, toRaw } from "vue";
import { actionsToProcess } from "@/utils/actionsToPorcess";
import { initStores } from "@/utils/initApp";
import { useEditorCompare } from "@/views/editor-shell/useEditorCompare";
import { useEditorFieldSettings } from "@/views/editor-shell/useEditorFieldSettings";
import { useEditorHelpDialogs } from "@/views/editor-shell/useEditorHelpDialogs";
import { useLocalContentPreview } from "@/views/editor-shell/useLocalContentPreview";
import { createEditorSubmissionPayload, saveEditorSubmission } from "@/views/editor-shell/useEditorSubmission";
import { useEditorSubmissionFlow } from "@/views/editor-shell/useEditorSubmissionFlow";
import { normalizeEditorValidation } from "@/views/editor-shell/useEditorValidation";
import type { useEditorRouteSetup } from "@/views/editor-shell/useEditorRouteSetup";
import { closeLoading, showLoading } from "@/plugin/tdesign";

type Setup = ReturnType<typeof useEditorRouteSetup>;

export const useEditorPageInteractions = (setup: Setup) => {
  const localContentText = computed(() => String(setup.cmStore.EditCode.SubEditer || setup.form.content || ""));
  const localPreview = useLocalContentPreview({
    createPayload: content => ({
      ...toRaw(setup.form),
      content,
      process: actionsToProcess(setup.form.process, setup.actions.actionsList, setup.actions.ignoreList),
      source: "local",
    }),
    getContent: () => localContentText.value,
    getSource: () => setup.form.source,
    messages: {
      empty: () => setup.t("editorPage.subConfig.basic.content.validation.empty"),
      failed: () => setup.t("editorPage.subConfig.basic.content.validation.failed"),
      importFailed: () => setup.t("editorPage.subConfig.basic.content.validation.importFailed"),
      noNodes: () => setup.t("editorPage.subConfig.basic.content.validation.noNodes"),
      success: count => setup.t("editorPage.subConfig.basic.content.validation.success", { count }),
      successDetail: types => setup.t("editorPage.subConfig.basic.content.validation.detail", { types }),
      unknownType: () => setup.t("specificWord.unknownType"),
    },
    notify: (type, title, content) => setup.showNotify({ type, title, content }),
    preview: payload => setup.cloudflareApi.previewItem("sub", payload),
    setContent: content => setup.cmStore.setEditCode("SubEditer", content),
    watchedContent: localContentText,
  });
  const editorCompare = useEditorCompare({
    actionsChecked: setup.actions.actionsChecked,
    buildProcess: () => actionsToProcess(setup.form.process, setup.actions.actionsList, setup.actions.ignoreList),
    closeLoading: () => closeLoading("compare"),
    editType: setup.editType,
    form: setup.form,
    preview: (type, payload) => setup.cloudflareApi.previewItem(type, payload),
    showLoading: () => showLoading(setup.t("editorPage.subConfig.basic.content.validation.compareLoading"), { id: "compare", cover: true }),
  });
  const compare = (): void => {
    const ruleForm = setup.ruleForm.value;
    if (!ruleForm) return;
    void ruleForm.validate().then(async (result: unknown) => {
      const { valid, errors } = normalizeEditorValidation(result);
      if (!valid) {
        setup.presentation.focusValidationErrorTab(errors);
        setup.dialog.open({
          title: setup.t("editorPage.subConfig.pop.errorTitle"),
          content: errors[0].message,
          okText: setup.t("editorPage.subConfig.pop.errorBtn"),
        });
        return;
      }
      await editorCompare.fetchCompareData();
      setup.openComparePanel();
    });
  };
  const refreshCompare = (): Promise<void> => editorCompare.fetchCompareData();
  const customerBlurValidate = (field: string): void => { void setup.ruleForm.value?.validate({ fields: [field] }); };
  const fieldSettings = useEditorFieldSettings({
    defaultIcon: setup.defaultIcon,
    form: setup.form,
    getRemoteSourceProfile: url => setup.cloudflareApi.getRemoteSourceProfile(url),
    isEditMode: setup.isEditMode,
    nameExists: name => setup.configName !== name && [...setup.subsStore.subs, ...setup.subsStore.collections].some(item => item.name === name),
    notifyAutoProfileFailure: () => setup.showNotify({ type: "danger", title: setup.t("editorPage.subConfig.basic.url.autoProfile.failed") }),
    notifyAutoProfileSuccess: () => setup.showNotify({ type: "primary", title: setup.t("editorPage.subConfig.basic.url.autoProfile.completed") }),
    placeholderDisabled: () => setup.t("editorPage.subConfig.basic.ua.placeholderDisabled"),
    placeholderEnabled: () => setup.t("editorPage.subConfig.basic.ua.placeholder"),
    validateField: customerBlurValidate,
  });
  const { submit } = useEditorSubmissionFlow({
    closeLoading: () => closeLoading("submits"),
    createPayload: () => createEditorSubmissionPayload({
      form: toRaw(setup.form),
      process: actionsToProcess(setup.form.process, setup.actions.actionsList, setup.actions.ignoreList),
    }),
    editType: setup.editType,
    focusValidationError: setup.presentation.focusValidationErrorTab,
    getLocalContent: () => localContentText.value,
    notifyBusy: () => setup.showNotify({ type: "success", title: setup.t("editorPage.subConfig.basic.content.validation.submitBusy") }),
    notifyFailure: () => setup.showNotify({ type: "danger", title: setup.t("editorPage.subConfig.pop.errorTitle"), offset: [0, -96] }),
    onSuccess: async () => { await setup.router.replace("/"); setup.showNotify({ type: "success", title: setup.t("editorPage.subConfig.pop.succeedMsg") }); },
    openValidationDialog: content => setup.dialog.open({
      title: setup.t("editorPage.subConfig.pop.errorTitle"),
      content,
      okText: setup.t("editorPage.subConfig.pop.errorBtn"),
    }),
    save: payload => saveEditorSubmission({
      configName: setup.configName,
      create: (type, data) => setup.cloudflareApi.createItem(type, data),
      edit: (type, name, data) => setup.cloudflareApi.editItem(type, name, data),
      editType: setup.editType,
      onRemoteCreate: () => initStores(false, true, false),
      payload,
      refresh: () => setup.subsStore.fetchSubsData(),
      update: (type, name) => setup.subsStore.updateOneData(type, name),
    }),
    showLoading: () => showLoading(setup.t("editorPage.subConfig.basic.content.validation.submitLoading"), { id: "submits", cover: true }),
    validateForm: async () => normalizeEditorValidation(await setup.ruleForm.value?.validate()),
    validateLocalContent: content => localPreview.validateLocalContent(content, true),
  });
  const tagPopupVisible = ref(false);
  const showTagPopup = (): void => { tagPopupVisible.value = true; };
  const setTagValue = (value: string): void => { setup.form.tag = value; };
  const help = useEditorHelpDialogs({
    content: () => ({
      title: setup.t("editorPage.subConfig.basic.content.tips.title"),
      content: setup.t("editorPage.subConfig.basic.content.tips.content"),
      okText: "OK",
    }),
    open: setup.dialog.open,
    subUserinfo: () => ({
      title: setup.t("editorPage.subConfig.basic.subUserinfo.tips.title"),
      content: setup.t("editorPage.subConfig.basic.subUserinfo.tips.content"),
      okText: "OK",
    }),
    template: () => ({
      title: setup.selectors.selectedTemplateLabel.value,
      content: setup.t("editorPage.subConfig.basic.template.tips", {
        type: setup.selectors.selectedTemplate.value?.readonly
          ? setup.t("editorPage.subConfig.basic.template.builtIn")
          : setup.t("editorPage.subConfig.basic.template.custom"),
        target: setup.selectors.selectedTemplate.value?.target || "mihomo",
      }),
      okText: "OK",
    }),
    ua: () => ({ title: setup.t("editorPage.subConfig.basic.ua.tips.title"), content: setup.t("editorPage.subConfig.basic.ua.tips.content"), okText: "OK" }),
    url: () => ({ title: setup.t("editorPage.subConfig.basic.url.tips.title"), content: setup.t("editorPage.subConfig.basic.url.tips.content"), okText: "OK" }),
  });
  return {
    compare,
    customerBlurValidate,
    editorCompare,
    fieldSettings,
    help,
    localContentText,
    localPreview,
    refreshCompare,
    setTagValue,
    showTagPopup,
    submit,
    tagPopupVisible,
  };
};
