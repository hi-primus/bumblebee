<template>
  <div
    class="concat-items-component w-full"
    :class="{ 'show-values': showValues }"
  >
    <!-- <SearchSelect
      v-if="searchSelectAttach"
      :attach="searchSelectAttach"
      :items="searchItems"
      @input="itemSelected"
      @menu-input="searchMenuInput"
    /> -->
    <div
      class="col-header-container flex justify-start items-start pb-2 text-center"
    >
      <div
        v-for="(dataframeInfo, dataframeIndex) in dataframesInfo"
        :key="dataframeInfo.name"
        class="col-header relative"
      >
        <span
          class="col-title font-bold text-neutral-light flex items-center justify-center"
          :class="{
            'text-primary-dark': dataframeIndex > 0
          }"
        >
          <h3>
            {{ dataframeInfo.name }}
          </h3>
          <IconButton
            v-if="dataframeIndex > 0"
            class="remove-button w-4 h-4 text-primary-dark"
            :path="mdiClose"
            @click="removeDataframe(dataframeIndex)"
          />
        </span>
        <div class="col-hint small-upper">
          {{ dataframeInfo.activeColumns }} of
          {{ dataframeInfo.totalColumns }} columns
        </div>
      </div>
      <div class="menu-button-container w-[70px] flex justify-center">
        <AppMenu
          v-if="dataframeOptions.length > 0"
          class="center-menu"
          :items="
            dataframeOptions.map(df => ({
              text: df.name || '',
              action: () => addDataframe(df)
            }))
          "
        >
          <AppButton
            class="icon-button rounded-button"
            type="button"
            :icon="mdiPlus"
          />
        </AppMenu>
      </div>
      <AppCheckbox
        class="small-upper self-start ml-auto min-w-[150px]"
        :label="showValues ? 'Hide values' : 'Show values'"
        :model-value="showValues"
        @update:model-value="showValues = $event"
      />
    </div>
    <div class="concat-items-set concat-items">
      <div class="items-cols">
        <div
          v-for="(itemsSlotsGroup, dfIndex) in itemsSlotsGroups"
          :key="'isg' + dfIndex"
          class="items-col"
        >
          <div
            v-for="(slotArray, slotIndex) in itemsSlotsGroup"
            :key="dfIndex + '' + slotIndex"
            class="items-item"
            :class="{ 'empty-slot': !slotArray || !slotArray[0] }"
          >
            <draggable
              tag="div"
              class="items-slot"
              :list="itemsSlotsGroups[dfIndex][slotIndex]"
              :data-df-index="dfIndex"
              :data-index="slotIndex"
              item-key="name"
              v-bind="{
                animation: 200,
                deleted: false,
                ghostClass: 'ghost',
                group: 'items' + dfIndex
              }"
              @start="startDrag"
              @end="endDrag"
            >
              <template #item="{ element }">
                <div
                  v-if="element"
                  :key="element.name"
                  class="concat-draggable concat-item flex items-center"
                >
                  <Icon
                    class="text-neutral-alpha/40 w-5 h-5"
                    :path="mdiDragHorizontalVariant"
                  />
                  <OperationFieldConcatItem
                    :item="{
                      name: element,
                      type: columnTypes[dataframesInfo[dfIndex].sourceId]?.[
                        element
                      ],
                      value:
                        columnValues[dataframesInfo[dfIndex].sourceId]?.[
                          element
                        ]
                    }"
                  />
                  <IconButton
                    class="close-button w-4 h-4"
                    :path="mdiClose"
                    @click="removeItem(dfIndex, slotIndex)"
                  />
                </div>
              </template>
            </draggable>
            <!-- <IconButton
              class="search-button text-primary w-4 h-4"
              :path="mdiMagnify"
              @click="triggerSearch(groupIndex, slotIndex, $event)"
            /> -->
          </div>
        </div>
      </div>
      <div class="output-col">
        <div
          v-for="(item, index) in outputItems.filter(
            (_item, index) => index < value.outputColumns.length
          )"
          :key="item.name"
          class="items-item concat-item"
        >
          <span class="data-item-title" :title="item.name">
            <ColumnTypeHint :data-type="item.type || 'unknown'" />
            <EditableElement
              class="data-column-name px-2 -mx-1"
              :model-value="item.name"
              element="div"
              :title="item.name"
              @update:model-value="textFieldsValues[textFields[index]] = $event"
            />
            <Icon :path="mdiCursorText" class="text-neutral-alpha/40 w-5 h-5" />
          </span>
          <span class="data-item-hint" :title="item.hint">
            {{ item.hint }}
          </span>
          <IconButton
            class="close-button w-4 h-4"
            :path="mdiClose"
            @click="removeRow(index)"
          />
        </div>
      </div>
    </div>
    <h3 class="concat-deleted-title small-upper pt-2 pl-1">Dropped columns</h3>
    <div class="concat-items-set deleted-items">
      <span
        v-if="showEmptyDeleted"
        class="deleted-items-empty pl-1 pt-1 font-sans text-xs text-neutral-alpha/40"
      >
        Drop unwanted columns here
      </span>
      <div v-for="(_notSelectedItems, dfIndex) in notSelected" :key="dfIndex">
        <draggable
          id="deleted-items-col"
          :key="'deleted-items-col-' + dfIndex"
          :list="notSelected[dfIndex]"
          tag="div"
          class="items-col deleted-items-col"
          item-key="name"
          data-index="deleted"
          v-bind="{
            animation: 200,
            deleted: false,
            ghostClass: 'ghost',
            group: 'items' + dfIndex
          }"
          @start="startDrag"
          @end="endDrag"
        >
          <template #item="{ element, index }">
            <div
              v-if="element && !element.empty"
              :key="element?.name + dfIndex + index"
              class="concat-draggable concat-item bg-danger-highlight"
            >
              <Icon
                class="text-neutral-alpha/40 w-5 h-5"
                :path="mdiDragHorizontalVariant"
              />
              <OperationFieldConcatItem
                :item="{
                  name: element,
                  type: columnTypes[dataframesInfo[dfIndex].sourceId]?.[
                    element
                  ],
                  value:
                    columnValues[dataframesInfo[dfIndex].sourceId]?.[element]
                }"
              />
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  mdiClose,
  mdiCursorText,
  mdiDragHorizontalVariant,
  mdiPlus
} from '@mdi/js';
import { ComputedRef, PropType, Ref } from 'vue';

import { DataframeObject } from '@/types/dataframe';
import { getUniqueName, transpose } from '@/utils';

type OutputColumn = {
  update: (value: string) => void;
  type: string;
  hint: string;
  name: string;
};

type Slot<T> = [T] | [];

type Value = {
  dfs: { name: string | undefined; sourceId: string }[];
  outputColumns: { value: string; columns: (string | undefined)[] }[];
};

const props = defineProps({
  modelValue: {
    type: Object as PropType<Value>
  }
});

type Emits = {
  (e: 'update:modelValue', value: Value): void;
};

const emit = defineEmits<Emits>();

const dataframes = inject('dataframes') as Ref<DataframeObject[]>;

const dataframeObject = inject(
  'dataframe-object'
) as ComputedRef<DataframeObject>;

const searchPromise = ref<{
  resolve: (value?: string) => void;
  reject: () => void;
} | null>(null);
const searchSelectAttach = ref<HTMLElement | null>(null);
const searchItems = ref<string[]>([]);
const itemsSlotsGroups = ref<Slot<string>[][]>([]);
const notSelected = ref<string[][]>([]);
const textFields = ref<string[]>([]);
const textFieldsValues = ref<Record<string, string>>({});
const showValues = ref(false);

const outputItems = computed<OutputColumn[]>(() => {
  const totalDatasets = itemsSlotsGroups.value.length;

  return textFields.value.map((textFieldKey, groupIndex) => {
    const obj = {} as Partial<OutputColumn>;

    const types = itemsSlotsGroups.value
      .map((e, dfIndex) => {
        const sourceId = dataframesInfo.value[dfIndex].sourceId;
        const colName = e[groupIndex]?.[0];
        return sourceId && colName
          ? columnTypes.value?.[sourceId]?.[colName]
          : undefined;
      })
      .filter((e): e is string => e !== undefined);

    obj.hint = `${types.length} of ${totalDatasets} columns`;

    if (types.every(type => type === types[0])) {
      obj.type = types[0];
    } else if (types.every(type => ['float', 'int'].includes(type))) {
      obj.type = 'float';
    } else {
      obj.type = 'str';
    }

    obj.name = textFieldsValues.value[textFieldKey] || textFieldKey;

    return obj as OutputColumn;
  });
});

const showEmptyDeleted = computed(() => {
  if (!notSelected.value) {
    return true;
  }
  return !(notSelected.value || [[]]).some(e => e.length);
});

const value = computed<Value>({
  get() {
    return (
      props.modelValue || {
        dfs: [],
        outputColumns: []
      }
    );
  },
  set(value: Value) {
    emit('update:modelValue', value);
  }
});

const selectedDataframes = computed<
  { name: string | undefined; sourceId: string }[]
>({
  get() {
    return value.value.dfs || [];
  },
  set(dfs: { name: string | undefined; sourceId: string }[]) {
    value.value.dfs = dfs;
  }
});

const columnTypes = ref<Record<string, Record<string, string>>>({});
const columnValues = ref<Record<string, Record<string, string>>>({});

const loadDataframeData = async (sourceId: string) => {
  const dataframe = dataframes.value?.find(df => df.sourceId === sourceId);
  if (!dataframe) {
    return;
  }
  const dataTypes = (
    await dataframe.df.cols.inferredDataType({
      cols: '*',
      useInternal: true,
      tidy: false,
      requestOptions: { priority: PRIORITIES.requirement }
    })
  )?.inferred_data_type;

  if (dataTypes) {
    columnTypes.value[sourceId] = dataTypes;
  }

  const valuesResult = await dataframe.df
    .iloc({
      lower_bound: 0,
      upper_bound: 1,
      target: dataframe.df.name + '_concat_preview',
      requestOptions: { priority: PRIORITIES.requirement }
    })
    .columnsSample();

  const values = valuesResult.columns.reduce((acc, col, index) => {
    acc[col.title] = valuesResult.value?.[0]?.[index];
    return acc;
  }, {} as Record<string, string>);

  values && (columnValues.value[sourceId] = values);
};

const dataframesData = computed(() => {
  const dfs = [...dataframes.value] || [];
  const obj = {} as Record<string, string[]>;
  for (const df of dfs) {
    if (!df.sourceId) {
      continue;
    }

    obj[df.sourceId] = Object.keys(df.profile?.columns || {});
    loadDataframeData(df.sourceId);
  }
  return obj;
});

const allDataframeOptions = computed(() => {
  return (
    dataframes.value?.map(e => ({
      name: e.name,
      sourceId: e.sourceId
    })) || []
  );
});

const dataframeOptions = computed(() => {
  return allDataframeOptions.value.filter(
    e =>
      !selectedDataframes.value.find(df => df.sourceId === e.sourceId) &&
      (dataframeObject.value?.name !== e.name ||
        dataframeObject.value?.sourceId !== e.sourceId)
  );
});

const options = computed(() => {
  const dfId = dataframes.value?.find(df => {
    const _d = df.df.name;
    return _d === dataframeObject.value?.df?.name;
  })?.sourceId;

  const otherDfIds = (selectedDataframes.value || []).map(df => df.sourceId);

  return [dfId, ...otherDfIds].map(sourceId => {
    if (!sourceId) {
      return [];
    }
    return dataframesData.value[sourceId] || [];
  });
});

const dataframesInfo = computed<
  {
    name: string;
    sourceId: string;
    activeColumns: number;
    totalColumns: number;
  }[]
>(() => {
  return options.value.map((cols, index) => {
    const activeColumns = value.value.outputColumns.filter(
      e => e.columns[index]
    ).length;
    return {
      name:
        index === 0
          ? dataframeObject.value?.name || 'Current dataframe'
          : selectedDataframes.value[index - 1]?.name || 'dataframe',
      sourceId:
        index === 0
          ? dataframeObject.value?.sourceId || '0'
          : selectedDataframes.value[index - 1]?.sourceId || `-${index}`,
      activeColumns,
      totalColumns: cols.length
    };
  });
});

// const searchMenuInput = (e: any) => {
//   if (!e) {
//     searchSelectAttach.value = null;
//     searchItems.value = [];
//     if (searchPromise.value?.reject) {
//       searchPromise.value.resolve();
//     }
//   }
// };

// const itemSelected = (item: Column) => {
//   if (searchPromise.value?.resolve) {
//     searchPromise.value.resolve(item);
//   }
// };

const triggerSearch = (
  groupIndex: number,
  slotIndex: number,
  event: KeyboardEvent
) => {
  setTimeout(async () => {
    try {
      const item = await new Promise(
        (resolve: (value?: string) => void, reject) => {
          searchPromise.value = { resolve, reject };
          const element = (event.target as HTMLElement)?.closest?.(
            '.items-item'
          ) as HTMLElement;
          searchSelectAttach.value = element;
          searchItems.value = options.value?.[groupIndex];
        }
      );
      if (typeof item === 'object') {
        moveItem(groupIndex, slotIndex, item);
      }
    } catch (err) {
      console.error(err);
    }
    searchPromise.value = null;
    searchSelectAttach.value = null;
    searchItems.value = [];
  }, 25);
};

const moveItem = (groupIndex: number, slotIndex: number, item: string) => {
  let previousSlotIndex = itemsSlotsGroups.value[groupIndex].findIndex(
    (e: [string] | [] | null) => e && e[0] && e[0] === item
  );
  let droppedSlot = false;

  if (previousSlotIndex === -1) {
    previousSlotIndex = notSelected.value[groupIndex].findIndex(
      (e: string | null) => e && e === item
    );

    if (previousSlotIndex >= 0) {
      droppedSlot = true;
    }
  }

  let newItemsSlotsGroups = Array.from(itemsSlotsGroups.value);

  if (droppedSlot) {
    notSelected.value[groupIndex].splice(previousSlotIndex, 1);
  } else {
    newItemsSlotsGroups[groupIndex][previousSlotIndex] = [];
  }

  newItemsSlotsGroups[groupIndex][slotIndex][0] = item;

  const deleteEmptyResults = deleteEmptyItemsSlots(newItemsSlotsGroups);
  if (deleteEmptyResults) {
    newItemsSlotsGroups = deleteEmptyResults;
  }

  itemsSlotsGroups.value = newItemsSlotsGroups;
};

const removeItem = (groupIndex: number, slotIndex: number) => {
  if (!itemsSlotsGroups.value[groupIndex][slotIndex].length) {
    return false;
  }
  itemsSlotsGroups.value[groupIndex][slotIndex].forEach(e => {
    notSelected.value[groupIndex].push(e);
  });
  let newItemsSlotsGroups = Array.from(itemsSlotsGroups.value);
  newItemsSlotsGroups[groupIndex][slotIndex] = [];
  const deleteEmptyResults = deleteEmptyItemsSlots(newItemsSlotsGroups);
  if (deleteEmptyResults) {
    newItemsSlotsGroups = deleteEmptyResults;
  }
  itemsSlotsGroups.value = newItemsSlotsGroups;
  return true;
};

const removeRow = (rowIndex: number) => {
  delete textFieldsValues.value[textFields.value[rowIndex]];

  delete textFields.value[rowIndex];

  let newItemsSlotsGroups = Array.from(itemsSlotsGroups.value);

  notSelected.value.forEach((_notSelectedGroup, colIndex) => {
    itemsSlotsGroups.value[colIndex][rowIndex].forEach(e => {
      notSelected.value[colIndex].push(e);
    });
    newItemsSlotsGroups[colIndex][rowIndex] = [];
    return true;
  });

  const deleteEmptyResults = deleteEmptyItemsSlots(newItemsSlotsGroups);
  if (deleteEmptyResults) {
    newItemsSlotsGroups = deleteEmptyResults;
  }
  itemsSlotsGroups.value = newItemsSlotsGroups;
};

const updateTextFields = () => {
  try {
    const defaultValues: string[] = [];
    const newTextFieldsValues: Record<string, string> = {};

    props.modelValue?.outputColumns?.forEach(row => {
      let name = 'error';

      if (row.columns?.length) {
        const columns = row.columns.filter(col => col);
        if (columns.every(col => col === columns[0])) {
          name = columns[0] || '';
        } else {
          name = columns.join('_');
        }
      }

      const fieldName = getUniqueName(name, defaultValues);
      name = getUniqueName(name, Object.values(newTextFieldsValues));

      fieldName && defaultValues.push(fieldName);
      newTextFieldsValues[fieldName] =
        row.value || textFieldsValues.value[fieldName] || name || '';
    });

    if (
      JSON.stringify(textFieldsValues.value) !==
      JSON.stringify(newTextFieldsValues)
    ) {
      textFieldsValues.value = newTextFieldsValues;
    }

    textFields.value = defaultValues;
  } catch (err) {
    console.error(err);
  }
};

const resetItemsSlotsGroups = (reset = false) => {
  try {
    const length = Math.max(...options.value.map(cols => cols.length)) + 1;
    let newItemsSlotsGroups: (string | undefined)[][];

    if (reset || !props.modelValue?.outputColumns?.length) {
      newItemsSlotsGroups = options.value;
    } else {
      newItemsSlotsGroups = transpose(
        props.modelValue.outputColumns.map(row => row.columns)
      );
    }

    itemsSlotsGroups.value = newItemsSlotsGroups.map(col => {
      const cols: (string | undefined)[] = col ? Array.from(col) : [];
      const colsLength = cols.length;
      cols.length = length;
      cols.fill(undefined, colsLength);
      return cols.map(e => (e ? [e] : []));
    });

    if (reset || !props.modelValue?.outputColumns?.length) {
      notSelected.value = options.value.map(_ => []);
    } else {
      updateTextFields();
      notSelected.value = options.value.map((cols, dfIndex) => {
        const newCols: string[] = [];
        cols.forEach(col => {
          if (
            col &&
            !itemsSlotsGroups.value[dfIndex]?.find(
              activeCol => col === activeCol?.[0]
            )
          ) {
            newCols.push(col);
          }
        });
        return newCols;
      });
    }
  } catch (err) {
    console.error(err);
  }
};

const updateSelection = () => {
  const columns = itemsSlotsGroups.value.map(itemsSlots => {
    const colItems = itemsSlots.map(itemArray => {
      return itemArray?.[0] || ('EMPTY_SLOT' as const);
    });
    colItems.splice(colItems.length - 1, 1);
    return colItems;
  });

  let rows: { value: string; columns: (string | undefined)[] }[] = transpose(
    columns
  ).map((row, i) => {
    const columns = row.map(it => (it !== 'EMPTY_SLOT' ? it : undefined));
    const firstItemName = columns.find(it => it);

    return {
      columns,
      value:
        textFieldsValues.value[textFields.value[i]] ||
        textFields.value[i] ||
        firstItemName ||
        ''
    };
  });

  rows = rows.map((row, rowIndex) => {
    const previousRow = rows.slice(0, rowIndex);
    const previousRowValues = previousRow.map(r => r.value);
    row.value = getUniqueName(row.value, previousRowValues);
    return row;
  });

  if (
    JSON.stringify(rows) === JSON.stringify(props.modelValue?.outputColumns)
  ) {
    return;
  }

  value.value.outputColumns = rows;
};

const deleteEmptyItemsSlots = (itemsSlotsGroups: Slot<string>[][]) => {
  let found = false;

  const itemsSlotsPairs = transpose(itemsSlotsGroups);

  for (let i = itemsSlotsPairs.length - 2; i >= 0; i--) {
    if (itemsSlotsPairs[i].every(e => !e.length)) {
      found = true;
      itemsSlotsPairs.splice(i, 1);
    }
  }

  if (found) {
    itemsSlotsGroups = transpose(itemsSlotsPairs);
    return itemsSlotsGroups;
  }

  return undefined;
};

const addDataframe = (df: { name: string | undefined; sourceId: string }) => {
  selectedDataframes.value.push({ ...df });
  resetItemsSlotsGroups(false);
};

const removeDataframe = (selectedIndex: number) => {
  if (selectedIndex > 0) {
    selectedDataframes.value.splice(selectedIndex - 1, 1);
    resetItemsSlotsGroups(false);
  }
};

type DraggableEvent = Event & {
  from: HTMLElement;
  to: HTMLElement;
  relatedContext: {
    index: number;
    element: HTMLElement;
    list: HTMLElement[];
    component: unknown;
  };
  draggedContext: {
    index: number;
    element: HTMLElement;
    futureIndex: number;
  };
};

type DraggableEndEvent = {
  from: HTMLElement;
  to: HTMLElement;
  newIndex: number;
  oldIndex: number;
};

let movingDfIndex: string | null = null;
let fromSlot: string | null = null;

const startDrag = (event: DraggableEvent) => {
  movingDfIndex = event.from.getAttribute('data-df-index');
  fromSlot = event.from.getAttribute('data-index');
  window.dragging = 'concat';
  if (!event) {
    return false;
  }
};

const endDrag = (event: DraggableEndEvent) => {
  if (event.to.id === 'deleted-items-col') {
    return;
  }

  const dfIndex = +movingDfIndex;

  if (event.to.children.length > 1) {
    const toSlot = event.to.getAttribute('data-index');

    const items = itemsSlotsGroups.value[dfIndex][+toSlot];

    const otherItems = items.filter((_, index) => {
      return index !== event.newIndex;
    });

    itemsSlotsGroups.value[dfIndex][+toSlot] = items.filter((_, index) => {
      return index === event.newIndex;
    });

    if (fromSlot === 'deleted') {
      notSelected.value[dfIndex].push(otherItems[0]);
    } else {
      itemsSlotsGroups.value[dfIndex][+fromSlot] = [otherItems[0]];
    }
  }
};

let optionsLength = -1;

watch(
  options,
  () => {
    if (options.value?.length !== optionsLength) {
      const reset = optionsLength > 0;
      optionsLength = options.value?.length || 0;
      resetItemsSlotsGroups(reset);
    }
  },
  {
    deep: true
  }
);

watch(
  itemsSlotsGroups,
  newValue => {
    if (!newValue) {
      return;
    }

    let newItemsSlotsGroups = Array.from(newValue);

    const addEmpty = newItemsSlotsGroups.some(
      itemsSlotsGroup => itemsSlotsGroup[itemsSlotsGroup.length - 1].length
    );

    const deleteEmptyResults = deleteEmptyItemsSlots(newItemsSlotsGroups);

    if (deleteEmptyResults) {
      newItemsSlotsGroups = deleteEmptyResults;
    }

    if (addEmpty) {
      newItemsSlotsGroups = newItemsSlotsGroups.map(group => [...group, []]);
    }

    if (deleteEmptyResults || addEmpty) {
      itemsSlotsGroups.value = newItemsSlotsGroups;
    } else {
      updateSelection();
    }
  },
  {
    deep: true
  }
);

watch(textFieldsValues, updateSelection, {
  deep: true
});

watch(value, () => {
  updateTextFields();
});

onMounted(() => {
  const df = dataframes.value?.find(
    df => df.name !== dataframeObject.value?.name
  );
  selectedDataframes.value = df
    ? [{ name: df.name, sourceId: df.sourceId }]
    : [];
  resetItemsSlotsGroups(false);
});
</script>

<style lang="scss">
$concat-item-height: 28px;
$highlight-red: theme('colors.danger.highlight');
$concat-col-width: calc(124px + 5vw);
$concat-output-col-width: calc(154px + 6vw);
$concat-output-col-padding: 74px;

.col-header-container {
  .col-header {
    min-width: $concat-col-width;
  }
}

.concat-item {
  @apply px-2 flex flex-wrap items-center justify-start gap-x-2;
  .close-button {
    pointer-events: none;
    opacity: 0;
    display: block;
  }
  &:hover,
  &.ghost {
    .close-button {
      pointer-events: auto;
      opacity: 1;
    }
  }
}

.concat-items-component {
  --concat-item-height: 28px;
  @apply bg-primary-highlight;
  &.show-values {
    --concat-item-height: 50px;
    .data-item-value {
      display: block !important;
    }
    .data-item-hint {
      left: unset !important;
      top: -2px !important;
    }
  }
}

.concat-items-component {
  padding-bottom: 0 !important;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 270px);
  height: calc(100vh - 300px);
  justify-content: flex-start;

  .concat-deleted-title {
    z-index: 2;
    background: theme('colors.primary.highlight');
    align-self: flex-start;
    position: relative;
    left: 0;
    padding-right: 10px;
    padding-bottom: 4px;
    line-height: 1em;
    border-bottom-right-radius: 12px;
    pointer-events: none;
    top: 2px;
    min-height: 28px;
  }
  .concat-items {
    overflow-y: auto;
    min-height: 112px;
    margin-bottom: -1px;
    flex-shrink: 3;
    flex-grow: 3;
  }
  .deleted-items {
    flex-shrink: 3;
    flex-grow: 2;
    min-height: 112px;
    background: theme('colors.primary.highlight');
    border-top: solid 1px rgba(0, 0, 0, 0.09);
    margin-top: -27px;
    padding-top: 32px;
    overflow-y: auto;
    position: relative;
  }
  &::after {
    content: ' ';
    background: theme('colors.primary.highlight');
    z-index: 2;
    width: 100%;
    min-height: 0px;
    height: 100%;
    flex-shrink: 1000000000;
  }
}

.concat-items-set {
  display: flex;
  min-width: 98px;
  min-height: $concat-item-height;
  @apply font-mono-table;

  &.concat-items {
    .concat-item {
      background: white;
    }
    .items-cols {
      min-height: inherit;
      display: flex;
      flex-shrink: 1;
      align-items: flex-start;
    }
  }
  .deleted-items-empty {
    position: absolute;
    pointer-events: none;
    top: 28px;
  }

  .items-col {
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: $concat-item-height;
    min-width: $concat-col-width;
    .concat-item {
      cursor: move;
      .data-item-title {
        // @include name-center;
        max-width: calc(#{$concat-col-width} - 36px);
      }
    }
  }
  .output-col {
    padding-left: $concat-output-col-padding;
    min-width: calc(
      #{$concat-output-col-width} + #{$concat-output-col-padding}
    );
    .concat-item {
      @apply pl-4;
      cursor: pointer !important;
      .data-item-title {
        position: relative;
        // &::after {
        //   @include mdi-icon;
        //   content: '\F05E7' !important;
        //   top: -1px;
        //   position: absolute;
        //   right: -16px;
        //   pointer-events: none !important;
        // }
      }

      &:last-child {
        position: relative;
        &::after {
          pointer-events: none;
          content: '';
          position: absolute;
          width: calc(100% + 2px);
          height: calc(100% + 2px);
          top: calc(100% + 7px);
          left: -1px;
          border-radius: 6px;
          background: rgba(white, 0.5);
        }
      }
    }
  }
  .items-item {
    height: var(--concat-item-height);
    margin-bottom: 6px;
  }
  .items-fields {
    input {
      position: relative;
      top: 1px;
    }
  }

  .concat-item {
    transition: background-color ease-in-out 0.1s;
    position: relative;
    font-size: 14px;
    min-width: calc(100% - 6px);
    max-width: calc(100% - 6px);
    min-height: var(--concat-item-height);
    height: var(--concat-item-height);
    line-height: 20px;
    margin-bottom: 6px;
    margin-right: 6px;
    border-radius: 6px;
    border-width: 1px;
    border-style: solid;
    border-color: transparent;

    .data-item-title {
      @apply w-full text-base flex gap-x-2 items-center;

      .data-type {
        user-select: none;
        position: absolute;
        display: block;
        min-width: 32px;
      }
      .data-column-name {
        flex-shrink: 0;
        display: inline-block;
        &:not(.editable-element) {
          max-width: calc(#{$concat-col-width} - 90px);
          width: calc(#{$concat-col-width} - 90px);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .data-item-value,
    .data-item-hint {
      @apply relative max-h-[18px];
      top: -2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: calc(#{$concat-col-width} - 50px);
    }

    .data-item-hint {
      @apply block mt-[-6px];
      pointer-events: none !important;
      user-select: none;
      left: calc(100% + 44px);
      top: -17px;
      /* upper small */
      @apply small-upper;
    }

    .data-item-value {
      // padding-left: 32px;
      // opacity: 0.71;
      display: none;
      &::before {
        max-width: 32px;
        // content: 'VALUE: ';
        font-size: 0.75em;
        font-weight: 700;
        text-transform: uppercase;
        @apply font-mono;
        opacity: 0.71;
      }
    }
    .close-button {
      position: absolute;
      right: 8px;
      top: calc(50% - 8px);
      padding-top: 0.75px !important;
      color: rgba(0, 0, 0, 0.54);
    }
    &.ghost {
      background: white;
      // border-color: $data-grey;
    }
  }
  .items-item {
    position: relative;
    .items-slot {
      height: 100%;
      width: 100%;
      & > .concat-item {
        position: absolute;
      }
    }
    .search-button {
      position: absolute;
      display: none;
      opacity: 0;
      left: 0;
      top: 0;
      width: calc(100% - 6px);
      height: 100%;
      max-height: var(--concat-item-height);
      cursor: pointer;
      z-index: 5;
      &::after {
        content: none;
      }
    }
    &.empty-slot {
      .search-button {
        display: inline-flex;
      }
      &:hover {
        .search-button {
          opacity: 1;
        }
      }
      // &:hover::after {
      //   color: rgba(0, 0, 0, 0);
      // }
      &::after {
        content: 'No column';
        font-weight: 400;
        position: absolute;
        opacity: 1;
        border: rgba(0, 0, 0, 0.2) dashed 1px;
        color: rgba(0, 0, 0, 0.4);
        background: rgba(white, 0.5);
        transition: color ease-in-out 0.3s;
        @apply font-mono;
        font-size: 16px;
        line-height: calc(var(--concat-item-height) - 2px);
        text-align: center;
        padding-right: 1px;
        width: calc(100% - 6px);
        height: 100%;
        max-height: var(--concat-item-height);
        left: 0px;
        top: 0px;
        border-radius: 6px;
      }
    }
  }
}

.small-upper {
  @apply text-[13px] text-neutral-alpha/60 uppercase font-bold font-sans;
}
</style>
