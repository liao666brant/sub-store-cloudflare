<template>
  <main class="tools-page">
    <TCard class="tool-card" :title="t('toolsPage.converter.title')">
      <p class="tool-description">{{ t('toolsPage.converter.desc') }}</p>
      <div class="row">
        <TSelect v-model="conversionKind" size="small" :options="conversionKindOptions" />
        <TSelect v-model="conversionTarget" size="small" :options="conversionTargetOptions" />
      </div>
      <TTextarea v-model="conversionInput" :placeholder="t('toolsPage.converter.input')" :autosize="{ minRows: 6, maxRows: 14 }" />
      <div class="actions">
        <TButton size="small" theme="primary" :loading="converting" @click="runConversion">
          {{ t("toolsPage.converter.run") }}
        </TButton>
        <TButton size="small" variant="outline" theme="primary" :disabled="!conversionOutput" @click="copyText(conversionOutput)">
          <template #icon>
            <FileCopyIcon />
          </template>
          {{ t("toolsPage.converter.copy") }}
        </TButton>
      </div>
      <TTextarea :model-value="conversionOutput" readonly :placeholder="t('toolsPage.converter.output')" :autosize="{ minRows: 6, maxRows: 14 }" />
      <p v-if="conversionStats" class="stats">{{ conversionStats }}</p>
    </TCard>
    <TCard class="tool-card" :title="t('toolsPage.shares.title')">
      <p class="tool-description">{{ t('toolsPage.shares.desc') }}</p>
      <div class="row share-form">
        <TSelect v-model="shareForm.resourceType" size="small" :options="resourceTypeOptions" />
        <TInput v-model="shareForm.resourceId" size="small" :placeholder="t('toolsPage.shares.resourceId')" />
        <TSelect v-model="shareForm.target" size="small" :options="shareTargetOptions" />
        <TInput v-model="shareForm.expiresHours" size="small" type="number" :min="0" :max="8760" :placeholder="t('toolsPage.shares.expires')" />
      </div>
      <TButton size="small" theme="primary" :loading="shareCreating" @click="createShare">{{ t('toolsPage.shares.create') }}</TButton>
      <TAlert v-if="createdShareUrl" class="created-link" theme="info" :message="createdShareUrl" close-btn @click="copyText(createdShareUrl)" />
      <TEmpty v-if="shares.length === 0" size="small" :description="t('toolsPage.shares.empty')" />
      <TList v-else split>
        <TListItem v-for="share in shares" :key="share.id">
          <template #default>
            <div class="list-copy">
              <strong>{{ share.resourceType }}/{{ share.resourceId }}</strong>
              <small>{{ share.target || "auto" }} · {{ formatShareExpiration(share.expiresAt) }}</small>
            </div>
          </template>
          <template #action>
            <TButton size="small" variant="text" @click="toggleShare(share)">
              {{ share.enabled ? t("toolsPage.shares.disable") : t("toolsPage.shares.enable") }}
            </TButton>
            <TButton size="small" variant="text" theme="danger" @click="removeShare(share.id)">
              {{ t("myPage.btn.delete") }}
            </TButton>
          </template>
        </TListItem>
      </TList>
    </TCard>
    <TCard class="tool-card" :title="t('toolsPage.recycle.title')">
      <p class="tool-description">{{ t('toolsPage.recycle.desc') }}</p>
      <TEmpty v-if="recycleEntries.length === 0" size="small" :description="t('toolsPage.recycle.empty')" />
      <TList v-else split>
        <TListItem v-for="entry in recycleEntries" :key="entry.id">
          <template #default>
            <div class="list-copy">
              <strong>{{ entry.resourceType }}/{{ entry.resourceId }}</strong>
              <small>{{ new Date(entry.deletedAt).toLocaleString() }}</small>
            </div>
          </template>
          <template #action>
            <TButton size="small" variant="text" theme="primary" @click="restoreEntry(entry.id)">
              {{ t("toolsPage.recycle.restore") }}
            </TButton>
            <TButton size="small" variant="text" theme="danger" @click="purgeEntry(entry.id)">
              {{ t("toolsPage.recycle.purge") }}
            </TButton>
          </template>
        </TListItem>
      </TList>
    </TCard>
  </main>
</template>

<script lang="ts" setup>
import { FileCopyIcon } from "tdesign-icons-vue-next";
import {
  Alert as TAlert,
  Button as TButton,
  Card as TCard,
  Empty as TEmpty,
  Input as TInput,
  List as TList,
  ListItem as TListItem,
  Select as TSelect,
  Textarea as TTextarea,
} from "tdesign-vue-next";
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useCloudflareApi } from "@/api/app";
import { showNotify } from "@/plugin/tdesign";

type Share = { readonly id: string; readonly resourceType: string; readonly resourceId: string; readonly target?: string; readonly expiresAt?: string; readonly enabled: boolean };
type RecycleEntry = { readonly id: string; readonly resourceType: string; readonly resourceId: string; readonly deletedAt: string };
const proxyTargets = [
  "mihomo", "stash", "surge", "surge-mac", "surfboard", "loon", "egern",
  "shadowrocket", "qx", "sing-box", "v2ray", "uri", "json",
] as const;
const ruleTargets = ["mihomo", "surge", "loon", "qx"] as const;
const { t } = useI18n();
const api = useCloudflareApi();
const conversionKind = ref<"proxy" | "rule">("proxy");
const conversionTarget = ref("mihomo");
const conversionInput = ref("");
const conversionOutput = ref("");
const conversionStats = ref("");
const converting = ref(false);
const shares = ref<readonly Share[]>([]);
const recycleEntries = ref<readonly RecycleEntry[]>([]);
const shareCreating = ref(false);
const createdShareUrl = ref("");
const shareForm = reactive({ resourceType: "source", resourceId: "", target: "", expiresHours: "0" });
const conversionKindOptions = [
  { label: t("toolsPage.converter.proxy"), value: "proxy" },
  { label: t("toolsPage.converter.rule"), value: "rule" },
];
const resourceTypeOptions = [{ label: "source", value: "source" }, { label: "collection", value: "collection" }];
const conversionTargetOptions = computed(() =>
  (conversionKind.value === "proxy" ? proxyTargets : ruleTargets).map(value => ({ label: value, value })),
);
const shareTargetOptions = [{ label: "auto", value: "" }, ...proxyTargets.map(value => ({ label: value, value }))];
const notifyError = (error: unknown): void => {
  showNotify({ type: "danger", title: t("toolsPage.notify.failed", { e: error instanceof Error ? error.message : String(error) }) });
};
const notifySuccess = (title: string): void => showNotify({ type: "success", title });
const formatShareExpiration = (expiresAt?: string): string => expiresAt ? new Date(expiresAt).toLocaleString() : "never";
const responseData = <T>(response: { readonly data: MyAxiosRes }): T => {
  if (response.data.status !== "success") {
    throw new Error(response.data.error.message);
  }
  return response.data.data;
};
const runConversion = async (): Promise<void> => {
  converting.value = true;
  try {
    if (!conversionTargetOptions.value.some(option => option.value === conversionTarget.value)) {
      conversionTarget.value = conversionTargetOptions.value[0]?.value ?? "mihomo";
    }
    const response = conversionKind.value === "proxy"
      ? await api.convertProxies({ content: conversionInput.value, target: conversionTarget.value })
      : await api.convertRules({ content: conversionInput.value, target: conversionTarget.value });
    const data = responseData<{
      readonly content?: string;
      readonly par_res?: string;
      readonly parsed?: number;
      readonly emitted?: number;
      readonly skipped?: number;
    }>(response);
    conversionOutput.value = data.content || data.par_res || "";
    conversionStats.value = `parsed ${data.parsed || 0} · emitted ${data.emitted || 0} · skipped ${data.skipped || 0}`;
    notifySuccess(t("toolsPage.notify.converted"));
  } catch (error) {
    notifyError(error);
  } finally {
    converting.value = false;
  }
};
const loadShares = async (): Promise<void> => {
  shares.value = responseData<readonly Share[]>(await api.getShares());
};
const loadRecycle = async (): Promise<void> => {
  recycleEntries.value = responseData<readonly RecycleEntry[]>(await api.getRecycleBin());
};
const createShare = async (): Promise<void> => {
  shareCreating.value = true;
  try {
    const data = responseData<{ readonly url?: string }>(await api.createShare({
      resourceType: shareForm.resourceType,
      resourceId: shareForm.resourceId,
      target: shareForm.target || undefined,
      expiresIn: Math.max(0, Number(shareForm.expiresHours) || 0) * 3600,
    }));
    createdShareUrl.value = data.url || "";
    await loadShares();
    notifySuccess(t("toolsPage.notify.shareCreated"));
  } catch (error) {
    notifyError(error);
  } finally {
    shareCreating.value = false;
  }
};
const toggleShare = async (share: Share): Promise<void> => {
  try {
    await api.updateShare(share.id, { enabled: !share.enabled });
    await loadShares();
  } catch (error) {
    notifyError(error);
  }
};
const removeShare = async (id: string): Promise<void> => {
  try {
    await api.deleteShare(id);
    await Promise.all([loadShares(), loadRecycle()]);
  } catch (error) {
    notifyError(error);
  }
};
const restoreEntry = async (id: string): Promise<void> => {
  try {
    await api.restoreRecycleEntry(id);
    await loadRecycle();
  } catch (error) {
    notifyError(error);
  }
};
const purgeEntry = async (id: string): Promise<void> => {
  try {
    await api.deleteRecycleEntry(id);
    await loadRecycle();
  } catch (error) {
    notifyError(error);
  }
};
const copyText = async (value: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(value);
    notifySuccess(t("toolsPage.notify.copied"));
  } catch (error) {
    notifyError(error);
  }
};
onMounted(() => {
  void Promise.all([loadShares(), loadRecycle()]).catch(notifyError);
});
</script>

<style lang="scss" scoped>
.tools-page { display: flex; min-height: 100%; flex-direction: column; gap: var(--app-space-control); padding: var(--app-space-inline-safe); padding-bottom: calc(var(--app-space-block) + env(safe-area-inset-bottom)); }
.tool-card { color: var(--td-text-color-primary); }
.tool-description, .stats { color: var(--td-text-color-secondary); font-size: var(--td-font-size-body-small); line-height: 1.6; }
.tool-description { word-break: keep-all; }
.row, .actions { display: flex; gap: var(--app-space-control); margin-block: var(--app-space-control); }
.row > * { min-width: 0; flex: 1; }
.share-form { flex-wrap: wrap; }
.share-form > * { min-width: 150px; }
.created-link { margin-top: var(--app-space-control); cursor: copy; overflow-wrap: anywhere; }
.list-copy { display: flex; min-width: 0; flex-direction: column; gap: var(--app-space-compact); overflow-wrap: anywhere; }
.list-copy small { color: var(--td-text-color-secondary); }
@media (max-width: 520px) { .row { flex-direction: column; } .share-form > * { min-width: 0; } }
</style>
