import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import zh from "@/locales/zh";

import {
  detectCodeLanguage,
  formatCodeLength,
  formatJavaScriptCode,
} from "@/hooks/useCodeMirrorEditor";
import CodeMirrorToolbar from "@/views/editCode/CodeMirrorToolbar.vue";

describe("CodeMirror editor behavior", () => {
  it("detects JavaScript and valid JSON without treating malformed JSON as JavaScript", () => {
    // Given
    const javaScript = "const name = 'Sub-Store';";
    const validJson = '{\"name\":\"Sub-Store\"}';
    const malformedJson = '{\"name\":}';

    // When / Then
    expect(detectCodeLanguage(javaScript)).toBe("javascript");
    expect(detectCodeLanguage(validJson)).toBe("javascript");
    expect(detectCodeLanguage(malformedJson)).toBe("plain");
  });

  it("formats byte labels and JavaScript without changing the editor's text storage contract", () => {
    // Given
    const source = "const value={enabled:true};\n";

    // When
    const formatted = formatJavaScriptCode(source);

    // Then
    expect(formatCodeLength(0)).toBe("");
    expect(formatCodeLength(1024)).toBe("1.00 KB");
    expect(formatCodeLength(1024 * 1024)).toBe("1.00 MB");
    expect(formatted).toContain("const value = {");
    expect(formatted).toContain("enabled: true");
  });

  it("exposes every CodeMirror command as an accessible TDesign toolbar button", async () => {
    // Given
    const wrapper = mount(CodeMirrorToolbar, {
      props: { isJavaScript: true },
      global: {
        plugins: [createI18n({ legacy: false, locale: "zh", messages: { zh } })],
        stubs: { TButton: { template: "<button v-bind='$attrs'><slot /></button>" } },
      },
    });

    // When
    await wrapper.get('button[aria-label="撤销"]').trigger("click");

    // Then
    expect(wrapper.emitted("undo")).toHaveLength(1);
    expect(wrapper.get('button[aria-label="格式化代码"]').exists()).toBe(true);
    expect(wrapper.get('button[aria-label="粘贴代码"]').exists()).toBe(true);
  });
});
