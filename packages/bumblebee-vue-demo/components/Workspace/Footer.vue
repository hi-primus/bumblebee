<template>
  <footer class="workspace-footer bg-white border-line border-solid border-t">
    <div class="flex h-full justify-end items-center gap-8 mx-8 font-mono">
      <template v-if="dataframe?.summary">
        <span>{{ dataframe.summary.total_count_data_types }} Data types</span>
        <span>{{ dataframe.summary.rows_count }} rows</span>
        <span>{{ dataframe.summary.cols_count }} columns</span>
      </template>
    </div>
  </footer>
</template>
<script setup lang="ts">
import { DataframeProfile } from 'types/profile'
import { PropType } from 'vue'

defineProps({
  dataframe: {
    type: Object as PropType<DataframeProfile>
  }
})
</script>
