<template>
  <div v-if="controller.isDis">
    <div class="page-wrapper" @click="controller.handleEditGlobalClick">
      <EditorSectionTabs
        v-if="controller.editorTabsEnabled"
        :active-tab="controller.activeEditorTab"
        :tabs="controller.editorSectionTabs"
        :top-offset="controller.navBarHeight"
        @update:active-tab="controller.setActiveEditorTab"
      />
      <EditorFormContent
        :all-checked="controller.checkbox"
        :all-indeterminate="controller.checkboxIndeterminate"
        :avatar-size="controller.chooserAvatarSize"
        :dragging="controller.isDragging"
        :edit-type="controller.editType"
        :failure-mode-label="controller.subFailureModeLabel"
        :folded="controller.manualSubscriptionsIsFold"
        :form="controller.form"
        :has-local-content="Boolean(controller.localContentText.trim())"
        :icon="controller.subIcon"
        :icon-is-color="Boolean(controller.form.isIconColor)"
        :is-edit-mode="controller.isEditMode"
        :is-selected="controller.isSelected"
        :local-preview-loading="controller.localPreviewLoading"
        :local-preview-summary="controller.localPreviewSummary"
        :local-preview-type-badges="controller.localPreviewTypeBadges"
        :pass-through-u-a-on="controller.passThroughUAOn"
        :rows="controller.displayedRows"
        :selected-tag="controller.tag"
        :show-icon="controller.appearanceSetting.isShowIcon && (!controller.editorTabsEnabled || controller.activeEditorTab === 'content')"
        :simple-mode="controller.appearanceSetting.isSimpleMode"
        :subscriptions-label="controller.subscriptionsLabel"
        :tags="controller.tags"
        :template-label="controller.selectedTemplateLabel"
        :user-agent-placeholder="controller.userAgentPlaceholder"
        :validate-name="controller.nameValidator"
        :validate-url="controller.urlValidator"
        :visible="controller.isSubFormTabActive"
        @change-pass-through-ua="controller.handlePassThroughUAChange"
        @change-selection="controller.setSelected"
        @content-tips="controller.contentTips"
        @end-drag="controller.onEndDrag"
        @file-selected="controller.fileChange"
        @fullscreen="controller.isDis = false"
        @open-failure-mode="controller.openSubFailureModePicker"
        @open-tag="controller.showTagPopup"
        @open-template="controller.openTemplatePicker"
        @select-tag="controller.setTag"
        @start-drag="controller.onStartDrag"
        @sub-userinfo-tips="controller.subUserinfoTips"
        @template-tips="controller.templateTips"
        @toggle-all="controller.toggleAll"
        @toggle-fold="controller.toggleManualSubscriptionsFold"
        @trim-url="controller.trim('url')"
        @ua-tips="controller.uaTips"
        @update:form-ref="controller.ruleForm = $event"
        @update:rows="controller.displayedRows = $event"
        @url-blur="controller.handleRemoteUrlBlur"
        @url-tips="controller.urlTips"
        @validate="controller.customerBlurValidate"
        @validate-local="controller.validateLocalContent()"
      />
      <EditorActionsPane
        :visible="!controller.editorTabsEnabled || controller.activeEditorTab === 'actions'"
        :fixed-offset="controller.editorTabsEnabled"
        :checked="controller.actionsChecked"
        :list="controller.actionsList"
        @update-custom-name-mode-flag="controller.updateCustomNameModeFlag"
        @add-action="controller.addAction"
        @delete-action="controller.deleteAction"
        @toggle-action="controller.toggleAction"
        @update-action-block="controller.actionBlockRef = $event"
      />
    </div>
    <EditorFooterActions
      :safe-area-padding="controller.padding"
      @compare="controller.compare"
      @submit="controller.submit"
    />
  </div>
  <EditorFullscreenContent v-else @close="controller.isDis = true" />
  <EditorSelectorDialogs
    :show-failure-picker="controller.editType === 'collections'"
    :show-template-picker="true"
    :failure-columns="controller.subFailureModeColumns"
    :failure-value="controller.selectedSubFailureMode"
    :failure-visible="controller.showSubFailureModePicker"
    :template-columns="controller.templateColumns"
    :template-value="controller.selectedTemplateValue"
    :template-visible="controller.showTemplatePicker"
    @confirm-failure="controller.handleSubFailureModeConfirm"
    @confirm-template="controller.handleTemplateConfirm"
    @update:failure-value="controller.selectedSubFailureMode = $event"
    @update:failure-visible="controller.showSubFailureModePicker = $event"
    @update:template-value="controller.selectedTemplateValue = $event"
    @update:template-visible="controller.showTemplatePicker = $event"
  />
  <EditorOverlayHost
    :compare-data="controller.compareData"
    :compare-visible="controller.compareTableIsVisible"
    :config-name="controller.configName"
    :current-tag="controller.currentTag"
    :dialog-confirm-text="controller.dialogState.confirmText"
    :dialog-content="controller.dialogState.content"
    :dialog-title="controller.dialogState.title"
    :dialog-visible="controller.dialogState.visible"
    :tag-visible="controller.tagPopupVisible"
    @close-compare="controller.closeCompare"
    @close-dialog="controller.closeDialog"
    @refresh-compare="controller.refreshCompare"
    @set-tag="controller.setTagValue"
    @update:tag-visible="controller.tagPopupVisible = $event"
  />
</template>

<script lang="ts" setup>
import EditorActionsPane from "@/views/editor-shell/EditorActionsPane.vue";
import EditorFooterActions from "@/views/editor-shell/EditorFooterActions.vue";
import EditorFormContent from "@/views/editor-shell/EditorFormContent.vue";
import EditorFullscreenContent from "@/views/editor-shell/EditorFullscreenContent.vue";
import EditorOverlayHost from "@/views/editor-shell/EditorOverlayHost.vue";
import EditorSectionTabs from "@/views/editor-shell/EditorSectionTabs.vue";
import EditorSelectorDialogs from "@/views/editor-shell/EditorSelectorDialogs.vue";
import { useEditorRouteController } from "@/views/editor-shell/useEditorRouteController";

defineProps<{ readonly controller: ReturnType<typeof useEditorRouteController> }>();
</script>
