<!-- eslint-disable vue/no-multiple-template-root -->
<template>
  <WorkspaceToolbar />
  <section
    class="workspace-table flex items-center justify-center overflow-hidden"
  >
    <TableChunks
      v-if="dataframeObject?.profile || previewData?.profile"
      ref="table"
      class="overflow-auto"
      :header="header"
      :chunks="completedChunks"
      :rows-count="rowsCount"
      @update-scroll="updateScroll"
    />
    <div v-else class="flex gap-2 flex-col justify-center items-center">
      <Icon
        v-if="dataframeObject || previewData"
        :path="mdiLoading"
        class="w-12 h-12 text-text-lighter animate-spin"
      />
      <slot v-else></slot>
    </div>
  </section>
  <WorkspaceOperations />
  <WorkspaceFooter />
</template>

<script setup lang="ts">
import { mdiLoading } from '@mdi/js';
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
        newTitle = title.replace('__bumblebee__preview__', '');
        // if the column already exists, we need to rename it
        if (columns?.[newTitle]) {
          newTitle = `new ${newTitle}`;
        }
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
        title,
        displayTitle: newTitle,
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
const previousChunks = ref<Chunk[]>([]);

const enableChunksLoading = ref(true);

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

const getChunk = async function (start: number, stop: number) {
  const df = previewData.value?.df || dataframeObject.value.df;

  if (!df) {
    throw new Error('No dataframe');
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
      `Sample length '${sample.value.length}' is less than expected for range '${start} - ${stop}' in dataframe '${df.name}'`
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

let gettingChunks = false;

const cleanChunks = function () {
  if (chunks.value.length > 25) {
    const chunksToDelete = chunks.value.length - 20;
    const distances = new WeakMap();
    const scrollRangeStart = scrollRange.value[0];
    chunks.value.forEach(chunk => {
      const distance = Math.abs(scrollRangeStart - chunk.start);
      distances.set(chunk, distance);
    });
    chunks.value.sort((a, b) => {
      return distances.get(b) - distances.get(a);
    });
    chunks.value = chunks.value.slice(chunksToDelete);
  }
};

const checkChunksQueue = async function (): Promise<boolean> {
  if (gettingChunks) {
    return false;
  }

  if (!enableChunksLoading.value) {
    return false;
  }

  gettingChunks = true;

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

    cleanChunks();

    gettingChunks = false;

    return checkChunksQueue();
  }

  gettingChunks = false;

  return true;
};

const addChunk = (chunk: Chunk) => {
  if (chunk.data.length === 0) {
    console.warn(`Sample length '${chunk.data.length}' is zero`);
    return;
  }

  if (chunk.data.length < chunk.stop - chunk.start) {
    console.warn(
      `Sample length '${chunk.data.length}' is less than expected for range '${chunk.start} - ${chunk.stop}'`
    );

    chunk.stop = chunk.start + chunk.data.length;
  }

  const index = chunks.value.findIndex(
    c => c.start === chunk.start && c.stop === chunk.stop
  );

  if (index !== -1) {
    chunks.value[index] = chunk;
  } else {
    chunks.value.push(chunk);
  }
};

const clearChunks = (saveOnPrevious = true, check = true) => {
  if (saveOnPrevious) {
    previousChunks.value = [...completedChunks.value];
  }
  chunks.value = [];
  chunksQueue.value = [];
  if (check) {
    checkChunksQueue();
  }
};

const setChunksLoading = (loading = true) => {
  enableChunksLoading.value = loading;
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

watch(enableChunksLoading, enable => {
  if (enable) {
    checkChunksQueue();
  }
});

defineExpose({
  addChunk,
  clearChunks,
  setChunksLoading,
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
