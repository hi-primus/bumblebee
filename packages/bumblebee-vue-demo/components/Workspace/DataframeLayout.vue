<!-- eslint-disable vue/no-multiple-template-root -->
<template>
  <WorkspaceToolbar />
  <section v-if="dataframe" class="workspace-table overflow-hidden">
    <TableChunks
      class="overflow-auto"
      :header="header"
      :chunks="completedChunks"
      :rows-count="rowsCount"
      @update-window="updateWindow"
    />
  </section>
  <WorkspaceOperations />
  <WorkspaceFooter :dataframe="dataframe" />
</template>

<script setup lang="ts">
import { PropType } from 'vue';

import { optimizeRanges } from '@/utils/table';
import { Column, DataframeProfile } from 'types/profile';
import { Chunk } from 'types/table';

const props = defineProps({
  dataframe: {
    type: Object as PropType<DataframeProfile>
  },
  getChunk: {
    type: Function as PropType<(start: number, end: number) => Promise<Chunk>>
  }
});

const header = reactiveComputed<Column[]>(() => {
  if (props.dataframe?.columns && Object.keys(props.dataframe.columns)) {
    return Object.entries(props.dataframe.columns).map(([title, column]) => {
      return {
        title,
        data_type: column.data_type,
        stats: column.stats
      };
    });
  }
  return [];
});

const rowsCount = computed(() => {
  return props.dataframe?.summary?.rows_count;
});

// uses ref to allow reseting it
const chunks = ref<Chunk[]>([]);

const completedChunks = computed(() => {
  return chunks.value.filter(chunk => chunk.data.length);
});

const chunksQueue = ref<[number, number][]>([]);

const updateWindow = function (start: number, stop: number) {
  console.log('[dataframe] updateWindow', start, stop);
  let range: [number, number] = [
    Math.max(start, 0),
    rowsCount.value ? Math.min(stop, rowsCount.value) : stop
  ];
  const chunksRanges: [number, number][] = chunks.value.map(chunk => [
    chunk.start,
    chunk.stop
  ]);

  let ranges = chunksRanges;

  chunksQueue.value = [];

  for (let i = 0; i < 3; i++) {
    const newRanges = optimizeRanges(range, ranges);
    chunksQueue.value.push(...newRanges);

    ranges = [...ranges, ...newRanges];
    range = [
      Math.max(range[0] - 30, 0),
      rowsCount.value ? Math.min(range[1] + 30, rowsCount.value) : range[1] + 30
    ];
  }

  console.log(JSON.stringify({ chunksQueue: chunksQueue.value }));

  return shiftChunksQueue();
};

let shiftChunksPromise: Promise<boolean> | false = false;

const shiftChunksQueue = async function () {
  // finish previous shiftChunksQueue
  await shiftChunksPromise;
  shiftChunksPromise = false;
  if (!shiftChunksPromise) {
    shiftChunksPromise = _shiftChunksQueue();
    await shiftChunksPromise;
    shiftChunksPromise = false;
  }
};

const _shiftChunksQueue = async function (): Promise<boolean> {
  console.log('chunksQueue length', chunksQueue.value.length);
  if (chunksQueue.value.length) {
    let [start, stop] = chunksQueue.value[0];
    console.log('[dataframe] shifting', start, stop);
    chunksQueue.value = chunksQueue.value.slice(1);
    start = Math.max(start, 0);
    stop = rowsCount.value ? Math.min(stop, rowsCount.value) : stop;
    if (props.getChunk) {
      const shallowChunk = {
        start,
        stop,
        data: []
      };
      const index = chunks.value.length;
      chunks.value[index] = shallowChunk;
      console.log('chunks.value', JSON.stringify(chunks.value));
      const chunk = await props.getChunk(start, stop);
      chunks.value[index] = chunk;
      console.log('chunks.value', JSON.stringify(chunks.value));
    }
    return _shiftChunksQueue();
  }
  return true;
};

watch(
  () => props.dataframe,
  () => {
    chunks.value = [];
    chunksQueue.value = [];
    shiftChunksQueue();
  }
);
</script>
