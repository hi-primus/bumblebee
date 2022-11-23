<template>
  <TableDefault
    :header="header"
    :data="data"
    :rows-count="rowsCount"
    @update-window="updateWindow"
  />
</template>

<script setup lang="ts">
import { PropType } from 'vue';

import { Column } from 'types/profile';
import { Chunk } from 'types/table';

const props = defineProps({
  chunks: {
    type: Array as PropType<Chunk[]>,
    default: () => []
  },
  rowsCount: {
    type: Number as PropType<number>
  },
  header: {
    type: Array as PropType<Column[]>,
    required: true
  }
});

type Emits = {
  (e: 'updateWindow', start: number, stop: number): void;
};

const emit = defineEmits<Emits>();

const updateWindow = (start: number, stop: number) => {
  console.info('updateWindow', start, stop);
  return emit('updateWindow', start, stop);
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
