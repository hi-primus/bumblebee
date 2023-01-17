<template>
  <div class="bg-text-lightest/50 h-2 flex w-full">
    <div
      class="bg-primary-dark hover:bg-primary-darker h-2"
      :class="{ 'min-w-1': data.match > 0 }"
      :style="{
        width: `${getPercentage('match')}%`
      }"
      @mouseenter="onHovered('match')"
    ></div>
    <div
      class="bg-error-desaturated hover:bg-error-desaturated-dark h-2"
      :class="{ 'min-w-1': data.mismatch > 0 }"
      :style="{
        width: `${getPercentage('mismatch')}%`
      }"
      @mouseenter="onHovered('mismatch')"
    ></div>
    <div
      class="bg-text-lighter/50 hover:bg-text-light/50 h-2"
      :class="{ 'min-w-5': data.missing > 0 }"
      :style="{
        width: `${getPercentage('missing')}%`
      }"
      @mouseenter="onHovered('missing')"
    ></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: { match: number; mismatch: number; missing: number };
}

const props = defineProps<Props>();

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

const getPercentage = (type: 'match' | 'mismatch' | 'missing') => {
  return (
    (props.data[type] /
      (props.data.match + props.data.mismatch + props.data.missing)) *
    100
  );
};
</script>
