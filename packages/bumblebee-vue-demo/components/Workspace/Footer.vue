<template>
  <footer class="workspace-footer bg-white border-line border-solid border-t">
    <div
      class="flex h-full justify-end items-center gap-8 mx-8 pb-[1px] text-text text-sm"
    >
      <span
        v-if="status"
        class="flex items-center gap-2 text-text mr-auto transition"
        :class="{
          'opacity-80': !isLoading,
          'text-primary-dark': appStatus === 'ready',
          'text-error-dark': appStatus === 'error'
        }"
      >
        <Icon
          :path="
            isLoading
              ? mdiLoading
              : appStatus === 'ready'
              ? mdiCheckBold
              : mdiCloseThick
          "
          :class="{
            'animate-spin': isLoading
          }"
        />
        {{ status }}
      </span>
      <template v-if="summary">
        <span> {{ summary.total_count_data_types }} Data types </span>
        <span> {{ summary.rows_count }} rows </span>
        <span> {{ summary.cols_count }} columns </span>
      </template>
    </div>
  </footer>
</template>
<script setup lang="ts">
import { mdiCheckBold, mdiCloseThick, mdiLoading } from '@mdi/js';
import { ComputedRef, Ref } from 'vue';

import { DataframeObject } from '@/types/dataframe';
import { AppStatus } from '@/types/workspace';

const dataframeObject = inject('dataframe') as ComputedRef<DataframeObject>;

const summary = computed(() => {
  return dataframeObject.value?.profile?.summary;
});

const appStatus = inject('app-status') as Ref<AppStatus>;

const status = computed(() => {
  switch (appStatus.value) {
    case 'loading':
      return 'Loading';
    case 'busy':
      return 'Busy';
    case 'ready':
      return 'Ready';
  }
});

const isLoading = computed(() => {
  return (
    typeof appStatus.value === 'string' &&
    ['loading', 'busy'].includes(appStatus.value)
  );
});
</script>
