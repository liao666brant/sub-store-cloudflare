<template>
  <TDialog
    v-model:visible="visible"
    attach="#app"
    dialog-class-name="preview-node-names-dialog auto-dialog"
    :header="title"
    :cancel-btn="null"
    :confirm-btn="null"
    destroy-on-close
    prevent-scroll-through
    show-overlay
    @closed="emit('close')"
  >
    <div class="preview-node-names-content">
      <p class="preview-node-names-desc">
        <span class="preview-node-names-desc-sentence">{{ t('comparePage.nodeNames.descriptionBefore') }}</span>
        <span class="preview-node-names-desc-sentence">{{ t('comparePage.nodeNames.aiLink') }}</span>
      </p>
      <TTextarea
        class="preview-node-names-textarea"
        :model-value="nodeNamesText"
        readonly
        :autosize="{ minRows: 10, maxRows: 14 }"
      />
    </div>
    <template #footer>
      <TButton
        size="small"
        variant="outline"
        theme="primary"
        class="preview-node-names-footer-button"
        @click="copyNodeNames"
      >
        {{ t('comparePage.nodeNames.copyAll') }}
      </TButton>
      <TButton
        size="small"
        theme="primary"
        class="preview-node-names-footer-button"
        @click="copyPrompt"
      >
        {{ t('comparePage.nodeNames.copyPrompt') }}
      </TButton>
    </template>
  </TDialog>
</template>

<script lang="ts" setup>
import { useClipboard } from '@vueuse/core';
import { Button as TButton, Dialog as TDialog, Textarea as TTextarea } from "tdesign-vue-next";
import { computed, ref } from 'vue';
import useV3Clipboard from 'vue-clipboard3';
import { useI18n } from 'vue-i18n';
import { showNotify } from '@/plugin/tdesign';
import {
  formatPreviewNodeInfoPrompt,
  formatPreviewNodeNames,
  PreviewNodeInfo,
  PreviewNodeNameSide,
} from '@/utils/previewNodeNames';

const props = defineProps<{
  side: PreviewNodeNameSide;
  nodeInfos: PreviewNodeInfo[];
}>();

const emit = defineEmits<{ readonly close: [] }>();
const visible = ref(true);

const { t } = useI18n();
const { copy, isSupported } = useClipboard();
const { toClipboard: copyFallback } = useV3Clipboard();

const sideLabel = computed(() => {
  return props.side === 'after'
    ? t('comparePage.remain.afterIndicator')
    : t('comparePage.remain.beforeIndicator');
});

const title = computed(() => {
  return t('comparePage.nodeNames.title', { side: sideLabel.value });
});

const nodeNamesText = computed(() => {
  return formatPreviewNodeNames(props.nodeInfos);
});

const promptText = computed(() => {
  return formatPreviewNodeInfoPrompt(props.nodeInfos);
});

const copyText = async (text: string, successText: string) => {
  try {
    if (isSupported) {
      await copy(text);
    } else {
      await copyFallback(text);
    }
    showNotify({ type: 'success', title: successText });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showNotify({ type: 'danger', title: t('comparePage.nodeNames.copyFailed', { e: message }) });
  }
};

const copyNodeNames = async () => {
  await copyText(nodeNamesText.value, t('comparePage.nodeNames.copyAllSucceed'));
};

const copyPrompt = async () => {
  await copyText(promptText.value, t('comparePage.nodeNames.copyPromptSucceed'));
};
</script>

<style lang="scss">
.preview-node-names-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 520px;
  color: var(--td-text-color-primary);
}

.preview-node-names-desc {
  margin: 0;
  color: var(--td-text-color-secondary);
  font-size: 14px;
  line-height: 1.6;
  text-align: left;

  a {
    color: var(--td-brand-color);
    text-decoration: underline;
  }
}

.preview-node-names-textarea {
  width: 100%;
  height: 220px;
  padding: 10px 12px;
  resize: none;
  border: 1px solid var(--td-component-stroke);
  border-radius: 6px;
  outline: none;
  color: var(--td-text-color-primary);
  background: var(--td-bg-color-container);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre;
  overflow: auto;

  &:focus {
    border-color: var(--td-brand-color);
  }
}

.preview-node-names-footer-button {
  min-width: 96px;
}

@media screen and (max-width: 520px) {
  .preview-node-names-dialog {
    padding-inline: var(--app-space-inline-safe);
  }

  .preview-node-names-textarea {
    height: 180px;
  }

  .preview-node-names-desc-sentence {
    display: block;
    white-space: pre-line;
  }
}
</style>
