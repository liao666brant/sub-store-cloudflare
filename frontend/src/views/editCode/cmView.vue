<template>
  <div class="cmview">
    <div class="cmview__toolbar">
      <CodeMirrorToolbar
        v-if="openPanel"
        :is-java-script="isJavaScript"
        @clear="clear"
        @copy="copy"
        @format="format"
        @highlight="toggleHighlight"
        @paste="paste"
        @redo="redo"
        @search="toggleSearch"
        @undo="undo"
      />
      <span v-else class="cmview__length">{{ length }}</span>
      <TButton
        :aria-label="openPanel ? t('codeEditor.toolbar.collapse') : t('codeEditor.toolbar.expand')"
        shape="square"
        size="small"
        variant="text"
        @click="togglePanel"
      >
        <ChevronUpIcon v-if="openPanel" />
        <ChevronDownIcon v-else />
      </TButton>
    </div>
    <div ref="viewRef" class="cmview__editor" />
    <div class="cmview__spacer" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import useV3Clipboard from "vue-clipboard3";
import { ChevronDownIcon, ChevronUpIcon } from "tdesign-icons-vue-next";
import { storeToRefs } from "pinia";
import CodeMirrorToolbar from "./CodeMirrorToolbar.vue";
import { useCodeMirrorEditor } from "@/hooks/useCodeMirrorEditor";
import { useCodeStore } from "@/store/codeStore";
import { useAppNotifyStore } from "@/store/appNotify";
import { useSettingsStore } from "@/store/settings";

const props = defineProps<{ readonly id: string; readonly isReadOnly?: boolean }>();
const { t } = useI18n();
const { toClipboard } = useV3Clipboard();
const { showNotify } = useAppNotifyStore();
const { theme } = storeToRefs(useSettingsStore());
const cmStore = useCodeStore();
const viewRef = ref<HTMLElement | null>(null);
const isDark = ref(true);
const editorCode = computed({
  get: (): string => cmStore.EditCode?.[props.id] ?? "",
  set: (text: string): void => cmStore.setEditCode(props.id, text),
});

const syncTheme = (): void => {
  if (theme.value.auto) {
    isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return;
  }
  isDark.value = !/^mocha$|light/.test(theme.value.name ?? "light");
};

const editor = useCodeMirrorEditor({
  code: editorCode,
  container: viewRef,
  copyToClipboard: toClipboard,
  isDark,
  isReadOnly: computed((): boolean => props.isReadOnly ?? false),
  notify: (type, title): void => showNotify({ type, title }),
  onClear: (): void => cmStore.CodeClear(props.id, true),
  onCodeChange: (text: string): void => { editorCode.value = text; },
  translate: t,
});
const {
  clear,
  copy,
  create,
  format,
  isJavaScript,
  length,
  openPanel,
  paste,
  redo,
  toggleHighlight,
  togglePanel,
  toggleSearch,
  undo,
} = editor;

let mediaQuery: MediaQueryList | undefined;
onMounted(() => {
  mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  syncTheme();
  mediaQuery.addEventListener("change", syncTheme);
  create();
});
onUnmounted(() => mediaQuery?.removeEventListener("change", syncTheme));
watch(theme, syncTheme, { deep: true });
</script>

<style lang="scss">
.cmview {
  border-radius: var(--td-radius-default, 12px);
}

.cmview__toolbar {
  display: flex;
  align-items: flex-start;
  min-height: 36px;
  padding-top: var(--app-space-compact, 6px);
}

.cmview__length {
  flex: 1;
  padding: 4px var(--app-space-control, 10px);
  color: var(--td-text-color-secondary);
  font-size: var(--td-font-size-body-small, 12px);
  line-height: 20px;
}

.cmview__editor {
  inline-size: 100%;
  font-size: var(--td-font-size-body-small, 12px);
}

.cmview__spacer {
  block-size: var(--app-space-control, 10px);
}

.cm-panels.cm-panels-bottom {
  margin: var(--app-space-block, 24px) 3% var(--app-space-block, 24px);
  padding: var(--app-space-control, 10px);
  border-top: 0;
  border-radius: var(--td-radius-default, 12px);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  box-shadow: var(--td-shadow-2);
  line-height: 16px;
}

.cm-panels .cm-textfield,
.cm-panels .cm-button {
  border-radius: var(--td-radius-default, 12px);
}

.cm-panels .cm-textfield {
  border-color: var(--td-component-stroke);
  background: var(--td-bg-color-container);
  color: inherit;
}

@media (max-width: 479px) {
  .cmview__toolbar {
    flex-wrap: wrap;
  }
}
</style>
