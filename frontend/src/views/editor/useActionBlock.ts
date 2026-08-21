import i18nFile from "@/locales/zh";
import { showNotify } from "@/plugin/tdesign";
import { useClipboard } from "@vueuse/core";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import useV3Clipboard from "vue-clipboard3";
import { useRequiredEditorForm } from "@/views/editor-shell/useRequiredEditorForm";
import {
  appendScriptActions,
  parsePastedAction,
  type ActionOption,
} from "./actionBlockUtilities";
import {
  isSupportedActionType,
  supportedActionTypes,
} from "./actionBlockTypes";

type EditableAction = {
  readonly id: string;
  readonly defaultName: string;
  customName: string;
  oldCustomName: string;
  isEditing: boolean;
};
type ActionBlockProps = {
  readonly checked: Array<[string, boolean]>;
  readonly list: ActionModuleProps[];
  readonly sourceType?: string;
};
type ActionBlockEmit = {
  (event: "addAction", value: ActionOption[]): void;
  (event: "deleteAction", value: string): void;
  (event: "updateCustomNameModeFlag", value: boolean): void;
  (event: "toggleAction", value: string): void;
};

export const useActionBlock = (
  props: ActionBlockProps,
  emit: ActionBlockEmit,
) => {
  const { t, locale } = useI18n();
  const form = useRequiredEditorForm();
  const { copy, isSupported } = useClipboard();
  const { toClipboard } = useV3Clipboard();
  const isCollapsed = ref(
    localStorage.getItem("actions-block-collapsed") === "1",
  );
  const collapsedElements = ref<string[]>(
    isCollapsed.value ? props.list.map((item) => item.id) : [],
  );
  const pasteboard = ref("");
  const showPasteboard = ref(false);
  const showHelp = ref(false);
  const actionToDelete = ref<string>();
  const tips = reactive({ visible: false, title: "", content: "" });
  const actionOptions = ref<ActionOption[]>(
    Object.keys(i18nFile.editorPage.subConfig.nodeActions)
      .filter(
        (type) => isSupportedActionType(type) && !type.startsWith("Script "),
      )
      .map((value) => ({
        value,
        text: t(`editorPage.subConfig.nodeActions['${value}'].label`),
      })),
  );
  const editable = reactive<EditableAction[]>([]);
  const deleteVisible = computed({
    get: () => Boolean(actionToDelete.value),
    set: (visible) => {
      if (!visible) actionToDelete.value = undefined;
    },
  });
  const getActionName = (type: string): string =>
    actionOptions.value.find((option) => option.value === type)?.text ?? type;
  const syncEditable = (): void => {
    for (const action of props.list)
      if (!editable.some((item) => item.id === action.id))
        editable.push({
          id: action.id,
          defaultName: getActionName(action.type),
          customName: action.customName ?? "",
          oldCustomName: action.customName ?? "",
          isEditing: false,
        });
    for (const item of [...editable])
      if (!props.list.some((action) => action.id === item.id))
        editable.splice(editable.indexOf(item), 1);
  };
  const editItem = (action: ActionModuleProps): EditableAction =>
    editable.find((item) => item.id === action.id) ?? {
      id: action.id,
      defaultName: action.type,
      customName: "",
      oldCustomName: "",
      isEditing: false,
    };
  const isElementCollapsed = (id: string): boolean =>
    collapsedElements.value.includes(id);
  const setCollapsed = (collapsed: boolean): void => {
    isCollapsed.value = collapsed;
    collapsedElements.value = collapsed
      ? props.list.map((item) => item.id)
      : [];
    localStorage.setItem("actions-block-collapsed", collapsed ? "1" : "0");
  };
  const toggleElementCollapsed = (id: string): void => {
    collapsedElements.value = isElementCollapsed(id)
      ? collapsedElements.value.filter((item) => item !== id)
      : [...collapsedElements.value, id];
    isCollapsed.value = collapsedElements.value.length === props.list.length;
  };
  const startEditName = (action: ActionModuleProps): void => {
    editable.forEach((item) => {
      item.isEditing = item.id === action.id;
    });
  };
  const saveEditName = (action: ActionModuleProps): void => {
    const item = editItem(action);
    item.customName = item.customName.trim();
    item.oldCustomName = item.customName;
    item.isEditing = false;
    const target = form.process.find((process) => process.id === action.id);
    if (target) target.customName = item.customName;
  };
  const cancelEditName = (action: ActionModuleProps): void => {
    const item = editItem(action);
    item.customName = item.oldCustomName;
    item.isEditing = false;
  };
  const previewModel = (id: string) =>
    computed<boolean>({
      get: () => props.checked.find((item) => item[0] === id)?.[1] ?? false,
      set: (value) => {
        const item = props.checked.find((entry) => entry[0] === id);
        if (item) item[1] = value;
      },
    });
  const openTips = (action: ActionModuleProps): void => {
    tips.title = t(
      `editorPage.subConfig.nodeActions['${action.type}'].tipsTitle`,
    );
    tips.content = action.tipsDes;
    tips.visible = true;
  };
  const addAction = (option: ActionOption): void => {
    if (
      option.value.startsWith("Script ") &&
      form.process.filter((item) => item.type.startsWith("Script ")).length >= 2
    ) {
      showNotify({
        type: "warning",
        title: t("editorPage.subConfig.actions.script.limit"),
      });
      return;
    }
    emit("addAction", [option]);
  };
  const copyItem = async (action: ActionModuleProps): Promise<void> => {
    const item = form.process.find((process) => process.id === action.id);
    const content = JSON.stringify({ source: props.sourceType, data: item });
    if (isSupported) await copy(content);
    else await toClipboard(content);
    showNotify({
      type: "success",
      title: t("editorPage.subConfig.actions.pasteAction.copied"),
    });
  };
  const pasteFromText = (): void => {
    const action = parsePastedAction(
      pasteboard.value,
      props.sourceType,
      supportedActionTypes,
      getActionName,
    );
    if (!action) {
      showNotify({
        type: "danger",
        title: t("editorPage.subConfig.actions.pasteAction.invalidData"),
      });
      return;
    }
    emit("addAction", [action]);
    pasteboard.value = "";
    showPasteboard.value = false;
  };
  const paste = async (): Promise<void> => {
    try {
      pasteboard.value = await navigator.clipboard.readText();
      pasteFromText();
    } catch {
      showPasteboard.value = true;
    }
  };
  const confirmDelete = (): void => {
    if (actionToDelete.value) emit("deleteAction", actionToDelete.value);
    actionToDelete.value = undefined;
  };
  onMounted(async () => {
    syncEditable();
    try {
      await appendScriptActions(actionOptions, locale, t);
    } catch {
      showNotify({
        type: "warning",
        title: t("editorPage.subConfig.actions.script.unavailable"),
      });
    }
  });
  watch(() => props.list, syncEditable, { deep: true });
  watch(
    editable,
    () =>
      emit(
        "updateCustomNameModeFlag",
        editable.some((item) => item.isEditing),
      ),
    { deep: true },
  );
  return {
    t,
    isCollapsed,
    collapsedElements,
    pasteboard,
    showPasteboard,
    showHelp,
    actionToDelete,
    tips,
    actionOptions,
    deleteVisible,
    editItem,
    isElementCollapsed,
    setCollapsed,
    toggleElementCollapsed,
    startEditName,
    saveEditName,
    cancelEditName,
    previewModel,
    openTips,
    addAction,
    copyItem,
    paste,
    pasteFromText,
    confirmDelete,
    exitAllEditName: () =>
      editable.forEach((item) => {
        item.isEditing = false;
        item.customName = item.oldCustomName;
      }),
  };
};
