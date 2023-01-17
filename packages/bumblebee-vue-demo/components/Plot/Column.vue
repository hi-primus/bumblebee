<template>
  <div @mouseleave="hovered = null">
    <PlotDataQuality
      v-if="
        data.stats?.match !== undefined &&
        data.stats?.missing !== undefined &&
        data.stats?.mismatch !== undefined
      "
      :data="data.stats"
      :column-name="data.title"
      selectable
      @hovered="hovered = $event"
    />
    <div class="px-1 pt-[2px]">
      <PlotHist
        v-if="data.stats?.hist"
        :data="data.stats?.hist"
        :column-name="data.title"
        selectable
        @hovered="hovered = $event"
      />
      <PlotFrequency
        v-else-if="data.stats?.frequency"
        :data="data.stats?.frequency"
        :column-name="data.title"
        selectable
        @hovered="hovered = $event"
      />
      <div
        class="w-full truncate"
        :class="{
          'text-primary-dark': hovered,
          'text-text': !hovered
        }"
      >
        <!-- TODO: use truncate on the value of name instead of all the string -->
        <template v-if="hovered">
          {{ hovered }}
        </template>
        <template v-else-if="data.stats?.frequency">
          {{ data.stats.frequency.length }}
          unique values
        </template>
        <template v-else-if="data.stats?.hist">
          {{
            data.stats.hist[0].value[0] -
            data.stats.hist[data.stats.hist.length - 1].value[1]
          }}: {{ data.stats.match }} values
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Column } from '@/types/dataframe';

defineProps<{
  data: Column;
}>();

const hovered = ref<string | null>(null);
</script>
