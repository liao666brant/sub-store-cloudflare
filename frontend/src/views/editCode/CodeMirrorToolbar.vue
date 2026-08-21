<template>
  <div
    class="cm-toolbar"
    role="toolbar"
    :aria-label="t('codeEditor.toolbar.label')"
  >
    <TButton
      :aria-label="t('codeEditor.toolbar.highlight')"
      size="small"
      shape="square"
      variant="text"
      @click="$emit('highlight')"
    >
      <CodeIcon />
    </TButton>
    <TButton
      :aria-label="t('codeEditor.toolbar.undo')"
      size="small"
      shape="square"
      variant="text"
      @click="$emit('undo')"
    >
      <RollbackIcon />
    </TButton>
    <TButton
      :aria-label="t('codeEditor.toolbar.redo')"
      size="small"
      shape="square"
      variant="text"
      @click="$emit('redo')"
    >
      <RefreshIcon />
    </TButton>
    <TButton
      v-if="isJavaScript"
      :aria-label="t('codeEditor.toolbar.format')"
      size="small"
      shape="square"
      variant="text"
      @click="$emit('format')"
    >
      <AlignTopIcon />
    </TButton>
    <TButton
      :aria-label="t('codeEditor.toolbar.search')"
      size="small"
      shape="square"
      variant="text"
      @click="$emit('search')"
    >
      <SearchIcon />
    </TButton>
    <TButton
      :aria-label="t('codeEditor.toolbar.copy')"
      size="small"
      shape="square"
      variant="text"
      @click="$emit('copy')"
    >
      <CopyIcon />
    </TButton>
    <TButton
      :aria-label="t('codeEditor.toolbar.clear')"
      size="small"
      shape="square"
      theme="danger"
      variant="text"
      @click="$emit('clear')"
    >
      <DeleteIcon />
    </TButton>
    <TButton
      :aria-label="t('codeEditor.toolbar.paste')"
      size="small"
      shape="square"
      variant="text"
      @click="$emit('paste')"
    >
      <PasteIcon />
    </TButton>
  </div>
</template>

<script setup lang="ts">
import {
  AlignTopIcon,
  CodeIcon,
  CopyIcon,
  DeleteIcon,
  PasteIcon,
  RefreshIcon,
  RollbackIcon,
  SearchIcon,
} from "tdesign-icons-vue-next";
import { useI18n } from "vue-i18n";

defineProps<{ readonly isJavaScript: boolean }>();
defineEmits<{
  readonly highlight: [];
  readonly undo: [];
  readonly redo: [];
  readonly format: [];
  readonly search: [];
  readonly copy: [];
  readonly clear: [];
  readonly paste: [];
}>();

const { t } = useI18n();
</script>
