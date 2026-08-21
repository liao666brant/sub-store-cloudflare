import { ref } from "vue";

type Options = {
  readonly onOpen: (top: number) => void;
  readonly onClose: () => void;
};

const setPageScrollLock = (locked: boolean): void => {
  const overflow = locked ? "hidden" : "";
  const height = locked ? "100%" : "";
  document.documentElement.style.overflowY = overflow;
  document.documentElement.style.height = height;
  document.body.style.overflowY = overflow;
  document.body.style.height = height;
  const app = document.querySelector<HTMLElement>("#app");
  if (app) {
    app.style.overflowY = overflow;
    app.style.height = height;
  }
};

export const useCompareOverlay = ({ onOpen, onClose }: Options) => {
  const visible = ref(false);
  let scrollTop = 0;

  const open = (): void => {
    scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    onOpen(scrollTop);
    setPageScrollLock(true);
    visible.value = true;
  };
  const close = (): void => {
    setPageScrollLock(false);
    visible.value = false;
    window.scrollTo({ top: scrollTop, behavior: "instant" });
    onClose();
  };

  return { close, open, visible };
};
