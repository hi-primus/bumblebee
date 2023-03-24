<template>
  <PlotBarsBase
    selection-type="values"
    :height="90 - 30"
    v-bind="{ ...props, ...$attrs }"
    @hovered="onHovered"
  />
</template>

<script setup lang="ts">
import PlotBarsBase from './BarsBase.vue';

import { FrequencyValue } from '@/types/dataframe';

type PlotBarsBaseProps = InstanceType<typeof PlotBarsBase>['$props'];

interface PlotFrequencyProps extends PlotBarsBaseProps {
  data: FrequencyValue[];
}

const props = defineProps<PlotFrequencyProps>();

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
  emit('hovered', `${value.value}: ${value.count}`);
};
</script>
