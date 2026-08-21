export type EditorValidationError = {
  readonly message: string;
  readonly prop: string;
};

export type EditorValidationResult = {
  readonly errors: EditorValidationError[];
  readonly valid: boolean;
};

export const normalizeEditorValidation = (result: unknown): EditorValidationResult => {
  if (result === true) return { valid: true, errors: [] };
  if (!result || typeof result !== "object") return { valid: false, errors: [] };

  const errors = Object.entries(result).flatMap(([prop, value]) => {
    if (!Array.isArray(value) || value.length === 0) return [];
    const first = value[0];
    const message = first && typeof first === "object" && "message" in first
      ? String(first.message ?? "")
      : "";
    return [{ prop, message }];
  });
  return { valid: errors.length === 0, errors };
};
