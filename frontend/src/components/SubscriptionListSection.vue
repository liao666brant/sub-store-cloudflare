<template>
  <section v-show="items.length" class="subs-list-content">
    <TButton class="list-title" variant="text" @click="emit('toggle')">
      <template #icon>
        <ChevronDownIcon v-if="!isFolded" />
        <ChevronRightIcon v-else />
      </template>
      {{ title }}
    </TButton>
    <draggable
      v-if="!isFolded"
      v-model="model"
      item-key="name"
      class="list-draggable"
      :class="{ 'dual-column': isDualColumn }"
      :animation="200"
      :delay="200"
      chosen-class="chosen-subscription"
      :force-fallback="true"
      @change="emit('sort')"
      @start="emit('start')"
      @end="emit('end')"
    >
      <template #item="{ element }">
        <div class="draggable-item">
          <SubListItem
            v-if="isSub(element)"
            :sub="element"
            type="sub"
            :disabled="dragging"
            :is-dual-column="isDualColumn"
          />
          <SubListItem
            v-else
            :collection="element"
            type="collection"
            :disabled="dragging"
            :is-dual-column="isDualColumn"
          />
        </div>
      </template>
    </draggable>
  </section>
</template>

<script setup lang="ts">
import { ChevronDownIcon, ChevronRightIcon } from "tdesign-icons-vue-next";
import { Button as TButton } from "tdesign-vue-next";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";
import SubListItem from "@/components/SubListItem.vue";

type SubscriptionItem = Sub | Collection;

const props = defineProps<{
  readonly items: SubscriptionItem[];
  readonly kind: "sub" | "collection";
  readonly isDualColumn: boolean;
  readonly isFolded: boolean;
  readonly dragging: boolean;
}>();

const emit = defineEmits<{
  readonly "update:items": [items: SubscriptionItem[]];
  readonly toggle: [];
  readonly sort: [];
  readonly start: [];
  readonly end: [];
}>();

const { t } = useI18n();
const model = computed({
  get: () => props.items,
  set: (items: SubscriptionItem[]) => emit("update:items", items),
});
const title = computed(() => {
  const label = props.kind === "sub"
    ? t("specificWord.singleSub")
    : t("specificWord.collectionSub");
  return `${label} (${props.items.length})`;
});

const isSub = (item: SubscriptionItem): item is Sub => "source" in item;
</script>

<style scoped lang="scss">
.subs-list-content {
  padding: 12px 16px;
}

.list-draggable {
  display: grid;
  gap: 12px;
}

.list-draggable.dual-column {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.chosen-subscription {
  outline: 2px solid var(--td-brand-color);
}

@media (max-width: 767px) {
  .list-draggable.dual-column {
    grid-template-columns: 1fr;
  }
}
</style>
