<template>
  <TDialog
    :visible="visible"
    width="320px"
    placement="center"
    :cancel-btn="null"
    :confirm-btn="confirmText"
    @close="emit('close')"
    @confirm="emit('close')"
  >
    <template #header>{{ title }}</template>
    <p class="editor-dialog-content">{{ content }}</p>
  </TDialog>
</template>

<script lang="ts" setup>
import { Dialog as TDialog } from "tdesign-vue-next";

defineProps<{
  readonly visible: boolean;
  readonly title: string;
  readonly content: string;
  readonly confirmText: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<style lang="scss" scoped>
.editor-dialog-content {
  margin: 0;
  color: var(--td-text-color-primary);
  overflow-wrap: anywhere;
}
</style>
