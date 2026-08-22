<template>
  <Teleport to="#app">
    <main class="compare-page compare-page-wrapper">
      <header class="compare-header compare-page-header">
        <div class="btn-groups preview-leading">
          <TButton class="close" variant="text" shape="square" :aria-label="$t('navBar.listSearch.close')" @click="emit('closeCompare')">
            <template #icon>
              <CloseIcon />
            </template>
          </TButton>
          <TButton v-if="showRefresh" class="refresh" variant="text" shape="square" :aria-label="$t('navBar.actions.refresh')" @click="emit('refresh')">
            <template #icon>
              <RefreshIcon />
            </template>
          </TButton>
        </div>
        <h1>{{ $t('comparePage.title') }}</h1>
        <span />
      </header>
      <section class="compare-content">
        <section class="compare-block">
          <h2>
            {{ $t('comparePage.remain.title') }} ({{ remainDescription }})
            <TButton v-if="filteredOriginalNodes.length" variant="text" size="small" @click="scrollToFiltered">
              {{ $t("comparePage.filter.title") }} ({{ filterDescription }})
            </TButton>
          </h2>
          <div class="visibility-controls">
            <TButton size="small" variant="outline" :disabled="!hasOriginal" :aria-pressed="originalVisible" @click="toggleOriginal">
              {{ $t("comparePage.remain.beforeIndicator") }}
            </TButton>
            <TButton class="node-names-action" size="small" variant="text" :disabled="!hasOriginal" @click="openNames('before')">
              <template #icon>
                <FileCopyIcon />
              </template>
              {{ $t("comparePage.nodeNames.entry") }}
            </TButton>
            <TButton size="small" variant="outline" :disabled="!hasProcessed" :aria-pressed="processedVisible" @click="toggleProcessed">
              {{ $t("comparePage.remain.afterIndicator") }}
            </TButton>
            <TButton class="node-names-action" size="small" variant="text" :disabled="!hasProcessed" @click="openNames('after')">
              <template #icon>
                <FileCopyIcon />
              </template>
              {{ $t("comparePage.nodeNames.entry") }}
            </TButton>
          </div>
          <CompareNodeTable :pairs="pairs" :paired="originalVisible && processedVisible" :show-original="originalVisible" :show-processed="processedVisible" @select="openNode" />
        </section>
        <TDivider v-if="filteredOriginalNodes.length">{{ $t('comparePage.divider') }}</TDivider>
        <section v-if="filteredOriginalNodes.length" ref="filteredSection" class="compare-block">
          <h2>{{ $t('comparePage.filter.title') }} ({{ filterDescription }})</h2>
          <CompareNodeTable :pairs="filteredPairs" :show-original="true" :show-processed="false" @select="openNode" />
        </section>
      </section>
    </main>
    <NodeInfoPanel v-if="selectedNode" :node-info="selectedNode" @close="selectedNode = undefined" />
    <PreviewNodeNamesDialog v-if="nodeNamesVisible" :side="nodeNamesSide" :node-infos="activeNodeInfos" @close="nodeNamesVisible = false" />
  </Teleport>
</template>

<script lang="ts" setup>
import { CloseIcon, FileCopyIcon, RefreshIcon } from "tdesign-icons-vue-next";
import { Button as TButton, Divider as TDivider } from "tdesign-vue-next";
import { computed, ref, watch } from "vue";
import NodeInfoPanel from "@/components/NodeInfoPanel.vue";
import CompareNodeTable from "@/components/compare/CompareNodeTable.vue";
import { useCompareData } from "@/components/compare/useCompareData";
import type { CompareNode, ComparePayload } from "@/components/compare/types";
import PreviewNodeNamesDialog from "@/components/PreviewNodeNamesDialog.vue";
import type { PreviewNodeNameSide } from "@/utils/previewNodeNames";

const props = defineProps<{
  readonly compareData?: ComparePayload;
  readonly name: string;
  readonly showRefresh?: boolean;
}>();
const emit = defineEmits<{ readonly closeCompare: []; readonly refresh: [] }>();
const compareData = computed(() => props.compareData);
const { filterDescription, filteredOriginalNodes, originalNodeInfos, pairs, processedNodeInfos, remainDescription } = useCompareData(compareData);
const filteredSection = ref<HTMLElement>();
const selectedNode = ref<CompareNode>();
const nodeNamesVisible = ref(false);
const nodeNamesSide = ref<PreviewNodeNameSide>("after");
const originalVisible = ref(false);
const processedVisible = ref(true);
const hasOriginal = computed(() => originalNodeInfos.value.length > 0);
const hasProcessed = computed(() => processedNodeInfos.value.length > 0);
const showRefresh = computed(() => props.showRefresh !== false);
const activeNodeInfos = computed(() =>
  nodeNamesSide.value === "after" ? processedNodeInfos.value : originalNodeInfos.value,
);
const filteredPairs = computed(() =>
  filteredOriginalNodes.value.map(node => [node, node] as const),
);

watch([hasOriginal, hasProcessed], ([original, processed]) => {
  originalVisible.value = original;
  processedVisible.value = processed;
}, {
  immediate: true,
});
const toggleOriginal = (): void => {
  if (hasOriginal.value && (processedVisible.value || !originalVisible.value)) {
    originalVisible.value = !originalVisible.value;
  }
};
const toggleProcessed = (): void => {
  if (hasProcessed.value && (originalVisible.value || !processedVisible.value)) {
    processedVisible.value = !processedVisible.value;
  }
};
const openNames = (side: PreviewNodeNameSide): void => {
  if ((side === "after" ? hasProcessed : hasOriginal).value) {
    nodeNamesSide.value = side;
    nodeNamesVisible.value = true;
  }
};
const openNode = (node: CompareNode): void => {
  selectedNode.value = node;
};
const scrollToFiltered = (): void => {
  filteredSection.value?.scrollIntoView({ block: "start" });
};
</script>

<style lang="scss" scoped>
.compare-page {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: auto;
  background: var(--td-bg-color-page);
}
.compare-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 56px;
  padding-inline: var(--app-space-inline-safe);
  border-bottom: 1px solid var(--td-component-stroke);
  background: var(--td-bg-color-container);
}
.compare-header h1 {
  margin: 0;
  color: var(--td-text-color-primary);
  font-size: var(--td-font-size-title-medium);
}
.compare-content {
  width: min(100%, 1000px);
  margin-inline: auto;
}
.compare-block h2 {
  position: sticky;
  top: 0;
  z-index: 1;
  margin: 0;
  padding: var(--app-space-control) var(--app-space-inline-safe);
  color: var(--td-text-color-primary);
  font-size: var(--td-font-size-body-medium);
  background: var(--td-bg-color-container);
}
.visibility-controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-compact);
  padding: var(--app-space-control) var(--app-space-inline-safe);
}
</style>
