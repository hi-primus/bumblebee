<template>
  <footer class="workspace-footer bg-white border-line border-solid border-t">
    <div
      class="flex h-full justify-end items-center gap-8 mx-8 text-text text-sm"
    >
      <template v-if="summary">
        <span> {{ summary.total_count_data_types }} Data types </span>
        <span> {{ summary.rows_count }} rows </span>
        <span> {{ summary.cols_count }} columns </span>
      </template>
    </div>
  </footer>
</template>
<script setup lang="ts">
import { ComputedRef } from 'vue';

import { DataframeObject } from '@/types/dataframe';

const dataframeObject = inject('dataframe') as ComputedRef<DataframeObject>;

const summary = computed(() => {
  return dataframeObject.value?.profile?.summary;
});
</script>
