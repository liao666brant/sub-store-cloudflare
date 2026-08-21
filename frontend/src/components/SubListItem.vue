<template>
  <article v-if="item" class="subscription-item" :class="{ 'is-dual-column': props.isDualColumn }">
    <TCard class="subscription-card" :bordered="false">
      <div v-if="appearanceSetting.subProgressStyle === 'background' && flowSummary?.progress" class="progress" :style="{ width: `${flowSummary.progress * 100}%` }" />
      <button class="subscription-preview-trigger" type="button" :aria-label="t('subPage.previewTitle')" @click="openPreviewPanel" @keydown.enter.prevent="openPreviewPanel" @keydown.space.prevent="openPreviewPanel" />
      <div class="subscription-content">
        <TButton v-if="appearanceSetting.isShowIcon" class="subscription-avatar-button" variant="text" shape="circle" :aria-label="t('subPage.actions.preview')" :title="t('subPage.actions.preview')" @click="compareSub">
          <TAvatar class="subscription-avatar" :image="item.icon || icon" :alt="displayName" shape="round" />
        </TButton>
        <div class="subscription-copy">
          <div class="subscription-heading">
            <h3 :title="displayName">{{ displayName }}</h3>
            <TTag v-for="itemTag in item.tag" :key="itemTag" size="small" variant="light-outline">{{ itemTag }}</TTag>
          </div>
          <p v-if="!appearanceSetting.isSimpleMode" class="subscription-detail" :title="primaryDetail">{{ primaryDetail }}</p>
          <p v-if="secondaryDetail" class="subscription-detail secondary">{{ secondaryDetail }}</p>
        </div>
        <div class="primary-actions" @click.stop>
          <TButton v-if="appOpenBtnVisible" variant="text" shape="square" :aria-label="t('subPage.actions.openApp')" :title="t('subPage.actions.openApp')" @click="openAppUrl"><template #icon><JumpIcon /></template></TButton>
          <TButton v-if="!appearanceSetting.isShowIcon" variant="text" shape="square" :aria-label="t('subPage.actions.preview')" :title="t('subPage.actions.preview')" @click="compareSub"><template #icon><BrowseIcon /></template></TButton>
          <TButton variant="text" shape="square" :aria-label="t('subPage.actions.copyLink')" :title="t('subPage.actions.copyLink')" @click="onClickCopyLink"><template #icon><FileCopyIcon /></template></TButton>
          <TButton v-if="props.type === 'sub'" variant="text" shape="square" :aria-label="t('subPage.actions.refresh')" :title="t('subPage.actions.refresh')" @click="onClickRefresh"><template #icon><RefreshIcon /></template></TButton>
          <TButton variant="text" shape="square" :aria-label="t('subPage.actions.edit')" :title="t('subPage.actions.edit')" @click="onClickEdit"><template #icon><EditIcon /></template></TButton>
          <TButton v-if="appearanceSetting.isSubItemMenuFold" variant="text" shape="square" :aria-label="itemMenuVisible ? t('subPage.actions.closeMenu') : t('subPage.actions.openMenu')" :title="itemMenuVisible ? t('subPage.actions.closeMenu') : t('subPage.actions.openMenu')" @click="itemMenuVisible = !itemMenuVisible"><template #icon><EllipsisIcon /></template></TButton>
        </div>
      </div>
      <div v-if="itemMenuVisible || !appearanceSetting.isSubItemMenuFold" class="secondary-actions" @click.stop>
        <TButton size="small" variant="outline" @click="onClickCopyConfig"><template #icon><FileCopyIcon /></template>{{ t('subPage.actions.cloneConfig') }}</TButton>
        <TButton size="small" variant="outline" @click="onClickOpenDownload"><template #icon><FileExportIcon /></template>{{ t('subPage.actions.openDownload') }}</TButton>
        <TButton size="small" variant="outline" theme="danger" :aria-label="t('subPage.actions.delete')" @click="deleteDialogVisible = true"><template #icon><DeleteIcon /></template>{{ t('subPage.actions.delete') }}</TButton>
      </div>
    </TCard>
  </article>

  <CompareTable v-if="compareTableIsVisible" :name="name" :compare-data="compareData" :show-refresh="true" @closeCompare="closeCompare" @refresh="refreshCompare" />
  <TDialog v-model:visible="previewPanelVisible" :header="t('subPage.previewTitle')" :cancel-btn="null" :confirm-btn="null" destroy-on-close prevent-scroll-through show-overlay>
    <PreviewPanel v-if="previewPanelVisible" :name="name" :display-name="displayName" :type="props.type" :general="t('subPage.panel.general')" :notify="t('subPage.copyNotify.succeed')" :desc="t('subPage.panel.tips.desc')" />
  </TDialog>
  <TDialog v-model:visible="deleteDialogVisible" :header="t('subPage.deleteItem.title')" :body="t('subPage.deleteItem.desc', { displayName })" :cancel-btn="t('subPage.deleteItem.btn.cancel')" :confirm-btn="t('subPage.deleteItem.btn.confirm')" theme="warning" @confirm="onDeleteConfirm" />
</template>

<script lang="ts" setup>
import { BrowseIcon, DeleteIcon, EditIcon, EllipsisIcon, FileCopyIcon, FileExportIcon, JumpIcon, RefreshIcon } from "tdesign-icons-vue-next";
import { Avatar as TAvatar, Button as TButton, Card as TCard, Dialog as TDialog, Tag as TTag } from "tdesign-vue-next";
import { useClipboard } from "@vueuse/core";
import dayjs from "dayjs";
import { storeToRefs } from "pinia";
import { computed, ref, toRaw } from "vue";
import useV3Clipboard from "vue-clipboard3";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useCloudflareApi } from "@/api/app";
import logoIcon from "@/assets/icons/logo.png";
import logoRedIcon from "@/assets/icons/logo-red.png";
import PreviewPanel from "@/components/PreviewPanel.vue";
import { useHostAPI } from "@/hooks/useHostAPI";
import { usePopupRoute } from "@/hooks/usePopupRoute";
import { showLoading, closeLoading } from "@/plugin/tdesign";
import { useAppNotifyStore } from "@/store/appNotify";
import { useGlobalStore } from "@/store/global";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { getString } from "@/utils/flowTransfer";
import CompareTable from "@/views/CompareTable.vue";

type FlowSummary = {
  readonly firstLine: string;
  readonly secondLine: string;
  readonly planName?: string;
  readonly appUrl?: string;
  readonly progress?: number;
};

const props = defineProps<{
  readonly type: "sub" | "collection";
  readonly sub?: Sub;
  readonly collection?: Collection;
  readonly disabled?: boolean;
  readonly isDualColumn?: boolean;
}>();

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const cloudflareApi = useCloudflareApi();
const subsStore = useSubsStore();
const settingsStore = useSettingsStore();
const globalStore = useGlobalStore();
const { showNotify } = useAppNotifyStore();
const { currentUrl: host } = useHostAPI();
const { appearanceSetting } = storeToRefs(settingsStore);
const { flows } = storeToRefs(subsStore);
const { isFlowFetching } = storeToRefs(globalStore);
const { copy, isSupported } = useClipboard();
const { toClipboard: copyFallback } = useV3Clipboard();
const item = computed<Sub | Collection | undefined>(() => props.sub ?? props.collection);
const name = computed(() => item.value?.name ?? "");
const displayName = computed(() => item.value?.displayName || item.value?.name || "");
const compareTableIsVisible = ref(false);
const previewPanelVisible = ref(false);
const deleteDialogVisible = ref(false);
const compareData = ref();
const itemMenuVisible = ref(false);
usePopupRoute(compareTableIsVisible);
const icon = computed(() => appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon);

const collectionDetail = computed(() => {
  if (!props.collection) return "";
  if (props.collection.subscriptions.length === 0) return t("subPage.collectionItem.noSub");
  const names = props.collection.subscriptions.map(subscriptionName => {
    const sub = subsStore.getOneSub(subscriptionName);
    return sub?.displayName || sub?.name || `${subscriptionName}(?)`;
  });
  return `${t("subPage.collectionItem.contain")}: ${names.join(", ")}`;
});

const flowSummary = computed<FlowSummary | undefined>(() => {
  if (!props.sub) return undefined;
  if (props.sub.source === "local" && !props.sub.subUserinfo) return { firstLine: t("subPage.subItem.local"), secondLine: "" };
  if (isFlowFetching.value && !flows.value[props.sub.url ?? props.sub.name]) return { firstLine: t("subPage.subItem.loading"), secondLine: "" };
  const flow = toRaw(flows.value[props.sub.url ?? props.sub.name]);
  if (!flow || flow.status === "noFlow") return { firstLine: t("subPage.subItem.noFlow"), secondLine: "" };
  if (flow.status !== "success" || !flow.data?.usage) return { firstLine: t("subPage.subItem.noFlowInfo"), secondLine: "" };
  const { upload, download } = flow.data.usage;
  const remaining = flow.data.total - upload - download;
  const usage = getString(flow.showRemaining ? remaining : upload + download, flow.data.total, "B");
  const expires = flow.hideExpire || !flow.data.expires ? "" : dayjs.unix(flow.data.expires).format("YYYY-MM-DD HH:mm");
  const days = flow.data.remainingDays ? `${flow.data.remainingDays}${t("subPage.subItem.remainingDaysUnit")}` : "";
  const secondLine = [days, expires].filter(Boolean).join(" · ");
  const firstLine = appearanceSetting.value.isSimpleMode ? usage : `${t(flow.showRemaining ? "subPage.subItem.showRemainingFlow" : "subPage.subItem.flow")}: ${usage}`;
  const progress = flow.data.total > 0 ? Math.max(0, Math.min(1, remaining / flow.data.total)) : 0;
  return { firstLine, secondLine, planName: flow.data.planName, appUrl: flow.data.appUrl, progress };
});

const primaryDetail = computed(() => props.type === "collection" ? collectionDetail.value : flowSummary.value?.firstLine ?? "");
const secondaryDetail = computed(() => {
  const detail = props.type === "collection" ? "" : flowSummary.value?.secondLine ?? "";
  const remark = item.value?.remark ?? "";
  return [detail, remark].filter(Boolean).join(" · ");
});
const appOpenBtnVisible = computed(() => Boolean(flowSummary.value?.appUrl));

const openPreviewPanel = (): void => {
  if (!props.disabled) previewPanelVisible.value = true;
};
const openAppUrl = (): void => {
  if (flowSummary.value?.appUrl) window.open(flowSummary.value.appUrl, "_blank", "noopener,noreferrer");
};
const closeCompare = (): void => {
  compareTableIsVisible.value = false;
  router.back();
};
const fetchCompareData = async (data?: Sub | Collection): Promise<void> => {
  showLoading(t("comparePage.loading"), { cover: true, id: "compare" });
  try {
    const result = await cloudflareApi.previewItem(props.type, data ?? props.sub ?? props.collection);
    compareData.value = result?.data?.status === "success" ? result.data.data : null;
  } catch {
    compareData.value = null;
  } finally {
    closeLoading("compare");
  }
};
const compareSub = async (): Promise<void> => {
  await fetchCompareData();
  globalStore.setSavedPositions(route.path, { left: 0, top: window.scrollY });
  compareTableIsVisible.value = true;
};
const refreshCompare = async (): Promise<void> => {
  const result = await cloudflareApi.getOne(props.type, name.value);
  const latestItem = result?.data?.status === "success" ? result.data.data : props.sub ?? props.collection;
  await fetchCompareData(latestItem);
};
const onDeleteConfirm = async (): Promise<void> => {
  await subsStore.deleteItem(props.type, name.value, "permanent");
  deleteDialogVisible.value = false;
};
const onClickCopyConfig = async (): Promise<void> => {
  if (!item.value) return;
  const copyItem = JSON.parse(JSON.stringify(toRaw(item.value))) as Sub | Collection;
  copyItem.name = `${copyItem.name}-copy-${crypto.randomUUID().slice(0, 8)}`;
  showLoading(t("subPage.copyConfigNotify.loading"), { cover: false, id: "copyConfig" });
  try {
    await cloudflareApi.createItem(`${props.type}s`, copyItem);
    await subsStore.fetchSubsData();
    showNotify({ title: t("subPage.copyConfigNotify.succeed") });
    itemMenuVisible.value = false;
  } finally {
    closeLoading("copyConfig");
  }
};
const onClickEdit = (): void => {
  void router.push(`/edit/${props.type}s/${encodeURIComponent(name.value)}`);
};
const downloadUrl = async (): Promise<string> => {
  const result = await cloudflareApi.getDownloadLink(props.type, name.value);
  return result?.data?.status === "success" && result.data.data?.url ? result.data.data.url : `${host.value}/download/${props.type === "collection" ? "collection/" : "source/"}${encodeURIComponent(name.value)}`;
};
const onClickCopyLink = async (): Promise<void> => {
  const url = await downloadUrl();
  if (isSupported) await copy(url); else await copyFallback(url);
  showNotify({ title: t("subPage.copyNotify.succeed") });
};
const onClickOpenDownload = async (): Promise<void> => {
  window.open(await downloadUrl(), "_blank", "noopener,noreferrer");
  itemMenuVisible.value = false;
};
const onClickRefresh = async (): Promise<void> => {
  showLoading(t("globalNotify.refresh.loading"), { cover: true, id: "refresh" });
  try {
    await cloudflareApi.downloadSource(name.value, { noCache: true });
    await subsStore.fetchFlows(props.sub ? [props.sub] : []);
    showNotify({ title: t("globalNotify.refresh.succeed") });
  } finally {
    closeLoading("refresh");
  }
};
</script>

<style scoped lang="scss" src="./SubListItem.scss"></style>
