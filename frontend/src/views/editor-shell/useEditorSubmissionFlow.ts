import { ref } from "vue";

type EditorPayload = Record<string, unknown> & { content?: unknown; source?: unknown };
type ValidationError = { readonly message?: string; readonly prop?: string };
type ValidationResult = { readonly errors: readonly ValidationError[]; readonly valid: boolean };
type Options<TPayload extends EditorPayload> = {
  readonly closeLoading: () => void;
  readonly createPayload: () => TPayload;
  readonly editType: string;
  readonly focusValidationError: (errors: readonly ValidationError[]) => void;
  readonly getLocalContent: () => string;
  readonly notifyBusy: () => void;
  readonly notifyFailure: () => void;
  readonly onSuccess: () => Promise<void>;
  readonly openValidationDialog: (message: string) => void;
  readonly save: (payload: TPayload) => Promise<boolean>;
  readonly showLoading: () => void;
  readonly validateForm: () => Promise<ValidationResult>;
  readonly validateLocalContent: (content: string) => Promise<boolean>;
};

export const useEditorSubmissionFlow = <TPayload extends EditorPayload>(options: Options<TPayload>): { submit: () => void } => {
  const submitting = ref(false);
  const submit = (): void => {
    if (submitting.value) {
      options.notifyBusy();
      return;
    }
    void options.validateForm().then(async result => {
      submitting.value = true;
      if (!result.valid) {
        submitting.value = false;
        options.focusValidationError(result.errors);
        options.openValidationDialog(result.errors[0]?.message ?? "");
        return;
      }
      options.showLoading();
      const payload = options.createPayload();
      if (options.editType === "subs" && payload.source === "local") {
        const content = options.getLocalContent();
        if (!await options.validateLocalContent(content)) {
          submitting.value = false;
          options.closeLoading();
          options.focusValidationError([{ prop: "content" }]);
          return;
        }
        payload.content = content;
      }
      if (await options.save(payload)) await options.onSuccess();
      else options.notifyFailure();
      submitting.value = false;
      options.closeLoading();
    });
  };
  return { submit };
};
