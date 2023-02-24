<template>
  <div
    ref="scrollElement"
    class="z-20 w-full h-full overflow-auto"
    @scroll.passive="onScroll"
  >
    <div
      class="bumblebee-table-container relative flex h-full w-[max-content] text-sm font-mono-table text-text-alpha"
      :style="{
        height:
          columnHeaderHeight +
          safeRowsCount * rowHeight +
          tablePaddingBottom +
          'px'
      }"
    >
      <div
        class="bumblebee-columns-rows-backgrounds sticky h-full w-full ml-[-100%] left-0 order-[-1]"
      >
        <div
          v-for="row in visibleRows"
          :key="`row-${row.index}`"
          :style="{
            top: columnHeaderHeight + row.index * rowHeight + 'px',
            height: rowHeight + 'px'
          }"
          class="bumblebee-row-background absolute bg-white pr-2 z-[-3] text-right w-full bg-white"
          :class="row?.highlights"
        ></div>
      </div>
      <div
        ref="columns"
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
          v-for="column in columnsHeader"
          :key="column.title"
          :class="{
            'column-color-preview': column.preview,
            'column-color-primary': selection?.columns.includes(column.title)
          }"
          class="bumblebee-table-column relative z-[0]"
          :tabindex="column.preview ? -1 : 0"
          :style="{
            height: columnHeaderHeight + safeRowsCount * rowHeight + 'px',
            width: minColumnWidth + 'px'
          }"
          :data-index="column.columnIndex"
          @keydown="
            $event =>
              column.preview ? null : handleKeyDown($event, column.columnIndex)
          "
          @mousedown.prevent
        >
          <div class="column-header">
            <div
              class="column-title border-[color:var(--line-color)] border-b text-[16px] py-1 px-1 text-center flex items-center select-none font-mono-table"
              :class="{
                'cursor-pointer': !column.preview
              }"
              :style="{
                height: columnTitleHeight + 'px'
              }"
              @click.prevent="
                $event =>
                  column.preview
                    ? null
                    : columnClicked($event, column.columnIndex, true)
              "
            >
              <span
                :title="dataTypeNames[column.columnIndex]"
                class="left-icon inline text-text-alpha/75 max-w-5 font-bold text-center"
                :class="{
                  'transform scale-x-125':
                    dataTypeHintLengths[column.columnIndex] <= 2,
                  'tracking-[-1px] transform scale-x-95':
                    dataTypeHintLengths[column.columnIndex] >= 4
                }"
              >
                {{ dataTypeHints[column.columnIndex] }}
              </span>
              <span class="flex-1 truncate pl-2">
                {{ column.displayTitle || column.title }}
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
            v-for="row in visibleRows"
            :key="`col-${column?.title}-${row.index}`"
            class="column-cell ellipsis whitespace-pre"
            :style="{
              top: columnHeaderHeight + row.index * rowHeight + 'px',
              height: rowHeight + 1 + 'px'
            }"
            v-html="getValue(row?.values?.[column.columnIndex])"
          ></div>
        </div>
      </div>
      <div class="sticky h-full left-0 order-[-1] z-[2]">
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
            v-for="(_row, rowIndex) in data"
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
import { focusNext, focusPrevious, throttle } from '@/utils';
import { TYPES_HINTS, TYPES_NAMES } from '@/utils/data-types';

const props = defineProps({
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
const minColumnWidth = 169;
const rowHeight = 24;

const scrollElement = ref<HTMLElement | null>(null);

const columns = ref<HTMLElement | null>(null);

const data = ref<Record<number, Record<string, unknown>>>({});

const safeRowsCount = computed(() => {
  if (props.rowsCount) {
    console.log('[DEBUG][TABLE] Setting rows count to', props.rowsCount);
    return props.rowsCount;
  }
  const keys = Object.keys(data.value);
  if (keys.length) {
    const count = +keys[keys.length - 1] + 1;
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

const columnsHeader = computed(() => {
  return props.header
    .map((c, columnIndex) => ({ ...c, columnIndex }))
    .filter(column => !column.highlight);
});

const highlights = computed(() => {
  return props.header
    .map((c, columnIndex) => ({ ...c, columnIndex }))
    .filter(column => column.highlight);
});

type Row = {
  values?: (typeof data.value)[0];
  highlights?: string;
  index: number;
};

const rowsData = computed(() => {
  if (highlights.value.length) {
    const rows: Row[] = Array<Row>(safeRowsCount.value);
    for (const index in data.value) {
      const numericIndex = +index;
      const values = data.value[numericIndex];
      rows[numericIndex] = {
        index: numericIndex,
        values,
        highlights: highlights.value
          .map(column =>
            values[column.columnIndex] ? `row-color-${column.highlight}` : null
          )
          .join(' ')
      };
    }
    return rows;
  }
  const rows: Row[] = Array<Row>(safeRowsCount.value);
  for (const index in data.value) {
    const numericIndex = +index;
    rows[numericIndex] = {
      index: numericIndex,
      values: data.value[numericIndex]
    };
  }
  return rows;
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

const visibleRowsRange = ref([0, 10]);

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
    visibleRowsRange.value = [start, stop];
    emit('updateScroll', start, stop);
  }
}, 300);

const visibleRows = computed(() => {
  const [start, stop] = visibleRowsRange.value;
  return rowsData.value.filter(r => {
    return r && r.index >= start - 25 && r.index <= stop + 25;
  });
});

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

watch(() => columnsHeader.value, onScroll, { deep: true });

watch(() => [props.rowsCount, data.value], onScroll);

let lastColumnClicked: number | null = null;

const focus = () => {
  const el = columns.value?.children[0]; // TODO
  if (el) {
    (el as HTMLElement).focus();
  }
};

const handleKeyDown = (event: KeyboardEvent, columnIndex: number) => {
  console.log('[DEBUG][TABLE] Key down', event.key, event, columnIndex);
  const key = event.key.toLowerCase();
  if (key === 'escape') {
    selection.value = {
      columns: [],
      ranges: null,
      indices: null,
      values: null
    };
  } else if (key === ' ' || key === 'spacebar' || key === 'enter') {
    columnClicked(event, columnIndex);
    event.preventDefault();
  } else if (key === 'arrowleft') {
    const el = focusPrevious(event.target as HTMLElement);
    if (el) {
      event.preventDefault();
    }
    if (el && event.shiftKey) {
      const indexFromElement = el.getAttribute('data-index');
      if (indexFromElement) {
        columnClicked(event, +indexFromElement);
      }
    }
  } else if (key === 'arrowright') {
    const el = focusNext(event.target as HTMLElement);
    if (el) {
      event.preventDefault();
    }
    if (el && event.shiftKey) {
      const indexFromElement = el.getAttribute('data-index');
      if (indexFromElement) {
        columnClicked(event, +indexFromElement);
      }
    }
  }
};

const columnClicked = (
  event: MouseEvent | KeyboardEvent,
  columnIndex: number,
  focus = false
) => {
  if (event.target && focus) {
    let el = event.target as HTMLElement;
    while (el && el.tabIndex !== 0) {
      el = el.parentElement as HTMLElement;
    }
    if (el) {
      el.focus();
    }
  }

  if (selection.value?.columns.length === 0 || !event.shiftKey) {
    lastColumnClicked = columnIndex;
  }

  const columnTitle = columnsHeader.value[columnIndex].title;

  let columns: string[] = [];

  if (event.shiftKey && lastColumnClicked !== null) {
    const start = Math.min(columnIndex, lastColumnClicked);
    const stop = Math.max(columnIndex, lastColumnClicked);
    columns = columnsHeader.value
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

const updateData = (newData: typeof data.value) => {
  data.value = newData;
};

defineExpose({
  focus,
  updateData
});
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
  & .column-header {
    @apply bg-white;
  }
  &:focus {
    outline: none;
    & .column-header::after {
      z-index: 3;
      content: '';
      height: calc(100vh - 100px); // TODO: use a variable
      @apply absolute -top-px -left-px -right-px -bottom-px;
      @apply pointer-events-none;
      @apply outline-offset-[-3px] outline-dashed outline-2;
      @apply outline-text-light;
      @apply opacity-75;
    }
    // &.column-color-primary .column-header::after {
    // }
  }
  &.column-color-primary {
    --line-color: theme('colors.primary.lighter');
    &,
    & .column-header > * {
      @apply bg-primary/10;
    }
  }
  &.column-color-preview {
    --line-color: theme('colors.warn.lighter');
    &,
    & .column-header > * {
      @apply bg-warn/10;
    }
  }
}

.column-header {
  @apply border-[color:var(--line-color)] border ml-[-1px] mt-[-1px] sticky top-0 bg-white z-[2] font-mono;
}

.column-cell {
  @apply absolute px-1;
  @apply ml-[-1px] mr-[0px];
  @apply w-[calc(100%+1px)];
  @apply border-[color:var(--line-color)] border;
  // border-right-color: red;
  /* bottom border only when last row */
  @apply border-y-0 last:border-b;
}

.bumblebee-row-background {
  &:not([class*='row-color-']) {
    @apply bg-white;
  }
  &.row-color-success {
    @apply bg-success-highlight;
  }
  &.row-color-error {
    @apply bg-error-highlight;
  }
  &.row-color-warning {
    @apply bg-warn-highlight;
  }
}
</style>
