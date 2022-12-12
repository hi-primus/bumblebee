<template>
  <div class="flex flex-col p-2 gap-2 bg-red">
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
    <div class="flex justify-end gap-2">
      <AppButton class="btn-layout-invisible" @click="cancelOperation">
        Cancel
      </AppButton>
      <AppButton @click="submitOperation"> Accept </AppButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Ref } from 'vue';

import { Operation, OperationActions, Payload } from '@/types/operations';

const operation = inject('state') as Ref<Operation>;
const operationValues = inject('operation-values') as Ref<Payload>;
const { submitOperation, cancelOperation } = inject(
  'operation-actions'
) as OperationActions;
</script>
