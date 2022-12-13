<template>
  <footer class="workspace-footer bg-white border-line border-solid border-t">
    <div class="flex h-full justify-end items-center gap-8 mx-8 font-mono">
      <template v-if="profile?.summary">
        <span>{{ profile.summary.total_count_data_types }} Data types</span>
        <span>{{ profile.summary.rows_count }} rows</span>
        <span>{{ profile.summary.cols_count }} columns</span>
      </template>
    </div>
  </footer>
</template>
<script setup lang="ts">
import { ComputedRef } from 'vue';

import { DataframeProfile } from '@/types/profile';

const profile = inject('profile') as ComputedRef<DataframeProfile>;
</script>
