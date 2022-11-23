<template>
  <div
    ref="scrollElement"
    class="z-20 w-full h-full overflow-auto"
    @scroll.passive="onScroll"
  >
    <div
      class="bumblebee-table-container relative flex h-full w-[max-content] text-sm font-mono-table text-text"
    >
      <div
        class="bumblebee-columns-rows-backgrounds sticky h-full w-full ml-[-100%] left-0 order-[-1]"
      >
        <div
          v-for="(row, rowIndex) in data"
          :key="`row-${rowIndex}`"
          :style="{
            top: columnHeaderHeight + rowIndex * rowHeight + 'px',
            height: rowHeight + 'px'
          }"
          class="absolute bg-white pr-2 z-[-3] text-right w-full op-50 bg-white"
        />
      </div>
      <div
        class="bumblebee-table relative max-w-full flex"
        :style="{
          height:
            columnHeaderHeight +
            safeRowsCount * rowHeight +
            tablePaddingBottom +
            'px',
          paddingBottom: tablePaddingBottom + 'px'
        }"
      >
        <div
          v-for="(column, columnIndex) in header"
          :key="column.title"
          class="bumblebee-table-column relative z-[0]"
          :style="{
            height:
              columnHeaderHeight +
              safeRowsCount * rowHeight +
              tablePaddingBottom +
              'px',
            minWidth: minColumnWidth + 'px'
          }"
        >
          <div
            class="border-line-light border-b border-r sticky top-0 bg-white z-[2] font-mono"
          >
            <div
              class="column-title border-line-light border-b text-[16px] py-1 px-3 text-center flex align-center"
              :style="{
                height: columnTitleHeight + 'px'
              }"
            >
              <!-- TODO: data type instead of icon -->
              <Icon
                :path="mdiTableColumn"
                class="left-icon inline text-text/90 mr-[2px]"
              />
              <span class="flex-1">
                {{ column.title }}
              </span>
              <div class="flex-1 max-w-[24px] right-icon" />
            </div>
            <div
              class="italic px-3 py-4"
              :style="{
                height: columnPlotHeight + 'px'
              }"
            />
          </div>
          <div
            v-for="(row, rowIndex) in data"
            :key="`col-${column?.title}-${rowIndex}`"
            class="absolute px-1 border-line-light border w-[calc(100%+1px)] ml-[-1px] mt-[-1px] ellipsis"
            :style="{
              top: columnHeaderHeight + rowIndex * rowHeight + 'px',
              height: rowHeight + 1 + 'px'
            }"
            v-html="getValue(row ? row[columnIndex] : null)"
          />
        </div>
      </div>
      <div class="sticky h-full left-0 order-[-1]">
        <div
          class="bumblebee-columns-rows-indices h-full bg-white text-text-lighter border-line-light border-r font-mono font-200 text-right"
          :style="{
            width: rowIndicesWidth + 'px',
            height:
              columnHeaderHeight +
              safeRowsCount * rowHeight +
              tablePaddingBottom +
              'px'
          }"
        >
          <div
            v-for="(row, rowIndex) in data"
            :key="`row-index-${rowIndex}`"
            :style="{
              top: columnHeaderHeight + rowIndex * rowHeight + 'px',
              height: rowHeight + 'px'
            }"
            class="absolute w-full pr-[6px] z-[1] bg-white border-line-light border-r"
          >
            {{ rowIndex }}
          </div>
          <div
            class="sticky top-0 z-[2] bg-white"
            :style="{
              width: rowIndicesWidth - 1 + 'px',
              height: columnHeaderHeight + 'px'
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mdiTableColumn } from '@mdi/js';
import { PropType } from 'vue';

import { throttle } from '@/utils';
import { Column } from 'types/profile';

const props = defineProps({
  data: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: Object as PropType<Record<number, Record<string, any>>>,
    required: true
  },
  rowsCount: {
    type: Number,
    default: 0
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

const scrollElement = ref<HTMLElement | null>(null);

const rowIndicesWidth = 48; // TODO: Width from rows number
const columnTitleHeight = 32;
const columnPlotHeight = 48;
const columnHeaderHeight = columnTitleHeight + columnPlotHeight;
const tablePaddingBottom = 200;
const minColumnWidth = 160;
const rowHeight = 24;

const safeRowsCount = computed(() => {
  if (props.rowsCount) {
    console.log('[TABLE] Setting rows count to', props.rowsCount);
    return props.rowsCount;
  }
  const keys = Object.keys(props.data);
  if (keys.length) {
    const count = +keys[keys.length - 1];
    console.log('[TABLE] Setting rows count to', count, '(using table data)');
    return count;
  }
  console.log('[TABLE] Setting rows count to 0 by defailt');
  return 0;
});

const onScroll = throttle(function () {
  const element = scrollElement.value;
  if (element) {
    const start = Math.floor(
      (element.scrollTop - columnHeaderHeight) / rowHeight
    );
    const stop = Math.ceil(
      (element.scrollTop + element.clientHeight - columnHeaderHeight) /
        rowHeight
    );
    console.log('updateWindow', start, stop);
    emit('updateWindow', start, stop);
  }
}, 300);

const getValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '<span class="text-text-lighter">None</span>';
  } else if (value === '') {
    return '<span class="text-text-lighter">Empty</span>';
  } else if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'number') {
    return value.toString();
  } else if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  } else if (Array.isArray(value)) {
    return value.map(v => getValue(v as unknown)).join(', ');
  } else if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value.toString();
};

onMounted(() => {
  console.log('onMounted on Table');
  onScroll();
});
</script>
