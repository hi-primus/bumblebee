<template>
  <v-stage
    ref="konva"
    class="konva-canvas-container"
    :config="{ width: stageWidth, height }"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseleave="setHovered(-1)"
  >
    <v-layer>
      <v-rect
        v-if="selectable && selectionRange && selectionRange.length"
        :config="{
          ...selectionRect,
          y: 0,
          height: height,
          fill: '#00000020'
        }"
      ></v-rect>
      <v-rect
        v-for="(value, index) in data"
        :key="index + 'b'"
        :config="getBackConfig(index)"
        @mouseenter="setHovered(index)"
        @mouseleave="unsetHovered(index)"
      ></v-rect>
      <v-rect
        v-for="(value, index) in data"
        :key="index"
        :config="getRectConfig(index)"
      ></v-rect>
    </v-layer>
  </v-stage>
</template>

<script setup lang="ts">
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage } from 'konva/lib/Stage';
import { PropType, Ref } from 'vue';

import { TableSelection } from '@/types/operations';
import { FrequencyValue, HistValue } from '@/types/profile';
import { stepify } from '@/utils';

const tailwindColors = useTailwindThemeColors();

const props = defineProps({
  data: {
    type: Array as PropType<HistValue[] | FrequencyValue[]>,
    default: () => []
  },
  columnName: {
    type: String,
    default: ''
  },
  selectionType: {
    type: String as PropType<'ranges' | 'values'>,
    default: 'values',
    required: true
  },
  width: {
    type: [Number, String] as PropType<number | 'auto'>,
    default: 'auto'
  },
  binWidth: {
    type: Number,
    default: 6
  },
  maxVal: {
    type: Number,
    default: 0
  },
  binMargin: {
    type: Number,
    default: 1
  },
  height: {
    type: Number,
    default: 90
  },
  selectable: {
    type: [Boolean, String] as PropType<boolean | 'single'>,
    default: false
  },
  colors: {
    type: Object as PropType<{
      selected: string;
      hovered: string;
      default: string;
    }>
  }
});

type Emits = {
  (e: 'hovered', index: number): void;
};
const emit = defineEmits<Emits>();

const konva = ref<Stage | null>(null);

const DEFAULT_RECT_CONFIG = {
  x: 10,
  y: 0,
  height: 100,
  width: 9,
  stroke: 'black',
  strokeWidth: 0
};

const selectionRange = ref<[number, number] | []>([]);
const selectionRect = ref({});
const bins = ref(
  props.data.map(() => ({
    hovered: false,
    selected: false,
    selecting: false
  }))
);
const totalWidth = ref(0);
const selecting = ref(false);
const multipleSelection = ref(false);

const selection = inject('selection') as Ref<TableSelection>;

if (props.selectable) {
  if (!props.columnName) {
    throw new Error('Column name is required for selectable bars');
  }
  if (!selection) {
    throw new Error('Selection is required for selectable bars');
  }
}

const calculatedMaxVal = computed(() => {
  return (
    props.maxVal ||
    props.data.reduce(
      (prev, current) => (prev.count > current.count ? prev : current),
      { count: 0 }
    ).count ||
    1
  );
});

const binBorder = computed(() => {
  return props.binMargin >= 0
    ? props.binMargin
    : Math.ceil(totalWidth.value / 8 / (props.data?.length || 1));
});

const calculatedBinWidth = computed(() => {
  return totalWidth.value
    ? Math.floor(
        (totalWidth.value + binBorder.value) / (props.data?.length || 1)
      )
    : props.binWidth;
});

const stageWidth = computed(() => {
  return calculatedBinWidth.value * (props.data?.length || 1);
});

const colors = computed(() => {
  if (props.colors) {
    return props.colors;
  }
  if (typeof tailwindColors?.primary === 'object') {
    return {
      selected: tailwindColors?.primary?.darkest,
      hovered: tailwindColors?.primary?.darker,
      default: tailwindColors?.primary?.dark
    };
  }
  return {
    selected: '#555',
    hovered: '#666',
    default: '#777'
  };
});

onBeforeMount(() => {
  totalWidth.value = props.width === 'auto' ? 0 : props.width;
});

onMounted(() => {
  if (props.width === 'auto') {
    nextTick(() => {
      fitIntoParent();
    });
  }
});

watch(selection, () => {
  console.log('selection changed', selection?.value);
  if (props.selectable) {
    if (selection?.value?.columns[0] !== props.columnName) {
      bins.value = bins.value.map(e => {
        return {
          ...e,
          selected: false,
          selecting: false
        };
      });
    } else {
      bins.value = bins.value.map((e, i) => {
        const selected = selection?.value?.indices?.includes(i) || false;
        return {
          ...e,
          selected,
          selecting: false
        };
      });
    }
  }
});

const addMouseUpEventListener = () => {
  document.documentElement.addEventListener('mouseup', onMouseUp, {
    passive: true
  });
};
const removeMouseUpEventListener = () => {
  document.documentElement.removeEventListener('mouseup', onMouseUp);
};

const fitIntoParent = async () => {
  const container = konva.value?.getStage()?.container();
  window.stage = konva.value?.getStage();
  const _totalWidth = container?.offsetWidth;

  if (!_totalWidth) {
    console.log({ container, konva: konva.value, _totalWidth });
    await new Promise(resolve => setTimeout(() => resolve(true), 100));
    fitIntoParent();
  } else {
    totalWidth.value = _totalWidth;
  }
};

const onMouseDown = (event: KonvaEventObject<MouseEvent>) => {
  if (!props.selectable) {
    return;
  }
  if (event.evt.which === 1) {
    addMouseUpEventListener();
    selecting.value = true;
    multipleSelection.value =
      event.evt.ctrlKey && props.selectable !== 'single';
    selectionRange.value = [event.evt.offsetX, event.evt.offsetX];
    updateSelectionRange(event.evt.offsetX);
  } else if (event.evt.which === 3 && !multipleSelection.value) {
    setSelection();
  }
};

const onMouseMove = (event: KonvaEventObject<MouseEvent>) => {
  if (!props.selectable) {
    return;
  }
  if (selectionRange.value.length) {
    updateSelectionRange(event.evt.offsetX);
  }
};

const updateSelectionRange = (offsetX: number) => {
  selectionRange.value[1] = offsetX;
  const sr = [...selectionRange.value];

  sr.sort((a, b) => a - b);

  const b2 = binBorder.value / 2;

  sr[0] = stepify(sr[0] + b2, calculatedBinWidth.value, Math.floor);
  sr[1] = stepify(sr[1] + b2, calculatedBinWidth.value, Math.ceil);

  let width = sr[1] - sr[0];

  if (width) {
    width -= binBorder.value;
  }

  selectionRect.value = { x: sr[0], width };

  const start = +(sr[0] / calculatedBinWidth.value).toPrecision(6);
  const end = +(sr[1] / calculatedBinWidth.value).toPrecision(6);
  setSelection(start, end);
};

const onMouseUp = () => {
  removeMouseUpEventListener();
  if (!props.selectable || !selecting.value) {
    return;
  }
  selecting.value = false;
  selectionRange.value = [];
  selectionRect.value = {};
  const _s = bins.value
    .map((e, i) => (e.selected || e.selecting ? i : -1))
    .filter(e => e >= 0);
  if (selection) {
    if (_s !== selection?.value?.indices) {
      if (props.selectionType === 'ranges') {
        console.log('update:selected ranges', _s);
        selection.value = {
          columns: [props.columnName],
          ranges: _s.map(e => props.data[e].value) as [number, number][],
          values: null,
          indices: _s
        };
      } else {
        console.log('update:selected values', _s);
        selection.value = {
          columns: [props.columnName],
          ranges: null,
          values: _s.map(e => props.data[e].value) as BasicType[],
          indices: _s
        };
      }
    }
  }
};

const setHovered = (index: number) => {
  bins.value = bins.value.map(e => ({ ...e, hovered: false }));
  if (index >= 0) {
    bins.value[index] && (bins.value[index].hovered = true);
  }
  emit('hovered', index);
};

const unsetHovered = (index: number) => {
  if (index >= 0) {
    bins.value[index] && (bins.value[index].hovered = false);
  }
};

const setSelection = (from = -1, to = -2) => {
  if (from === to) {
    from--;
  }

  if (
    from >= 0 &&
    !multipleSelection.value &&
    to - from <= 1 &&
    bins.value[from] &&
    bins.value[from].selected
  ) {
    bins.value = bins.value.map(e => ({
      ...e,
      selecting: false,
      selected: false
    }));
    return;
  }

  if (!multipleSelection.value) {
    bins.value = bins.value.map(e => ({
      ...e,
      selecting: false,
      selected: false
    }));
  }

  if (from >= 0) {
    for (let i = from; i < to; i++) {
      bins.value[i].selecting = true;
    }
  }
};

const getBackConfig = (index: number) => {
  return {
    ...DEFAULT_RECT_CONFIG,
    width: calculatedBinWidth.value - binBorder.value,
    height: props.height,
    y: 0,
    x: calculatedBinWidth.value * index,
    fill:
      bins.value[index] &&
      (bins.value[index].hovered || bins.value[index].selected) &&
      !bins.value[index].selecting
        ? '#00000010'
        : '#0000'
  };
};

const getRectConfig = (index: number) => {
  let h = props.height * (props.data[index].count / calculatedMaxVal.value);
  const hmin = Math.max(Math.ceil(props.binWidth / 16), 2);
  const opacity = h > hmin ? 1 : 0.5 + (h / hmin) * 0.5;
  h = Math.max(h, hmin);

  const fill =
    bins.value[index] &&
    (bins.value[index].selected
      ? colors.value.selected
      : bins.value[index].selecting
      ? colors.value.selected
      : bins.value[index].hovered
      ? colors.value.hovered
      : colors.value.default);

  return {
    ...getBackConfig(index),
    height: h,
    y: props.height - h,
    fill,
    opacity,
    listening: false
  };
};
</script>

<style lang="scss">
.konva-canvas-container {
  overflow: hidden;
  width: 100%;

  & > * {
    margin: auto;
  }

  canvas {
    cursor: crosshair;
  }
}
</style>
