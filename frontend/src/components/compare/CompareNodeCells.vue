<template>
  <td :class="variant">
    <div class="node-name">
      <div><TTag v-if="showType" size="small" theme="primary" variant="outline">{{ String(node.type ?? '') }}</TTag>{{ String(node.name ?? '') }}</div>
      <small v-if="endpoint">{{ endpoint }}</small>
    </div>
  </td>
  <td v-for="(enabled, index) in flags" :key="index"><CheckIcon v-if="enabled" class="is-enabled" /><span v-else class="is-disabled" /></td>
</template>

<script lang="ts" setup>
import { CheckIcon } from "tdesign-icons-vue-next";
import { Tag as TTag } from "tdesign-vue-next";
import { computed } from "vue";
import { endpointText } from "./types";
import type { CompareNode } from "./types";

const props = withDefaults(defineProps<{ readonly node: CompareNode; readonly showType?: boolean; readonly variant: "original" | "processed" }>(), { showType: true });
const endpoint = computed(() => endpointText(props.node));
const flags = computed(() => [Boolean(props.node.udp), Boolean(props.node.tfo || props.node["fast-open"]), Boolean(props.node["skip-cert-verify"]), Boolean(props.node.aead)]);
</script>

<style lang="scss" scoped>
.node-name { min-width: 0; overflow-wrap: anywhere; }
.node-name small { display: block; color: var(--td-text-color-secondary); }
.is-enabled { color: var(--td-brand-color); }
.is-disabled { width: 8px; height: 1px; border-radius: 2px; background: var(--td-text-color-placeholder); }
.processed::before, .original::before { width: 6px; height: 6px; margin-right: var(--app-space-control); border-radius: 50%; background: var(--td-brand-color); content: ""; flex: none; }
.original::before { background: var(--td-success-color); }
</style>
