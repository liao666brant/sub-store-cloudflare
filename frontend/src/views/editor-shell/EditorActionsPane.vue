<template>
  <section
    v-show="visible"
    class="editor-tab-content editor-actions-content"
    :class="{ 'editor-tab-fixed-offset': fixedOffset }"
  >
    <CommonBlock />
    <ActionBlock
      ref="actionBlock"
      :checked="checked"
      :list="list"
      @update-custom-name-mode-flag="emit('updateCustomNameModeFlag', $event)"
      @add-action="emit('addAction', $event)"
      @delete-action="emit('deleteAction', $event)"
      @toggle-action="emit('toggleAction', $event)"
    />
  </section>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import ActionBlock from "@/views/editor/ActionBlock.vue";
import CommonBlock from "@/views/editor/CommonBlock.vue";

defineProps<{
  readonly visible: boolean;
  readonly fixedOffset: boolean;
  readonly checked: Array<[string, boolean]>;
  readonly list: ActionModuleProps[];
}>();

const emit = defineEmits<{
  updateCustomNameModeFlag: [value: boolean];
  addAction: [value: unknown[]];
  deleteAction: [value: string];
  toggleAction: [value: string];
  updateActionBlock: [value: { readonly exitAllEditName: () => void } | null];
}>();

const actionBlock = ref<{ readonly exitAllEditName: () => void } | null>(null);

watch(actionBlock, value => {
  emit("updateActionBlock", value);
}, { immediate: true });
</script>
