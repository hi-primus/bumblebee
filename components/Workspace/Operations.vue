<template>
  <aside
    class="workspace-aside flex flex-col bg-white border-line border-solid border-l overflow-hidden"
  >
    <div
      class="relative w-full h-8 bg-primary-highlight text-neutral-alpha flex justify-center items-center"
    >
      <h3 v-if="operation">
        {{ resolve(operation.title) || operation.name || 'Operation' }}
      </h3>
      <h3 v-else-if="columnsInfo && sidebar === 'selection'">Details</h3>
      <h3 v-else>Operations</h3>
      <IconButton
        class="absolute h-full w-10 min-w-10 px-3 right-0"
        :path="mdiClose"
        @click="closeSidebar"
      />
    </div>
    <OperationsOperation
      v-if="operation"
      :key="operation.name"
      class="flex-1 overflow-y-auto"
    />
    <div
      v-else-if="columnsInfo && sidebar === 'selection'"
      :key="columnsList"
      class="columns-info-container"
    >
      <ColumnDetails
        v-for="(column, i) in columnsInfo"
        :key="column.title"
        :expanded="i === 0"
        :column="column"
      />
    </div>
    <div
      v-else
      class="operations-container overflow-y-auto h-full flex flex-col justify-stretch text-sm text-neutral"
    >
      <div class="flex justify-end gap-2 p-2">
        <Transition name="fade">
          <AppButton
            v-if="selectedOperationCells.length"
            v-tooltip="'Create macro'"
            class="ml-auto mr-2 icon-button layout-invisible size-small color-neutral-light"
            :icon="mdiContentSave"
            @click="saveMacro"
          />
        </Transition>
        <AppMenu
          :items="Object.entries(engines).map(([engineKey, engine]) => ({
              text: 'Export to ' + engine.name,
              action: () => exportPythonCode(engineKey as keyof typeof engines)
            }))"
        >
          <AppButton
            v-tooltip="'Export python code'"
            class="icon-button layout-invisible size-small color-neutral-light"
            :icon="mdiExport"
          />
        </AppMenu>
      </div>
      <draggable
        v-model="operationCells"
        tag="ul"
        group="operations"
        ghost-class="opacity-50"
        item-key="id"
        class="operations-items px-4 pt-4 pb-2 flex flex-col gap-2"
        :class="{
          'with-multiple-datasets': datasets.length > 1
        }"
        @start="dragging = true"
        @end="dragging = false"
      >
        <template #item="{ element, index }">
          <li
            class="group relative flex gap-2 items-center cursor-pointer transition p-2 rounded-md"
            :class="[
              ...(selectedOperationCells.includes(index)
                ? [
                    !dragging ? 'hover:bg-primary-lighter/40' : '',
                    'bg-primary-lighter/30'
                  ]
                : [!dragging ? 'hover:bg-primary-lighter/10' : ''])
            ]"
            @click="selectOperationCell(index)"
          >
            <!-- <span
              class="handler absolute left-0 top-0 bottom-0 w-8 cursor-move"
            ></span> -->
            <span class="text-neutral-lighter text-xs mr-2">{{
              index + 1
            }}</span>
            <span
              class="flex-1 break-words-overflow"
              v-html="element.htmlContent"
            ></span>
            <IconButton
              :path="mdiPencil"
              class="min-w-4 h-4 ml-auto cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
              @click="editOperationCell(index)"
            />
            <IconButton
              :path="mdiClose"
              class="min-w-4 h-4 cursor-pointer"
              @click="removeOperation(index)"
            />
          </li>
        </template>
      </draggable>
      <ul
        class="inactive-operations operations-items px-4 pb-10 flex flex-col gap-2 opacity-60 select-none"
      >
        <li
          v-for="(element, index) in inactiveOperations.map(formatOperation)"
          :key="element.operation.name + index"
          class="flex items-center gap-2 transition p-2 rounded-md"
        >
          <span class="text-neutral-lighter text-xs mr-2">{{
            operationCells.length + 1 + index
          }}</span>
          <span v-html="element.htmlContent"></span>
          <!-- TODO: Support remove inactive operations -->
          <!-- <Icon
            :path="mdiClose"
            class="w-4 h-4 ml-auto cursor-pointer"
            @click="removeOperation(operations.length + 1 + index)"
          /> -->
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { mdiClose, mdiContentSave, mdiExport, mdiPencil } from '@mdi/js';
import { Ref } from 'vue';

import { AppProperties, AppSettings, CommandData } from '@/types/app';
import { Column, DataframeObject } from '@/types/dataframe';
import {
  ColumnDetailState,
  isOperation,
  OperationActions,
  OperationItem,
  OperationPayload,
  PayloadWithOptions,
  State
} from '@/types/operations';
import { CREATE_MACRO } from '@/api/queries';

const engines = {
  pandas: { name: 'Pandas', init: '"pandas"' },
  cudf: { name: 'cuDF', init: '"cudf"' },
  vaex: { name: 'Vaex', init: '"vaex"' },
  dask: { name: 'Dask', init: '"dask"' },
  dask_cudf: { name: 'Dask-cuDF', init: '"dask_cudf", process=True' },
  spark: { name: 'Spark', init: '"spark"' }
};

const { addToast } = useToasts();

const { confirm } = useConfirmPopup();

const state = inject<Ref<State | null>>('state', ref(null));

const sidebar = inject('show-sidebar') as Ref<
  'operations' | 'selection' | null
>;

const closeSidebar = () => {
  sidebar.value = null;
};

const dataframeObject = inject<Ref<DataframeObject | null>>(
  'dataframe-object',
  ref(null)
);

const appSettings = inject('app-settings') as Ref<AppSettings>;

const operation = computed(() => {
  return isOperation(state.value) ? state.value : null;
});

const columnsInfo = computed(() => {
  if (!state.value || !(state.value as ColumnDetailState)?.columns?.length) {
    return null;
  }

  const columns = (state.value as ColumnDetailState).columns;

  const columnProfiles = dataframeObject.value?.profile?.columns;
  if (!columnProfiles) {
    return null;
  }

  return columns
    .filter(column => columnProfiles[column])
    .map(
      columnName =>
        ({
          title: columnName,
          ...columnProfiles[columnName]
        } as Column)
    );
});

const columnsList = ref('');

const operationValues = inject('operation-values') as Ref<
  OperationPayload<PayloadWithOptions>
>;

const operations = inject<Ref<OperationItem[]>>('operations', ref([]));

const inactiveOperations = inject<Ref<OperationItem[]>>(
  'inactive-operations',
  ref([])
);

const dragging = ref(false);

type OperationCell = OperationItem & { id: string; htmlContent: string };

const formatOperation = (operation: OperationItem, index: number) => {
  // comes from already processed operation
  const payload = operation.payload as OperationPayload<PayloadWithOptions>;

  const content = operation.operation?.content
    ? formatOperationContent(
        resolveUsingPayload(operation.operation.content, payload)
      )
    : undefined;

  const title = operation.operation?.title
    ? resolveUsingPayload(operation.operation.title, payload)
    : undefined;

  return {
    ...operation,
    id: operation.payload.id || index,
    htmlContent:
      content ||
      formatOperationContent(
        `b{${title || operation.operation.name || 'Operation'}}`
      )
  };
};

const operationCells = computed<OperationCell[]>({
  get: () => {
    return operations.value.map(formatOperation);
  },
  set: value => {
    updateOperations(
      value.map(operation => ({
        operation: operation.operation,
        payload: operation.payload
      }))
    );
  }
});

const datasets = computed<string[]>(() => {
  const datasetsList = operationCells.value
    ?.map(cell => cell.payload?.options?.newSourceId)
    .filter(id => id) as string[];
  return datasetsList ? [...new Set(datasetsList)] : [];
});

const { selectOperation, submitOperation } = inject(
  'operation-actions'
) as OperationActions;

const resolve = <T>(
  value: ((payload: OperationPayload<PayloadWithOptions>) => T) | T
): T => {
  return resolveUsingPayload(value, operationValues.value);
};

const resolveUsingPayload = <T>(
  value: ((payload: OperationPayload<PayloadWithOptions>) => T) | T,
  payload: OperationPayload<PayloadWithOptions>
): T => {
  if (value instanceof Function) {
    return value(payload);
  }
  return value;
};

const updateOperations = async (
  newOperations: OperationItem[]
): Promise<void> => {
  const validOrder = newOperations.every((operation, index) => {
    if (operation.payload.options.saveToNewDataframe) {
      const sourceIndex = newOperations.findIndex(
        (op, i) =>
          i < index &&
          op.payload.options.sourceId === operation.payload.options.newSourceId
      );
      return sourceIndex === -1;
    }
    return true;
  });

  if (!validOrder) {
    console.warn('Cannot move operation before source creation');
    addToast({
      title: 'Cannot move operation before source creation',
      type: 'warning'
    });
    return;
  }

  if (
    operations.value.length !== newOperations.length ||
    operations.value.some(
      (operation, index) => !compareObjects(operation, newOperations[index])
    )
  ) {
    operations.value = newOperations;
    return await submitOperation(null, null, false);
  }
};

const selectDataframe = inject('select-dataframe') as (
  sourceId: string
) => void;

const editOperationCell = async (index: number): Promise<void> => {
  const { operation, payload } = operations.value[index];

  inactiveOperations.value = operations.value.slice(index);
  operations.value = operations.value.slice(0, index);

  operationValues.value = {} as OperationPayload<PayloadWithOptions>;
  await submitOperation(null, null, false);

  await nextTick();

  payload.options.sourceId && selectDataframe(payload.options.sourceId);

  const newPayload: PayloadWithOptions = {
    ...payload,
    options: {
      ...payload.options,
      preview: operation.defaultOptions.preview || payload.options.preview,
      editing: index
    }
  };

  selectOperation(operation, newPayload);
};

// macros

const selectedOperationCells = ref<number[]>([]);

const selectOperationCell = (index: number): void => {
  if (selectedOperationCells.value.includes(index)) {
    selectedOperationCells.value = selectedOperationCells.value.filter(
      i => i !== index
    );
  } else {
    selectedOperationCells.value.push(index);
  }
};

const AppInput = resolveComponent('AppInput');

const adaptOperationCellsToMacro = (operationCells: OperationCell[]) => {
  const macro: {
    operations: CommandData[];
    sources: {
      name: string;
      cols: string[];
    }[];
  } = {
    operations: [],
    sources: []
  };

  operationCells.forEach(operationCell => {
    const { operation, payload } = operationCell;

    const newPayload: PayloadWithOptions = {
      ...payload
    };

    newPayload.sourceName = payload.source?.name;

    // if source is not already on sources list, add it

    if (
      payload.source &&
      !macro.sources.find(s => s.name === payload.source.name)
    ) {
      macro.sources.push({
        name: payload.source.name,
        cols: payload.allColumns
      });
    }

    (
      [
        'allColumns',
        'allDataframes',
        'app',
        'otherDataframes',
        'requestOptions',
        'options',
        'isUsingSample',
        'target',
        'source',
        'operationStatus'
      ] as const
    ).forEach(key => {
      delete newPayload[key];
    });

    macro.operations.push({
      operationKey: operation.key,
      payload: newPayload as OperationPayload
    });
  });

  return macro;
};

const { mutate: createMacroMutation } = useMutation(CREATE_MACRO);

const saveMacro = async () => {
  const date = new Date();

  const name =
    'macro-' +
    [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    ].join('-');

  const result = await confirm({
    title: 'Save macro',
    acceptLabel: 'Save',
    fields: [
      {
        component: AppInput,
        name: 'name',
        placeholder: name,
        label: 'Macro name',
        value: name
      }
    ]
  });

  if (typeof result !== 'object' || !result) {
    return;
  }

  const macroOperationCells = selectedOperationCells.value.map(
    index => operationCells.value[index]
  );

  const mutationResult = await createMacroMutation({
    name: result.name || name,
    macro: adaptOperationCellsToMacro(macroOperationCells)
  });

  if (mutationResult?.data?.insert_macros_one) {
    addToast({
      title: 'Macro saved',
      type: 'success'
    });
  } else {
    console.error('Error saving macro', mutationResult);
    addToast({
      title: 'Error saving macro',
      type: 'error'
    });
  }
};

const removeOperation = async (index: number): Promise<void> => {
  const remove = await confirm('Remove operation');
  if (!remove) {
    return;
  }
  const selectedOperationOptions = operations.value[index].payload.options;
  if (selectedOperationOptions.saveToNewDataframe) {
    const operationsUsingSource = operations.value.filter(
      (operation, i) =>
        i !== index &&
        operation.payload.options.sourceId ===
          selectedOperationOptions.newSourceId
    );
    if (operationsUsingSource.length) {
      console.warn('Cannot remove source that is used by other operations');
      addToast({
        title: 'Cannot remove source that is used by other operations',
        type: 'warning'
      });
      return;
    }
  }
  operations.value.splice(index, 1);
  return await submitOperation(null, null, false);
};

const dataframeNames = inject('dataframe-names') as Ref<Record<string, string>>;

const formatOperationContent = (content: string): string => {
  // replaces in rendered content to match tab names

  const matches = content.match(/dn\{([a-zA-Z0-9]+?)\}/g);
  if (matches) {
    matches.forEach(match => {
      const varName = match.replace(/dn\{([a-zA-Z0-9]+?)\}/, '$1');

      const dataframeName = dataframeNames.value[varName];

      content = content.replace(`dn{${varName}}`, dataframeName || varName);
    });
  }

  content = content
    .replace(/bl\{((.|\n)+?)\}/g, '<span class="content-text-blue">$1</span>')
    .replace(/gr\{((.|\n)+?)\}/g, '<span class="content-text-green">$1</span>')
    .replace(/rd\{((.|\n)+?)\}/g, '<span class="content-text-red">$1</span>')
    .replace(/b\{((.|\n)+?)\}/g, '<span class="font-bold">$1</span>')
    .replace(/df\{((.|\n)+?)\}/g, '<span class="dataframe-hint">$1</span>');

  return content;
};

const getOperationsCode = inject(
  'get-operations-code'
) as () => Promise<string>;

const exportPythonCode = async (
  engine: keyof typeof engines
): Promise<void> => {
  const operationsCode = await getOperationsCode();
  const code =
    'from optimus import Optimus\n' +
    (operationsCode.includes('parse')
      ? 'from optimus.expressions import parse\n'
      : '') +
    `op = Optimus(${engines[engine].init})\n` +
    operationsCode;
  copyToClipboard(code);
  addToast({
    title: 'Python code copied to clipboard',
    type: 'success'
  });
};
</script>

<style lang="scss">
.content-text-blue {
  @apply text-blue-dark;
}
.content-text-green {
  @apply text-green-dark;
}
.content-text-red {
  @apply text-red-desaturated-dark;
}
.content-text-blue,
.content-text-green,
.content-text-red {
  @apply font-mono;
  &::before,
  &::after {
    content: "'";
  }
}
.operations-items:not(.with-multiple-datasets) .dataframe-hint {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
