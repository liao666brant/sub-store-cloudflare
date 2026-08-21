import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useCloudflareApi } from "@/api/app";
import { useFilteredDraggableList } from "@/hooks/useFilteredDraggableList";
import { useListViewMode } from "@/hooks/useListViewMode";
import { useTagBarHeight } from "@/hooks/useTagBarHeight";
import { useAppNotifyStore } from "@/store/appNotify";
import { useGlobalStore } from "@/store/global";
import { useListSearchStore } from "@/store/listSearch";
import { useMethodStore } from "@/store/methodStore";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { getStoredAdminToken, setStoredAdminToken } from "@/utils/adminToken";
import { initStores } from "@/utils/initApp";
import { listItemMatchesSearch, shouldSearchListRemark } from "@/utils/listSearch";

type SubscriptionItem = Sub | Collection;
type SubscriptionTag = { readonly label: string; readonly value: string };
type FoldState = Partial<Record<"sub" | "collection", Record<string, true>>>;

const readFoldState = (): FoldState => {
  try {
    const rawState = localStorage.getItem("sub-fold");
    return rawState ? JSON.parse(rawState) : {};
  } catch {
    return {};
  }
};

export const useSubscriptionsPage = () => {
  const { t } = useI18n();
  const cloudflareApi = useCloudflareApi();
  const { showNotify } = useAppNotifyStore();
  const subsStore = useSubsStore();
  const settingsStore = useSettingsStore();
  const globalStore = useGlobalStore();
  const listSearchStore = useListSearchStore();
  const methodStore = useMethodStore();
  const { hasSubs, hasCollections, subs, collections } = storeToRefs(subsStore);
  const { appearanceSetting } = storeToRefs(settingsStore);
  const { isLoading, fetchResult } = storeToRefs(globalStore);
  const { effectiveListViewMode } = useListViewMode();
  const addSubVisible = ref(false);
  const showImportTips = ref(false);
  const restoreIsLoading = ref(false);
  const adminToken = ref(getStoredAdminToken());
  const dragging = ref(false);
  const sortFailed = ref(false);
  const dragSnapshot = ref<SubscriptionItem[] | null>(null);
  const activeSortRequest = ref<Promise<void> | null>(null);
  const tag = ref(localStorage.getItem("sub-tag") ?? "all");
  const foldState = ref<FoldState>(readFoldState());
  const isDualColumnMode = computed(() => effectiveListViewMode.value === "dual-column");

  const tags = computed<SubscriptionTag[]>(() => {
    const tagValues = new Set<string>();
    let hasRemote = false;
    let hasLocal = false;
    let hasUntagged = false;
    const items = [...subs.value, ...collections.value];

    items.forEach(item => {
      if ("source" in item) hasRemote ||= item.source === "remote";
      if ("source" in item) hasLocal ||= item.source === "local";
      if (item.tag?.length) item.tag.forEach(value => tagValues.add(value));
      else hasUntagged = true;
    });

    const result: SubscriptionTag[] = [
      { label: t("specificWord.all"), value: "all" },
      ...[...tagValues].map(value => ({ label: value, value })),
    ];
    if (hasRemote) result.push({ label: t("editorPage.subConfig.basic.source.remote"), value: "remote" });
    if (hasLocal) result.push({ label: t("editorPage.subConfig.basic.source.local"), value: "local" });
    if (hasUntagged && tagValues.size > 0) result.push({ label: t("specificWord.untagged"), value: "untagged" });
    if (!result.some(item => item.value === tag.value)) tag.value = "all";
    return result;
  });

  const shouldShowElement = (item: SubscriptionItem): boolean => {
    const tagMatches = tag.value === "all"
      || (tag.value === "untagged" && !item.tag?.length)
      || (tag.value === "remote" && "source" in item && item.source === "remote")
      || (tag.value === "local" && "source" in item && item.source === "local")
      || item.tag?.includes(tag.value) === true;
    return tagMatches && listItemMatchesSearch(item, listSearchStore.normalizedQuery, {
      includeRemark: shouldSearchListRemark(appearanceSetting.value),
    });
  };

  const filteredSubs = useFilteredDraggableList(subs, shouldShowElement);
  const filteredCollections = useFilteredDraggableList(collections, shouldShowElement);
  const { tagBarRef, tagBarHeight } = useTagBarHeight([tag, () => tags.value]);
  const isFold = (type: "sub" | "collection"): boolean => Boolean(foldState.value[type]?.[tag.value]);
  const toggleFold = (type: "sub" | "collection"): void => {
    const next = structuredClone(foldState.value);
    const values = next[type] ?? {};
    if (values[tag.value]) delete values[tag.value];
    else values[tag.value] = true;
    next[type] = values;
    foldState.value = next;
    localStorage.setItem("sub-fold", JSON.stringify(next));
  };

  const setTag = (value: string): void => {
    tag.value = value;
    if (value === "all") localStorage.removeItem("sub-tag");
    else localStorage.setItem("sub-tag", value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = async (): Promise<void> => { await initStores(true, true, true); };
  const saveTokenAndRetry = async (): Promise<void> => {
    setStoredAdminToken(adminToken.value);
    adminToken.value = getStoredAdminToken();
    await refresh();
  };
  const startDrag = (items: SubscriptionItem[]): void => {
    dragging.value = true;
    sortFailed.value = false;
    dragSnapshot.value = [...items];
  };
  const endDrag = async (items: SubscriptionItem[]): Promise<void> => {
    await activeSortRequest.value;
    if (sortFailed.value && dragSnapshot.value) items.splice(0, items.length, ...dragSnapshot.value);
    dragging.value = false;
    dragSnapshot.value = null;
    activeSortRequest.value = null;
  };
  const changeSort = async (kind: "subs" | "collections", items: SubscriptionItem[]): Promise<void> => {
    activeSortRequest.value = (async () => {
      try {
        const payload = JSON.parse(JSON.stringify(items.map(item => item.name)));
        const result = await cloudflareApi.reorderItems(kind, payload);
        if (result?.data?.status !== "success") throw new Error(JSON.stringify(result));
      } catch (error) {
        sortFailed.value = true;
        const message = error instanceof Error ? error.message : String(error);
        showNotify({ type: "danger", title: t("subPage.sort.failed"), content: message });
      }
    })();
    await activeSortRequest.value;
  };

  const importFile = async (event: Event): Promise<void> => {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    const file = input?.files?.[0];
    if (!file) return;
    restoreIsLoading.value = true;
    try {
      const item = JSON.parse(await file.text());
      const suffix = Date.now();
      const name = typeof item.name === "string" ? item.name : "imported";
      const displayName = typeof item.displayName === "string" ? item.displayName : name;
      item.name = `${name}_${suffix}`;
      item.displayName = `${displayName}_${suffix}`;
      item["display-name"] = item.displayName;
      const type = Array.isArray(item.subscriptions) ? "collections" : "subs";
      const result = await cloudflareApi.createItem(type, item);
      if (result?.data?.status !== "success") throw new Error("restore failed");
      await initStores(false, true, true);
      showNotify({ type: "success", title: t("subPage.import.succeed") });
      addSubVisible.value = false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showNotify({ type: "danger", title: t("subPage.import.failed", { e: message }) });
    } finally {
      restoreIsLoading.value = false;
      if (input) input.value = "";
    }
  };

  onMounted(() => methodStore.registerMethod("addSub", () => { addSubVisible.value = true; }));

  return {
    addSubVisible,
    adminToken,
    appearanceSetting,
    collections,
    dragging,
    fetchResult,
    filteredCollections,
    filteredSubs,
    hasCollections,
    hasSubs,
    importFile,
    isDualColumnMode,
    isFold,
    isLoading,
    refresh,
    restoreIsLoading,
    saveTokenAndRetry,
    setTag,
    showImportTips,
    startDrag,
    subs,
    t,
    tag,
    tagBarHeight,
    tagBarRef,
    tags,
    toggleFold,
    changeSort,
    endDrag,
  };
};
