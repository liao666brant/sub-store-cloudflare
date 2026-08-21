<template>
    <TFormItem required :label="t('editorPage.subConfig.basic.name.label')" name="name" :rules="nameRules">
        <input
          v-model.trim="form.name"
          class="editor-input-text"
          data-1p-ignore
          :disabled="isEditMode"
          maxlength="64"
          autocapitalize="none"
          spellcheck="false"
          type="text"
          :placeholder="t('editorPage.subConfig.basic.name.placeholder')"
          @blur="emit('validate', 'name')"
        >
    </TFormItem>
    <TFormItem :label="t('editorPage.subConfig.basic.displayName.label')" name="displayName">
        <input v-model.trim="form.displayName" class="editor-input-text" type="text" :placeholder="t('editorPage.subConfig.basic.displayName.placeholder')">
    </TFormItem>
    <TFormItem :label="t('editorPage.subConfig.basic.remark.label')" name="remark">
        <TTextarea
          v-model="form.remark"
          class="editor-input-text"
          rows="1"
          :autosize="{ maxRows: 6 }"
          maxlength="100"
          :placeholder="t('editorPage.subConfig.basic.remark.placeholder')"
        />
    </TFormItem>
    <TFormItem :label="t('editorPage.subConfig.basic.tag.label')" name="tag">
        <TInput v-model.trim="form.tag" class="editor-input-text" type="text" :placeholder="t('editorPage.subConfig.basic.tag.placeholder')">
            <template #suffix-icon>
                <button class="tag-picker-trigger" type="button" :aria-label="t('editorPage.subConfig.basic.tag.label')" @click.stop="emit('openTag')">
                    <ChevronRightIcon />
                </button>
            </template>
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
</template>

<script lang="ts" setup>
    import {
        ChevronRightIcon
    } from "tdesign-icons-vue-next";
    import {
        FormItem as TFormItem,
        Input as TInput,
        Switch as TSwitch,
        Textarea as TTextarea
    } from "tdesign-vue-next";
    import {
        computed
    } from "vue";
    import {
        useI18n
    } from "vue-i18n";

    type MetadataForm = {
        displayName ? : string;
        icon ? : string;
        isIconColor ? : boolean;
        name: string;
        remark ? : string;
        tag ? : string;
    };

    const props = defineProps < {
        readonly form: MetadataForm;
        readonly isEditMode: boolean;
        readonly validateName: (value: string) => Promise < boolean > ;
    } > ();

    const emit = defineEmits < {
        openTag: [];
        validate: [field: string];
    } > ();

    const {
        t
    } = useI18n();
    const nameRules = computed(() => [{
            required: true,
            message: t("editorPage.subConfig.basic.name.isEmpty")
        },
        {
            validator: props.validateName,
            message: t("editorPage.subConfig.basic.name.isInvalid")
        },
    ]);
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
