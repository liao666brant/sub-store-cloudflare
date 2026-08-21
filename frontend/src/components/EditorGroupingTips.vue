<template>
  <button
    type="button"
    class="editor-grouping-tips-button"
    :aria-label="t('editorPage.groupingTips.open')"
    :title="t('editorPage.groupingTips.open')"
    @click.stop="openTips"
  >
    <HelpCircleIcon />
  </button>
  <TDialog
    :visible="visible"
    width="320px"
    placement="center"
    :cancel-btn="null"
    confirm-btn="OK"
    @close="visible = false"
    @confirm="visible = false"
  >
    <template #header>{{ t('editorPage.groupingTips.title') }}</template>
    <p>{{ t('editorPage.groupingTips.content') }}</p>
  </TDialog>
</template>

<script setup lang="ts">
import { HelpCircleIcon } from "tdesign-icons-vue-next";
import { Dialog as TDialog } from "tdesign-vue-next";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const openTips = (): void => {
  visible.value = true;
};

const visible = ref(false);
</script>
