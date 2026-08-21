import { computed } from "vue";
import type { Ref } from "vue";
import { extractPreviewNodeInfos } from "@/utils/previewNodeNames";
import { nodeId, toCompareNodes } from "./types";
import type { ComparePair, ComparePayload } from "./types";

export const useCompareData = (payload: Ref<ComparePayload | undefined>) => {
  const processedNodes = computed(() => toCompareNodes(payload.value?.processed));
  const originalNodes = computed(() => toCompareNodes(payload.value?.original));
  const processedIds = computed(() => new Set(processedNodes.value.map(nodeId)));
  const filteredOriginalNodes = computed(() => originalNodes.value.filter(node => !processedIds.value.has(nodeId(node))));
  const pairs = computed<readonly ComparePair[]>(() => processedNodes.value.map(node => [node, originalNodes.value.find(original => nodeId(original) === nodeId(node))]));
  const processedNodeInfos = computed(() => extractPreviewNodeInfos(processedNodes.value));
  const originalNodeInfos = computed(() => extractPreviewNodeInfos(originalNodes.value));
  const remainDescription = computed(() => {
    const remaining = processedNodes.value.length;
    const filtered = filteredOriginalNodes.value.length;
    return remaining === 0 ? 0 : filtered > 0 ? `${remaining}/${remaining + filtered}` : remaining;
  });
  const filterDescription = computed(() => {
    const remaining = processedNodes.value.length;
    const filtered = filteredOriginalNodes.value.length;
    return filtered === 0 ? 0 : remaining > 0 ? `${filtered}/${remaining + filtered}` : filtered;
  });
  const isOriginalVisible = computed(() => originalNodes.value.length > 0);
  const isProcessedVisible = computed(() => processedNodes.value.length > 0);

  return {
    filterDescription,
    filteredOriginalNodes,
    isOriginalVisible,
    isProcessedVisible,
    originalNodeInfos,
    pairs,
    processedNodeInfos,
    remainDescription,
  };
};
