<template>
  <TableDefault
    ref="table"
    :header="header"
    :rows-count="rowsCount"
    @update-scroll="(start, stop) => emit('updateScroll', start, stop)"
  />
</template>

<script setup lang="ts">
import { PropType } from 'vue';

import TableDefault from '@/components/Table/Default.vue';
import { Chunk } from '@/types/app';
import { ColumnHeader } from '@/types/dataframe';

defineProps({
  rowsCount: {
    type: Number as PropType<number>
  },
  header: {
    type: Array as PropType<ColumnHeader[]>,
    required: true
  }
});

type Emits = {
  (e: 'updateScroll', start: number, stop: number): void;
};

const emit = defineEmits<Emits>();

const table = ref<InstanceType<typeof TableDefault> | null>(null);

const updateChunks = (chunks: Chunk[]) => {
  const data = (chunks || []).reduce((rows, chunk) => {
    for (let i = chunk.start; i < chunk.stop; i++) {
      rows[i] = rows[i] || chunk.data[i - chunk.start];
    }
    return rows;
  }, {} as Record<number, unknown[]>);
  table.value?.updateData(data);
};

defineExpose({
  updateChunks,
  focus: () => {
    table.value?.focus();
  }
});
</script>
