import { computed, ref, toRaw, watch, type ComputedRef } from "vue";

export type SubscriptionRow = [string, string, string | undefined, string[] | undefined, boolean];

type CollectionEditorForm = {
  subscriptions?: string[];
};

type Options = {
  readonly form: CollectionEditorForm;
  readonly rows: ComputedRef<SubscriptionRow[]>;
  readonly shouldShow: (tags: string[] | undefined) => boolean;
  readonly visibleKey: ComputedRef<string>;
};

const sameNames = (left: readonly string[], right: readonly string[]): boolean => {
  return left.length === right.length && left.every((name, index) => name === right[index]);
};

export const useCollectionSubscriptionSelection = ({ form, rows, shouldShow, visibleKey }: Options) => {
  const ensureSubscriptions = (): string[] => {
    if (!Array.isArray(form.subscriptions)) form.subscriptions = [];
    return form.subscriptions;
  };
  const skipDisplayedSync = ref(false);
  const replaceSubscriptions = (next: string[], preserveDisplayedOrder = false): void => {
    const current = ensureSubscriptions();
    if (sameNames(current, next)) return;
    if (preserveDisplayedOrder) skipDisplayedSync.value = true;
    current.splice(0, current.length, ...next);
  };
  const selected = computed(() => Array.isArray(form.subscriptions) ? form.subscriptions : []);
  const orderedRows = computed<SubscriptionRow[]>(() => {
    const selectedRows = selected.value
      .map(name => rows.value.find(item => item[0] === name))
      .filter((item): item is SubscriptionRow => Boolean(item));
    const selectedNames = new Set(selectedRows.map(([name]) => name));
    return [...selectedRows, ...rows.value.filter(([name]) => !selectedNames.has(name))];
  });
  const displayedRows = ref<SubscriptionRow[]>([]);
  const isDragging = ref(false);
  const syncDisplayedRows = (): void => {
    displayedRows.value = orderedRows.value.filter(item => shouldShow(item[3]));
  };
  const currentVisibleRows = (): SubscriptionRow[] => {
    return displayedRows.value.length > 0
      ? displayedRows.value
      : orderedRows.value.filter(item => shouldShow(item[3]));
  };
  const isSelected = (name: string): boolean => selected.value.includes(name);
  const setSelected = (name: string, checked: boolean): void => {
    const next = checked
      ? [...ensureSubscriptions(), name]
      : ensureSubscriptions().filter(subscription => subscription !== name);
    replaceSubscriptions([...new Set(next)], true);
  };
  const visibleSelections = computed<string[]>({
    get: () => selected.value.filter(name => {
      const row = rows.value.find(item => item[0] === name);
      return row ? shouldShow(row[3]) : false;
    }),
    set: visibleNames => {
      const visibleRows = currentVisibleRows().map(([name]) => name);
      const visibleSet = new Set(visibleRows);
      const selectedSet = new Set(visibleNames);
      const remaining = ensureSubscriptions().filter(name => !visibleSet.has(name) || selectedSet.has(name));
      const ordered = visibleRows.filter(name => selectedSet.has(name));
      const merged = [...remaining, ...ordered.filter(name => !remaining.includes(name))];
      replaceSubscriptions(merged, true);
    },
  });
  const checkbox = ref(true);
  const checkboxIndeterminate = ref(true);
  const updateCheckbox = (): void => {
    const group = rows.value.filter(item => shouldShow(item[3])).map(item => item[0]);
    const selectedNames = toRaw(selected.value) ?? [];
    checkbox.value = group.some(name => selectedNames.includes(name));
    checkboxIndeterminate.value = checkbox.value && !group.every(name => selectedNames.includes(name));
  };
  const toggleAll = (): void => {
    visibleSelections.value = checkbox.value && !checkboxIndeterminate.value
      ? []
      : currentVisibleRows().map(([name]) => name);
    checkboxIndeterminate.value = false;
  };
  const onStartDrag = (): void => { isDragging.value = true; };
  const onEndDrag = (): void => {
    const reordered = new Map(displayedRows.value.map(row => [row[0], row]));
    const mergedRows = orderedRows.value.map(row => shouldShow(row[3]) ? reordered.get(row[0]) ?? row : row);
    const selectedNames = new Set(ensureSubscriptions());
    replaceSubscriptions(mergedRows.filter(([name]) => selectedNames.has(name)).map(([name]) => name), true);
    isDragging.value = false;
    syncDisplayedRows();
  };

  watch([rows, visibleKey], () => { if (!isDragging.value) syncDisplayedRows(); }, { immediate: true });
  watch(selected, () => {
    if (isDragging.value) return;
    if (skipDisplayedSync.value) { skipDisplayedSync.value = false; return; }
    syncDisplayedRows();
  }, { deep: true });
  watch([selected, rows, visibleKey], updateCheckbox, { immediate: true, deep: true });

  return { checkbox, checkboxIndeterminate, displayedRows, isDragging, isSelected, onEndDrag, onStartDrag, setSelected, toggleAll };
};
