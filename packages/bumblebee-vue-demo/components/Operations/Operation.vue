<template>
  <form
    ref="operationElement"
    class="flex flex-col px-2 pt-5 gap-5 bg-red"
    @submit.prevent="submit"
  >
    <AppAutocomplete
      v-if="options?.usesInputCols"
      v-model="columns"
      multiple
      label="Columns"
      name="Columns"
      :options="Object.keys(dataframeObject?.profile?.columns || {})"
    />
    <template v-if="operation?.fields?.length">
      <template v-for="field in operation.fields">
        <AppSelector
          v-if="field.options?.length"
          :key="`selector-${field.name}`"
          v-model="operationValues[field.name]"
          :options="field.options"
          :text-callback="field.textCallback"
          :label="field.label || field.name"
          :name="field.name"
          :placeholder="field.placeholder"
        />
        <AppInput
          v-else-if="field.type === 'string'"
          :key="`input-${field.name}`"
          v-model="operationValues[field.name]"
          :label="field.label || field.name"
          :name="field.name"
          :placeholder="field.placeholder"
        />
        <AppCheckbox
          v-else-if="field.type === 'boolean'"
          :key="`check-${field.name}`"
          v-model="operationValues[field.name]"
          :label="field.label || field.name"
          :name="field.name"
        />
      </template>
    </template>
    <div class="flex justify-end gap-2">
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
