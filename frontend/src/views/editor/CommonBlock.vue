<template>
  <section class="form-block-wrapper">
    <header class="sticky-title-wrapper common-title-row">
      <button class="title" type="button" @click="toggleFold">
        <p>{{ t("editorPage.subConfig.commonOptions.label") }}</p>
        <ChevronRightIcon v-if="isFold" /><ChevronDownIcon v-else /></button
      ><EditorCommonTips />
    </header>
    <TForm v-if="!isFold" class="form common-options-form" layout="inline">
      <div class="quick-option-palette">
        <TButton
          v-for="option in options"
          :key="option.key"
          size="small"
          :variant="configured(option) ? 'base' : 'outline'"
          @click="toggle(option)"
          >{{
            t(`editorPage.subConfig.commonOptions${option.path}.label`)
          }}</TButton
        >
      </div>
      <TFormItem
        v-for="option in configuredOptions"
        :key="option.key"
        class="configured-option-item"
        ><p class="options-label">
          {{ t(`editorPage.subConfig.commonOptions${option.path}.label`) }}
        </p>
        <TRadioGroup v-model="args[option.key]"
          ><TRadio
            v-for="radio in radioOptions(option)"
            :key="radio.value"
            :value="radio.value"
            >{{
              t(
                `editorPage.subConfig.commonOptions${option.path}.${radio.label}`,
              )
            }}</TRadio
          ></TRadioGroup
        ><TButton
          :aria-label="t('editorPage.subConfig.pop.deleteConfirm')"
          shape="circle"
          size="small"
          theme="danger"
          variant="text"
          @click="remove(option)"
          ><CloseIcon /></TButton
      ></TFormItem>
    </TForm>
  </section>
</template>
<script setup lang="ts">
import EditorCommonTips from "@/components/EditorCommonTips.vue";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
} from "tdesign-icons-vue-next";
import { computed, inject, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import {
  getEditorFoldState,
  getEditorIsFolded,
  setEditorFoldState,
} from "@/utils/editorFoldState";
type Key = "useless" | "udp" | "scert" | "tfo" | "vmess aead";
type Option = {
  readonly key: Key;
  readonly path: string;
  readonly empty: string;
  readonly initial?: string;
  readonly radios?: readonly {
    readonly value: string;
    readonly label: string;
  }[];
};
const props = withDefaults(defineProps<{ defaultFolded?: boolean }>(), {
  defaultFolded: false,
});
const { t } = useI18n();
const route = useRoute();
const form = inject<Sub | Collection>("form");
const foldKey = "common-block-fold";
const options: readonly Option[] = [
  {
    key: "useless",
    path: ".useless",
    empty: "DISABLED",
    radios: [
      { value: "DISABLED", label: "disabled" },
      { value: "ENABLED", label: "enabled" },
    ],
  },
  { key: "udp", path: ".udp", empty: "DEFAULT" },
  { key: "scert", path: ".scert", empty: "DEFAULT" },
  { key: "tfo", path: ".tfo", empty: "DEFAULT" },
  { key: "vmess aead", path: "['vmess aead']", empty: "DEFAULT" },
];
const defaults = (): Record<Key, string> => ({
  useless: "DISABLED",
  udp: "DEFAULT",
  scert: "DEFAULT",
  tfo: "DEFAULT",
  "vmess aead": "DEFAULT",
});
const getOperator = () => {
  const existing = form.process.find(
    (item) => item.type === "Quick Setting Operator",
  );
  if (existing) return existing;
  const created = { type: "Quick Setting Operator", args: defaults() };
  form.process.unshift(created);
  return created;
};
const ensureArgs = (): Record<Key, string> => {
  const operator = getOperator();
  if (!operator.args || typeof operator.args !== "object")
    operator.args = defaults();
  const values = operator.args as Record<Key, string>;
  for (const [name, value] of Object.entries(defaults()))
    if (!values[name as Key]) values[name as Key] = value;
  return values;
};
const args = computed(ensureArgs);
const isFold = ref(getEditorIsFolded(foldKey, route.path, props.defaultFolded));
const configured = (option: Option): boolean =>
  args.value[option.key] !== option.empty;
const configuredOptions = computed(() => options.filter(configured));
const radioOptions = (option: Option) =>
  option.radios ?? [
    { value: "ENABLED", label: "enabled" },
    { value: "DISABLED", label: "disabled" },
  ];
const remove = (option: Option): void => {
  args.value[option.key] = option.empty;
};
const toggle = (option: Option): void => {
  args.value[option.key] = configured(option)
    ? option.empty
    : (option.initial ?? "ENABLED");
};
const toggleFold = (): void => {
  isFold.value = !isFold.value;
  setEditorFoldState(foldKey, route.path, isFold.value);
};
watch(
  () => props.defaultFolded,
  (value) => {
    if (getEditorFoldState(foldKey, route.path) === undefined)
      isFold.value = value;
  },
);
</script>
<style src="./CommonBlock.scss" lang="scss" scoped />
