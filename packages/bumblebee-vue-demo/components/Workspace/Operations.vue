<template>
  <aside class="workspace-aside bg-white border-line border-solid border-l">
    <div
      class="w-full h-8 bg-primary-highlight text-text/90 flex justify-center items-center"
    >
      <h3 v-if="operation">
        {{ operation.name || 'Operation' }}
      </h3>
      <h3 v-else>Operations</h3>
    </div>
    <!-- <ul class="p-4 flex flex-col gap-2">
      <OperationsOperation
        v-for="(operation, index) in operations"
        :key="index"
        :index="index"
      />
    </ul> -->
    <OperationsOperation v-if="operation" />
  </aside>
</template>

<script setup lang="ts">
import { isOperation, State } from '@/types/operations';
import { Ref } from 'vue';

const state = inject<Ref<State>>('state', ref(null));

const operation = computed(() => {
  return isOperation(state.value) ? state.value : null;
});
</script>
