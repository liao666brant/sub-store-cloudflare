<template>
  <section v-if="sourceType !== 'file'" class="form-block-wrapper">
    <header class="sticky-title-wrapper actions-title-wrapper">
      <p>{{ t("editorPage.subConfig.actions.label") }}</p>
      <TButton
        :aria-label="isCollapsed ? 'Expand actions' : 'Collapse actions'"
        shape="circle"
        size="small"
        variant="text"
        @click="setCollapsed(!isCollapsed)"
        ><ChevronRightIcon v-if="isCollapsed" /><ChevronDownIcon
          v-else /></TButton
      ><TButton size="small" variant="text" @click="showHelp = true"
        ><HelpCircleIcon />{{
          t("editorPage.subConfig.basic.nodeActionsHelp")
        }}</TButton
      >
    </header>
    <ActionBlockList
      v-if="list.length"
      :list="list"
      :source-type="sourceType"
      :t="t"
      :edit-item="editItem"
      :is-element-collapsed="isElementCollapsed"
      :toggle-element-collapsed="toggleElementCollapsed"
      :start-edit-name="startEditName"
      :save-edit-name="saveEditName"
      :cancel-edit-name="cancelEditName"
      :preview-model="previewModel"
      :open-tips="openTips"
      :copy-item="copyItem"
      @toggle-action="emit('toggleAction', $event)"
      @delete-request="actionToDelete = $event"
    />
    <TCard class="add-actions" :bordered="false"
      ><div>
        <strong>{{ t("editorPage.subConfig.actions.addAction.title") }}</strong
        ><TButton
          aria-label="Actions help"
          shape="circle"
          size="small"
          variant="text"
          @click="showHelp = true"
          ><HelpCircleIcon
        /></TButton>
      </div>
      <div class="add-actions__buttons">
        <TButton
          v-for="item in actionOptions"
          :key="item.value"
          size="small"
          @click="addAction(item)"
          >{{ item.text }}</TButton
        ><TButton size="small" variant="outline" @click="paste">{{
          t("editorPage.subConfig.actions.pasteAction.label")
        }}</TButton>
      </div></TCard
    >
    <TDialog
      v-model:visible="showPasteboard"
      :header="t('editorPage.subConfig.actions.pasteAction.label')"
      :cancel-btn="t('editorPage.subConfig.actions.addAction.cancel')"
      :confirm-btn="t('editorPage.subConfig.actions.pasteAction.label')"
      @confirm="pasteFromText"
      ><TTextarea
        v-model="pasteboard"
        :placeholder="t('editorPage.subConfig.actions.pasteAction.placeholder')"
        autosize
    /></TDialog>
    <TDialog
      v-model:visible="showHelp"
      :header="t('editorPage.subConfig.pop.helpTitle')"
      :body="t('editorPage.subConfig.pop.helpContent')"
      :cancel-btn="null"
    />
    <TDialog
      v-model:visible="tips.visible"
      :header="tips.title"
      :body="tips.content"
      :cancel-btn="null"
    />
    <TDialog
      v-model:visible="deleteVisible"
      :header="t('editorPage.subConfig.pop.deleteTitle')"
      :body="t('editorPage.subConfig.pop.deleteDes')"
      :cancel-btn="t('editorPage.subConfig.pop.deleteCancel')"
      :confirm-btn="t('editorPage.subConfig.pop.deleteConfirm')"
      theme="danger"
      @confirm="confirmDelete"
    />
  </section>
</template>
<script setup lang="ts">
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HelpCircleIcon,
} from "tdesign-icons-vue-next";
import { useActionBlock } from "./useActionBlock";
import ActionBlockList from "./ActionBlockList.vue";
const props = defineProps<{
  checked: Array<[string, boolean]>;
  list: ActionModuleProps[];
  sourceType?: string;
}>();
const emit = defineEmits<{
  addAction: [unknown[]];
  deleteAction: [string];
  updateCustomNameModeFlag: [boolean];
  toggleAction: [string];
}>();
const {
  t,
  isCollapsed,
  pasteboard,
  showPasteboard,
  showHelp,
  actionToDelete,
  tips,
  actionOptions,
  deleteVisible,
  editItem,
  isElementCollapsed,
  setCollapsed,
  toggleElementCollapsed,
  startEditName,
  saveEditName,
  cancelEditName,
  previewModel,
  openTips,
  addAction,
  copyItem,
  paste,
  pasteFromText,
  confirmDelete,
  exitAllEditName,
} = useActionBlock(props, emit);
defineExpose({ exitAllEditName });
const { list, sourceType } = props;
</script>
<style src="./ActionBlockShell.scss" lang="scss" scoped />
