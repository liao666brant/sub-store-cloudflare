import { defineStore } from "pinia";
import { showNotify as showTDesignNotify } from "@/plugin/tdesign";

export const useAppNotifyStore = defineStore("appNotify", {
  state: (): AppNotifyStoreState => {
    return {
      navBartop: 0,
    };
  },
  getters: {},
  actions: {
    showNotify(settings: NotifySettings) {
      showTDesignNotify(settings);
    },
  },
});
