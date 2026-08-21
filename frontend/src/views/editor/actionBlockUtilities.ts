import type { Ref } from "vue";
import { useCloudflareApi } from "@/api/app";

export type ActionOption = {
  readonly text: string;
  readonly value: string;
  readonly customName?: string;
  readonly args?: Record<string, unknown>;
};

type ScriptMetadata = {
  readonly id: string;
  readonly kind: "filter" | "operator";
  readonly name: string;
  readonly nameZh?: string;
  readonly parameters?: Array<{
    readonly key?: string;
    readonly default?: unknown;
  }>;
};

export const parsePastedAction = (
  content: string,
  sourceType: string | undefined,
  supportedTypes: readonly string[],
  getActionName: (type: string) => string,
): ActionOption | undefined => {
  try {
    const parsed: unknown = JSON.parse(content);
    if (typeof parsed !== "object" || parsed === null) return;
    const record = parsed as {
      source?: unknown;
      data?: { id?: unknown; type?: unknown };
    };
    if (
      record.source !== sourceType ||
      typeof record.data?.id !== "string" ||
      typeof record.data?.type !== "string" ||
      !supportedTypes.includes(record.data.type)
    )
      return;
    return {
      ...record.data,
      value: record.data.type,
      text: getActionName(record.data.type),
    };
  } catch {
    return;
  }
};

export const appendScriptActions = async (
  actionOptions: Ref<ActionOption[]>,
  locale: Ref<string>,
  translate: (key: string) => string,
): Promise<void> => {
  const response = await useCloudflareApi().getScripts();
  const payload: unknown = "data" in response ? response.data : undefined;
  const scripts =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : undefined;
  if (!Array.isArray(scripts)) return;
  for (const script of scripts as ScriptMetadata[]) {
    const value =
      script.kind === "filter" ? "Script Filter" : "Script Operator";
    const name =
      locale.value.startsWith("zh") && script.nameZh
        ? script.nameZh
        : script.name;
    actionOptions.value.push({
      value,
      text: `${name} · ${translate(`editorPage.subConfig.nodeActions['${value}'].label`)}`,
      customName: name,
      args: {
        scriptId: script.id,
        scriptKind: script.kind,
        arguments: Object.fromEntries(
          (script.parameters ?? [])
            .filter((parameter) => parameter?.key)
            .map((parameter) => [parameter.key, parameter.default]),
        ),
      },
    });
  }
};
