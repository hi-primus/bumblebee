<template>
  <div ref="operationElement" class="flex flex-col px-2 pt-5 gap-5 bg-red">
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
          :key="field.name"
          v-model="operationValues[field.name]"
          :options="field.options"
          label="selector"
          name="selector"
        />
        <AppInput
          v-if="field.type === 'string'"
          :key="field.name"
          v-model="operationValues[field.name]"
          :label="field.label || field.name"
          :name="field.name"
          :placeholder="field.placeholder"
        />
        <AppCheckbox
          v-if="field.type === 'boolean'"
          :key="field.name"
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
        @click="cancel"
      >
        Cancel
      </AppButton>
      <AppButton
        :disabled="Boolean(status)"
        :loading="status === 'submitting'"
        @click="submit"
      >
        Accept
      </AppButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ComputedRef, Ref } from 'vue';

import { DataframeObject } from '@/types/dataframe';
import {
  Operation,
  OperationActions,
  Payload,
  TableSelection
} from '@/types/operations';

const operation = inject('state') as Ref<Operation>;
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

const dataframeObject = inject('dataframe') as ComputedRef<DataframeObject>;
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
    operation.value.defaultOptions || {},
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
