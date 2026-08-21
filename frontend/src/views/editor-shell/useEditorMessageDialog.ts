import { nextTick, reactive, ref } from "vue";

type DialogOptions = {
  readonly content: string;
  readonly okText?: string;
  readonly title: string;
};

export const useEditorMessageDialog = () => {
  const state = reactive({ visible: false, title: "", content: "", confirmText: "OK" });
  const returnFocus = ref<HTMLElement | null>(null);

  const open = (options: DialogOptions): void => {
    returnFocus.value = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    state.title = options.title;
    state.content = options.content;
    state.confirmText = options.okText ?? "OK";
    state.visible = true;
  };

  const close = (): void => {
    state.visible = false;
    const trigger = returnFocus.value;
    returnFocus.value = null;
    if (trigger) void nextTick(() => trigger.focus());
  };

  return { close, open, state };
};
