import { javascript } from "@codemirror/lang-javascript";
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  redo,
  undo,
} from "@codemirror/commands";
import { bracketMatching, foldGutter } from "@codemirror/language";
import {
  closeSearchPanel,
  highlightSelectionMatches,
  openSearchPanel,
  searchKeymap,
} from "@codemirror/search";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";
import { hyperLink } from "@uiw/codemirror-extensions-hyper-link";
import beautify from "js-beautify";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { onUnmounted, ref, watch } from "vue";
import type { Ref } from "vue";
import { darkCode } from "@/views/editCode/dark.js";
import { lightCode } from "@/views/editCode/light.js";

type CodeLanguage = "javascript" | "plain";
type NotifyType = "success" | "warning";

type CodeMirrorEditorOptions = {
  readonly code: Ref<string>;
  readonly container: Ref<HTMLElement | null>;
  readonly isDark: Ref<boolean>;
  readonly isReadOnly: Ref<boolean>;
  readonly copyToClipboard: (text: string) => Promise<unknown>;
  readonly onCodeChange: (text: string) => void;
  readonly onClear: () => void;
  readonly notify: (type: NotifyType, title: string) => void;
  readonly translate: (key: string, values?: Record<string, number>) => string;
};

export const formatCodeLength = (length: number): string => {
  if (length === 0) return "";
  if (length < 1024) return `${length} bytes`;
  if (length < 1024 * 1024) return `${(length / 1024).toFixed(2)} KB`;
  return `${(length / (1024 * 1024)).toFixed(2)} MB`;
};

export const detectCodeLanguage = (text: string): CodeLanguage => {
  const sample = text.slice(0, 4000);
  const javaScriptKeyword = /(?:function|var|let|const|if|else|return|try|catch|finally|typeof|delete|async|await|Error:)\s/;
  if (javaScriptKeyword.test(sample)) return "javascript";
  if (!sample.includes("{")) return "plain";
  try {
    JSON.parse(text);
    return "javascript";
  } catch {
    return "plain";
  }
};

export const formatJavaScriptCode = (text: string): string => {
  return beautify
    .js_beautify(text, { indent_size: 2 })
    .replace(/^\s*[\r\n]/gm, "\n");
};

export const useCodeMirrorEditor = (options: CodeMirrorEditorOptions) => {
  const editorTheme = new Compartment();
  const language = new Compartment();
  const isJavaScript = ref(false);
  const length = ref(formatCodeLength(options.code.value.length));
  const openPanel = ref(localStorage.getItem("openCodePanel") !== "1");
  const highlightOnNextToggle = ref(localStorage.getItem("highlightJS") !== "1");
  let updatingFromEditor = false;
  let searchOpen = true;
  let view: EditorView | undefined;

  const dispatch = (effects: Parameters<EditorView["dispatch"]>[0]["effects"]): void => {
    if (view) view.dispatch({ effects });
  };

  const setLanguage = (nextLanguage: CodeLanguage): void => {
    isJavaScript.value = nextLanguage === "javascript";
    dispatch(language.reconfigure(isJavaScript.value ? javascript() : []));
  };

  const synchronizeMetadata = (text: string): void => {
    length.value = formatCodeLength(text.length);
    const detected = detectCodeLanguage(text);
    if (detected === "javascript") {
      setLanguage(detected);
      return;
    }
    setLanguage(localStorage.getItem("highlightJS") === "0" ? "plain" : "javascript");
  };

  const create = (): void => {
    const parent = options.container.value;
    if (!parent || view) return;
    view = new EditorView({
      state: EditorState.create({
        doc: options.code.value,
        extensions: [
          history(),
          keymap.of([indentWithTab, ...searchKeymap, ...defaultKeymap, ...historyKeymap]),
          language.of([]),
          editorTheme.of(options.isDark.value ? darkCode : lightCode),
          EditorState.readOnly.of(options.isReadOnly.value),
          EditorView.lineWrapping,
          lineNumbers(),
          highlightActiveLine(),
          bracketMatching(),
          highlightSelectionMatches(),
          indentationMarkers(),
          closeBrackets(),
          autocompletion(),
          EditorView.updateListener.of(update => {
            if (!update.docChanged) return;
            const nextText = update.state.doc.toString();
            updatingFromEditor = true;
            options.onCodeChange(nextText);
            length.value = formatCodeLength(nextText.length);
            updatingFromEditor = false;
          }),
          hyperLink,
          foldGutter({ closedText: "▸", openText: "▾" }),
        ],
      }),
      parent,
    });
    synchronizeMetadata(options.code.value);
  };

  const destroy = (): void => {
    view?.destroy();
    view = undefined;
  };

  const togglePanel = (): void => {
    openPanel.value = !openPanel.value;
    localStorage.setItem("openCodePanel", openPanel.value ? "0" : "1");
  };

  const toggleHighlight = (): void => {
    if (highlightOnNextToggle.value) {
      setLanguage("javascript");
      highlightOnNextToggle.value = false;
      localStorage.setItem("highlightJS", "1");
      return;
    }
    setLanguage("plain");
    highlightOnNextToggle.value = true;
    localStorage.setItem("highlightJS", "0");
  };

  const toggleSearch = (): void => {
    if (!view) return;
    if (searchOpen) openSearchPanel(view);
    else closeSearchPanel(view);
    searchOpen = !searchOpen;
  };

  const format = (): void => options.onCodeChange(formatJavaScriptCode(options.code.value));
  const copy = async (): Promise<void> => {
    await options.copyToClipboard(options.code.value);
    options.notify("success", options.translate("codeEditor.copiedLength", { count: options.code.value.length }));
  };
  const clear = (): void => {
    options.onCodeChange("");
    options.onClear();
    options.notify("success", options.translate("codeEditor.cleared"));
  };
  const paste = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      options.onCodeChange(text);
      options.notify("success", options.translate("codeEditor.pastedLength", { count: text.length }));
    } catch {
      options.notify("warning", options.translate("codeEditor.clipboardFailed"));
    }
  };
  const undoChange = (): void => {
    if (view) undo(view);
  };
  const redoChange = (): void => {
    if (view) redo(view);
  };

  const stopCodeSync = watch(options.code, nextText => {
    if (updatingFromEditor || !view || nextText === view.state.doc.toString()) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: nextText } });
    synchronizeMetadata(nextText);
  });
  const stopThemeSync = watch(options.isDark, isDark => {
    dispatch(editorTheme.reconfigure(isDark ? darkCode : lightCode));
  });

  onUnmounted(() => {
    stopCodeSync();
    stopThemeSync();
    destroy();
  });

  return {
    clear,
    copy,
    create,
    destroy,
    format,
    isJavaScript,
    length,
    openPanel,
    paste,
    redo: redoChange,
    toggleHighlight,
    togglePanel,
    toggleSearch,
    undo: undoChange,
  };
};
