<template>
  <div class="editor-action-card editable-tags-card">
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
    <p class="des-label">
      {{ $t(`editorPage.subConfig.nodeActions['${type}'].field.des`) }}
    </p>
    <Draggable
      v-model="dragData"
      item-key="id"
      class="tag-list"
      :force-fallback="true"
      :scroll="true"
      :chosen-class="'chosentag'"
    >
      <template #item="{ element, index }">
        <div class="tag-list__item">
          <TButton
            :aria-label="`Edit field ${index + 1}`"
            variant="text"
            size="small"
            @click="requestEdit(index)"
            ><TTag>{{ element.value }}</TTag></TButton
          ><TButton
            :aria-label="`Delete field ${index + 1}`"
            theme="danger"
            variant="text"
            shape="circle"
            size="small"
            @click="deleteItem(index)"
            ><CloseIcon
          /></TButton>
        </div>
      </template>
    </Draggable>
    <div class="input-wrapper">
      <TInput
        v-model="input"
        :placeholder="
          $t(`editorPage.subConfig.nodeActions['${type}'].field.placeholder`)
        "
      /><TButton
        aria-label="Add field"
        shape="circle"
        variant="text"
        @click="addItem"
        ><AddIcon
      /></TButton>
    </div>
    <p class="des-label">
      {{ $t(`editorPage.subConfig.nodeActions['${type}'].action.des`) }}
    </p>
    <TRadioGroup v-model="value.action" class="option-grid"
      ><TRadio
        v-for="(action, index) in actions"
        :key="action"
        :value="action"
        >{{
          $t(
            `editorPage.subConfig.nodeActions['${type}'].action.options[${index}]`,
          )
        }}</TRadio
      ></TRadioGroup
    >
    <template v-if="value.action === 'rename'">
      <p class="des-label">
        {{ $t(`editorPage.subConfig.nodeActions['${type}'].position.des`) }}
      </p>
      <TRadioGroup v-model="value.position" class="option-grid"
        ><TRadio
          v-for="(position, index) in positions"
          :key="position"
          :value="position"
          >{{
            $t(
              `editorPage.subConfig.nodeActions['${type}'].position.options[${index}]`,
            )
          }}</TRadio
        ></TRadioGroup
      >
      <p class="des-label">
        {{ $t(`editorPage.subConfig.nodeActions['${type}'].template.des`) }}
      </p>
      <TInput
        v-model="value.template"
        :placeholder="
          $t(`editorPage.subConfig.nodeActions['${type}'].template.placeholder`)
        "
      />
      <p class="des-label">
        {{ $t(`editorPage.subConfig.nodeActions['${type}'].link.des`) }}
      </p>
      <TInput
        v-model="value.link"
        :placeholder="
          $t(`editorPage.subConfig.nodeActions['${type}'].link.placeholder`)
        "
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { AddIcon, CloseIcon } from "tdesign-icons-vue-next";
import { computed, inject, onMounted, reactive, ref, toRaw, watch } from "vue";
import { useI18n } from "vue-i18n";
import Draggable from "vuedraggable";

type DuplicateArgs = {
  action: string;
  position: string;
  template: string;
  link: string;
  field: string[];
};
type DraggableField = { id: string; value: string };
const props = defineProps<{ type: string; id: string }>();
const { t } = useI18n();
const form = inject<Sub | Collection>("form");
const actions = ["rename", "delete"] as const;
const positions = ["front", "back"] as const;
const input = ref("");
const editDialogVisible = ref(false);
const editingIndex = ref<number>();
const value = reactive<DuplicateArgs>({
  action: "",
  position: "",
  template: "",
  link: "",
  field: [],
});
const findAction = () => form?.process.find((item) => item.id === props.id);
const dragData = computed<DraggableField[]>({
  get: () =>
    value.field.map((field, index) => ({
      id: `${index}-${field}`,
      value: field,
    })),
  set: (fields) => {
    value.field.splice(
      0,
      value.field.length,
      ...fields.map((field) => field.value),
    );
  },
});
const editTag = (index: number): void => {
  const field = value.field[index];
  if (field === undefined) return;
  value.field.splice(index, 1);
  input.value = field;
};
const requestEdit = (index: number): void => {
  if (input.value) {
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
const deleteItem = (index: number): void => {
  value.field.splice(index, 1);
};
const addItem = (): void => {
  if (!input.value) return;
  value.field.push(input.value);
  input.value = "";
};
onMounted(() => {
  const action = findAction();
  if (!action) return;
  const args = (action.args ?? {}) as Partial<DuplicateArgs>;
  value.action = args.action ?? "";
  value.position = args.position ?? "";
  value.template = args.template ?? "";
  value.link = args.link ?? "";
  value.field = Array.isArray(args.field) ? args.field : ["name"];
});
watch(
  value,
  () => {
    const action = findAction();
    if (action) action.args = toRaw(value);
  },
  { deep: true },
);
</script>

<style src="./EditableTags.scss" lang="scss" scoped />
