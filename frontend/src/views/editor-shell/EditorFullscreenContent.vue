<template>
  <div class="fullscreen-editor">
    <button class="cimg-button" type="button" @click="emit('close')">
      <FullscreenExitIcon />
      {{ t("editorPage.subConfig.basic.url.tips.fullScreenEditCancel") }}
    </button>
    <CmView :is-read-only="false" id="SubEditer" />
  </div>
</template>

<script lang="ts" setup>
import { FullscreenExitIcon } from "tdesign-icons-vue-next";
import { useI18n } from "vue-i18n";
import CmView from "@/views/editCode/cmView.vue";

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.fullscreen-editor {
  width: 100%;
  max-height: 95vh;
}
</style>
