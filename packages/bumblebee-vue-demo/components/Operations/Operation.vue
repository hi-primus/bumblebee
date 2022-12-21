<template>
  <div class="flex flex-col p-2 gap-2 bg-red">
    <!-- {{ Object.keys(profile?.columns || {}) }} -->
    <AppAutocomplete
      v-if="options?.usesInputCols"
      v-model="columns"
      multiple
      label="Columns"
      name="Columns"
      :options="Object.keys(profile?.columns || {})"
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
      <AppButton class="btn-layout-invisible" @click="cancelOperation">
        Cancel
      </AppButton>
      <AppButton @click="submitOperation"> Accept </AppButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ComputedRef, Ref } from 'vue';

import {
  Operation,
  OperationActions,
  Payload,
  TableSelection
} from '@/types/operations';
import { DataframeProfile } from '@/types/profile';

const operation = inject('state') as Ref<Operation>;
const operationValues = inject('operation-values') as Ref<Payload>;
const { submitOperation, cancelOperation } = inject(
  'operation-actions'
) as OperationActions;
const profile = inject('profile') as ComputedRef<DataframeProfile>;
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
</script>
