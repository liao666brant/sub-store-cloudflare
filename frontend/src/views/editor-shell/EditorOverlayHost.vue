<template>
  <CompareTable
    v-if="compareVisible"
    :name="configName"
    :compare-data="compareData"
    :show-refresh="true"
    @close-compare="emit('closeCompare')"
    @refresh="emit('refreshCompare')"
  />
  <TagPopup
    :visible="tagVisible"
    :current-tag="currentTag"
    @update:visible="emit('update:tagVisible', $event)"
    @set-tag="emit('setTag', $event)"
  />
  <EditorMessageDialog
    :visible="dialogVisible"
    :title="dialogTitle"
    :content="dialogContent"
    :confirm-text="dialogConfirmText"
    @close="emit('closeDialog')"
  />
</template>

<script lang="ts" setup>
import TagPopup from "@/components/TagPopup.vue";
import CompareTable from "@/views/CompareTable.vue";
import EditorMessageDialog from "@/views/editor-shell/EditorMessageDialog.vue";

defineProps<{
  readonly compareData: unknown;
  readonly compareVisible: boolean;
  readonly configName: string;
  readonly currentTag: string;
  readonly dialogConfirmText: string;
  readonly dialogContent: string;
  readonly dialogTitle: string;
  readonly dialogVisible: boolean;
  readonly tagVisible: boolean;
}>();

const emit = defineEmits<{
  closeCompare: [];
  closeDialog: [];
  refreshCompare: [];
  setTag: [value: string];
  "update:tagVisible": [visible: boolean];
}>();
</script>
