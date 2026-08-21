<template>
  <table class="compare-node-table" :class="{ 'is-paired': paired }">
    <thead><tr><th v-for="title in columnTitles" :key="title">{{ t(`comparePage.tableHead.${title}`) }}</th></tr></thead>
    <tbody>
      <template v-for="[processed, original] in pairs" :key="nodeId(processed)">
        <tr v-if="showProcessed" class="compare-node-row is-processed" @click="emit('select', processed)">
          <CompareNodeCells :node="processed" variant="processed" />
        </tr>
        <tr v-if="showOriginal && hasDisplayInfo(original)" class="compare-node-row is-original" @click="emit('select', original)">
          <CompareNodeCells :node="original" variant="original" :show-type="!paired" />
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import CompareNodeCells from "./CompareNodeCells.vue";
import { hasDisplayInfo, nodeId } from "./types";
import type { CompareNode, ComparePair } from "./types";
import { useI18n } from "vue-i18n";

defineProps<{
  readonly paired?: boolean;
  readonly pairs: readonly ComparePair[];
  readonly showOriginal: boolean;
  readonly showProcessed: boolean;
}>();

const emit = defineEmits<{ readonly select: [node: CompareNode] }>();
const { t } = useI18n();
const columnTitles = ["name", "udp", "tfo", "skip-cert-verify", "aead"] as const;
</script>

<style lang="scss" scoped>
.compare-node-table { width: 100%; border-collapse: collapse; }
.compare-node-table thead tr, .compare-node-row { display: grid; grid-template-columns: 46% repeat(4, 1fr); padding: var(--app-space-control) var(--app-space-inline-safe); border-bottom: 1px solid var(--td-component-stroke); }
.compare-node-table th { color: var(--td-text-color-secondary); font-size: var(--td-font-size-body-small); text-align: center; }
.compare-node-table th:first-child { text-align: left; }
.compare-node-row { cursor: pointer; }
.compare-node-row.is-processed + .compare-node-row.is-original { padding-top: var(--app-space-compact); }
.is-paired .compare-node-row.is-processed { border-bottom: 0; }
.compare-node-row :deep(td) { display: flex; min-width: 0; align-items: center; justify-content: center; }
.compare-node-row :deep(td:first-child) { justify-content: start; }
</style>
