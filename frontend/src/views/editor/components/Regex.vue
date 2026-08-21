<template>
  <div class="editor-action-card editable-tags-card">
    <TDialog
      v-model:visible="leaveDialogVisible"
      :header="t('editorPage.subConfig.pop.leaveConfirmTitle')"
      :body="t('editorPage.subConfig.pop.leaveContent')"
      :cancel-btn="t('editorPage.subConfig.pop.leaveCancel')"
      :confirm-btn="t('editorPage.subConfig.pop.leaveConfirm')"
      @cancel="cancelLeave"
      @close="cancelLeave"
      @confirm="confirmLeave"
    />
    <TDialog
      v-model:visible="editDialogVisible"
      :header="t('editorPage.subConfig.pop.clickTag.title')"
      :body="t('editorPage.subConfig.pop.clickTag.content')"
      :cancel-btn="t('editorPage.subConfig.pop.clickTag.cancel')"
      :confirm-btn="t('editorPage.subConfig.pop.clickTag.confirm')"
      @cancel="cancelEdit"
      @close="cancelEdit"
      @confirm="confirmEdit"
    />
    <template v-if="hasMode"
      ><p class="des-label">
        {{ $t(`editorPage.subConfig.nodeActions['${type}'].des[1]`) }}
      </p>
      <TRadioGroup v-model="mode" class="option-grid option-grid--three"
        ><TRadio
          v-for="(option, index) in modeOptions"
          :key="String(option)"
          :value="option"
          >{{
            $t(`editorPage.subConfig.nodeActions['${type}'].options[${index}]`)
          }}</TRadio
        ></TRadioGroup
      ></template
    >
    <p class="des-label">
      {{ $t(`editorPage.subConfig.nodeActions['${type}'].des[0]`) }}
    </p>
    <Draggable
      v-model="dragData"
      item-key="id"
      class="tag-list"
      :force-fallback="true"
      :scroll="true"
      :chosen-class="'chosentag'"
    >
      <template #item="{ element, index }"
        ><div class="tag-list__item">
          <TButton
            :aria-label="`Edit regex ${index + 1}`"
            variant="text"
            size="small"
            @click="requestEdit(index)"
            ><TTag>{{ tagText(element.value) }}</TTag></TButton
          ><TButton
            :aria-label="`Delete regex ${index + 1}`"
            theme="danger"
            variant="text"
            shape="circle"
            size="small"
            @click="deleteRegexItem(index)"
            ><CloseIcon
          /></TButton></div
      ></template>
    </Draggable>
    <div class="input-wrapper">
      <TInput
        v-model="input1"
        :placeholder="
          $t(`editorPage.subConfig.nodeActions['${type}'].placeholder[0]`)
        "
      /><TInput
        v-if="isRenameOperator"
        v-model="input2"
        :placeholder="
          $t(`editorPage.subConfig.nodeActions['${type}'].placeholder[1]`)
        "
      /><TButton
        aria-label="Add regex"
        shape="circle"
        variant="text"
        @click="addItem"
        ><AddIcon
      /></TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AddIcon, CloseIcon } from "tdesign-icons-vue-next";
import { computed, inject, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { onBeforeRouteLeave } from "vue-router";
import Draggable from "vuedraggable";
import { showNotify } from "@/plugin/tdesign";
type RenameExpression = { expr: string; now: string };
type RegexValue = string | RenameExpression;
type RegexFilterArgs = { keep: boolean; regex: RegexValue[] };
type RegexSortArgs = { order: string; expressions: RegexValue[] };
type DraggableRegex = { id: string; value: RegexValue };
const props = defineProps<{ type: string; id: string }>(); const { t } = useI18n();
const form = inject<Sub | Collection>("form");
const input1 = ref("");
const input2 = ref("");
const mode = ref<string | number>(0);
const value = ref<RegexValue[]>([]);
const editDialogVisible = ref(false);
const editingIndex = ref<number>();
const leaveDialogVisible = ref(false);
let resolveLeave: ((allow: boolean) => void) | undefined;
const isRenameOperator = props.type === "Regex Rename Operator";
const hasMode = props.type === "Regex Filter" || props.type === "Regex Sort Operator";
const modeOptions = computed<readonly (string | number)[]>(() =>
  props.type === "Regex Filter" ? [0, 1] : ["asc", "desc", "original"],
);
const findAction = () => form?.process.find((item) => item.id === props.id);
const dragData = computed<DraggableRegex[]>({
  get: () =>
    value.value.map((expression, index) => ({
      id: `${index}-${JSON.stringify(expression)}`,
      value: expression,
    })),
  set: (expressions) => {
    value.value.splice(
      0,
      value.value.length,
      ...expressions.map((expression) => expression.value),
    );
  },
});
const tagText = (expression: RegexValue): string =>
  typeof expression === "string"
    ? expression
    : `${expression.expr}  ⇒  ${expression.now}`;
const isValidRegex = (expression: string): boolean => {
  try {
    new RegExp(expression);
    return true;
  } catch {
    return false;
  }
};
const editTag = (index: number): void => {
  const expression = value.value[index];
  if (expression === undefined) return;
  value.value.splice(index, 1);
  if (typeof expression === "string") {
    input1.value = expression;
    return;
  }
  input1.value = expression.expr;
  input2.value = expression.now;
};
const requestEdit = (index: number): void => {
  if (input1.value || input2.value) {
    editingIndex.value = index;
    editDialogVisible.value = true;
    return;
  }
  editTag(index);
};
const cancelEdit = (): void => {
  editingIndex.value = undefined;
};
const confirmEdit = (): void => {
  if (editingIndex.value !== undefined) editTag(editingIndex.value);
  editDialogVisible.value = false;
  cancelEdit();
};
const deleteRegexItem = (index: number): void => {
  value.value.splice(index, 1);
};
const cancelLeave = (): void => {
  resolveLeave?.(false);
  resolveLeave = undefined;
};
const confirmLeave = (): void => {
  resolveLeave?.(true);
  resolveLeave = undefined;
};
const addItem = (): void => {
  if (!input1.value) return;
  if (!isValidRegex(input1.value)) {
    showNotify({
      type: "danger",
      title: t("editorPage.subConfig.actions.pasteAction.invalidData"),
    });
    return;
  }
  value.value.push(
    isRenameOperator ? { expr: input1.value, now: input2.value } : input1.value,
  );
  input1.value = "";
  input2.value = "";
};
onMounted(() => {
  const action = findAction();
  if (!action) return;
  if (props.type === "Regex Filter") {
    const args = action.args as RegexFilterArgs;
    value.value = Array.isArray(args?.regex) ? args.regex : [];
    mode.value = args?.keep ? 0 : 1;
    return;
  }
  if (props.type === "Regex Sort Operator") {
    const args = action.args;
    const order = Array.isArray(args)
      ? "asc"
      : ((args as Partial<RegexSortArgs>)?.order ?? "asc");
    const expressions = Array.isArray(args)
      ? args
      : (args as Partial<RegexSortArgs>)?.expressions;
    const normalized: RegexSortArgs = {
      order,
      expressions: Array.isArray(expressions) ? expressions : [],
    };
    action.args = normalized;
    value.value = normalized.expressions;
    mode.value = normalized.order;
    return;
  }
  value.value = Array.isArray(action.args) ? action.args : [];
});
watch(mode, () => {
  const action = findAction();
  if (!action) return;
  if (props.type === "Regex Filter")
    (action.args as RegexFilterArgs).keep = !mode.value;
  if (props.type === "Regex Sort Operator")
    (action.args as RegexSortArgs).order = String(mode.value);
});
onBeforeRouteLeave(() => {
  if (!input1.value && !input2.value) return true;
  leaveDialogVisible.value = true;
  return new Promise<boolean>((resolve) => {
    resolveLeave = resolve;
  });
});
</script>

<style src="./EditableTags.scss" lang="scss" scoped />
<style scoped>
.option-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
</style>
