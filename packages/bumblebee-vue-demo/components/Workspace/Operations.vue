<template>
  <aside
    class="workspace-aside flex flex-col bg-white border-line border-solid border-l overflow-hidden"
  >
    <div
      class="w-full h-8 bg-primary-highlight text-text-alpha flex justify-center items-center"
    >
      <h3 v-if="operation">
        {{ resolve(operation.title) || operation.name || 'Operation' }}
      </h3>
      <h3 v-else>Operations</h3>
    </div>
    <OperationsOperation v-if="operation" :key="operation.name" />
    <div
      v-else
      class="operations-container overflow-y-auto h-full flex flex-col justify-stretch text-sm text-text"
    >
      <draggable
        v-model="operationCells"
        tag="ul"
        group="operations"
        ghost-class="opacity-50"
        item-key="id"
        class="operations-items px-4 pt-4 pb-2 flex flex-col gap-2"
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
            <span class="text-text-lighter text-xs mr-2">{{ index + 1 }}</span>
            <span class="flex-1">{{ element.content }}</span>
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
          v-for="(element, index) in inactiveOperations"
          :key="element.operation.name + index"
          class="flex items-center gap-2 transition p-2 rounded-md"
        >
          <span class="text-text-lighter text-xs mr-2">{{
            operations.length + 1 + index
          }}</span>
          <span>{{ element.operation.name }}</span>
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

import {
  isOperation,
  OperationActions,
  OperationPayload,
  PayloadWithOptions,
  State
} from '@/types/operations';

const { addToast } = useToasts();

const state = inject<Ref<State | null>>('state', ref(null));

const operation = computed(() => {
  return isOperation(state.value) ? state.value : null;
});

const operationValues = inject('operation-values') as Ref<
  Partial<PayloadWithOptions>
>;

const operations = inject<Ref<OperationPayload[]>>('operations', ref([]));

const inactiveOperations = inject<Ref<OperationPayload[]>>(
  'inactive-operations',
  ref([])
);

const dragging = ref(false);

type OperationCell = OperationPayload & { id: string; content: string };

const operationCells = computed<OperationCell[]>({
  get: () => {
    return operations.value.map((operation, index) => {
      // const content = resolveUsingPayload(
      //   operation.operation.content,
      //   operation.payload
      // ); // TODO: content property
      const title = resolveUsingPayload(
        operation.operation.title,
        operation.payload
      );
      return {
        ...operation,
        id: operation.payload.id || index,
        content: title || operation.operation.name || 'Operation'
      };
    });
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

const { selectOperation, submitOperation } = inject(
  'operation-actions'
) as OperationActions;

const resolve = <T>(
  value: ((payload: Partial<PayloadWithOptions>) => T) | T
): T => {
  return resolveUsingPayload(value, operationValues.value);
};

const resolveUsingPayload = <T>(
  value: ((payload: Partial<PayloadWithOptions>) => T) | T,
  payload: Partial<PayloadWithOptions>
): T => {
  if (value instanceof Function) {
    return value(payload);
  }
  return value;
};

const updateOperations = async (
  newOperations: OperationPayload[]
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
    console.warn('Cannot move operation after source creation');
    addToast({
      title: 'Cannot move operation after source creation',
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

  operationValues.value = {};
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
</script>
