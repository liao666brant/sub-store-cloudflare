<template>
  <div class="editor-section-tabs" :style="{ top: topOffset }">
    <div class="editor-section-tab-list" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="editor-section-tab"
        :class="{ current: tab.value === activeTab }"
        role="tab"
        :aria-selected="tab.value === activeTab"
        @click="emit('update:activeTab', tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>
    <EditorGroupingTips />
  </div>
</template>

<script lang="ts" setup>
import EditorGroupingTips from "@/components/EditorGroupingTips.vue";

type EditorTab = "content" | "actions";
type EditorSectionTab = {
  readonly value: EditorTab;
  readonly label: string;
};

defineProps<{
  readonly activeTab: EditorTab;
  readonly tabs: readonly EditorSectionTab[];
  readonly topOffset: string;
}>();

const emit = defineEmits<{
  "update:activeTab": [tab: EditorTab];
}>();
</script>

<style lang="scss" scoped>
.editor-section-tabs {
  position: sticky;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-control);
  padding: var(--app-space-compact) var(--safe-area-side);
  background: var(--background-color);
}

.editor-section-tab-list {
  display: flex;
  min-width: 0;
  gap: var(--app-space-compact);
}

.editor-section-tab {
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.editor-section-tab.current {
  border-bottom-color: var(--td-brand-color);
  color: var(--td-brand-color);
}
</style>
