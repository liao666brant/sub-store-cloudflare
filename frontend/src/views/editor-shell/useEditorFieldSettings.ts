import { computed, ref, type ComputedRef } from "vue";

type EditorForm = Record<string, unknown>;
type RemoteSourceProfile = { readonly id: string; readonly name: string };
type Options = {
  readonly defaultIcon: ComputedRef<string>;
  readonly form: EditorForm;
  readonly getRemoteSourceProfile: (url: string) => Promise<unknown>;
  readonly isEditMode: ComputedRef<boolean>;
  readonly nameExists: (name: string) => boolean;
  readonly notifyAutoProfileFailure: () => void;
  readonly notifyAutoProfileSuccess: () => void;
  readonly placeholderDisabled: () => string;
  readonly placeholderEnabled: () => string;
  readonly validateField: (field: string) => void;
};

const isRemoteSourceProfile = (value: unknown): value is RemoteSourceProfile => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && typeof Reflect.get(value, "id") === "string" && typeof Reflect.get(value, "name") === "string";
};
const profileFromResponse = (response: unknown): RemoteSourceProfile | undefined => {
  if (!response || typeof response !== "object") return undefined;
  const data = Reflect.get(response, "data");
  if (!data || typeof data !== "object" || Reflect.get(data, "status") !== "success") return undefined;
  const profile = Reflect.get(data, "data");
  return isRemoteSourceProfile(profile) ? profile : undefined;
};

export const useEditorFieldSettings = (options: Options) => {
  const remoteSourceProfileUrl = ref("");
  const nameValidator = async (value: string): Promise<boolean> => {
    return /^[a-z0-9_-]{1,64}$/.test(value) && value !== "UNTITLED" && !options.nameExists(value);
  };
  const urlValidator = async (value: string): Promise<boolean> => {
    if (!/\n/.test(value)) return /^(http|https):\/\/\S+$/.test(value);
    return value.split(/[\r\n]+/).map(item => item.trim()).filter(Boolean).every(item => /^(http|https):\/\/\S+$/.test(item));
  };
  const passThroughUAOn = computed(() => options.form.source === "remote" && Boolean(options.form.passThroughUA));
  const userAgentPlaceholder = computed(() => passThroughUAOn.value ? options.placeholderDisabled() : options.placeholderEnabled());
  const handlePassThroughUAChange = (value: boolean): void => {
    if (value) {
      options.form._savedUA = options.form.ua;
      options.form.ua = "";
      return;
    }
    if (options.form._savedUA !== undefined) {
      options.form.ua = options.form._savedUA;
      options.form._savedUA = undefined;
    }
  };
  const handleRemoteUrlBlur = async (): Promise<void> => {
    options.validateField("url");
    const url = String(options.form.url || "").trim();
    if (options.isEditMode.value || options.form.source !== "remote" || remoteSourceProfileUrl.value === url || !/^https?:\/\/\S+$/i.test(url)) return;
    try {
      const profile = profileFromResponse(await options.getRemoteSourceProfile(url));
      if (!profile) return;
      remoteSourceProfileUrl.value = url;
      if (!options.form.displayName) {
        options.form.displayName = profile.name;
        options.notifyAutoProfileSuccess();
      }
    } catch (error) {
      if (error instanceof Error) {
        options.notifyAutoProfileFailure();
        return;
      }
      throw error;
    }
  };
  const trim = (field: string): void => {
    if (typeof options.form[field] === "string") options.form[field] = options.form[field].trim();
  };
  const subIcon = computed(() => typeof options.form.icon === "string" && options.form.icon ? options.form.icon : options.defaultIcon.value);

  return { handlePassThroughUAChange, handleRemoteUrlBlur, nameValidator, passThroughUAOn, subIcon, trim, urlValidator, userAgentPlaceholder };
};
