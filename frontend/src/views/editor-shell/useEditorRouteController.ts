import { computed, proxyRefs, ref } from "vue";
import { useEditorPageInteractions } from "@/views/editor-shell/useEditorPageInteractions";
import { useEditorRouteSetup } from "@/views/editor-shell/useEditorRouteSetup";

type ActionBlock = { readonly exitAllEditName: () => void };

export const useEditorRouteController = () => {
  const setup = useEditorRouteSetup();
  const interactions = useEditorPageInteractions(setup);
  const actionBlockRef = ref<ActionBlock | null>(null);
  const customNameModeFlag = ref(false);
  const updateCustomNameModeFlag = (value: boolean): void => { customNameModeFlag.value = value; };
  const handleEditGlobalClick = (): void => {
    if (customNameModeFlag.value) actionBlockRef.value?.exitAllEditName();
  };
  return proxyRefs({
    ...setup.presentation,
    ...setup.selectors,
    ...setup.actions,
    ...interactions.localPreview,
    ...interactions.fieldSettings,
    ...interactions.help,
    actionBlockRef,
    appearanceSetting: setup.appearanceSetting,
    closeCompare: setup.closeCompare,
    closeDialog: setup.dialog.close,
    compare: interactions.compare,
    compareData: interactions.editorCompare.compareData,
    compareTableIsVisible: setup.compareTableIsVisible,
    configName: setup.configName,
    currentTag: computed(() => setup.form.tag),
    customNameModeFlag,
    customerBlurValidate: interactions.customerBlurValidate,
    dialogState: setup.dialog.state,
    editType: setup.editType,
    form: setup.form,
    handleEditGlobalClick,
    isDis: setup.isDis,
    isEditMode: setup.isEditMode,
    localContentText: interactions.localContentText,
    navBarHeight: setup.navBarHeight,
    padding: "env(safe-area-inset-bottom)",
    refreshCompare: interactions.refreshCompare,
    ruleForm: setup.ruleForm,
    setTagValue: interactions.setTagValue,
    showTagPopup: interactions.showTagPopup,
    submit: interactions.submit,
    tagPopupVisible: interactions.tagPopupVisible,
    updateCustomNameModeFlag,
  });
};
