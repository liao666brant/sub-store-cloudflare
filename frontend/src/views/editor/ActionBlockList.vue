<template>
  <Draggable
    :list="list"
    class="list-group"
    item-key="id"
    handle=".drag-handler"
    :force-fallback="true"
    :animation="200"
  >
    <template #item="{ element }">
      <TCard class="list-group-item" :bordered="false">
        <div
          class="list-group-item-title"
          :class="{ collapsed: isElementCollapsed(element.id) }"
        >
          <div class="title-text">
            <TButton
              :aria-label="
                isElementCollapsed(element.id)
                  ? 'Expand action'
                  : 'Collapse action'
              "
              shape="circle"
              size="small"
              variant="text"
              @click="toggleElementCollapsed(element.id)"
              ><ChevronRightIcon
                v-if="isElementCollapsed(element.id)" /><ChevronDownIcon v-else
            /></TButton>
            <TInput
              v-model="editItem(element).customName"
              :placeholder="editItem(element).defaultName"
              :readonly="!editItem(element).isEditing"
              @blur="saveEditName(element)"
              @keyup.enter="saveEditName(element)"
            />
          </div>
          <div class="action-controls">
            <TButton
              v-if="!editItem(element).isEditing"
              aria-label="Edit action name"
              shape="circle"
              size="small"
              variant="text"
              @click="startEditName(element)"
              ><EditIcon
            /></TButton>
            <template v-else
              ><TButton
                aria-label="Save action name"
                shape="circle"
                size="small"
                variant="text"
                @click="saveEditName(element)"
                ><CheckIcon /></TButton
              ><TButton
                aria-label="Cancel action name"
                shape="circle"
                size="small"
                variant="text"
                @click="cancelEditName(element)"
                ><CloseIcon /></TButton
            ></template>
            <TSwitch
              :value="element.enabled"
              :aria-checked="element.enabled"
              :aria-label="t('editorPage.subConfig.actions.enable')"
              :label="[t('editorPage.subConfig.actions.enable'), '']"
              role="switch"
              tabindex="0"
              @change="emit('toggle-action', element.id)"
              @keydown.enter.prevent="emit('toggle-action', element.id)"
              @keydown.space.prevent="emit('toggle-action', element.id)"
            />
            <TSwitch
              :value="previewModel(element.id).value"
              :label="[t('editorPage.subConfig.basic.previewSwitch'), '']"
              @change="previewModel(element.id).value = Boolean($event)"
            />
            <TButton
              aria-label="Action help"
              shape="circle"
              size="small"
              variant="text"
              @click="openTips(element)"
              ><HelpCircleIcon
            /></TButton>
            <TButton
              aria-label="Duplicate action"
              shape="circle"
              size="small"
              variant="text"
              @click="copyItem(element)"
              ><CopyIcon
            /></TButton>
            <TButton
              aria-label="Delete action"
              shape="circle"
              size="small"
              theme="danger"
              variant="text"
              @click="emit('delete-request', element.id)"
              ><DeleteIcon
            /></TButton>
            <TButton
              aria-label="Drag action"
              class="drag-handler"
              shape="circle"
              size="small"
              variant="text"
              ><MoveIcon
            /></TButton>
          </div>
        </div>
        <Component
          :is="element.component"
          v-show="!isElementCollapsed(element.id)"
          :id="element.id"
          :source-type="sourceType"
          :type="element.type"
        />
      </TCard>
    </template>
  </Draggable>
</template>
<script setup lang="ts">
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  CopyIcon,
  DeleteIcon,
  EditIcon,
  HelpCircleIcon,
  MoveIcon,
} from "tdesign-icons-vue-next";
import Draggable from "vuedraggable";
type EditableAction = {
  readonly defaultName: string;
  customName: string;
  isEditing: boolean;
};
const props = defineProps<{
  list: ActionModuleProps[];
  sourceType?: string;
  t: (key: string) => string;
  editItem: (action: ActionModuleProps) => EditableAction;
  isElementCollapsed: (id: string) => boolean;
  toggleElementCollapsed: (id: string) => void;
  startEditName: (action: ActionModuleProps) => void;
  saveEditName: (action: ActionModuleProps) => void;
  cancelEditName: (action: ActionModuleProps) => void;
  previewModel: (id: string) => { value: boolean };
  openTips: (action: ActionModuleProps) => void;
  copyItem: (action: ActionModuleProps) => Promise<void>;
}>();
const emit = defineEmits<{
  "toggle-action": [string];
  "delete-request": [string];
}>();
const {
  list,
  sourceType,
  t,
  editItem,
  isElementCollapsed,
  toggleElementCollapsed,
  startEditName,
  saveEditName,
  cancelEditName,
  previewModel,
  openTips,
  copyItem,
} = props;
</script>
<style src="./ActionBlockList.scss" lang="scss" scoped />
