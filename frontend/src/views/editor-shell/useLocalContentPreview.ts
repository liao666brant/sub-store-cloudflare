import { computed, ref, watch, type ComputedRef } from "vue";

export type LocalPreviewSummary = {
  readonly detail?: string;
  readonly status: "success" | "danger";
  readonly title: string;
  readonly types?: Record<string, number>;
};

type Options = {
  readonly createPayload: (content: string) => Record<string, unknown>;
  readonly getContent: () => string;
  readonly getSource: () => unknown;
  readonly messages: {
    readonly empty: () => string;
    readonly failed: () => string;
    readonly importFailed: () => string;
    readonly noNodes: () => string;
    readonly success: (count: number) => string;
    readonly successDetail: (types: string) => string;
    readonly unknownType: () => string;
  };
  readonly notify: (type: "success" | "danger", title: string, content?: string) => void;
  readonly preview: (payload: Record<string, unknown>) => Promise<unknown>;
  readonly setContent: (content: string) => void;
  readonly watchedContent: ComputedRef<string>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const previewNodes = (response: unknown): unknown[] => {
  if (!isRecord(response) || !isRecord(response.data)) return [];
  const payload = response.data;
  if (payload.status !== "success" || !isRecord(payload.data) || !Array.isArray(payload.data.original)) return [];
  return payload.data.original;
};

const previewError = (response: unknown): string | undefined => {
  if (!isRecord(response) || !isRecord(response.data) || !isRecord(response.data.error)) return undefined;
  const message = response.data.error.message;
  return typeof message === "string" ? message : undefined;
};

const readTextFile = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
  reader.readAsText(file);
});

export const useLocalContentPreview = (options: Options) => {
  const localPreviewLoading = ref(false);
  const localPreviewSummary = ref<LocalPreviewSummary | null>(null);
  const summarizeNodes = (nodes: readonly unknown[]): Record<string, number> => nodes.reduce<Record<string, number>>((result, node) => {
    const type = isRecord(node) && typeof node.type === "string" ? node.type : options.messages.unknownType();
    result[type] = (result[type] ?? 0) + 1;
    return result;
  }, {});
  const formatSummary = (nodes: readonly unknown[]): Omit<LocalPreviewSummary, "status"> => {
    const types = summarizeNodes(nodes);
    const typeText = Object.entries(types).sort(([left], [right]) => left.localeCompare(right)).map(([type, count]) => `${type} × ${count}`).join(", ");
    return { title: options.messages.success(nodes.length), detail: typeText ? options.messages.successDetail(typeText) : "", types };
  };
  const localPreviewTypeBadges = computed(() => Object.entries(localPreviewSummary.value?.types ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([type, count]) => `${type} × ${count}`));
  const validateLocalContent = async (content = options.getContent(), notify = false): Promise<boolean> => {
    if (options.getSource() !== "local") return false;
    const raw = String(content || "");
    if (!raw.trim()) {
      localPreviewSummary.value = { status: "danger", title: options.messages.empty() };
      return false;
    }
    localPreviewLoading.value = true;
    try {
      const response = await options.preview(options.createPayload(raw));
      const nodes = previewNodes(response);
      if (nodes.length === 0) throw new Error(previewError(response) ?? options.messages.noNodes());
      const summary = formatSummary(nodes);
      localPreviewSummary.value = { status: "success", ...summary };
      if (notify) options.notify("success", summary.title, summary.detail);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      localPreviewSummary.value = { status: "danger", title: options.messages.failed(), detail: message };
      if (notify) options.notify("danger", options.messages.failed(), message);
      return false;
    } finally {
      localPreviewLoading.value = false;
    }
  };
  const fileChange = async (file: File): Promise<void> => {
    try {
      const content = await readTextFile(file);
      options.setContent(content);
      await validateLocalContent(content, true);
    } catch (error) {
      options.notify("danger", options.messages.importFailed());
      console.error(error);
    }
  };

  watch(options.watchedContent, () => { localPreviewSummary.value = null; });

  return { fileChange, localPreviewLoading, localPreviewSummary, localPreviewTypeBadges, validateLocalContent };
};
