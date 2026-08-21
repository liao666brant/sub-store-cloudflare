<template>
  <button
    type="button"
    class="editor-common-tips-button"
    :aria-label="t('editorPage.commonTips.open')"
    :title="t('editorPage.commonTips.open')"
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
    <template #header>{{ t('editorPage.commonTips.title') }}</template>
    <p>{{ t('editorPage.commonTips.content') }}</p>
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

<style lang="scss" scoped>
.editor-common-tips-button {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  margin: 0 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--second-text-color);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover,
  &:focus-visible {
    color: var(--primary-color);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}
</style>
