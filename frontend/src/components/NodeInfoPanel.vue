<template>
  <TDrawer
    :visible="visible"
    :header="t('comparePage.nodeInfo.node.title')"
    size="420px"
    placement="right"
    :close-btn="true"
    :footer="false"
    destroy-on-close
    @close="closePanel"
  >
    <TTabs v-model="currentTab" size="medium">
      <TTabPanel value="node" :label="t('comparePage.nodeInfo.node.title')">
        <ul class="info-list">
          <li>
            <strong class="node-name">
              <TTag theme="primary" variant="outline">{{ nodeInfo.type }}</TTag>
              {{ nodeInfo.name }}
            </strong>
          </li>
          <li v-for="(value, key) in displayNodeInfo" :key="key">
            <span>{{ key }}</span>
            <span class="value">{{ formatValue(value) }}</span>
          </li>
        </ul>
      </TTabPanel>
      <TTabPanel value="json" label="JSON">
        <TTextarea
          :model-value="JSON.stringify(nodeInfo, null, 2)"
          readonly
          :autosize="{ minRows: 15, maxRows: 20 }"
        />
      </TTabPanel>
      <TTabPanel value="ip" :label="t('comparePage.nodeInfo.ipApi.title')">
        <TLoading
          v-if="ipLoading"
          class="ip-state"
          :text="t('comparePage.nodeInfo.ipApi.loading')"
        />
        <div v-else-if="ipError" class="ip-state">
          <p>{{ t('comparePage.nodeInfo.ipApi.loadFailed') }}</p>
          <p class="ip-error-detail">{{ ipError }}</p>
          <TButton size="small" variant="outline" theme="primary" @click="loadIpInfo">
            {{ t('comparePage.nodeInfo.ipApi.retry') }}
          </TButton>
        </div>
        <ul v-else class="info-list">
          <li v-for="(value, key) in ipInfo" :key="key">
            <span>{{ key }}</span>
            <span class="value">{{ formatValue(value) }}</span>
          </li>
        </ul>
      </TTabPanel>
    </TTabs>
  </TDrawer>
</template>

<script lang="ts" setup>
import {
  Button as TButton,
  Drawer as TDrawer,
  Loading as TLoading,
  TabPanel as TTabPanel,
  Tabs as TTabs,
  Tag as TTag,
  Textarea as TTextarea,
} from "tdesign-vue-next";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useCloudflareApi } from "@/api/app";
import type { CompareNode } from "@/components/compare/types";

type NodeRecord = Record<string, unknown>;

const props = defineProps<{ readonly nodeInfo: CompareNode }>();
const emit = defineEmits<{ readonly close: [] }>();
const { t } = useI18n();
const api = useCloudflareApi();
const visible = ref(true);
const currentTab = ref("node");
const ipLoading = ref(false);
const ipError = ref("");
const ipInfo = ref<NodeRecord>({});

const displayNodeInfo = computed<NodeRecord>(() => {
  const hiddenKeys = ["id", "type", "name"];
  return Object.fromEntries(
    Object.entries(props.nodeInfo).filter(([key]) => !hiddenKeys.includes(key)),
  );
});

const formatValue = (value: unknown): string => {
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value ?? "");
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const loadIpInfo = async (): Promise<void> => {
  ipLoading.value = true;
  ipError.value = "";

  try {
    const response = await api.getNodeInfo({ server: String(props.nodeInfo.server ?? "") });
    if (response.data.status !== "success") throw new Error(response.data.error.message);
    ipInfo.value = response.data.data ?? {};
  } catch (error: unknown) {
    ipError.value = errorMessage(error);
  } finally {
    ipLoading.value = false;
  }
};

const closePanel = (): void => {
  visible.value = false;
  emit("close");
};

onMounted(() => {
  void loadIpInfo();
});
</script>

<style lang="scss" scoped>
.info-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-control);
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--td-text-color-secondary);
}

.info-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: var(--app-space-compact);
  overflow-wrap: anywhere;
}

.info-list li:first-child {
  display: block;
  color: var(--td-text-color-primary);
}

.node-name {
  display: flex;
  align-items: start;
  gap: var(--app-space-compact);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.value {
  white-space: pre-wrap;
  word-break: break-word;
}

.ip-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-standard);
  min-height: 220px;
  color: var(--td-text-color-secondary);
  text-align: center;
}

.ip-error-detail {
  max-width: 100%;
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
