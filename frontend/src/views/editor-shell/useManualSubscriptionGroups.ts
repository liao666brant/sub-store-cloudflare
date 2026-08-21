import { ref, watch, type ComputedRef, type Ref } from "vue";
import { getEditorRouteValue, setEditorRouteValue } from "@/utils/editorFoldState";
import type { SubscriptionRow } from "@/views/editor-shell/useCollectionSubscriptionSelection";

type EditorForm = Record<string, unknown>;
type TagOption = { readonly label: string; readonly value: string };
type Options = {
  readonly editType: string;
  readonly form: EditorForm;
  readonly initialized: Ref<boolean>;
  readonly path: ComputedRef<string>;
  readonly rows: ComputedRef<SubscriptionRow[]>;
  readonly storageKey: string;
  readonly tags: ComputedRef<TagOption[]>;
};

const normalizeTagList = (value: unknown): string[] => {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  return source.map(item => String(item).trim()).filter(Boolean);
};

export const useManualSubscriptionGroups = (options: Options) => {
  const tag = ref("all");
  const initialized = ref(false);
  const touched = ref(false);
  const isGroupAvailable = (group: string): boolean => {
    return group === "all" || options.tags.value.some(item => item.value === group);
  };
  const matchingCollectionGroup = (): string => {
    const collectionTags = normalizeTagList(options.form.tag);
    if (collectionTags.length === 0) return "";
    const sourceTags = new Set<string>();
    options.rows.value.forEach(([, , , tags]) => normalizeTagList(tags).forEach(value => sourceTags.add(value)));
    return collectionTags.find(value => sourceTags.has(value)) ?? "";
  };
  const applyInitialGroup = (): void => {
    if (options.editType !== "collections" || !options.initialized.value || initialized.value || touched.value || tag.value !== "all") return;
    const remembered = getEditorRouteValue(options.storageKey, options.path.value);
    if (remembered && isGroupAvailable(remembered)) {
      tag.value = remembered;
      initialized.value = true;
      return;
    }
    if (remembered && options.rows.value.length === 0) return;
    const matched = matchingCollectionGroup();
    if (!matched) return;
    tag.value = matched;
    initialized.value = true;
  };
  const setTag = (value: string): void => {
    touched.value = true;
    tag.value = value;
    setEditorRouteValue(options.storageKey, options.path.value, value);
  };
  const shouldShow = (tags: string[] | undefined): boolean => {
    if (tag.value === "all") return true;
    if (tag.value === "untagged") return !Array.isArray(tags) || tags.length === 0;
    return tags?.includes(tag.value) ?? false;
  };

  watch([() => options.form.tag, options.rows, options.tags, options.initialized], applyInitialGroup, { deep: true, immediate: true });

  return { setTag, shouldShow, tag };
};
