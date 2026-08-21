export type EditorSubmissionPayload = Sub & Record<string, unknown>;

type Options = {
  readonly form: Record<string, unknown>;
  readonly process: Process[];
};

const tagsFromValue = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  return [...new Set(value.split(",").map(item => item.trim()).filter(Boolean))];
};

export const createEditorSubmissionPayload = ({ form, process }: Options): EditorSubmissionPayload => {
  const payload: EditorSubmissionPayload = JSON.parse(JSON.stringify(form));
  delete payload.proxy;
  delete payload.mergeSources;
  delete payload.firstSubFlow;
  payload.tag = tagsFromValue(payload.tag);
  payload["display-name"] = payload.displayName;
  payload.process = process;
  if (payload.ignoreFailedRemoteSub === "disabled") payload.ignoreFailedRemoteSub = false;
  return payload;
};

type SaveOptions = {
  readonly configName: string;
  readonly create: (type: string, payload: EditorSubmissionPayload) => Promise<unknown>;
  readonly edit: (type: "collection" | "sub", name: string, payload: EditorSubmissionPayload) => Promise<unknown>;
  readonly editType: string;
  readonly onRemoteCreate: () => Promise<void>;
  readonly payload: EditorSubmissionPayload;
  readonly refresh: () => Promise<void>;
  readonly update: (type: string, name: string) => Promise<void>;
};

const saveSucceeded = (response: unknown): boolean => {
  if (!response || typeof response !== "object") return false;
  const data = Reflect.get(response, "data");
  return Boolean(data && typeof data === "object" && Reflect.get(data, "status") === "success");
};

export const saveEditorSubmission = async (options: SaveOptions): Promise<boolean> => {
  let response: unknown;
  if (options.configName === "UNTITLED") {
    response = await options.create(options.editType, options.payload);
    await options.refresh();
    if (options.payload.source === "remote") await options.onRemoteCreate();
  } else {
    const apiType = options.editType === "collections" ? "collection" : "sub";
    response = await options.edit(apiType, options.configName, options.payload);
    if (options.configName === options.payload.name) {
      await options.update(options.editType, options.configName);
    } else {
      await options.refresh();
    }
  }
  return saveSucceeded(response);
};
