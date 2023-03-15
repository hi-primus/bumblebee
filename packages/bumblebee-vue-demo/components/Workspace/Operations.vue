<template>
  <aside
    class="workspace-aside flex flex-col bg-white border-line border-solid border-l overflow-hidden"
  >
    <div
      class="w-full h-8 bg-primary-highlight text-text-alpha flex justify-center items-center"
    >
      <h3 v-if="operation">
        {{ operation.name || 'Operation' }}
      </h3>
      <h3 v-else>Operations</h3>
    </div>
    <OperationsOperation v-if="operation" :key="operation.name" />
    <draggable
      v-else
      v-model="operationsCells"
      tag="ul"
      group="operations"
      ghost-class="opacity-50"
      item-key="id"
      class="operations-items px-4 pt-4 pb-10 flex flex-col gap-2 text-sm text-text overflow-y-auto h-full"
      @start="dragging = true"
      @end="dragging = false"
    >
      <template #item="{ element, index }">
        <li
          class="flex items-center gap-2 cursor-move transition p-2 rounded-md"
          :class="{
            'hover:bg-primary-highlight': !dragging
          }"
        >
          <span class="text-text-lighter text-xs mr-2">{{ index + 1 }}</span>
          <span>{{ element.operation.name }}</span>
          <Icon
            :path="mdiClose"
            class="w-4 h-4 ml-auto cursor-pointer"
            @click="removeOperation(index)"
          />
        </li>
      </template>
    </draggable>
  </aside>
</template>

<script setup lang="ts">
import { mdiClose } from '@mdi/js';
import { Ref } from 'vue';

import {
  isOperation,
  OperationActions,
  OperationPayload,
  State
} from '@/types/operations';

const { addToast } = useToasts();

const state = inject<Ref<State | null>>('state', ref(null));

const operation = computed(() => {
  return isOperation(state.value) ? state.value : null;
});

const operations = inject<Ref<OperationPayload[]>>('operations', ref([]));

const dragging = ref(false);

type OperationPayloadWithId = OperationPayload & { id: string };

const operationsCells = computed<OperationPayloadWithId[]>({
  get: () => {
    return operations.value.map((operation, index) => ({
      ...operation,
      id: operation.payload.id || index
    }));
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

const { submitOperation } = inject('operation-actions') as OperationActions;

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
