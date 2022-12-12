<template>
  <div class="flex flex-col p-2 gap-2 bg-red">
    <AppInput placeholder="test" />
    <AppSelector
      :model-value="'option1'"
      :options="['option1', 'option2']"
      label="selector"
      name="selector"
      @update:model-value="() => {}"
    />
    <AppCheckbox
      name="checkbox"
      label="checkbox"
      class="w-full px-2 pt-4 z-3"
      :model-value="false"
      @update:model-value="() => {}"
    />
    <div class="flex justify-end">
      <AppButton class="mr-auto btn-color-error">
      <AppButton class="btn-layout-invisible" @click="cancelOperation">
      </AppButton>
      <AppButton
        class="btn-layout-invisible"
      >
        Cancel
      </AppButton>
      <AppButton @click="submitOperation"> Accept </AppButton>
        class="btn-layout-outline"
      >
        Accept
      </AppButton>
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
