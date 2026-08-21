<template>
    <TFormItem class="local-content-field" :label="undefined" name="content">
        <input ref="fileInput" class="file-input" type="file" @change="selectFile">
        <div class="local-editor-actions">
            <button class="cimg-button" type="button" @click="emit('fullscreen')">
                <FullscreenIcon />
                {{ t("editorPage.subConfig.basic.url.tips.fullScreenEdit") }}
            </button>
            <button class="cimg-button" type="button" @click="fileInput?.click()">
                <CloudUploadIcon />
                {{ t("editorPage.subConfig.basic.url.tips.importFromFile") }}
            </button>
            <button class="cimg-button" type="button" :disabled="loading || !hasContent" @click="emit('validate')">
                <CheckCircleIcon />
                {{ loading ? t("editorPage.subConfig.basic.content.validation.checking") : t("editorPage.subConfig.basic.content.validation.action") }}
            </button>
            <button class="button-tips" type="button" @click="emit('tips')">
                <span class="tips">{{ t("editorPage.subConfig.basic.url.tips.label") }}</span>
            </button>
        </div>
        <div v-if="summary" class="local-preview-summary" :class="`is-${summary.status}`">
            <div class="summary-title">
                <CheckCircleIcon />
                <span>{{ summary.title }}</span>
            </div>
            <div v-if="summary.detail" class="summary-detail">{{ summary.detail }}</div>
            <div v-if="typeBadges.length" class="summary-types">
                <TTag v-for="item in typeBadges" :key="item">{{ item }}</TTag>
            </div>
        </div>
        <div class="local-code-editor">
            <CmView :is-read-only="false" id="SubEditer" />
        </div>
    </TFormItem>
</template>

<script lang="ts" setup>
    import {
        CheckCircleIcon,
        CloudUploadIcon,
        FullscreenIcon
    } from "tdesign-icons-vue-next";
    import {
        FormItem as TFormItem,
        Tag as TTag
    } from "tdesign-vue-next";
    import {
        ref
    } from "vue";
    import {
        useI18n
    } from "vue-i18n";
    import CmView from "@/views/editCode/cmView.vue";

    export type LocalPreviewSummary = {
        readonly status: "success" | "danger";
        readonly title: string;
        readonly detail ? : string;
        readonly types ? : Record < string,
        number > ;
    };

    defineProps < {
        readonly hasContent: boolean;
        readonly loading: boolean;
        readonly summary: LocalPreviewSummary | null;
        readonly typeBadges: readonly string[];
    } > ();

    const emit = defineEmits < {
        fileSelected: [file: File];
        fullscreen: [];
        tips: [];
        validate: [];
    } > ();

    const {
        t
    } = useI18n();
    const fileInput = ref < HTMLInputElement | null > (null);

    const selectFile = (event: Event): void => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) emit("fileSelected", file);
    };
</script>

<style lang="scss" scoped>
    .file-input {
        display: none;
    }

    .local-content-field {
        min-width: 0;

        :deep(.t-form__controls),
        :deep(.t-form__controls-content) {
            width: 100%;
            min-width: 0;
        }

        :deep(.t-form__controls-content) {
            display: block;
        }
    }

    .local-editor-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--app-space-control);
        min-width: 0;
        margin-block: var(--app-space-compact);

        .cimg-button,
        .button-tips {
            display: inline-flex;
            flex: 0 1 auto;
            align-items: center;
            gap: var(--app-space-compact);
            min-height: var(--td-comp-size-s);
            margin: 0;
            padding-inline: 2px;
            border: 0;
            background: transparent;
            color: var(--td-text-color-secondary);
            font: inherit;
            font-size: 12px;
            line-height: 1.5;
            white-space: nowrap;
        }

        .cimg-button {
            padding-inline-end: var(--app-space-compact);
            border-inline-end: 1px solid var(--td-component-stroke);
        }

        .button-tips {
            color: var(--td-brand-color);
            cursor: pointer;
            text-decoration: underline;
        }
    }

    .local-preview-summary {
        margin: 10px -15px 12px;
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--item-card-radios);
        background: var(--card-color);
        color: var(--second-text-color);
        font-size: 12px;

        &.is-success {
            border-color: color-mix(in srgb, var(--primary-color) 35%, var(--divider-color));

            .summary-title {
                color: var(--primary-color);
            }
        }

        &.is-danger {
            border-color: color-mix(in srgb, var(--danger-color, #fa2c19) 35%, var(--divider-color));

            .summary-title {
                color: var(--danger-color, #fa2c19);
            }
        }
    }

    .summary-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
    }

    .summary-detail {
        margin-top: 6px;
        overflow-wrap: anywhere;
    }

    .summary-types {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
    }

    .local-code-editor {
        max-height: 60vh;
        min-width: 0;
        margin-inline: calc(-1 * var(--safe-area-side));
        overflow: auto;

        :deep(.cmviewRef),
        :deep(.cm-editor) {
            min-width: 0;
        }

        :deep(.cm-img-button) {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            justify-content: flex-end;
            gap: var(--app-space-compact);
            width: 100%;
            height: auto;
            min-height: 33px;
            min-width: 0;
        }

        :deep(.cm-img-button > div) {
            display: flex;
            flex: 1 1 0;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: var(--app-space-compact);
            min-width: 0;
        }

        :deep(.cm-img-button button) {
            flex: 0 0 33px;
            margin: 0;
        }
    }
</style>