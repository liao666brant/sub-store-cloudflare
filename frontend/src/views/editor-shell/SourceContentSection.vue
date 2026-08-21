<template>
    <TFormItem required :label="t('editorPage.subConfig.basic.source.label')" name="source">
        <div class="radio-wrapper">
            <TRadioGroup v-model="form.source">
                <TRadio value="remote">{{ t("editorPage.subConfig.basic.source.remote") }}</TRadio>
                <TRadio value="local">{{ t("editorPage.subConfig.basic.source.local") }}</TRadio>
            </TRadioGroup>
        </div>
    </TFormItem>
    <TFormItem v-if="form.source === 'remote'" required name="url" :rules="urlRules">
        <template #label>
            <span class="label-tips" @click="emit('urlTips')">
                <span>{{ t("editorPage.subConfig.basic.url.label") }}</span>
                <span class="tips">{{ t("editorPage.subConfig.basic.url.tips.label") }}</span>
            </span>
        </template>
        <TTextarea
          v-model="form.url"
          class="textarea-wrapper"
          :autosize="{ maxRows: 5, minRows: 2 }"
          :placeholder="t('editorPage.subConfig.basic.url.placeholder')"
          @blur="emit('urlBlur')"
          @change="emit('trimUrl')"
        />
    </TFormItem>
    <slot v-else />
</template>

<script lang="ts" setup>
    import {
        FormItem as TFormItem,
        RadioButton as TRadio,
        RadioGroup as TRadioGroup,
        Textarea as TTextarea
    } from "tdesign-vue-next";
    import {
        computed
    } from "vue";
    import {
        useI18n
    } from "vue-i18n";

    type SourceForm = {
        source ? : "local" | "remote";url ? : string
    };
    const props = defineProps < {
        readonly form: SourceForm;
        readonly validateUrl: (value: string) => Promise < boolean > ;
    } > ();
    const emit = defineEmits < {
        trimUrl: [];
        urlBlur: [];
        urlTips: [];
    } > ();
    const {
        t
    } = useI18n();
    const urlRules = computed(() => [{
            required: true,
            message: t("editorPage.subConfig.basic.url.isEmpty")
        },
        {
            validator: props.validateUrl,
            message: t("editorPage.subConfig.basic.url.isIllegal")
        },
    ]);
</script>
