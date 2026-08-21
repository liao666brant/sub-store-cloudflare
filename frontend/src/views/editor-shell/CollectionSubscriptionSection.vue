<template>
    <div class="t-form__item line template-trigger" @click.stop="emit('openTemplate')">
        <span class="editor-cell__title t-form__label">{{ t("editorPage.subConfig.basic.template.label") }}</span>
        <span class="editor-cell__value t-form__controls">
            <TInput :model-value="templateLabel" class="editor-input-text template-trigger-input" readonly>
                <template #prefix-icon><button class="input-icon-trigger" type="button" :aria-label="t('editorPage.subConfig.basic.template.label')" @click.stop="emit('templateTips')">
                        <HelpCircleIcon />
                    </button></template>
                <template #suffix-icon><button class="input-icon-trigger" type="button" :aria-label="t('editorPage.subConfig.basic.template.pickerTitle')" @click.stop="emit('openTemplate')">
                        <ChevronRightIcon />
                    </button></template>
            </TInput>
        </span>
    </div>
    <div class="t-form__item line include-subs-trigger" @click.stop="emit('toggleFold')">
        <span class="editor-cell__title t-form__label">{{ t("editorPage.subConfig.basic.subscriptions.label") }}</span>
        <span class="editor-cell__value t-form__controls">
            <TInput :model-value="subscriptionsLabel" class="editor-input-text include-subs-trigger-input" readonly><template #suffix-icon>
                    <ChevronDownIcon />
                </template></TInput>
        </span>
    </div>
    <div v-show="!folded" class="include-subs-wrapper">
        <div v-if="tags.length" class="tag-check">
            <div class="radio-wrapper"><span v-for="item in tags" :key="item.value" :class="{ tag: true, current: item.value === selectedTag }" @click="emit('selectTag', item.value)">{{ item.label }}</span></div>
            <TCheckbox :checked="allChecked" :indeterminate="allIndeterminate" @click="emit('toggleAll')" />
        </div>
        <div role="group" :aria-label="t('editorPage.subConfig.basic.subscriptions.label')" :class="['subs-checkbox-wrapper', { 'is-simple-mode': simpleMode, 'is-dragging': dragging }]">
            <draggable v-model="modelRows" item-key="0" animation="300" :scroll-sensitivity="200" :force-fallback="true" :scroll-speed="8" :scroll="true" handle=".drag-handle" @start="emit('startDrag')" @end="emit('endDrag')">
                <template #item="{ element }">
                    <TCheckbox :key="element[0]" :label="element[0]" :checked="isSelected(element[0])" text-position="left" class="subs-checkbox" @change="emit('changeSelection', element[0], $event)">
                        <div class="sub-img-wrapper">
                            <TAvatar v-if="element[2]" :class="{ icon: true, 'sub-item-customer-icon': !element[4] }" :size="avatarSize" :image="element[2]" />
                            <span class="sub-item"><span class="name">{{ element[1] }}</span><span v-for="tagName in element[3]" :key="tagName" class="tag">
                                    <TTag>{{ tagName }}</TTag>
                                </span></span>
                            <MenuIcon class="drag-handle" />
                        </div>
                    </TCheckbox>
                </template>
            </draggable>
        </div>
    </div>
    <TFormItem :label="t('editorPage.subConfig.basic.subUserinfo.label')" name="subUserinfo">
        <TInput v-model.trim="form.subUserinfo" class="editor-input-text" type="text" :placeholder="t('editorPage.subConfig.basic.subUserinfo.placeholder')"><template #prefix-icon>
                <HelpCircleIcon @click.stop="emit('subUserinfoTips')" />
            </template></TInput>
    </TFormItem>
</template>

<script lang="ts" setup>
    import {
        ChevronDownIcon,
        ChevronRightIcon,
        HelpCircleIcon,
        MenuIcon
    } from "tdesign-icons-vue-next";
    import {
        Avatar as TAvatar,
        Checkbox as TCheckbox,
        FormItem as TFormItem,
        Input as TInput,
        Tag as TTag
    } from "tdesign-vue-next";
    import {
        computed
    } from "vue";
    import {
        useI18n
    } from "vue-i18n";
    import draggable from "vuedraggable";
    import type {
        SubscriptionRow
    } from "@/views/editor-shell/useCollectionSubscriptionSelection";

    type CollectionForm = {
        subUserinfo ? : string
    };
    type TagOption = {
        readonly label: string;readonly value: string
    };

    const props = defineProps < {
        readonly allChecked: boolean;
        readonly allIndeterminate: boolean;
        readonly avatarSize: string;
        readonly dragging: boolean;
        readonly folded: boolean;
        readonly form: CollectionForm;
        readonly isSelected: (name: string) => boolean;
        readonly rows: readonly SubscriptionRow[];
        readonly selectedTag: string;
        readonly simpleMode: boolean;
        readonly subscriptionsLabel: string;
        readonly tags: readonly TagOption[];
        readonly templateLabel: string;
    } > ();
    const emit = defineEmits < {
        changeSelection: [name: string, checked: boolean];
        endDrag: [];
        openTemplate: [];
        selectTag: [tag: string];
        startDrag: [];
        subUserinfoTips: [];
        templateTips: [];
        toggleAll: [];
        toggleFold: [];
        "update:rows": [rows: SubscriptionRow[]];
    } > ();
    const {
        t
    } = useI18n();
    const modelRows = computed({
        get: () => [...props.rows],
        set: value => emit("update:rows", value)
    });
</script>

<style lang="scss" scoped>
    @import "./editor-collection-subscriptions";
</style>