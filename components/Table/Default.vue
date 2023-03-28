<template>
  <div
    ref="scrollElement"
    class="z-20 w-full h-full overflow-auto"
    @scroll.passive="onScroll"
  >
    <div
      class="bumblebee-table-container relative flex h-full w-[max-content] text-sm font-mono-table text-neutral-alpha"
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
          class="bumblebee-table-column-container relative"
          :tabindex="column.columnType.startsWith('preview') ? -1 : 0"
          :data-index="column.columnIndex"
          @keydown="
            $event =>
              column.columnType.startsWith('preview')
                ? null
                : handleKeyDown($event, column.columnIndex)
          "
          @mousedown.prevent
        >
          <div
            :class="{
              'column-color-preview': column.columnType == 'preview',
              'column-color-preview-secondary':
                column.columnType == 'preview secondary',
              'column-color-preview-tertiary':
                column.columnType == 'preview tertiary',
              'column-color-primary':
                column.columnType == 'highlighted' ||
                selection?.columns.includes(column.title),
              'column-color-secondary':
                column.columnType == 'highlighted secondary',
              'column-color-tertiary':
                column.columnType == 'highlighted tertiary'
            }"
            class="bumblebee-table-column relative"
            :style="{
              height: columnHeaderHeight + safeRowsCount * rowHeight + 'px',
              width: (columnWidths[column.title] || minColumnWidth) + 'px'
            }"
          >
            <div :data-column-index="column.columnIndex" class="column-header">
              <div
                class="column-title border-[color:var(--line-color)] border-b text-[16px] py-1 px-1 text-center flex items-center select-none font-mono-table"
                :class="{
                  'cursor-pointer': !column.columnType.startsWith('preview')
                }"
                :style="{
                  height: columnTitleHeight + 'px'
                }"
                @click.prevent="
                  $event =>
                    column.columnType.startsWith('preview')
                      ? null
                      : columnClicked($event, column.columnIndex, true)
                "
              >
                <span
                  :key="
                    columnData[column.title]?.typeName ||
                    columnData[column.title]?.typeHint
                  "
                  v-tooltip="
                    columnData[column.title]?.typeName ||
                    columnData[column.title]?.typeHint
                  "
                  class="left-icon inline text-neutral-alpha/75 max-w-5 font-bold text-center"
                  :class="{
                    'transform scale-x-125':
                      (columnData[column.title]?.typeHintLength || 3) <= 2,
                    'tracking-[-1px] transform scale-x-95':
                      (columnData[column.title]?.typeHintLength || 3) >= 4
                  }"
                >
                  {{ columnData[column.title]?.typeHint }}
                </span>
                <span
                  v-tooltip="column.displayTitle || column.title"
                  class="flex-1 truncate pl-2"
                >
                  {{ column.displayTitle || column.title }}
                </span>
                <div class="flex-0 w-[24px] right-icon"></div>
              </div>
              <PlotColumn
                class="column-plot"
                :data-index="column.columnIndex"
                :style="{
                  height: columnPlotHeight + 'px'
                }"
                :data="column"
              />
            </div>
            <div
              v-for="row in visibleRows"
              :key="`col-${column?.title}-${row.index}`"
              :title="(row?.values?.[column.columnIndex] as string)"
              class="column-cell ellipsis"
              :style="{
                top: columnHeaderHeight + row.index * rowHeight + 'px',
                height: rowHeight + 1 + 'px'
              }"
              v-html="row?.htmlValues?.[column.columnIndex]"
            ></div>
          </div>

          <div
            class="column-resize-handler absolute right-[-4px] top-0 z-[20] w-[9px] h-full cursor-col-resize"
            @click.stop
            @mousedown.prevent.stop="onResizeStart($event, column.columnIndex)"
          ></div>
        </div>
      </div>
      <div
        class="sticky h-full left-0 order-[-1]"
        :class="{
          'z-[16]': !scrollIsLeft,
          'z-[1]': scrollIsLeft
        }"
      >
        <div
          class="bumblebee-columns-rows-indices h-full bg-white text-neutral-lightest border-line-light border-r font-mono font-200 text-right"
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
import { focusNext, focusPrevious } from '@/utils';
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
const minColumnWidth = 173;
const rowHeight = 24;

const scrollElement = ref<HTMLElement | null>(null);

const columns = ref<HTMLElement | null>(null);
const columnWidths = ref<Record<string, number>>({});

const data = ref<Record<number, unknown[]>>({});

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

const columnData = reactive<Record<string, ColumnData>>({});

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
        columnData[column.title] = {
          typeHint,
          typeHintLength: typeHint.length,
          typeName: TYPES_NAMES[dataType] || dataType || 'unknown'
        };
      }
    });

    const firstPreviewColumn = header.find(column =>
      column.columnType.startsWith('preview')
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

const updateTopToEnd = throttle(function () {
  const table = scrollElement.value?.querySelector(
    '.bumblebee-table'
  ) as HTMLElement;
  if (!scrollElement.value || !table) {
    return;
  }
  const h1 = scrollElement.value.clientHeight;
  const h2 = table.clientHeight - scrollElement.value.scrollTop - 200;
  document.body.style.setProperty('--top-to-end', Math.min(h1, h2) + 'px');
  scrollIsLeft.value = scrollElement?.value?.scrollLeft === 0;
}, 100);

const onScroll = () => {
  updateScroll();
  updateTopToEnd();
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
    return '<span class="text-neutral-lighter">None</span>';
  } else if (value === '') {
    return '<span class="text-neutral-lighter">Empty</span>';
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

const reloadPlot = (columnName: string) => {
  const column = columnsHeader.value.find(c => c.title === columnName);
  const columnIndex = column?.columnIndex;
  if (columnIndex === undefined) {
    return;
  }

  const plotElement = scrollElement.value?.querySelector(
    `[data-column-index='${columnIndex}'] .bars-base-container`
  ) as { fitIntoParent?: () => void } | null;

  if (plotElement && plotElement.fitIntoParent) {
    plotElement.fitIntoParent();
  }
};

let resizeStartX: number | null = null;
let resizeStartWidth: number | null = null;
let resizeNewX: number | null = null;
let resizeElement: HTMLElement | null = null;
let resizeElementName = '';

const onResizeStart = (event: MouseEvent, columnIndex: number) => {
  event = event || window.event;
  event = event || window.event;
  event.preventDefault();
  event.stopPropagation();
  resizeStartX = event.clientX;
  resizeNewX = event.clientX;
  resizeElement = event.target as HTMLElement;
  resizeElementName = props.header[columnIndex].title;
  resizeStartWidth = columnWidths.value[resizeElementName] || 172;
  document.onmouseup = resizeEnd;
  document.onmousemove = resizeDrag;
  const columnElement = document.querySelector(
    `[data-column-index="${columnIndex}"]`
  );
};

const resizeDrag = (event: MouseEvent) => {
  if (resizeNewX === null || resizeStartX === null || resizeElement === null) {
    return;
  }
  event = event || window.event;
  event.preventDefault();
  event.stopPropagation();
  resizeNewX = event.clientX;

  setColumnWidth();
};

const resizeEnd = () => {
  reloadPlot(resizeElementName);

  document.onmouseup = null;
  document.onmousemove = null;
  resizeNewX = null;
  resizeStartX = null;
  resizeElement = null;
  resizeElementName = '';

  // saveCacheThrottled();
};

const setColumnWidth = () => {
  if (
    resizeNewX === null ||
    resizeStartX === null ||
    resizeStartWidth === null ||
    resizeElementName === ''
  ) {
    return;
  }
  const grow = resizeNewX - resizeStartX;
  const name = resizeElementName;
  let width = resizeStartWidth;
  width += grow;
  width = Math.max(width, 150);

  columnWidths.value[name] = width;
};

let moreElement: HTMLElement | null = null;

let _cellElement: HTMLElement | null = null;

const expandCell = (cellElement: HTMLElement) => {
  const columnElement = cellElement?.parentElement;
  const columnContainerElement = columnElement?.parentElement;
  const columnsElement = columnContainerElement?.parentElement;

  if (!columnContainerElement || !columnsElement) {
    return;
  }

  let elements = Array.from(
    columnsElement.getElementsByClassName('column-with-expanded-cell')
  );

  elements.forEach(element =>
    element.classList.remove('column-with-expanded-cell')
  );

  elements = Array.from(columnsElement.getElementsByClassName('expanded-cell'));

  elements.forEach(element => element.classList.remove('expanded-cell'));

  cellElement.classList.add('expanded-cell');

  columnContainerElement.classList.add('column-with-expanded-cell');

  columnsElement.classList.add('table-with-expanded-cell');

  _cellElement = cellElement;
};

const restoreCell = (cellElement?: HTMLElement) => {
  cellElement = _cellElement || cellElement;
  if (cellElement) {
    const columnElement = cellElement?.parentElement;
    const columnContainerElement = columnElement?.parentElement;
    const columnsElement = columnContainerElement?.parentElement;
    cellElement.classList.remove('expanded-cell');
    columnContainerElement?.classList.remove('column-with-expanded-cell');
    columnsElement?.classList.remove('table-with-expanded-cell');
  }
};

const initMoreElement = () => {
  if (moreElement) {
    return moreElement;
  }
  const clickOutsideExpandedCell = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.classList || !target.classList.contains('expanded-cell')) {
      restoreCell();
    }
  };
  moreElement = document.createElement('div');
  moreElement.classList.add('action-icon');
  moreElement.onmousedown = e => {
    const cell = (e.target as HTMLElement)?.parentElement;
    if (cell && cell.classList.contains('expanded-cell')) {
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
    if (element.classList.contains('expanded-cell')) {
      element.appendChild(moreElement);
    } else {
      const textWidth = element.innerText.length * 7;
      const width = element.offsetWidth - 18;
      if (textWidth >= width) {
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
.bumblebee-table-column-container {
  z-index: auto;
  &:focus {
    outline: none;
    & .column-header::after {
      z-index: 3;
      content: '';
      max-height: calc(100vh - 100px);
      height: var(--top-to-end, calc(100vh - 100px));
      transition: height 0.05s linear;
      @apply absolute -top-px -left-px -right-px -bottom-px;
      @apply pointer-events-none;
      @apply outline-offset-[-3px] outline-dashed outline-2;
      @apply outline-neutral-light;
      @apply opacity-75;
    }
  }
}
.bumblebee-table-column {
  &:not([class*='column-color-']) {
    --line-color: theme('colors.line.light');
    z-index: 1;
  }
  &[class*='column-color-'] {
    .column-cell {
      @apply z-[2];
    }
  }
  .column-cell {
    @apply whitespace-pre z-[1];
  }
  & .column-header {
    @apply bg-white z-[15];
  }
  &.column-color-primary,
  &.column-color-preview-tertiary {
    --line-color: theme('colors.primary.lighter');
    &,
    & .column-header > * {
      @apply bg-primary/10;
    }
  }
  &.column-color-preview,
  &.column-color-tertiary {
    --line-color: theme('colors.yellow.lighter');
    &,
    & .column-header > * {
      @apply bg-yellow/10;
    }
  }
  &.column-color-preview-secondary,
  &.column-color-secondary {
    @apply z-[3];
    --line-color: theme('colors.green.light');
    &,
    & .column-header > * {
      @apply bg-green/10;
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
  &.row-color-danger {
    @apply bg-danger-highlight;
  }
  &.row-color-warning {
    @apply bg-warning-highlight;
  }
}

.expanded-cell {
  z-index: 30 !important;
}

.column-cell {
  &.expanded-cell {
    background-color: white;
    width: 400px;
    min-width: calc(100% + 6px);
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
        @apply absolute bg-neutral;
        @apply w-[2px] h-[1em] left-[calc(0.5em-1px)];
      }
      &::before {
        content: '';
        @apply absolute bg-neutral;
        @apply w-[1em] h-[2px] top-[calc(0.5em-1px)];
      }
    }
  }
  &:not(.expanded-cell) {
    @apply pr-4;
    .action-icon {
      font-size: 8px;
      @apply cursor-pointer;
      @apply absolute right-[5px] top-[calc(50%-4px)];
      @apply w-[1em] h-[1em];
      @apply bg-transparent opacity-50;
      @apply border-neutral border-[2px];
      @apply border-l-0 border-b-0;
      @apply transform rotate-45;
    }
  }
}

.column-with-expanded-cell .bumblebee-table-column {
  z-index: auto !important;
}

.column-with-expanded-cell:last-child .column-cell.expanded-cell {
  margin-left: calc(100% - 397px);
}

.column-with-expanded-cell:nth-last-child(2) .column-cell.expanded-cell {
  margin-left: calc(200% - 397px);
}
</style>
