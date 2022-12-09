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
        Delete
      </AppButton>
      <AppButton
        class="btn-layout-invisible"
      >
        Cancel
      </AppButton>
      <AppButton
        class="btn-layout-outline"
      >
        Accept
      </AppButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Ref } from 'vue';

import { Operation } from '@/types/operations';

const operation = inject('state') as Ref<Operation>;
</script>
