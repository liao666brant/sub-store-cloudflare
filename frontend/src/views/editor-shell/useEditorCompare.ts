import { ref, toRaw, type Ref } from "vue";

type EditorForm = Record<string, unknown>;
type Options = {
  readonly actionsChecked: readonly unknown[];
  readonly buildProcess: () => unknown[];
  readonly closeLoading: () => void;
  readonly editType: string;
  readonly form: EditorForm;
  readonly preview: (type: "collection" | "sub", payload: Record<string, unknown>) => Promise<unknown>;
  readonly showLoading: () => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const cloneForm = (form: EditorForm): Record<string, unknown> => JSON.parse(JSON.stringify(toRaw(form)));
const tagsFromValue = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  return [...new Set(value.split(",").map(tag => tag.trim()).filter(Boolean))];
};
const uncheckedActionIds = (actions: readonly unknown[]): string[] => actions.flatMap(action => {
  if (!Array.isArray(action) || action[1] !== false || typeof action[0] !== "string") return [];
  return [action[0]];
});
const withoutUncheckedProcess = (process: unknown, uncheckedIds: readonly string[]): unknown[] => {
  if (!Array.isArray(process)) return [];
  return process.filter(item => !isRecord(item) || typeof item.id !== "string" || !uncheckedIds.includes(item.id));
};
const responseData = (response: unknown): unknown => {
  if (!isRecord(response) || !isRecord(response.data) || response.data.status !== "success") return null;
  return response.data.data ?? null;
};

export const useEditorCompare = (options: Options): { compareData: Ref<unknown>; fetchCompareData: () => Promise<void> } => {
  const compareData = ref<unknown>(null);
  const fetchCompareData = async (): Promise<void> => {
    options.showLoading();
    try {
      const payload = cloneForm(options.form);
      payload.process = withoutUncheckedProcess(options.buildProcess(), uncheckedActionIds(options.actionsChecked));
      if (payload.ignoreFailedRemoteSub === "disabled") payload.ignoreFailedRemoteSub = false;
      delete payload.firstSubFlow;
      delete payload.proxy;
      delete payload.mergeSources;
      payload.tag = tagsFromValue(payload.tag);
      compareData.value = responseData(await options.preview(options.editType === "collections" ? "collection" : "sub", payload));
    } catch (error) {
      console.error(error);
      compareData.value = null;
    } finally {
      options.closeLoading();
    }
  };
  return { compareData, fetchCompareData };
};
