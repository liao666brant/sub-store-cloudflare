import { watchEffect, type Ref } from "vue";

type EditorForm = Record<string, unknown>;
type Options = {
  readonly configName: string;
  readonly editType: string;
  readonly form: EditorForm;
  readonly getRecord: () => unknown;
  readonly initialized: Ref<boolean>;
  readonly loadActions: (process: unknown[]) => void;
  readonly notifyRemoteUaConflict: () => void;
  readonly setCode: (content: string) => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};
const stringValue = (value: unknown): string | undefined => typeof value === "string" ? value : undefined;
const stringList = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === "string")
  : [];
const copyProcess = (value: unknown): unknown[] => Array.isArray(value)
  ? JSON.parse(JSON.stringify(value))
  : [];
const normalizedFailureMode = (value: unknown): "disabled" | "skip" | unknown => {
  if (value === true || value === "quiet" || value === "enabled") return "skip";
  return value === false || value == null ? "disabled" : value;
};

export const useEditorInitialization = (options: Options): void => {
  watchEffect(() => {
    if (options.initialized.value) return;
    if (options.configName === "UNTITLED") {
      if (options.editType === "collections") {
        options.form.subscriptions = [];
        options.form.templateId = "acl4ssr-mihomo";
      } else {
        options.form.source = "remote";
        options.form.url = "";
        options.form.content = "";
        options.form.ua = "";
        options.setCode("");
      }
      options.initialized.value = true;
      return;
    }

    const record = options.getRecord();
    if (!isRecord(record)) return;
    const process = copyProcess(record.process);
    options.form.ignoreFailedRemoteSub = normalizedFailureMode(record.ignoreFailedRemoteSub);
    options.form.passThroughUA = record.passThroughUA;
    options.form.name = record.name;
    options.form.displayName = record.displayName ?? record["display-name"];
    options.form.remark = record.remark;
    options.form.icon = record.icon;
    options.form.isIconColor = record.isIconColor !== false;
    options.form.process = process;
    options.form.subUserinfo = record.subUserinfo;
    options.form.tag = Array.isArray(record.tag) ? stringList(record.tag).join(", ") : record.tag;

    if (options.editType === "collections") {
      options.form.subscriptions = stringList(record.subscriptions);
      options.form.templateId = record.templateId ?? "acl4ssr-mihomo";
    } else {
      options.form.source = record.source;
      options.form.url = record.url;
      options.form.content = record.content;
      options.setCode(stringValue(record.content) ?? "");
      options.form.ua = record.ua;
      options.form._savedUA = record._savedUA;
      if (record.passThroughUA && record.ua) options.notifyRemoteUaConflict();
    }

    options.loadActions(process);
    options.initialized.value = true;
  });
};
