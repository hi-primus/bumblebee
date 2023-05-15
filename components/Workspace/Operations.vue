<template>
  <aside
    class="workspace-aside flex flex-col bg-white border-line border-solid border-l overflow-hidden"
  >
    <div
      class="w-full h-8 bg-primary-highlight text-neutral-alpha flex justify-center items-center"
    >
      <h3 v-if="operation">
        {{ resolve(operation.title) || operation.name || 'Operation' }}
      </h3>
      <h3 v-else-if="columnsInfo && sidebar === 'selection'">Details</h3>
      <h3 v-else>Operations</h3>
      <IconButton
        class="absolute h-full w-10 px-3 right-0"
        :path="mdiClose"
        @click="closeSidebar"
      />
    </div>
    <OperationsOperation v-if="operation" :key="operation.name" />
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
        <AppMenu
          :items="Object.entries(engines).map(([engineKey, engine]) => ({
              text: 'Export to ' + engine.name,
              action: () => exportPythonCode(engineKey as keyof typeof engines)
            }))"
        >
          <AppButton
            v-tooltip="'Export python code'"
            class="ml-auto icon-button layout-invisible size-small color-neutral-light"
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
            class="group flex items-center gap-2 cursor-move transition p-2 rounded-md"
            :class="{
              'hover:bg-primary-highlight': !dragging
            }"
          >
            <span class="text-neutral-lighter text-xs mr-2">{{
              index + 1
            }}</span>
            <span class="flex-1" v-html="element.htmlContent"></span>
            <IconButton
              :path="mdiPencil"
              class="w-4 h-4 ml-auto cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
              @click="editOperation(index)"
            />
            <IconButton
              :path="mdiClose"
              class="w-4 h-4 cursor-pointer"
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
import { mdiClose, mdiExport, mdiPencil } from '@mdi/js';
import { Ref } from 'vue';

import { AppSettings } from '@/types/app';
import { Client } from '@/types/blurr';
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
    return await submitOperation();
  }
};

const selectDataframe = inject('select-dataframe') as (
  sourceId: string
) => void;

const editOperation = async (index: number): Promise<void> => {
  const { operation, payload } = operations.value[index];

  inactiveOperations.value = operations.value.slice(index);
  operations.value = operations.value.slice(0, index);

  operationValues.value = {} as OperationPayload<PayloadWithOptions>;
  await submitOperation();

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
  return await submitOperation();
};

const blurr = inject('blurr') as Ref<Client>;

const dataframes = inject('dataframes') as Ref<DataframeObject[]>;

const formatOperationContent = (content: string): string => {
  // replaces in rendered content to match tab names

  const matches = content.match(/dn\{([a-zA-Z0-9]+?)\}/g);
  if (matches) {
    matches.forEach(match => {
      const varName = match.replace(/dn\{([a-zA-Z0-9]+?)\}/, '$1');

      const dataframeObject = dataframes.value.find(
        dataframe => dataframe.df?.name === varName
      );

      if (dataframeObject) {
        content = content.replace(
          `dn{${varName}}`,
          dataframeObject.name || varName
        );
      } else {
        content = content.replace(`dn{${varName}}`, varName);
      }
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

const getAppProperties = () => {
  return {
    settings: appSettings.value,
    blurr: blurr.value,
    addToast
  };
};

const getOperationsCode = async (): Promise<string> => {
  const data: OperationItem[] = operationCells.value;

  let code = '';

  for (let i = 0; i < data.length; i++) {
    const { operation, payload } = data[i];

    if (!isOperation(operation)) {
      throw new Error('Invalid operation', { cause: operation });
    }

    payload.requestOptions = { getCode: true };

    if (operation.codeExport) {
      for (const key in payload) {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      }
      code +=
        operation.codeExport({
          ...payload,
          target: payload.target || payload.source?.name
        }) + '\n';
      continue;
    }

    code +=
      (await operation.action({
        ...payload,
        target: payload.target || payload.source?.name,
        options: {
          ...payload.options,
          preview: false
        },
        app: getAppProperties()
      })) + '\n';
  }

  return code;
};

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
</style>
