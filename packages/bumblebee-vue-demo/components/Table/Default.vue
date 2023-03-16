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
        @mouseover="checkCellHover"
      >
        <div
          v-for="column in columnsHeader"
          :key="column.title"
          :class="{
            'column-color-preview': column.columnType === 'preview',
            'column-color-primary':
              selection?.columns.includes(column.title) ||
              column.columnType === 'highlighted'
          }"
          class="bumblebee-table-column relative z-[0]"
          :tabindex="column.columnType === 'preview' ? -1 : 0"
          :style="{
            height: columnHeaderHeight + safeRowsCount * rowHeight + 'px',
            width: minColumnWidth + 'px'
          }"
          :data-index="column.columnIndex"
          @keydown="
            $event =>
              column.columnType === 'preview'
                ? null
                : handleKeyDown($event, column.columnIndex)
          "
          @mousedown.prevent
        >
          <div class="column-header">
            <div
              :data-column-index="column.columnIndex"
              class="column-title border-[color:var(--line-color)] border-b text-[16px] py-1 px-1 text-center flex items-center select-none font-mono-table"
              :class="{
                'cursor-pointer': column.columnType !== 'preview'
              }"
              :style="{
                height: columnTitleHeight + 'px'
              }"
              @click.prevent="
                $event =>
                  column.columnType === 'preview'
                    ? null
                    : columnClicked($event, column.columnIndex, true)
              "
            >
              <span
                :title="columnData?.get(column.title)?.typeName"
                class="left-icon inline text-text-alpha/75 max-w-5 font-bold text-center"
                :class="{
                  'transform scale-x-125':
                    columnData?.get(column.title)?.typeHintLength || 3 <= 2,
                  'tracking-[-1px] transform scale-x-95':
                    columnData?.get(column.title)?.typeHintLength || 3 >= 4
                }"
              >
                {{ columnData?.get(column.title)?.typeHint }}
              </span>
              <span
                :title="column.displayTitle || column.title"
                class="flex-1 truncate pl-2"
              >
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
            :title="row?.values?.[column.columnIndex] as string"
            class="column-cell ellipsis whitespace-pre"
            :style="{
              top: columnHeaderHeight + row.index * rowHeight + 'px',
              height: rowHeight + 1 + 'px'
            }"
            v-html="row?.htmlValues?.[column.columnIndex]"
          ></div>
        </div>
      </div>
      <div
        class="sticky h-full left-0 order-[-1]"
        :class="{
          'z-[2]': !scrollIsLeft,
          'z-[1]': scrollIsLeft
        }"
      >
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
import { focusNext, focusPrevious, objectMap } from '@/utils';
import { TYPES_HINTS, TYPES_NAMES } from '@/utils/data-types';
import { throttle } from '@/utils/time';

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

interface ColumnData {
  typeHint: string;
  typeHintLength: number;
  typeName: string;
}

const columnData = ref<Map<string, ColumnData>>(new Map<string, ColumnData>());

watch(
  columnsHeader,
  header => {
    header.forEach(column => {
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
      const typeHint = TYPES_HINTS[dataType] || dataType || '';
      if (typeHint) {
        columnData.value.set(column.title, {
          typeHint,
          typeHintLength: typeHint.length,
          typeName: TYPES_NAMES[dataType] || dataType || 'unknown'
        });
      }
    });

    const firstPreviewColumn = header.find(
      column => column.columnType === 'preview'
    );

    if (firstPreviewColumn) {
      const firstPreviewColumnHtmlElement = document.querySelector(
        `[data-column-index="${firstPreviewColumn.columnIndex}"]`
      );
      if (firstPreviewColumnHtmlElement) {
        firstPreviewColumnHtmlElement.scrollIntoView();
      }
    }
  },
  { immediate: true }
);

const visibleRowsRange = ref([0, 10]);
const scrollIsLeft = ref(false);

const updateScroll = throttle(function () {
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

const onScroll = () => {
  updateScroll();
  scrollIsLeft.value = scrollElement?.value?.scrollLeft === 0;
};

const visibleRows = computed(() => {
  const [start, stop] = visibleRowsRange.value;
  return rowsData.value
    .filter(row => {
      return row && row.index >= start - 25 && row.index <= stop + 25;
    })
    .map(row => {
      return {
        ...row,
        htmlValues: row.values ? objectMap(row.values, getValue) : row.values
      };
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

let moreElement: HTMLElement | null = null;

let _cellElement: HTMLElement | null = null;

const expandCell = (cellElement: HTMLElement) => {
  const columnElement = cellElement.parentElement;
  const tableElement = columnElement?.parentElement;

  if (!columnElement || !tableElement) {
    return;
  }

  let elements = Array.from(
    tableElement.getElementsByClassName('has-expanded-cell')
  );

  elements.forEach(element => element.classList.remove('has-expanded-cell'));

  elements = Array.from(tableElement.getElementsByClassName('cell-expanded'));

  elements.forEach(element => element.classList.remove('cell-expanded'));

  columnElement.classList.add('has-expanded-cell');

  cellElement.classList.add('cell-expanded');

  _cellElement = cellElement;
};

const restoreCell = (cellElement?: HTMLElement) => {
  cellElement = _cellElement || cellElement;
  if (cellElement) {
    const columnElement = cellElement.parentElement;
    cellElement.classList.remove('cell-expanded');
    columnElement?.classList.remove('has-expanded-cell');
  }
};

const initMoreElement = () => {
  if (moreElement) {
    return moreElement;
  }
  const clickOutsideExpandedCell = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.classList || !target.classList.contains('cell-expanded')) {
      restoreCell();
    }
  };
  moreElement = document.createElement('div');
  moreElement.classList.add('action-icon');
  moreElement.onmousedown = e => {
    const cell = (e.target as HTMLElement)?.parentElement;
    if (cell && cell.classList.contains('cell-expanded')) {
      restoreCell(cell);
      document.onmousedown = null;
    } else if (cell) {
      expandCell(cell);
      document.onmousedown = clickOutsideExpandedCell;
    }
    e.preventDefault();
    e.stopPropagation();
  };
  return moreElement;
};

const removeMoreElement = () => {
  if (moreElement && moreElement.parentElement) {
    moreElement.parentElement.removeChild(moreElement);
  }
};

const checkCellHover = (event: MouseEvent) => {
  event = event || window.event;
  const element = event.target as HTMLElement;
  // check if targetElement is a cell by checking if it has a class column-cell
  if (
    element &&
    element.className &&
    element.classList.contains('column-cell') &&
    moreElement
  ) {
    if (element.classList.contains('cell-expanded')) {
      element.appendChild(moreElement);
    } else {
      const textWidth = element.innerText.length * 7;
      const width = element.offsetWidth - 12;
      if (textWidth > width) {
        element.classList.add('cell-to-expand');
        element.appendChild(moreElement);
      } else {
        element.classList.remove('cell-to-expand');
        return removeMoreElement();
      }
    }
  }
};

onMounted(() => {
  initMoreElement();
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
      .filter(c => c.columnType !== 'preview')
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

.has-expanded-cell,
.cell-expanded {
  @apply z-[30] #{!important};
}

.column-cell {
  &.cell-expanded {
    background-color: white;
    width: 400px;
    min-height: 170px;
    padding: 2px 17px 2px 7px;
    margin-top: -2px;
    margin-left: -3px;
    white-space: pre-wrap !important;
    border-style: none !important;
    word-break: break-word;
    overflow-y: auto;

    @apply shadow-[1px_1px_10px_0px_rgba(0,0,0,0.08)];

    .action-icon {
      font-size: 14px;
      @apply relative cursor-pointer;
      @apply absolute right-[5px] top-[5px];
      @apply w-[1em] h-[1em] p-0;
      @apply bg-transparent opacity-50;
      @apply transform rotate-45;
      &::after {
        content: '';
        @apply absolute bg-text;
        @apply w-[2px] h-[1em] left-[calc(0.5em-1px)];
      }
      &::before {
        content: '';
        @apply absolute bg-text;
        @apply w-[1em] h-[2px] top-[calc(0.5em-1px)];
      }
    }
  }
  &:not(.cell-expanded) {
    @apply pr-4;
    .action-icon {
      font-size: 8px;
      @apply cursor-pointer;
      @apply absolute right-[5px] top-[calc(50%-4px)];
      @apply w-[1em] h-[1em];
      @apply bg-transparent opacity-50;
      @apply border-text border-[2px];
      @apply border-l-0 border-b-0;
      @apply transform rotate-45;
    }
  }
}

.has-expanded-cell:last-child .column-cell.cell-expanded {
  margin-left: calc(100% - 397px);
}

.has-expanded-cell:nth-last-child(2) .column-cell.cell-expanded {
  margin-left: calc(200% - 397px);
}
</style>
