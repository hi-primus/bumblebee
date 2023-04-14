<template>
  <div class="bg-neutral-lightest/50 h-2 flex w-full cursor-crosshair">
    <div
      class="bg-primary hover:bg-primary-dark h-full"
      :class="{ 'min-w-1': data.match > 0 }"
      :style="{
        width: `${getPercentage('match')}%`
      }"
      @click="select('match')"
      @mouseenter="onHovered('match')"
    ></div>
    <div
      class="bg-danger-desaturated hover:bg-danger-desaturated-dark h-full"
      :class="{ 'min-w-1': data.mismatch > 0 }"
      :style="{
        width: `${getPercentage('mismatch')}%`
      }"
      @click="select('mismatch')"
      @mouseenter="onHovered('mismatch')"
    ></div>
    <div
      class="bg-neutral-lighter/50 hover:bg-neutral-light/50 h-full"
      :class="{ 'min-w-5': data.missing > 0 }"
      :style="{
        width: `${getPercentage('missing')}%`
      }"
      @click="select('missing')"
      @mouseenter="onHovered('missing')"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { PropType, Ref } from 'vue';

import { TableSelection } from '@/types/operations';

const selection = inject('selection') as Ref<TableSelection>;

const props = defineProps({
  data: {
    type: Object as PropType<{
      match: number;
      mismatch: number;
      missing: number;
    }>,
    required: true
  },
  columnName: {
    type: String
  },
  selectable: {
    type: Boolean,
    default: false
  }
});

type Emits = {
  (e: 'hovered', value: string): void;
};
const emit = defineEmits<Emits>();

const onHovered = (type: 'match' | 'mismatch' | 'missing') => {
  const value = props.data[type];
  const typeString = {
    match: ['match', 'matches'],
    mismatch: ['mismatch', 'mismatches'],
    missing: ['missing value', 'missing values']
  }[type][value === 1 ? 0 : 1];
  emit(
    'hovered',
    `${value} ${typeString} (${Math.round(getPercentage(type) * 100) / 100}%)`
  );
};

const select = (type: 'match' | 'mismatch' | 'missing') => {
  if (props.columnName && props.selectable) {
    selection.value = {
      columns: [props.columnName],
      ranges: null,
      values: type,
      indices: null
    };
  }
};

const getPercentage = (type: 'match' | 'mismatch' | 'missing') => {
  return (
    (props.data[type] /
      (props.data.match + props.data.mismatch + props.data.missing)) *
    100
  );
};
</script>
