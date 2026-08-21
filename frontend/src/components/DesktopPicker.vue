<template>
  <TDialog
    :visible="props.visible"
    :header="props.title"
    :cancel-btn="props.cancelText"
    :confirm-btn="props.okText"
    destroy-on-close
    prevent-scroll-through
    show-overlay
    @close="close"
    @cancel="close"
    @confirm="confirm"
  >
    <TSelect v-model="selectedValue" :options="options" />
  </TDialog>
</template>

<script setup lang="ts">
import { Dialog as TDialog, Select as TSelect } from "tdesign-vue-next";
import { computed, ref, watch } from "vue";

type PickerValue = string | number;

type PickerOption = {
  readonly text: string;
  readonly value: PickerValue;
};

const props = defineProps<{
  readonly modelValue: readonly PickerValue[];
  readonly visible: boolean;
  readonly columns: readonly PickerOption[];
  readonly title?: string;
  readonly cancelText?: string;
  readonly okText?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: PickerValue[]];
  "update:visible": [value: boolean];
  confirm: [payload: { readonly selectedValue: PickerValue[] }];
}>();

const selectedValue = ref<PickerValue | undefined>(props.modelValue[0]);
const options = computed(() => props.columns.map(option => ({
  label: option.text,
  value: option.value,
})));

watch(() => props.modelValue, value => {
  selectedValue.value = value[0] ?? props.columns[0]?.value;
}, { immediate: true });

watch(() => props.visible, visible => {
  if (visible) selectedValue.value = props.modelValue[0] ?? props.columns[0]?.value;
});

const close = (): void => {
  emit("update:visible", false);
};

const confirm = (): void => {
  const value = selectedValue.value ?? props.columns[0]?.value;
  if (value === undefined) {
    close();
    return;
  }

  const selectedValueList = [value];
  emit("update:modelValue", selectedValueList);
  emit("confirm", { selectedValue: selectedValueList });
  close();
};
</script>
