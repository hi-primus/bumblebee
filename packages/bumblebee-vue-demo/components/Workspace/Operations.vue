<template>
  <aside class="workspace-aside bg-white border-line border-solid border-l">
    <div
      class="w-full h-8 bg-primary-highlight text-text-alpha flex justify-center items-center"
    >
      <h3 v-if="operation">
        {{ operation.name || 'Operation' }}
      </h3>
      <h3 v-else>Operations</h3>
    </div>
    <OperationsOperation v-if="operation" :key="operation.name" />
    <ul v-else class="p-4 flex flex-col gap-2 text-sm text-text">
      <li
        v-for="(operationPayload, index) in operations"
        :key="index"
        class="flex items-center gap-2 cursor-move transition hover:bg-primary-highlight p-2 rounded-md"
      >
        <span class="text-text-lighter text-xs mr-2">{{ index + 1 }}</span>
        <span>{{ operationPayload.operation.name }}</span>
        <Icon
          :path="mdiClose"
          class="w-4 h-4 ml-auto cursor-pointer"
          @click="removeOperation(index)"
        />
      </li>
    </ul>
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

const state = inject<Ref<State>>('state', ref(null));

const operation = computed(() => {
  return isOperation(state.value) ? state.value : null;
});

const operations = inject<Ref<OperationPayload[]>>('operations', ref([]));

const { submitOperation } = inject('operation-actions') as OperationActions;

const removeOperation = async (index: number): Promise<void> => {
  const selectedOperationOptions = operations.value[index].payload.options;
  if (selectedOperationOptions.saveToNewDataframe) {
    const operationsUsingSource = operations.value.filter(
      (operation, i) =>
        i !== index &&
        operation.payload.options.sourceId === selectedOperationOptions.sourceId
    );
    if (operationsUsingSource.length) {
      console.warn('Trying to remove source that is used by other operations');
      // TODO: properly warn user that this operation is used by other operations
      return;
    }
  }
  operations.value.splice(index, 1);
  return await submitOperation();
};
</script>
