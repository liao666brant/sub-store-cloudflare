<template>
  <TDrawer
    :visible="isVisible"
    placement="bottom"
    size="95%"
    :header="t('subPage.tag.addTagTitle')"
    :footer="false"
    destroy-on-close
    @close="close"
  >
    <TInput
      v-model="keyword"
      clearable
      :placeholder="t('subPage.tag.tagPlaceholder')"
      @clear="clearSearch"
    />
    <div class="tag-list">
      <draggable :list="allTags" item-key="label" :animation="300">
        <template #item="{ element }">
          <TTag
            v-show="!keyword || element.label.includes(keyword)"
            :theme="element.isActive ? 'primary' : 'default'"
            :variant="element.isActive ? 'outline' : 'light-outline'"
            class="tag-item"
            @click="handleTagItem(element)"
          >
            {{ element.label }}
          </TTag>
        </template>
      </draggable>
      <div class="add-tag-box">
        <TInput
          v-if="isAddTag"
          v-model="addTagValue"
          autofocus
          :placeholder="t('subPage.tag.tagPlaceholder')"
          :maxlength="30"
          @blur="saveTag"
        />
        <TButton
          v-else
          size="small"
          variant="outline"
          theme="primary"
          @click="addTag"
        >
          <template #icon><AddIcon /></template>
          {{ t('subPage.tag.addTagBtn') }}
        </TButton>
      </div>
    </div>
  </TDrawer>
</template>

<script setup lang="ts">
import { AddIcon } from "tdesign-icons-vue-next";
import {
  Button as TButton,
  Drawer as TDrawer,
  Input as TInput,
  Tag as TTag,
} from "tdesign-vue-next";
import { storeToRefs } from "pinia";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";
import { useSubsStore } from "@/store/subs";

type TagItem = {
  label: string;
  value: string;
  isActive: boolean;
};

const props = withDefaults(
  defineProps<{
    readonly visible?: boolean;
    readonly currentTag?: string;
    readonly type?: string;
  }>(),
  {
    visible: false,
    currentTag: "",
    type: "subCol",
  },
);
const emit = defineEmits<{
  readonly "update:visible": [value: boolean];
  readonly setTag: [value: string];
}>();

const { t } = useI18n();
const subsStore = useSubsStore();
const { hasSubs, hasCollections, subs, collections } = storeToRefs(subsStore);
const isVisible = ref(props.visible);
const keyword = ref("");
const isAddTag = ref(false);
const addTagValue = ref("");
const allTags = ref<TagItem[]>([]);

const getTags = (): void => {
  if (!hasSubs.value && !hasCollections.value) {
    allTags.value = [];
    return;
  }

  const labels = new Set<string>();
  for (const item of [...subs.value, ...collections.value]) {
    if (Array.isArray(item.tag)) {
      for (const label of item.tag) {
        labels.add(label);
      }
    }
  }
  const selected = new Set(
    props.currentTag
      .split(",")
      .map(value => value.trim())
      .filter(Boolean),
  );
  allTags.value = [...labels].map(label => ({
    label,
    value: label,
    isActive: selected.has(label),
  }));
};

watch(
  () => props.visible,
  value => {
    isVisible.value = value;
    if (value) {
      getTags();
    }
  },
);

const clearSearch = (): void => {
  keyword.value = "";
};

const addTag = (): void => {
  addTagValue.value = "";
  isAddTag.value = true;
};

const saveTag = (): void => {
  const value = addTagValue.value.trim();
  if (!value) {
    isAddTag.value = false;
    return;
  }

  const existing = allTags.value.find(item => item.value === value);
  if (existing) {
    existing.isActive = true;
  } else {
    allTags.value.push({ label: value, value, isActive: true });
  }
  isAddTag.value = false;
};

const handleTagItem = (item: TagItem): void => {
  item.isActive = !item.isActive;
};

const show = (): void => {
  isVisible.value = true;
  emit("update:visible", true);
};

const hide = (): void => {
  isVisible.value = false;
  emit("update:visible", false);
};

const close = (): void => {
  emit(
    "setTag",
    allTags.value
      .filter(item => item.isActive)
      .map(item => item.value)
      .join(","),
  );
  isAddTag.value = false;
  hide();
};

defineExpose({ show, close });
onMounted(getTags);
</script>

<style lang="scss" scoped>
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-control);
  margin-top: var(--app-space-block);
}

.tag-list :deep(.vuedraggable) {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-control);
}

.tag-item {
  cursor: pointer;
}

.add-tag-box {
  min-width: 160px;
}
</style>
