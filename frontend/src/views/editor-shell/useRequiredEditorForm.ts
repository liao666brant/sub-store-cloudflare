import { inject } from "vue";
import type { EditorFormState } from "./editorTypes";

export class MissingEditorFormError extends Error {
  constructor() {
    super("Editor actions require an editor form provider.");
    this.name = "MissingEditorFormError";
  }
}

export const useRequiredEditorForm = (): EditorFormState => {
  const form = inject<EditorFormState>("form");
  if (!form) throw new MissingEditorFormError();
  return form;
};
