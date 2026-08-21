<template>
  <nav class="nav-bar-wrapper" :aria-label="currentTitle">
    <div class="nav-bar-wrapper__leading">
      <TButton
        v-if="isNeedBack"
        class="nav-bar-wrapper__action"
        variant="text"
        shape="square"
        :aria-label="t('navBar.actions.back')"
        :title="t('navBar.actions.back')"
        @click="back"
      >
        <ArrowLeftIcon />
      </TButton>
      <template v-else>
        <TButton
          v-if="showRefreshButton"
          class="nav-bar-wrapper__action"
          variant="text"
          shape="square"
          :aria-label="t('navBar.actions.refresh')"
          :title="t('navBar.actions.refresh')"
          @click="refresh"
        >
          <RefreshIcon />
        </TButton>
        <TButton
          v-if="showAddButton"
          class="nav-bar-wrapper__action"
          variant="text"
          shape="square"
          :aria-label="t('navBar.actions.add')"
          :title="t('navBar.actions.add')"
          @click="add"
        >
          <AddIcon />
        </TButton>
        <TButton
          v-if="showSearchButton"
          class="nav-bar-wrapper__action"
          :class="{ 'nav-bar-wrapper__action--active': isListSearchActive || listSearchStore.hasQuery }"
          variant="text"
          shape="square"
          :aria-label="t('navBar.listSearch.open')"
          :title="t('navBar.listSearch.open')"
          @click="openListSearch"
        >
          <SearchIcon />
        </TButton>
      </template>
    </div>

    <TInput
      v-if="isListSearchActive"
      ref="searchInputRef"
      v-model="listSearchQuery"
      class="nav-bar-wrapper__search"
      clearable
      size="small"
      type="search"
      :placeholder="t('navBar.listSearch.placeholder')"
      :aria-label="t('navBar.listSearch.placeholder')"
      @clear="closeListSearch"
      @keydown.esc.stop.prevent="closeListSearch"
    />
    <h1 v-else class="nav-bar-wrapper__title">{{ currentTitle }}</h1>
  </nav>
</template>

<script setup lang="ts">
import { AddIcon, ArrowLeftIcon, RefreshIcon, SearchIcon } from "tdesign-icons-vue-next";
import { Button as TButton, Input as TInput } from "tdesign-vue-next";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAppNotifyStore } from "@/store/appNotify";
import { useListSearchStore } from "@/store/listSearch";
import { useMethodStore } from "@/store/methodStore";
import { useSettingsStore } from "@/store/settings";
import { useSystemStore } from "@/store/system";
import { initStores } from "@/utils/initApp";
import i18n from "@/locales";

const { t: i18nGlobal } = i18n.global;
const { showNotify } = useAppNotifyStore();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const methodStore = useMethodStore();
const systemStore = useSystemStore();
const settingsStore = useSettingsStore();
const listSearchStore = useListSearchStore();
const searchInputRef = ref<{ $el: HTMLElement } | null>(null);

onMounted(() => {
  systemStore.initSystemState();
});

const isNeedBack = computed(() => route.meta.needNavBack ?? false);
const currentTitle = computed(() => {
  if (isListSearchActive.value) return "";

  if (route.meta.title === "subEditor") {
    const isCollection = route.params.editType === "collections";
    const isCreate = route.params.id === "UNTITLED";
    const titleKey = isCollection
      ? (isCreate ? "collectionCreate" : "collectionEdit")
      : (isCreate ? "sourceCreate" : "sourceEdit");
    return t(`navBar.pagesTitle.${titleKey}`);
  }

  return route.meta.title ? t(`navBar.pagesTitle.${route.meta.title}`) : "";
});
const showRefreshButton = computed(() => !isNeedBack.value && !settingsStore.appearanceSetting.showFloatingRefreshButton);
const showAddButton = computed(() => route.path === "/subs" && !settingsStore.appearanceSetting.showFloatingAddButton);
const showSearchButton = computed(() => Boolean(route.meta.supportsListSearch));
const isListSearchActive = computed(() => showSearchButton.value && listSearchStore.isSearchOpen && listSearchStore.activeRoutePath === route.path);
const listSearchQuery = computed({
  get: () => listSearchStore.query,
  set: (value: string) => listSearchStore.setQuery(value),
});

watch(() => route.path, () => {
  listSearchStore.syncRoute(route.path, Boolean(route.meta.supportsListSearch));
}, { immediate: true });

const focusSearchInput = async (): Promise<void> => {
  await nextTick();
  searchInputRef.value?.$el.querySelector<HTMLInputElement>("input")?.focus();
};

const openListSearch = async (): Promise<void> => {
  listSearchStore.open(route.path);
  await focusSearchInput();
};

const closeListSearch = (): void => listSearchStore.close();

const add = (): void => {
  methodStore.invokeMethod("addSub", {});
};

const back = (): void => {
  if (!isNeedBack.value) return;

  try {
    if (router.options.history.state.back) {
      router.back();
    } else {
      void router.push("/");
    }
  } catch {
    void router.push("/");
  }
};

const refresh = async (): Promise<void> => {
  if (route.path === "/preview") {
    window.location.reload();
    return;
  }

  if (route.path === "/subs") {
    await initStores(true, true, true);
    return;
  }

  showNotify({ title: i18nGlobal("globalNotify.refresh.loading"), type: "primary" });
  await initStores(true, true, true);
};
</script>

<style scoped lang="scss">
.nav-bar-wrapper {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  height: 100%;
  min-width: 0;
  padding: 0 var(--app-space-inline-safe, 16px);
}

.nav-bar-wrapper__leading {
  display: flex;
  align-items: center;
  gap: var(--app-space-compact, 6px);
  min-width: 0;
}

.nav-bar-wrapper__action {
  color: var(--td-text-color-secondary, var(--icon-nav-bar-right));
}

.nav-bar-wrapper__action--active {
  color: var(--td-brand-color, var(--primary-color));
}

.nav-bar-wrapper__title,
.nav-bar-wrapper__search {
  grid-column: 2;
  width: min(100%, 34rem);
}

.nav-bar-wrapper__title {
  overflow: hidden;
  margin: 0;
  color: var(--td-text-color-primary, var(--primary-text-color));
  font-size: var(--td-font-size-title-medium, 18px);
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media screen and (max-width: 479px) {
  .nav-bar-wrapper {
    grid-template-columns: minmax(0, 1fr) minmax(96px, 1.5fr) minmax(0, 1fr);
  }

  .nav-bar-wrapper__title {
    font-size: var(--td-font-size-body-medium, 14px);
    white-space: normal;
  }
}
</style>
