<template>
  <div class="bottom-btn-wrapper" :style="{ paddingBottom: `calc(${safeAreaPadding} + 8px)` }">
    <TButton class="compare-btn btn" variant="outline" shape="square" @click="emit('compare')">
      <BrowseIcon />
      {{ t("editorPage.subConfig.btn.compare") }}
    </TButton>
    <TButton class="submit-btn btn" theme="primary" shape="square" @click="emit('submit')">
      <SaveIcon />
      {{ t("editorPage.subConfig.btn.save") }}
    </TButton>
  </div>
</template>

<script lang="ts" setup>
import { BrowseIcon, SaveIcon } from "tdesign-icons-vue-next";
import { Button as TButton } from "tdesign-vue-next";
import { useI18n } from "vue-i18n";

defineProps<{
  readonly safeAreaPadding: string;
}>();

const emit = defineEmits<{
  compare: [];
  submit: [];
}>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.bottom-btn-wrapper {
  position: fixed;
  z-index: 20;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px var(--safe-area-side);
  background: var(--background-color);
  border-top: 1px solid var(--divider-color);

  @include centered-fixed-container;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 14px;

  svg {
    margin-right: 4px;
  }
}

.compare-btn {
  width: 36%;
  background: transparent;
}

.submit-btn {
  width: 62%;
}
</style>
