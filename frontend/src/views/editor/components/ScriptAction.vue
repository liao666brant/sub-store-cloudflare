<template>
  <div class="script-action">
    <template v-if="metadata">
      <p class="script-description">
        {{ localized(metadata.description, metadata.descriptionZh) }}
      </p>
      <p class="script-compatibility">
        {{
          metadata.compatibility === "free"
            ? $t("editorPage.subConfig.actions.script.freeVerified")
            : $t("editorPage.subConfig.actions.script.personal")
        }}
      </p>
      <TForm>
        <TFormItem
          v-for="parameter in metadata.parameters"
          :key="parameter.key"
        >
          <p class="options-label">
            {{ localized(parameter.label, parameter.labelZh) }}
          </p>
          <TCheckbox
            v-if="parameter.type === 'boolean'"
            :model-value="Boolean(argumentsValue[parameter.key])"
            @update:model-value="(value) => setArgument(parameter, value)"
          >
            {{
              Boolean(argumentsValue[parameter.key])
                ? $t("editorPage.subConfig.actions.enable")
                : $t("editorPage.subConfig.actions.disable")
            }}
          </TCheckbox>
          <TTextarea
            v-else-if="parameter.type === 'string-list'"
            :model-value="formatList(argumentsValue[parameter.key])"
            :placeholder="parameter.placeholder || ''"
            :autosize="{ minHeight: 48, maxHeight: 120 }"
            @update:model-value="(value) => setArgument(parameter, value)"
          />
          <TInput
            v-else
            :model-value="String(argumentsValue[parameter.key] ?? '')"
            :type="parameter.type === 'number' ? 'number' : 'text'"
            :placeholder="parameter.placeholder || ''"
            @update:model-value="(value) => setArgument(parameter, value)"
          />
        </TFormItem>
      </TForm>
    </template>
    <p v-else class="script-unavailable">
      {{ $t("editorPage.subConfig.actions.script.unavailable") }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, ref } from "vue";
import { useCloudflareApi } from "@/api/app";
import type { EditorFormState } from "@/views/editor-shell/editorTypes";
import { useI18n } from "vue-i18n";

type Parameter = {
  readonly key: string;
  readonly label: string;
  labelZh?: string;
  readonly type: "string" | "number" | "boolean" | "string-list";
  readonly default?: unknown;
  readonly placeholder?: string;
};
type Metadata = {
  readonly id: string;
  readonly name: string;
  readonly nameZh?: string;
  readonly description: string;
  readonly descriptionZh?: string;
  readonly kind: "filter" | "operator";
  readonly compatibility: "free" | "personal";
  readonly parameters: readonly Parameter[];
};
type ScriptArguments = Record<string, unknown>;
type ScriptApiPayload = { readonly data?: readonly Metadata[] };

const { id } = defineProps<{ id: string }>();
const { locale } = useI18n();
const form = inject<EditorFormState>("form");
const scripts = ref<Metadata[]>([]);
const emptyArguments: ScriptArguments = {};
const item = computed(() => form?.process.find((process) => process.id === id));
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isParameter = (value: unknown): value is Parameter =>
  isRecord(value) &&
  typeof value.key === "string" &&
  typeof value.label === "string" &&
  ["string", "number", "boolean", "string-list"].includes(String(value.type));
const isMetadata = (value: unknown): value is Metadata =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.name === "string" &&
  typeof value.description === "string" &&
  (value.kind === "filter" || value.kind === "operator") &&
  (value.compatibility === "free" || value.compatibility === "personal") &&
  Array.isArray(value.parameters) &&
  value.parameters.every(isParameter);
const toScriptApiPayload = (value: unknown): ScriptApiPayload =>
  isRecord(value) && Array.isArray(value.data)
    ? { data: value.data.filter(isMetadata) }
    : {};
const argumentsValue = computed<ScriptArguments>(() => {
  const selected = item.value;
  if (!selected) return emptyArguments;
  const payload: unknown = selected.args;
  if (!isRecord(payload)) {
    const nextArguments: ScriptArguments = {};
    selected.args = { arguments: nextArguments };
    return nextArguments;
  }
  const argumentsPayload: unknown = payload.arguments;
  if (isRecord(argumentsPayload)) return argumentsPayload;
  const nextArguments: ScriptArguments = {};
  payload.arguments = nextArguments;
  return nextArguments;
});
const metadata = computed(() => {
  const payload: unknown = item.value?.args;
  const scriptId = isRecord(payload) ? payload.scriptId : undefined;
  return typeof scriptId === "string"
    ? scripts.value.find((script) => script.id === scriptId)
    : undefined;
});

onMounted(async () => {
  const response = await useCloudflareApi().getScripts();
  const payload = toScriptApiPayload(response.data);
  scripts.value = Array.isArray(payload.data) ? [...payload.data] : [];
  for (const parameter of metadata.value?.parameters ?? []) {
    if (
      argumentsValue.value[parameter.key] === undefined &&
      parameter.default !== undefined
    ) {
      argumentsValue.value[parameter.key] = parameter.default;
    }
  }
});

const setArgument = (parameter: Parameter, value: unknown): void => {
  if (parameter.type === "number") {
    const number = Number(value);
    argumentsValue.value[parameter.key] = Number.isFinite(number)
      ? number
      : parameter.default;
  } else if (parameter.type === "string-list") {
    argumentsValue.value[parameter.key] = String(value || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  } else {
    argumentsValue.value[parameter.key] = value;
  }
};

const formatList = (value: unknown): string =>
  Array.isArray(value) ? value.join("\n") : "";
const localized = (english: string, chinese?: string): string =>
  locale.value.startsWith("zh") && chinese ? chinese : english;
</script>

<style lang="scss" scoped>
.script-action {
  width: 100%;
}

.script-description,
.script-compatibility,
.script-unavailable {
  color: var(--comment-text-color);
  font-size: 12px;
  line-height: 1.5;
  margin: 0 0 8px;
}

.script-compatibility {
  color: var(--primary-color);
}

.options-label {
  color: var(--second-text-color);
  font-size: 12px;
  margin-right: 12px;
}
</style>
