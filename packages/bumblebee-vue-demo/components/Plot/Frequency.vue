<template>
  <div class="px-1 pt-1">
    <PlotBarsBase
      selection-type="values"
      :height="90 - 24"
      v-bind="{ ...props, ...$attrs }"
      @hovered="
        emit('hovered', $event);
        hovered = $event;
      "
    />
    <div v-if="hovered === null || hovered < 0" class="">
      {{ data.length }} values
    </div>
    <div v-else class="text-primary-darker">
      {{ data[hovered].value }}: {{ data[hovered].count }}
    </div>
  </div>
</template>

<script setup lang="ts">
import PlotBarsBase from './BarsBase.vue';

import { FrequencyValue } from '@/types/profile';

type PlotBarsBaseProps = InstanceType<typeof PlotBarsBase>['$props'];

interface PlotFrequencyProps extends PlotBarsBaseProps {
  data: FrequencyValue[];
}

const props = defineProps<PlotFrequencyProps>();

type Emits = {
  (e: 'hovered', index: number): void;
};
const emit = defineEmits<Emits>();

const hovered = ref<number | null>(null);
</script>
