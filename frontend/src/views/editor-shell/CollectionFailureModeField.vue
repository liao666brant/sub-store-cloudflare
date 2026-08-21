<template>
    <TFormItem :label="t('editorPage.subConfig.basic.ignoreFailedRemoteSub.label')" name="ignoreFailedRemoteSub" class="failure-mode-trigger">
        <TInput :model-value="label" class="editor-input-text failure-mode-input" readonly @click="emit('open')">
            <template #suffix-icon><button class="input-icon-trigger" type="button" :aria-label="t('editorPage.subConfig.basic.ignoreFailedRemoteSub.label')" @click.stop="emit('open')">
                    <ChevronRightIcon />
                </button></template>
        </TInput>
    </TFormItem>
</template>

<script lang="ts" setup>
    import {
        ChevronRightIcon
    } from "tdesign-icons-vue-next";
    import {
        FormItem as TFormItem,
        Input as TInput
    } from "tdesign-vue-next";
    import {
        useI18n
    } from "vue-i18n";

    defineProps < {
        readonly label: string
    } > ();
    const emit = defineEmits < {
        open: []
    } > ();
    const {
        t
    } = useI18n();
</script>