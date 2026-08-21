<template>
  <TDrawer
    :visible="visible"
    placement="bottom"
    size="260px"
    :header="t('subPage.addSubTitle')"
    :footer="false"
    destroy-on-close
    @close="close"
  >
    <div class="add-sub-panel">
      <div class="import-row">
        <TButton
          size="small"
          variant="outline"
          theme="primary"
          :loading="restoreIsLoading"
          @click="openImport"
        >
          <template #icon><FileImportIcon /></template>
          {{ t('subPage.import.label') }}
        </TButton>
        <TButton
          size="small"
          variant="text"
          shape="square"
          :aria-label="t('subPage.import.tipsTitle')"
          @click="emit('update:tipsVisible', true)"
        >
          <template #icon><HelpIcon /></template>
        </TButton>
        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept="application/json,text/json,.json"
          @change="emit('import', $event)"
        />
      </div>
      <div class="add-sub-actions">
        <RouterLink
          to="/edit/subs/UNTITLED"
          class="add-sub-link"
          @click="close"
        >
          <LinkIcon />
          <span>{{ t('specificWord.singleSub') }}</span>
        </RouterLink>
        <RouterLink
          to="/edit/collections/UNTITLED"
          class="add-sub-link"
          @click="close"
        >
          <FolderAddIcon />
          <span>{{ t('specificWord.collectionSub') }}</span>
        </RouterLink>
      </div>
    </div>
  </TDrawer>
  <TDialog
    :visible="tipsVisible"
    :header="t('subPage.import.tipsTitle')"
    :cancel-btn="null"
    :confirm-btn="'OK'"
    @close="emit('update:tipsVisible', false)"
    @confirm="emit('update:tipsVisible', false)"
  >
    {{ t('subPage.import.tipsContent') }}
  </TDialog>
</template>

<script setup lang="ts">
import {
  FileImportIcon,
  FolderAddIcon,
  HelpIcon,
  LinkIcon,
} from "tdesign-icons-vue-next";
import {
  Button as TButton,
  Dialog as TDialog,
  Drawer as TDrawer,
} from "tdesign-vue-next";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

defineProps<{
  readonly visible: boolean;
  readonly tipsVisible: boolean;
  readonly restoreIsLoading: boolean;
}>();

const emit = defineEmits<{
  readonly "update:visible": [value: boolean];
  readonly "update:tipsVisible": [value: boolean];
  readonly import: [event: Event];
}>();

const { t } = useI18n();
const fileInput = ref<HTMLInputElement | null>(null);

const close = (): void => {
  emit("update:visible", false);
};

const openImport = (): void => {
  fileInput.value?.click();
};
</script>

<style scoped lang="scss">
.add-sub-panel,
.import-row,
.add-sub-actions {
  display: flex;
  gap: 12px;
}

.add-sub-panel {
  flex-direction: column;
}

.import-row {
  justify-content: center;
}

.add-sub-link {
  display: grid;
  flex: 1;
  min-block-size: 112px;
  place-items: center;
  color: var(--td-text-color-primary);
  border: 1px solid var(--td-component-stroke);
  border-radius: var(--td-radius-default);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
