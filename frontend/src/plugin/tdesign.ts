import { normalizeLocale } from "@/locales/languages";
import type { SupportedLocale } from "@/locales/languages";
import { getThemeMode } from "@/hooks/useThemes";
import { useSettingsStore } from "@/store/settings";
import enUS from "tdesign-vue-next/es/locale/en_US";
import {
  Dialog as TDesignDialog,
  Drawer as TDesignDrawer,
  LoadingPlugin,
  MessagePlugin,
  Popup as TDesignPopup,
} from "tdesign-vue-next";
import type { GlobalConfigProvider, LoadingInstance } from "tdesign-vue-next";
import zhCN from "tdesign-vue-next/es/locale/zh_CN";
import { useMediaQuery } from "@vueuse/core";
import { computed, h, watchEffect } from "vue";
import type { App, ComputedRef, VNode } from "vue";

type TDesignLocale = typeof enUS | typeof zhCN;

type LoadingId = string;

type FeedbackLoadingOptions = {
  readonly cover: boolean;
  readonly id: LoadingId;
};

type FeedbackNotifyType = "primary" | "success" | "danger" | "warning";

export type FeedbackNotifyOptions = {
  readonly title: string;
  readonly content?: string;
  readonly type?: FeedbackNotifyType;
  readonly duration?: number;
  readonly offset?: readonly [number, number];
  readonly placement?: "top" | "bottom";
};

const loadingInstances = new Map<LoadingId, LoadingInstance>();

export const installTDesignFeedback = (app: App): void => {
  app.use(LoadingPlugin);
  app.use(MessagePlugin);
};

export const showLoading = (content: string, options: FeedbackLoadingOptions): void => {
  closeLoading(options.id);
  const instance = LoadingPlugin({
    content,
    fullscreen: true,
    preventScrollThrough: options.cover,
    showOverlay: options.cover,
  });
  loadingInstances.set(options.id, instance);
};

export const closeLoading = (id: LoadingId): void => {
  const instance = loadingInstances.get(id);
  if (!instance) return;

  instance.hide();
  loadingInstances.delete(id);
};

export const showSuccess = (content: string): void => {
  void MessagePlugin.success(content);
};

export const showError = (content: string): void => {
  void MessagePlugin.error(content);
};

const notifyMethods = {
  primary: MessagePlugin.info,
  success: MessagePlugin.success,
  danger: MessagePlugin.error,
  warning: MessagePlugin.warning,
} satisfies Record<FeedbackNotifyType, typeof MessagePlugin.info>;

const createNotifyContent = (options: FeedbackNotifyOptions): VNode => h("div", [
  h("strong", options.title),
  options.content ? h("div", options.content) : null,
]);

const defaultNotifyOffset = (): [number, number] | undefined => {
  return window.matchMedia("(max-width: 767px)").matches || document.querySelector(".bottom-btn-wrapper")
    ? [0, -96]
    : undefined;
};

export const showNotify = (options: FeedbackNotifyOptions): void => {
  const type = options.type ?? "primary";
  void notifyMethods[type]({
    closeBtn: true,
    content: () => createNotifyContent(options),
    duration: options.duration ?? 2500,
    offset: options.offset ? [...options.offset] : defaultNotifyOffset(),
    placement: options.placement ?? "bottom",
    zIndex: 65535,
  });
};

export { TDesignDialog, TDesignDrawer, TDesignPopup };

const createTDesignLocale = (locale: TDesignLocale): GlobalConfigProvider => ({
  ...locale,
  datePicker: {
    ...locale.datePicker,
    months: [...locale.datePicker.months],
    quarters: [...locale.datePicker.quarters],
    weekdays: [...locale.datePicker.weekdays],
  },
  rate: {
    ...locale.rate,
    rateText: [...locale.rate.rateText],
  },
});

const TDESIGN_LOCALES = {
  en: createTDesignLocale(enUS),
  zh: createTDesignLocale(zhCN),
} satisfies Record<SupportedLocale, GlobalConfigProvider>;

export const useTDesignConfig = (getLocale: () => string): ComputedRef<GlobalConfigProvider> => {
  return computed<GlobalConfigProvider>(() => TDESIGN_LOCALES[normalizeLocale(getLocale())]);
};

export const useTDesignThemeMode = (): void => {
  const settingsStore = useSettingsStore();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const themeMode = computed(() => {
    if (settingsStore.theme.auto) {
      return prefersDark.value ? "dark" : "light";
    }

    return getThemeMode(settingsStore.theme.name) ?? "light";
  });

  watchEffect(() => {
    document.documentElement.setAttribute("theme-mode", themeMode.value);
  });
};
