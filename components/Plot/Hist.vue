<template>
  <PlotBarsBase
    v-bind="{ ...$attrs, ...props, selectionType: 'ranges', height: 90 - 30 }"
    @hovered="onHovered"
  />
</template>

<script setup lang="ts">
import PlotBarsBase from './BarsBase.vue';

import { HistValue } from '@/types/dataframe';

type PlotBarsBaseProps = InstanceType<typeof PlotBarsBase>['$props'];

interface PlotHistProps extends PlotBarsBaseProps {
  data: HistValue[];
}

const props = defineProps<PlotHistProps>();

type Emits = {
  (e: 'hovered', value: string): void;
};
const emit = defineEmits<Emits>();

const hovered = ref<number | null>(null);

const onHovered = (index: number) => {
  if (hovered.value === index) return;
  hovered.value = index;
  if (index < 0) return;
  const value = props.data[index];
  emit('hovered', `${value.lower} - ${value.upper}: ${value.count}`);
};
</script>
