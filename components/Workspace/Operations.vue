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
      <h3 v-else>Operations</h3>
    </div>
    <OperationsOperation v-if="operation" :key="operation.name" />
    <div
      v-else
      class="operations-container overflow-y-auto h-full flex flex-col justify-stretch text-sm text-neutral"
    >
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
import { mdiClose, mdiPencil } from '@mdi/js';
import { Ref } from 'vue';

import { DataframeObject } from '@/types/dataframe';
import {
  isOperation,
  OperationActions,
  OperationItem,
  OperationPayload,
  PayloadWithOptions,
  State
} from '@/types/operations';

const { addToast } = useToasts();

const { confirm } = useConfirmPopup();

const state = inject<Ref<State | null>>('state', ref(null));

const operation = computed(() => {
  return isOperation(state.value) ? state.value : null;
});

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
    ?.map(cell => cell.payload?.options?.sourceId)
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
          op.payload.options.sourceId === operation.payload.options.sourceId
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

const editOperation = async (index: number): Promise<void> => {
  const { operation, payload } = operations.value[index];

  inactiveOperations.value = operations.value.slice(index);
  operations.value = operations.value.slice(0, index);

  operationValues.value = {} as OperationPayload<PayloadWithOptions>;
  await submitOperation();

  const newPayload: PayloadWithOptions = {
    ...payload,
    options: {
      ...payload.options,
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
        operation.payload.options.sourceId === selectedOperationOptions.sourceId
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

const dataframes = inject('dataframes') as Ref<DataframeObject[]>;

const formatOperationContent = (content: string): string => {
  // find matches for dataframe names in dn{dataframeName} format but without any {} inside

  const matches = content.match(/dn\{([a-zA-Z0-9]+?)\}/g);
  if (matches) {
    matches.forEach(match => {
      const varName = match.replace(/dn\{([a-zA-Z0-9]+?)\}/, '$1');

      const dataframeObject = dataframes.value.find(
        dataframe => dataframe.df?.name === varName
      );

      console.log('found dataframe name', dataframeObject, varName);

      if (dataframeObject) {
        content = content.replace(
          `dn{${varName}}`,
          dataframeObject.name || varName
        );
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
