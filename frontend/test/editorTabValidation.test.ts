import { describe, expect, it } from "vitest";
import { getEditorTabForValidationErrors } from "../src/utils/editorTabValidation";

describe("editorTabValidation", () => {
  const propToTabMap = { name: "basic", url: "source" } as const;

  it("maps the first validation error field to its tab", () => {
    expect(getEditorTabForValidationErrors([{ prop: "url" }], propToTabMap)).toBe("source");
    expect(getEditorTabForValidationErrors([{ field: "name" }, { prop: "url" }], propToTabMap)).toBe("basic");
  });

  it("ignores errors without a mapped tab and non-array input", () => {
    expect(getEditorTabForValidationErrors([{ prop: "unknown" }], propToTabMap)).toBeUndefined();
    expect(getEditorTabForValidationErrors([{ field: "" }], propToTabMap)).toBeUndefined();
    expect(getEditorTabForValidationErrors(null, propToTabMap)).toBeUndefined();
    expect(getEditorTabForValidationErrors("name", propToTabMap)).toBeUndefined();
  });
});