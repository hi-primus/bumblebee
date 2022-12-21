<template>
  <div class="px-2">
    <PlotBarsBase
      v-bind="{ ...$attrs, ...props }"
      selection-type="ranges"
      :height="90 - 20"
      @hovered="
        emit('hovered', $event);
        hovered = $event;
      "
    />
    {{ hovered }}
  </div>
</template>

<script setup lang="ts">
import PlotBarsBase from './BarsBase.vue';

import { HistValue } from '@/types/profile';

type PlotBarsBaseProps = InstanceType<typeof PlotBarsBase>['$props'];

interface PlotHistProps extends PlotBarsBaseProps {
  data: HistValue[];
}

const props = defineProps<PlotHistProps>();

type Emits = {
  (e: 'hovered', index: number): void;
};
const emit = defineEmits<Emits>();

const hovered = ref<number | null>(null);
</script>
