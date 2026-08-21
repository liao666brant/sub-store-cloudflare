import { computed, ref, watch, type ComputedRef, type Ref } from "vue";
import { getEditorFoldState, getEditorIsFolded, setEditorFoldState } from "@/utils/editorFoldState";
import { useCollectionSubscriptionSelection, type SubscriptionRow } from "@/views/editor-shell/useCollectionSubscriptionSelection";
import { useEditorTabs } from "@/views/editor-shell/useEditorTabs";
import { useManualSubscriptionGroups } from "@/views/editor-shell/useManualSubscriptionGroups";

type Appearance = {
  readonly editorGroupingMode?: EditorGroupingMode;
  readonly isDefaultIcon?: boolean;
  readonly isSimpleMode?: boolean;
  readonly manualSubscriptionsDisplayMode?: string;
};
type EditorForm = Record<string, unknown> & { subscriptions?: string[] };
type Options = {
  readonly appearance: Readonly<Ref<Appearance>>;
  readonly collection: (name: string) => Collection | undefined;
  readonly configName: string;
  readonly defaultIcon: ComputedRef<string>;
  readonly editType: string;
  readonly form: EditorForm;
  readonly initialized: Ref<boolean>;
  readonly isEditMode: ComputedRef<boolean>;
  readonly path: ComputedRef<string>;
  readonly source: (name: string) => Sub | undefined;
  readonly sources: ComputedRef<readonly Sub[]>;
  readonly topOffset: Readonly<Ref<string>>;
  readonly translate: (key: string) => string;
};

const FOLD_STORAGE_KEY = "manual-subscriptions-fold";
const GROUP_STORAGE_KEY = "manual-subscriptions-group";

export const useEditorPresentation = (options: Options) => {
  const groupingMode = computed<EditorGroupingMode>(() => options.appearance.value.editorGroupingMode || "edit-only");
  const {
    activeEditorTab,
    editorSectionTabs,
    editorTabsEnabled,
    focusValidationErrorTab,
    isSubFormTabActive,
    setActiveEditorTab,
  } = useEditorTabs({ path: options.path, isEditMode: options.isEditMode, groupingMode, label: options.translate });
  const defaultFolded = computed(() => options.appearance.value.manualSubscriptionsDisplayMode !== "expanded");
  const manualSubscriptionsIsFold = ref(getEditorIsFolded(FOLD_STORAGE_KEY, options.path.value, defaultFolded.value));
  const toggleManualSubscriptionsFold = (): void => {
    manualSubscriptionsIsFold.value = !manualSubscriptionsIsFold.value;
    setEditorFoldState(FOLD_STORAGE_KEY, options.path.value, manualSubscriptionsIsFold.value);
  };
  watch([options.path, defaultFolded], ([path, folded]) => {
    manualSubscriptionsIsFold.value = getEditorFoldState(FOLD_STORAGE_KEY, path) === undefined
      ? folded
      : getEditorIsFolded(FOLD_STORAGE_KEY, path, folded);
  });

  const sub = computed(() => options.source(options.configName));
  const collection = computed(() => options.collection(options.configName));
  const rows = computed<SubscriptionRow[]>(() => options.sources.value.map(item => [
    item.name,
    item.displayName || item["display-name"] || item.name,
    item.icon || options.defaultIcon.value,
    item.tag,
    item.isIconColor !== false,
  ]));
  const tags = computed(() => {
    if (options.sources.value.length === 0) return [];
    const values = new Set<string>();
    let hasUntagged = false;
    options.sources.value.forEach(source => {
      if (source.tag?.length) source.tag.forEach(tag => values.add(tag));
      else hasUntagged = true;
    });
    const result = [{ label: options.translate("specificWord.all"), value: "all" }, ...[...values].map(value => ({ label: value, value }))];
    if (hasUntagged) result.push({ label: options.translate("specificWord.untagged"), value: "untagged" });
    return result;
  });
  const { setTag, shouldShow, tag } = useManualSubscriptionGroups({
    editType: options.editType,
    form: options.form,
    initialized: options.initialized,
    path: options.path,
    rows,
    storageKey: GROUP_STORAGE_KEY,
    tags,
  });
  const subscriptionsLabel = computed(() => {
    const subscriptions = options.form.subscriptions;
    if (!subscriptions?.length) return rows.value.length === 0
      ? options.translate("editorPage.subConfig.basic.subscriptions.empty")
      : options.translate("editorPage.subConfig.basic.subscriptions.allEnabled");
    const labels = subscriptions.flatMap(name => {
      const source = options.source(name);
      if (!source) {
        options.form.subscriptions = subscriptions.filter(item => item !== name);
        return [`${name}(🚫)`];
      }
      return [source.displayName || source["display-name"] || source.name];
    });
    return labels.join(", ");
  });
  const selection = useCollectionSubscriptionSelection({ form: options.form, rows, shouldShow, visibleKey: computed(() => tag.value) });

  return {
    ...selection,
    activeEditorTab,
    chooserAvatarSize: computed(() => options.appearance.value.isSimpleMode ? "28" : "32"),
    collection,
    editorSectionTabs,
    editorTabsEnabled,
    focusValidationErrorTab,
    isSubFormTabActive,
    manualSubscriptionsIsFold,
    setActiveEditorTab,
    setTag,
    sub,
    subscriptionsLabel,
    tag,
    tags,
    toggleManualSubscriptionsFold,
    topOffset: options.topOffset,
  };
};
