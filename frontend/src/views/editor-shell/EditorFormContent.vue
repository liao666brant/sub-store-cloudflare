<template>
  <section v-show="visible" class="form-block-wrapper">
    <div v-if="showIcon" class="sticky-title-icon-container">
      <TImage :class="{ 'sub-item-customer-icon': !iconIsColor }" :src="icon" fit="cover" show-loading />
    </div>
    <TForm ref="formRef" class="form" :data="form" label-align="top">
      <div class="editor-tab-content">
        <EditorMetadataFields
          v-if="editType !== 'subs'"
          :form="form"
          :is-edit-mode="isEditMode"
          :validate-name="validateName"
          @open-tag="emit('openTag')"
          @validate="emit('validate', $event)"
        />
      </div>
      <div class="editor-tab-content">
        <template v-if="editType === 'subs'">
          <SourceContentSection
            :form="form"
            :validate-url="validateUrl"
            @trim-url="emit('trimUrl')"
            @url-blur="emit('urlBlur')"
            @url-tips="emit('urlTips')"
          >
            <EditorLocalContent
              :has-content="hasLocalContent"
              :loading="localPreviewLoading"
              :summary="localPreviewSummary"
              :type-badges="localPreviewTypeBadges"
              @file-selected="emit('fileSelected', $event)"
              @fullscreen="emit('fullscreen')"
              @tips="emit('contentTips')"
              @validate="emit('validateLocal')"
            />
          </SourceContentSection>
          <SourceAdvancedFields
            :form="form"
            :pass-through-u-a-on="passThroughUAOn"
            :user-agent-placeholder="userAgentPlaceholder"
            @change-pass-through-u-a="emit('changePassThroughUa', $event)"
            @open-tag="emit('openTag')"
            @sub-userinfo-tips="emit('subUserinfoTips')"
            @ua-tips="emit('uaTips')"
          />
        </template>
        <CollectionSubscriptionSection
          v-else-if="editType === 'collections'"
          :all-checked="allChecked"
          :all-indeterminate="allIndeterminate"
          :avatar-size="avatarSize"
          :dragging="dragging"
          :folded="folded"
          :form="form"
          :is-selected="isSelected"
          :rows="rows"
          :selected-tag="selectedTag"
          :simple-mode="simpleMode"
          :subscriptions-label="subscriptionsLabel"
          :tags="tags"
          :template-label="templateLabel"
          @change-selection="(name, checked) => emit('changeSelection', name, Boolean(checked))"
          @end-drag="emit('endDrag')"
          @open-template="emit('openTemplate')"
          @select-tag="emit('selectTag', $event)"
          @start-drag="emit('startDrag')"
          @sub-userinfo-tips="emit('subUserinfoTips')"
          @template-tips="emit('templateTips')"
          @toggle-all="emit('toggleAll')"
          @toggle-fold="emit('toggleFold')"
          @update:rows="emit('update:rows', $event)"
        />
        <CollectionFailureModeField v-if="editType === 'collections'" :label="failureModeLabel" @open="emit('openFailureMode')" />
      </div>
    </TForm>
  </section>
</template>

<script lang="ts" setup>
import { Image as TImage, Form as TForm } from "tdesign-vue-next";
import { ref, watch } from "vue";
import CollectionFailureModeField from "@/views/editor-shell/CollectionFailureModeField.vue";
import CollectionSubscriptionSection from "@/views/editor-shell/CollectionSubscriptionSection.vue";
import EditorLocalContent, { type LocalPreviewSummary } from "@/views/editor-shell/EditorLocalContent.vue";
import EditorMetadataFields from "@/views/editor-shell/EditorMetadataFields.vue";
import SourceAdvancedFields from "@/views/editor-shell/SourceAdvancedFields.vue";
import SourceContentSection from "@/views/editor-shell/SourceContentSection.vue";
import type { SubscriptionRow } from "@/views/editor-shell/useCollectionSubscriptionSelection";
import type { EditorFormInstance } from "@/views/editor-shell/editorTypes";

type EditorForm = Record<string, unknown> & {
  displayName?: string;
  icon?: string;
  isIconColor?: boolean;
  name: string;
  passThroughUA?: boolean;
  remark?: string;
  source?: "local" | "remote";
  subUserinfo?: string;
  tag?: string;
  ua?: string;
  url?: string;
};
type TagOption = { readonly label: string; readonly value: string };

defineProps<{
  readonly allChecked: boolean;
  readonly allIndeterminate: boolean;
  readonly avatarSize: string;
  readonly dragging: boolean;
  readonly editType: string;
  readonly failureModeLabel: string;
  readonly folded: boolean;
  readonly form: EditorForm;
  readonly hasLocalContent: boolean;
  readonly icon: string;
  readonly iconIsColor: boolean;
  readonly isEditMode: boolean;
  readonly isSelected: (name: string) => boolean;
  readonly localPreviewLoading: boolean;
  readonly localPreviewSummary: LocalPreviewSummary | null;
  readonly localPreviewTypeBadges: readonly string[];
  readonly passThroughUAOn: boolean;
  readonly rows: readonly SubscriptionRow[];
  readonly selectedTag: string;
  readonly showIcon: boolean;
  readonly simpleMode: boolean;
  readonly subscriptionsLabel: string;
  readonly tags: readonly TagOption[];
  readonly templateLabel: string;
  readonly userAgentPlaceholder: string;
  readonly validateName: (value: string) => Promise<boolean>;
  readonly validateUrl: (value: string) => Promise<boolean>;
  readonly visible: boolean;
}>();

const emit = defineEmits<{
  changePassThroughUa: [value: boolean];
  changeSelection: [name: string, checked: boolean];
  contentTips: [];
  endDrag: [];
  fileSelected: [file: File];
  fullscreen: [];
  openFailureMode: [];
  openTag: [];
  openTemplate: [];
  selectTag: [tag: string];
  startDrag: [];
  subUserinfoTips: [];
  templateTips: [];
  toggleAll: [];
  toggleFold: [];
  trimUrl: [];
  uaTips: [];
  "update:formRef": [value: EditorFormInstance | null];
  "update:rows": [value: SubscriptionRow[]];
  urlBlur: [];
  urlTips: [];
  validate: [field: string];
  validateLocal: [];
}>();

const formRef = ref<EditorFormInstance | null>(null);
watch(formRef, value => emit("update:formRef", value), { immediate: true });
</script>

<style lang="scss" scoped>
@import "./editor-form-content";
</style>
