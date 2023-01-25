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
          class="absolute bg-white pr-2 z-[-3] text-right w-full opacity-50 bg-white"
        ></div>
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
          :class="{
            'column-color-preview': column.preview,
            'column-color-primary': selection?.columns.includes(column.title)
          }"
          class="bumblebee-table-column relative z-[0]"
          :style="{
            height: columnHeaderHeight + safeRowsCount * rowHeight + 'px',
            width: minColumnWidth + 'px'
          }"
        >
          <div
            class="column-header border-[color:var(--line-color)] border ml-[-1px] mt-[-1px] sticky top-0 bg-white z-[2] font-mono"
          >
            <div
              class="column-title border-[color:var(--line-color)] border-b text-[16px] py-1 px-3 text-center flex align-center cursor-pointer select-none"
              :style="{
                height: columnTitleHeight + 'px'
              }"
              @click="$event => columnClicked($event, columnIndex)"
            >
              <span
                :title="dataTypeNames[columnIndex]"
                class="left-icon inline text-current max-w-5 font-bold text-center"
                :class="{
                  'transform scale-x-125':
                    dataTypeHintLengths[columnIndex] <= 2,
                  'tracking-[-1px] transform scale-x-95':
                    dataTypeHintLengths[columnIndex] >= 4
                }"
              >
                {{ dataTypeHints[columnIndex] }}
              </span>
              <span class="flex-1 truncate pl-2">
                {{ column.title }}
              </span>
              <div class="flex-0 w-[24px] right-icon"></div>
            </div>
            <PlotColumn
              :style="{
                height: columnPlotHeight + 'px'
              }"
              :data="column"
            />
          </div>
          <div
            v-for="(row, rowIndex) in data"
            :key="`col-${column?.title}-${rowIndex}`"
            class="column-cell ellipsis whitespace-pre"
            :style="{
              top: columnHeaderHeight + rowIndex * rowHeight + 'px',
              height: rowHeight + 1 + 'px'
            }"
            v-html="getValue(row ? row[columnIndex] : null)"
          ></div>
        </div>
      </div>
      <div class="sticky h-full left-0 order-[-1]">
        <div
          class="bumblebee-columns-rows-indices h-full bg-white text-text-lightest border-line-light border-r font-mono font-200 text-right"
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
          ></div>
        </div>
      </div>
      <div class="table-bottom-part"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, Ref } from 'vue';

import { ColumnHeader } from '@/types/dataframe';
import { TableSelection } from '@/types/operations';
import { throttle } from '@/utils';
import { TYPES_HINTS, TYPES_NAMES } from '@/utils/data-types';

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
    type: Array as PropType<ColumnHeader[]>,
    required: true
  }
});

const selection = inject('selection') as Ref<TableSelection>;

type Emits = {
  (e: 'updateScroll', start: number, stop: number): void;
};

const emit = defineEmits<Emits>();

const rowIndicesWidth = 48; // TODO: Width from rows number
const columnTitleHeight = 32;
const columnPlotHeight = 90;
const columnHeaderHeight = columnTitleHeight + columnPlotHeight + 2;
const tablePaddingBottom = 200;
const minColumnWidth = 180;
const rowHeight = 24;

const scrollElement = ref<HTMLElement | null>(null);

const safeRowsCount = computed(() => {
  if (props.rowsCount) {
    console.log('[DEBUG][TABLE] Setting rows count to', props.rowsCount);
    return props.rowsCount;
  }
  const keys = Object.keys(props.data);
  if (keys.length) {
    const count = +keys[keys.length - 1];
    console.log(
      '[DEBUG][TABLE] Setting rows count to',
      count,
      '(using table data)'
    );
    return count;
  }
  console.log('[DEBUG][TABLE] Setting rows count to 0 by defailt');
  return 0;
});

const dataTypeHints = computed(() => {
  return props.header.map(column => {
    let dataType = '';
    if (column.stats?.inferred_data_type) {
      if (typeof column.stats.inferred_data_type === 'string') {
        dataType = column.stats.inferred_data_type;
      } else {
        dataType = column.stats.inferred_data_type.data_type;
      }
    } else if (column.data_type) {
      dataType = column.data_type;
    }
    return TYPES_HINTS[dataType] || dataType || '?';
  });
});

const dataTypeHintLengths = computed(() => {
  return dataTypeHints.value.map(hint => hint.length);
});

const dataTypeNames = computed(() => {
  return props.header.map(column => {
    let dataType = '';
    if (column.stats?.inferred_data_type) {
      if (typeof column.stats.inferred_data_type === 'string') {
        dataType = column.stats.inferred_data_type;
      } else {
        dataType = column.stats.inferred_data_type.data_type;
      }
    } else if (column.data_type) {
      dataType = column.data_type;
    }
    return TYPES_NAMES[dataType] || dataType || 'unknown';
  });
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
    emit('updateScroll', start, stop);
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
  onScroll();
});

watch(props.header, onScroll, { deep: true });

watch([props.rowsCount, props.data], onScroll);

let lastColumnClicked: number | null = null;

const columnClicked = (event: MouseEvent, columnIndex: number) => {
  if (selection.value?.columns.length === 0 || !event.shiftKey) {
    lastColumnClicked = columnIndex;
  }

  const columnTitle = props.header[columnIndex].title;

  let columns: string[] = [];

  if (event.shiftKey && lastColumnClicked !== null) {
    const start = Math.min(columnIndex, lastColumnClicked);
    const stop = Math.max(columnIndex, lastColumnClicked);
    columns = props.header
      .slice(start, stop + 1)
      .filter(c => !c.preview)
      .map(c => c.title);
  } else if (event.ctrlKey) {
    if (selection.value?.columns.includes(columnTitle)) {
      columns = selection.value.columns.filter(c => c !== columnTitle);
    } else {
      columns = [...(selection.value?.columns || []), columnTitle];
    }
  } else if (
    selection.value?.columns.length === 1 &&
    selection.value?.columns[0] === columnTitle
  ) {
    columns = [];
  } else {
    columns = [columnTitle];
  }

  selection.value = {
    columns,
    ranges: null,
    values: null,
    indices: null
  };
};
</script>

<style lang="scss">
.bumblebee-table-column {
  &:not([class*='column-color-']) {
    --line-color: theme('colors.line.light');
    z-index: 1;
  }
  &[class*='column-color-'] {
    z-index: 2;
  }
  &.column-color-primary {
    --line-color: theme('colors.primary.lighter');
    &,
    & .column-header {
      @apply bg-primary-highlight;
    }
  }
  &.column-color-preview {
    --line-color: theme('colors.warn.lighter');
    &,
    & .column-header {
      @apply bg-warn-highlight;
    }
  }
}

.column-cell {
  @apply absolute px-1 border-[color:var(--line-color)] border w-[calc(100%+1px)] ml-[-1px] mt-[-1px];
}
</style>
