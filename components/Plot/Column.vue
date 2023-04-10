<template>
  <div
    class="flex flex-col max-w-full h-full items-center justify-center"
    @mouseleave="hovered = null"
  >
    <PlotDataQuality
      v-if="
        stats?.match !== undefined &&
        stats?.missing !== undefined &&
        stats?.mismatch !== undefined
      "
      v-tooltip:bottom.follow-x="tooltipValue"
      :data="stats"
      :column-name="data.title"
      :selectable="data.columnType !== 'preview'"
      @hovered="$event => tooltipValue = ($event as string)"
    />
    <div
      class="px-1 pt-[2px] w-full flex flex-col flex-1 items-center justify-center"
    >
      <PlotHist
        v-if="stats?.hist"
        v-tooltip:bottom.follow-x="tooltipValue"
        :data="stats?.hist"
        :column-name="data.title"
        :selectable="data.columnType !== 'preview'"
        @hovered="$event => tooltipValue = ($event as string)"
      />
      <PlotFrequency
        v-else-if="stats?.frequency"
        v-tooltip:bottom.follow-x="tooltipValue"
        :data="stats?.frequency"
        :column-name="data.title"
        :selectable="data.columnType !== 'preview'"
        @hovered="$event => tooltipValue = ($event as string)"
      />
      <Icon
        v-else
        :path="mdiLoading"
        class="flex-1 w-8 h-8 text-neutral-lighter animate-spin"
      />
      <div
        class="w-full truncate"
        :class="{
          'text-primary-dark': hovered,
          'text-current': !hovered
        }"
      >
        <template v-if="hovered">
          {{ hovered }}
        </template>
        <template v-else-if="stats?.frequency && stats.count_uniques">
          <template v-if="stats.frequency.length !== stats.count_uniques">
            {{ stats.frequency.length }}
            of
            {{ stats.count_uniques }}
          </template>
          <template v-else>
            {{ stats.count_uniques }}
          </template>
          {{ stats.count_uniques === 1 ? 'unique value' : 'unique values' }}
        </template>
        <template v-else-if="stats?.frequency">
          {{ stats.frequency.length }}
          {{ stats.frequency.length === 1 ? 'unique value' : 'unique values' }}
        </template>
        <template v-else-if="stats?.hist">
          {{ stats.hist[0].lower }} -
          {{ stats.hist[stats.hist.length - 1].upper }}:
          {{ stats.match }} values
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mdiLoading } from '@mdi/js';

import { ColumnHeader } from '@/types/dataframe';
import { compareObjects } from '@/utils';

const props = defineProps<{
  data: ColumnHeader;
}>();

const tooltipValue = ref('');

const hovered = ref<string | null>(null); // TODO: remove

const stats = ref<typeof props.data.stats | null>(null);

watch(
  () => props.data.stats,
  newStats => {
    if (!compareObjects(newStats, stats.value) && newStats) {
      stats.value = newStats;
    }
  },
  { immediate: true }
);
</script>
