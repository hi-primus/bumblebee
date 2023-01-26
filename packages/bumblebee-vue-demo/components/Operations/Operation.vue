<template>
  <form
    ref="operationElement"
    class="flex flex-wrap px-2 pt-5 gap-y-5"
    @submit.prevent="submit"
  >
    <AppAutocomplete
      v-if="options?.usesInputCols"
      v-model="columns"
      multiple
      label="Columns"
      name="Columns"
      class="w-full"
      :options="Object.keys(dataframeObject?.profile?.columns || {})"
    />
    <template v-if="operation?.fields?.length">
      <AppOperationField
        v-for="field in operation.fields"
        :key="field.name"
        :field="field"
      />
    </template>
    <div class="w-full flex justify-end gap-2">
      <AppButton
        class="btn-layout-invisible"
        :disabled="Boolean(status)"
        :loading="status === 'cancelling'"
        type="button"
        @click="cancel"
      >
        Cancel
      </AppButton>
      <AppButton
        :disabled="Boolean(status)"
        :loading="status === 'submitting'"
        type="submit"
      >
        Accept
      </AppButton>
    </div>
  </form>
</template>
<script setup lang="ts">
import { ComputedRef, Ref } from 'vue';

import { DataframeObject } from '@/types/dataframe';
import {
  isOperation,
  OperationActions,
  Payload,
  State,
  TableSelection
} from '@/types/operations';

const state = inject('state') as Ref<State>;
const operation = computed(() =>
  isOperation(state.value) ? state.value : null
);
const operationValues = inject('operation-values') as Ref<Payload>;
const { submitOperation, cancelOperation } = inject(
  'operation-actions'
) as OperationActions;

const operationElement = ref<HTMLElement | null>(null);

const status = ref<'' | 'submitting' | 'cancelling'>('');

const submit = async () => {
  status.value = 'submitting';
  const result = await submitOperation();
  status.value = '';
  return result;
};

const cancel = async () => {
  status.value = 'cancelling';
  const result = await cancelOperation();
  status.value = '';
  return result;
};

const dataframeObject = inject(
  'dataframe-object'
) as ComputedRef<DataframeObject>;
const selection = inject('selection') as Ref<TableSelection>;

const columns = computed({
  get() {
    return selection.value?.columns || [];
  },
  set(value) {
    selection.value = {
      columns: value,
      ranges: null,
      values: null,
      indices: null
    };
  }
});

const options = computed(() => {
  console.log('Getting options from operation', operation.value);
  return Object.assign(
    {},
    operationValues.value.options || {},
    operation.value?.defaultOptions || {},
    { targetType: 'dataframe' }
  );
});

onMounted(() => {
  if (!operationElement.value) {
    return;
  }

  const input = operationElement.value.querySelector(
    'input, textarea'
  ) as HTMLInputElement;

  if (input) {
    input.focus();
  }
});
</script>
