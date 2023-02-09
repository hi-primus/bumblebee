<!-- eslint-disable vue/no-multiple-template-root -->
<template>
  <WorkspaceToolbar />
  <section class="workspace-table overflow-hidden">
    <TableChunks
      v-if="dataframeObject?.profile || previewData?.profile"
      ref="table"
      class="overflow-auto"
      :header="header"
      :chunks="completedChunks"
      :rows-count="rowsCount"
      @update-scroll="updateScroll"
    />
  </section>
  <WorkspaceOperations />
  <WorkspaceFooter />
</template>

<script setup lang="ts">
import { ComputedRef, Ref } from 'vue';

import TableChunks from '@/components/Table/Chunks.vue';
import {
  ColumnHeader,
  DataframeObject,
  Highlight,
  PreviewData
} from '@/types/dataframe';
import { Chunk } from '@/types/table';
import { optimizeRanges } from '@/utils/table';

// table data

const dataframeObject = inject(
  'dataframe-object'
) as ComputedRef<DataframeObject>;

const previewData = inject('preview-data') as Ref<PreviewData>;

const table = ref<InstanceType<typeof TableChunks> | null>(null);

const header = computed<ColumnHeader[]>(() => {
  const dataframeProfile = dataframeObject.value?.profile;
  const previewProfile = previewData.value?.profile;
  const profile =
    previewProfile && dataframeProfile
      ? {
          ...dataframeProfile,
          columns: {
            ...dataframeProfile?.columns,
            ...previewProfile?.columns
          }
        }
      : dataframeProfile;
  const originalColumns = profile?.columns;
  const columns =
    previewData.value?.columns ||
    previewData.value?.profile?.columns ||
    originalColumns;

  const wholePreview = previewData.value?.options?.usesInputDataframe === false;

  if (columns && Object.keys(columns)) {
    return Object.entries(columns).map(([title, column]) => {
      let preview = false;

      let newTitle: string = title;

      if (title.startsWith('__bumblebee__preview__')) {
        newTitle = title.replace('__bumblebee__preview__', 'new ');
        preview = true;
      }

      let highlight: Highlight = false;

      if (title.startsWith('__bumblebee__highlight_row__')) {
        const highlightString = title.replace(
          '__bumblebee__highlight_row__',
          ''
        );
        highlight = ['error', 'warning', 'success'].includes(highlightString)
          ? (highlightString as Highlight)
          : true;
      }
      return {
        title: newTitle,
        data_type:
          (column as ColumnHeader).data_type ||
          originalColumns?.[title]?.data_type,
        stats:
          (column as ColumnHeader).stats || originalColumns?.[title]?.stats,
        preview: preview || wholePreview,
        highlight
      };
    });
  }
  return [];
});

const rowsCount = computed(() => {
  return (
    dataframeObject.value?.profile?.summary?.rows_count ||
    previewData.value?.profile?.summary?.rows_count
  );
});

// chunks

const chunks = ref<Chunk[]>([]);

const completedChunks = computed(() => {
  return chunks.value.filter(chunk => chunk.data?.length);
});

const chunksQueue = ref<[number, number][]>([]);

const scrollRange = inject('scroll-range') as Ref<[number, number]>;

const updateScroll = function (start: number, stop: number) {
  let range: [number, number] = [
    Math.max(start, 0),
    rowsCount.value ? Math.min(stop, rowsCount.value) : stop
  ];

  scrollRange.value = range;

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

  return checkChunksQueue();
};

let shiftChunksPromise: Promise<boolean> | false = false;

const checkChunksQueue = async function () {
  // finish previous checkChunksQueue
  await shiftChunksPromise;
  shiftChunksPromise = false;
  if (!shiftChunksPromise) {
    shiftChunksPromise = _shiftChunksQueue();
    await shiftChunksPromise;
    shiftChunksPromise = false;
  }
};

const getChunk = async function (start: number, stop: number) {
  const df = previewData.value?.df || dataframeObject.value.df;

  if (!df) {
    return;
  }

  const sample = await df
    .iloc({
      target: 'preview_' + df.name,
      lower_bound: start,
      upper_bound: stop
    })
    .columnsSample();

  if (sample.value.length === 0) {
    console.warn(`Sample length '${sample.value.length}' is zero`);
    return;
  }

  if (sample.value.length < stop - start) {
    console.warn(
      `Sample length '${sample.value.length}' is less than expected for range '${start} - ${stop}'`
    );

    stop = start + sample.value.length;

    // filter out ranges from queue if it contains chunks that are out of range

    chunksQueue.value = chunksQueue.value.filter(
      ([_start, _stop]) => _start < stop && _stop < stop
    );
  }

  const chunk = {
    start,
    stop,
    data: sample.value
  };
  return chunk;
};

const _shiftChunksQueue = async function (): Promise<boolean> {
  if (chunksQueue.value.length) {
    let [start, stop] = chunksQueue.value[0];
    chunksQueue.value = chunksQueue.value.slice(1);
    start = Math.max(start, 0);
    stop = rowsCount.value ? Math.min(stop, rowsCount.value) : stop;
    const shallowChunk = {
      start,
      stop,
      data: []
    };
    const index = chunks.value.length;
    chunks.value[index] = shallowChunk;
    const chunk = await getChunk(start, stop);
    if (chunk) {
      chunks.value[index] = chunk;
    }
    return _shiftChunksQueue();
  }
  return true;
};

const addChunk = (chunk: Chunk) => {
  const index = chunks.value.findIndex(
    c => c.start === chunk.start && c.stop === chunk.stop
  );
  if (index !== -1) {
    chunks.value[index] = chunk;
  } else {
    chunks.value.push(chunk);
  }
};

const clearChunks = (check = true) => {
  chunks.value = [];
  chunksQueue.value = [];
  check && checkChunksQueue();
};

const focusTable = () => {
  if (table.value) {
    table.value.focus();
  }
};

watch(
  () => dataframeObject.value,
  () => clearChunks(),
  {
    immediate: true,
    deep: true
  }
);

defineExpose({
  addChunk,
  clearChunks,
  focusTable
});
</script>

<style lang="scss">
// fake top border
.workspace-table {
  position: relative;
  &::before {
    content: ' ';
    border-top-color: theme('colors.line.light');
    border-top-style: solid;
    border-top-width: 1px;
    position: absolute;
    width: 100%;
    height: 1px;
    top: 0;
    left: 0;
    z-index: 1;
  }
}
</style>
