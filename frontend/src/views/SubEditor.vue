<template>
  <EditorPageShell :controller="controller" />
</template>

<script lang="ts" setup>
import EditorPageShell from "@/views/editor-shell/EditorPageShell.vue";
import { useEditorRouteController } from "@/views/editor-shell/useEditorRouteController";

const controller = useEditorRouteController();
</script>

<style lang="scss" scoped>
@import "./editor-shell/sub-editor-chrome";
</style>
