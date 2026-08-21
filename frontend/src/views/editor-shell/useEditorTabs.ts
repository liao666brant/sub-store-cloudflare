import { computed, ref, watch, type ComputedRef } from "vue";
import { getEditorActiveTab, setEditorActiveTab } from "@/utils/editorTabState";
import { getEditorTabForValidationErrors } from "@/utils/editorTabValidation";

const STORAGE_KEY = "sub-editor-active-tab";
const TABS = ["content", "actions"] as const;

export type EditorTab = (typeof TABS)[number];

type ValidationError = {
  readonly prop: string;
};

type Options = {
  readonly path: ComputedRef<string>;
  readonly isEditMode: ComputedRef<boolean>;
  readonly groupingMode: ComputedRef<EditorGroupingMode>;
  readonly label: (key: string) => string;
};

const propToTab: Partial<Record<string, EditorTab>> = {
  name: "content",
  displayName: "content",
  remark: "content",
  tag: "content",
  icon: "content",
  isIconColor: "content",
  source: "content",
  url: "content",
  content: "content",
  passThroughUA: "content",
  ua: "content",
  subUserinfo: "content",
  ignoreFailedRemoteSub: "content",
};

export const useEditorTabs = ({ path, isEditMode, groupingMode, label }: Options) => {
  const availableTabs = computed(() => [...TABS]);
  const editorTabsEnabled = computed(() => groupingMode.value !== "disabled");
  const getActiveTab = (currentPath: string, tabs: readonly EditorTab[]): EditorTab => {
    const defaultTab = tabs[0] ?? "content";
    return isEditMode.value
      ? getEditorActiveTab(STORAGE_KEY, currentPath, tabs, defaultTab)
      : defaultTab;
  };
  const activeEditorTab = ref<EditorTab>(getActiveTab(path.value, availableTabs.value));
  const editorSectionTabs = computed(() => TABS.map(value => ({
    value,
    label: label(`editorPage.subConfig.editorTabs.${value}`),
  })));
  const isSubFormTabActive = computed(() => !editorTabsEnabled.value || activeEditorTab.value === "content");

  watch([path, availableTabs, isEditMode], ([nextPath, tabs]) => {
    activeEditorTab.value = getActiveTab(nextPath, tabs);
  }, { immediate: true });
  watch(activeEditorTab, tab => {
    if (isEditMode.value) setEditorActiveTab(STORAGE_KEY, path.value, tab);
  });

  const setActiveEditorTab = (tab: EditorTab): void => {
    if (editorTabsEnabled.value) activeEditorTab.value = tab;
  };
  const focusValidationErrorTab = (errors: readonly ValidationError[]): void => {
    const tab = getEditorTabForValidationErrors(errors, propToTab);
    if (tab) setActiveEditorTab(tab);
  };

  return {
    activeEditorTab,
    editorSectionTabs,
    editorTabsEnabled,
    focusValidationErrorTab,
    isSubFormTabActive,
    setActiveEditorTab,
  };
};
