<template>
  <TableDefault
    :header="header"
    :data="data"
    :rows-count="rowsCount"
    @update-scroll="updateScroll"
  />
</template>

<script setup lang="ts">
import { PropType } from 'vue';

import { ColumnHeader } from '@/types/dataframe';
import { Chunk } from '@/types/table';

const props = defineProps({
  chunks: {
    type: Array as PropType<Chunk[]>,
    default: () => []
  },
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

const updateScroll = (start: number, stop: number) => {
  console.info('updateScroll', start, stop);
  return emit('updateScroll', start, stop);
};

const data = reactiveComputed(() => {
  return (props.chunks || []).reduce((rows, chunk) => {
    for (let i = chunk.start; i < chunk.stop; i++) {
      rows[i] = rows[i] || chunk.data[i - chunk.start];
    }
    return rows;
  }, {} as Record<number, object>);
});
</script>
