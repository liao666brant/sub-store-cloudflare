<template>
    <TFormItem :label="t('editorPage.subConfig.basic.displayName.label')" name="displayName">
        <input v-model.trim="form.displayName" class="editor-input-text" data-1p-ignore type="text" :placeholder="t('editorPage.subConfig.basic.displayName.placeholder')">
    </TFormItem>
    <TFormItem :label="t('editorPage.subConfig.basic.remark.label')" name="remark">
        <TTextarea v-model="form.remark" class="editor-input-text" rows="1" :autosize="{ maxRows: 6 }" maxlength="100" :placeholder="t('editorPage.subConfig.basic.remark.placeholder')" />
    </TFormItem>
    <TFormItem :label="t('editorPage.subConfig.basic.tag.label')" name="tag">
        <TInput v-model.trim="form.tag" class="editor-input-text" type="text" :placeholder="t('editorPage.subConfig.basic.tag.placeholder')">
            <template #suffix-icon><button class="tag-picker-trigger" type="button" :aria-label="t('editorPage.subConfig.basic.tag.label')" @click.stop="emit('openTag')">
                    <ChevronRightIcon />
                </button></template>
        </TInput>
    </TFormItem>
    <TFormItem :label="t('editorPage.subConfig.basic.icon.label')" name="icon">
        <TInput v-model.trim="form.icon" class="editor-input-text" type="text" :placeholder="t('editorPage.subConfig.basic.icon.placeholder')" />
    </TFormItem>
    <TFormItem :label="t('editorPage.subConfig.basic.isIconColor.label')" name="isIconColor" class="ignore-failed-wrapper">
        <div class="switch-wrapper">
            <TSwitch v-model="form.isIconColor" />
        </div>
    </TFormItem>
    <TFormItem v-if="form.source === 'remote'" :label="t('editorPage.subConfig.basic.passThroughUA.label')" name="passThroughUA" class="ignore-failed-wrapper">
        <div class="switch-wrapper">
            <TSwitch v-model="form.passThroughUA" @change="emit('changePassThroughUA', Boolean($event))" />
        </div>
    </TFormItem>
    <TFormItem v-if="form.source === 'remote'" :label="t('editorPage.subConfig.basic.ua.label')" name="ua">
        <TInput v-model.trim="form.ua" class="editor-input-text" type="text" :readonly="passThroughUAOn" :placeholder="userAgentPlaceholder"><template #prefix-icon>
                <HelpCircleIcon @click.stop="emit('uaTips')" />
            </template></TInput>
    </TFormItem>
    <TFormItem :label="t('editorPage.subConfig.basic.subUserinfo.label')" name="subUserinfo">
        <TInput v-model.trim="form.subUserinfo" class="editor-input-text" type="text" :placeholder="t('editorPage.subConfig.basic.subUserinfo.placeholder')"><template #prefix-icon>
                <HelpCircleIcon @click.stop="emit('subUserinfoTips')" />
            </template></TInput>
    </TFormItem>
</template>

<script lang="ts" setup>
    import {
        ChevronRightIcon,
        HelpCircleIcon
    } from "tdesign-icons-vue-next";
    import {
        FormItem as TFormItem,
        Input as TInput,
        Switch as TSwitch,
        Textarea as TTextarea
    } from "tdesign-vue-next";
    import {
        useI18n
    } from "vue-i18n";

    type SourceForm = {
        displayName ? : string;
        icon ? : string;
        isIconColor ? : boolean;
        passThroughUA ? : boolean;
        remark ? : string;
        source ? : "local" | "remote";
        subUserinfo ? : string;
        tag ? : string;
        ua ? : string;
    };

    defineProps < {
        readonly form: SourceForm;
        readonly passThroughUAOn: boolean;
        readonly userAgentPlaceholder: string;
    } > ();
    const emit = defineEmits < {
        changePassThroughUA: [value: boolean];
        openTag: [];
        subUserinfoTips: [];
        uaTips: [];
    } > ();
    const {
        t
    } = useI18n();
</script>

<style lang="scss" scoped>
    .tag-picker-trigger {
        display: inline-flex;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--td-text-color-placeholder);
        cursor: pointer;
    }

    .ignore-failed-wrapper {
        flex-direction: row;
        justify-content: space-between;
    }

    .switch-wrapper {
        display: flex;
        justify-content: flex-end;
    }
</style>