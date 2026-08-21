import { reactive, shallowRef } from "vue";
import ActionRadio from "@/views/editor/components/ActionRadio.vue";
import FilterSelect from "@/views/editor/components/FilterSelect.vue";
import HandleDuplicate from "@/views/editor/components/HandleDuplicate.vue";
import Regex from "@/views/editor/components/Regex.vue";
import ScriptAction from "@/views/editor/components/ScriptAction.vue";
import Sort from "@/views/editor/components/Sort.vue";
import { addItem, deleteItem, toggleItem } from "@/utils/actionsOperate";

type EditorForm = Record<string, unknown> & { process: Process[] };
type Options = { readonly form: EditorForm; readonly translate: (key: string) => string };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const componentFor = (type: string) => {
  switch (type) {
    case "Flag Operator":
    case "Resolve Domain Operator": return ActionRadio;
    case "Sort Operator": return Sort;
    case "Region Filter":
    case "Type Filter": return FilterSelect;
    case "Regex Filter":
    case "Regex Sort Operator":
    case "Regex Delete Operator":
    case "Regex Rename Operator": return Regex;
    case "Handle Duplicate Operator": return HandleDuplicate;
    case "Script Filter":
    case "Script Operator": return ScriptAction;
    default: return null;
  }
};

export const useEditorActionsHost = (options: Options) => {
  const checked = reactive<Array<[string, boolean]>>([]);
  const list = reactive<ActionModuleProps[]>([]);
  const ignoreList = ["Quick Setting Operator"];
  const loadActions = (process: readonly unknown[]): void => {
    process.forEach(item => {
      if (!isRecord(item) || typeof item.type !== "string") return;
      const type = item.type;
      const id = typeof item.id === "string" ? item.id : "";
      const customName = typeof item.customName === "string" ? item.customName : "";
      const disabled = item.disabled === true;
      if (ignoreList.includes(type)) return;
      checked.push([id, true]);
      list.push({
        type,
        id,
        customName,
        tipsDes: options.translate(`editorPage.subConfig.nodeActions['${type}'].tipsDes`),
        component: shallowRef(componentFor(type)),
        enabled: !disabled,
      });
    });
  };
  const addAction = (value: unknown[]): void => addItem(options.form, list, checked, value, options.translate);
  const deleteAction = (id: string): void => deleteItem(options.form, list, checked, id);
  const toggleAction = (id: string): void => toggleItem(list, id);
  return { actionsChecked: checked, actionsList: list, addAction, deleteAction, ignoreList, loadActions, toggleAction };
};
