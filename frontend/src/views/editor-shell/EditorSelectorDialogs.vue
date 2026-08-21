<template>
  <DesktopPicker
    v-if="showFailurePicker"
    v-model="failureValue"
    v-model:visible="failureVisible"
    :columns="failureColumns"
    :title="t('editorPage.subConfig.basic.ignoreFailedRemoteSub.label')"
    :cancel-text="t('editorPage.subConfig.sourceNamePicker.cancel')"
    :ok-text="t('editorPage.subConfig.sourceNamePicker.confirm')"
    @confirm="emit('confirmFailure', $event)"
  />
  <DesktopPicker
    v-if="showTemplatePicker"
    v-model="templateValue"
    v-model:visible="templateVisible"
    :columns="templateColumns"
    :title="t('editorPage.subConfig.basic.template.pickerTitle')"
    :cancel-text="t('editorPage.subConfig.sourceNamePicker.cancel')"
    :ok-text="t('editorPage.subConfig.sourceNamePicker.confirm')"
    @confirm="emit('confirmTemplate', $event)"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import DesktopPicker from "@/components/DesktopPicker.vue";

type PickerColumn = {
  readonly text: string;
  readonly value: string;
};

const props = defineProps<{
  readonly failureColumns: readonly PickerColumn[];
  readonly failureVisible: boolean;
  readonly failureValue: readonly string[];
  readonly showFailurePicker: boolean;
  readonly showTemplatePicker: boolean;
  readonly templateColumns: readonly PickerColumn[];
  readonly templateVisible: boolean;
  readonly templateValue: readonly string[];
}>();

const emit = defineEmits<{
  (event: "confirmFailure", payload: unknown): void;
  (event: "confirmTemplate", payload: unknown): void;
  (event: "update:failureVisible", value: boolean): void;
  (event: "update:failureValue", value: string[]): void;
  (event: "update:templateVisible", value: boolean): void;
  (event: "update:templateValue", value: string[]): void;
}>();

const { t } = useI18n();
const failureVisible = computed({
  get: () => props.failureVisible,
  set: value => emit("update:failureVisible", value),
});
const failureValue = computed({
  get: () => [...props.failureValue],
  set: value => emit("update:failureValue", value),
});
const templateVisible = computed({
  get: () => props.templateVisible,
  set: value => emit("update:templateVisible", value),
});
const templateValue = computed({
  get: () => [...props.templateValue],
  set: value => emit("update:templateValue", value),
});
</script>
