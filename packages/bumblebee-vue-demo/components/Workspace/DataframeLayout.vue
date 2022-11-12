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

let chunks = shallowReactive<Chunk[]>([]);

const completedChunks = reactiveComputed(() => {
  return chunks.filter(chunk => chunk.data.length);
});

const fillChunk = async function (start: number, stop: number) {
  const chunk = {
    start: Math.max(start, 0),
    stop: rowsCount.value ? Math.min(stop, rowsCount.value) : stop,
    data: []
  };
  chunks.push(chunk);
  if (props.getChunk) {
    await props.getChunk(start, stop);
  }
};

let chunksQueue: [number, number][] = [];

const updateWindow = function (start: number, stop: number) {
  let range: [number, number] = [
    Math.max(start, 0),
    rowsCount.value ? Math.min(stop, rowsCount.value) : stop
  ];
  const chunksRanges: [number, number][] = chunks.map(chunk => [
    chunk.start,
    chunk.stop
  ]);

  let ranges = chunksRanges;

  chunksQueue = [];

  for (let i = 0; i < 3; i++) {
    const newRanges = optimizeRanges(range, ranges);
    chunksQueue.push(...newRanges);

    ranges = [...ranges, ...newRanges];
    range = [
      Math.max(range[0] - 30, 0),
      rowsCount.value ? Math.min(range[1] + 30, rowsCount.value) : range[1] + 30
    ];
  }

  return shiftChunksQueue();
};

let shiftChunksPromise: Promise<void> | null = null;

const shiftChunksQueue = async function () {
  if (!shiftChunksPromise) {
    shiftChunksPromise = _shiftChunksQueue();
    await shiftChunksPromise;
    shiftChunksPromise = null;
  }
};

const _shiftChunksQueue = async function (): Promise<void> {
  if (chunksQueue.length) {
    const [start, stop] = chunksQueue[0];
    chunksQueue = chunksQueue.slice(1);
    await fillChunk(start, stop);
    return _shiftChunksQueue();
  }
};

watch(
  () => props.dataframe,
  () => {
    chunks = [];
    chunksQueue = [];
    shiftChunksQueue();
  }
);
</script>
