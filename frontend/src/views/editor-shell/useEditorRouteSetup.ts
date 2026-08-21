import { computed, provide, reactive, ref, toRaw } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useCloudflareApi } from "@/api/app";
import logoIcon from "@/assets/icons/logo.png";
import logoRedIcon from "@/assets/icons/logo-red.png";
import { usePopupRoute } from "@/hooks/usePopupRoute";
import { useAppNotifyStore } from "@/store/appNotify";
import { useGlobalStore } from "@/store/global";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { useSystemStore } from "@/store/system";
import { useEditorActionsHost } from "@/views/editor-shell/useEditorActionsHost";
import { useCompareOverlay } from "@/views/editor-shell/useCompareOverlay";
import { useEditorInitialization } from "@/views/editor-shell/useEditorInitialization";
import { useEditorMessageDialog } from "@/views/editor-shell/useEditorMessageDialog";
import { useEditorPresentation } from "@/views/editor-shell/useEditorPresentation";
import { useEditorSelectors } from "@/views/editor-shell/useEditorSelectors";
import { useCodeStore } from "@/store/codeStore";
import type { EditorFormInstance, EditorFormState } from "@/views/editor-shell/editorTypes";

export const useEditorRouteSetup = () => {
  const cmStore = useCodeStore();
  const isDis = ref(true);
  const dialog = useEditorMessageDialog();
  const { t, locale } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const cloudflareApi = useCloudflareApi();
  const editType = route.params.editType as string;
  const configName = route.params.id as string;
  const subsStore = useSubsStore();
  const { showNotify } = useAppNotifyStore();
  const globalStore = useGlobalStore();
  const { appearanceSetting } = storeToRefs(useSettingsStore());
  const { navBarHeight } = storeToRefs(useSystemStore());
  const isEditMode = computed(() => route.params.id !== "UNTITLED");
  const { close: closeCompare, open: openComparePanel, visible: compareTableIsVisible } = useCompareOverlay({
    onOpen: top => globalStore.setSavedPositions(route.path, { left: 0, top }),
    onClose: () => router.back(),
  });
  usePopupRoute(compareTableIsVisible);
  const initialized = ref(false);
  const ruleForm = ref<EditorFormInstance | null>(null);
  const defaultIcon = computed(() => appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon);
  const form = reactive<EditorFormState>({
    name: "", displayName: "", form: "", remark: "", ignoreFailedRemoteSub: false,
    passThroughUA: false, icon: "", isIconColor: true, process: [],
  });
  provide("form", form);
  const presentation = useEditorPresentation({
    appearance: appearanceSetting,
    collection: name => subsStore.getOneCollection(name),
    configName,
    defaultIcon,
    editType,
    form,
    initialized,
    isEditMode,
    path: computed(() => route.path),
    source: name => subsStore.getOneSub(name),
    sources: computed(() => subsStore.subs),
    topOffset: navBarHeight,
    translate: t,
  });
  const selectors = useEditorSelectors({
    editType,
    form,
    getTemplates: () => cloudflareApi.getTemplates(),
    isChinese: computed(() => locale.value.startsWith("zh")),
    translate: t,
  });
  const actions = useEditorActionsHost({ form, translate: t });
  useEditorInitialization({
    configName,
    editType,
    form,
    getRecord: () => toRaw(presentation.sub.value) || toRaw(presentation.collection.value),
    initialized,
    loadActions: actions.loadActions,
    notifyRemoteUaConflict: () => showNotify({ type: "warning", title: t("editorPage.subConfig.basic.passThroughUA.warning"), duration: 65535 }),
    setCode: content => cmStore.setEditCode("SubEditer", content),
  });
  return {
    actions, appearanceSetting, cloudflareApi, cmStore, closeCompare, compareTableIsVisible, defaultIcon,
    configName, dialog, editType, form, isDis, isEditMode, navBarHeight, openComparePanel,
    presentation, router, ruleForm, selectors, showNotify, subsStore, t,
  };
};
