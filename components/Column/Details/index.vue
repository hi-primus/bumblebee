<template>
  <div class="details-container pt-2 border-b border-gray-lightest">
    <div
      class="flex h-8 gap-2 items-center px-4 pb-2 cursor-pointer select-none"
      @click="detailsExpanded = !detailsExpanded"
    >
      <ColumnTypeHint
        class="text-md text-neutral-light text-left w-[2em]"
        :data-type="dataType || 'unknown'"
      />
      <div class="flex-1 font-mono-table text-neutral">
        {{ column.title }}
      </div>
      <IconButton
        :path="mdiChevronDown"
        class="text-neutral"
        :class="{
          'rotate-180': detailsExpanded
        }"
      />
    </div>
    <div
      v-if="detailsExpanded"
      class="details flex flex-col gap-2 px-4 pt-2 pb-1 border-t border-gray-lightest"
    >
      <div v-if="column.stats">
        <h4>General</h4>
        <PlotDataQuality
          v-tooltip:bottom.follow-x="tooltipValue"
          :data="column.stats"
          :column-name="column.title"
          class="rounded-full overflow-hidden my-1 h-3"
          selectable
          @hovered="$event => tooltipValue = ($event as string)"
        />
        <ColumnDetailsTable :data="qualityData" />
      </div>
      <div v-if="column.stats?.hist">
        <h4>Histogram</h4>
        <PlotHist
          v-tooltip:bottom.follow-x="tooltipValue"
          :height="80"
          :data="column.stats.hist"
          :column-name="column.title"
          selectable
          @hovered="$event => tooltipValue = ($event as string)"
        />
      </div>
      <div v-if="column.stats?.frequency">
        <h4>Frequency</h4>
        <PlotFrequency
          v-tooltip:bottom.follow-x="tooltipValue"
          :height="80"
          :data="column.stats.frequency"
          :column-name="column.title"
          selectable
          @hovered="$event => tooltipValue = ($event as string)"
        />
        <!-- class="rounded-full overflow-hidden my-1 h-3" -->
      </div>
      <div>
        <h4>Patterns</h4>
        <ColumnDetailsTable
          v-if="patternsFrequency[patternsResolution]"
          :data="patternsFrequency[patternsResolution].data"
          :total="patternsFrequency[patternsResolution].total"
          :display-value-index="1"
          value-class="first:font-mono-table"
          selectable
          @select="row => selectPattern(row, patternsResolution)"
        />
        <ColumnDetailsTable
          v-else-if="patternsFrequency[previousPatternsResolution]"
          :data="patternsFrequency[previousPatternsResolution].data"
          :total="patternsFrequency[previousPatternsResolution].total"
          :display-value-index="1"
          value-class="first:font-mono-table"
          selectable
          @select="row => selectPattern(row, previousPatternsResolution)"
        />
        <AppButton
          v-else
          class="layout-outline color-primary mx-auto my-4 min-h-[100px]"
          @click="loadPatternsFrequency"
        >
          <Icon :path="mdiRefresh" />
          Reload patterns
        </AppButton>
        <AppSlider
          v-model="patternsResolution"
          class="px-4 py-4"
          :min="0"
          :max="3"
          :format="
            (value: number) => {
              switch (Math.round(value)) {
                case 0:
                  return `U, l, #, !`;
                case 1:
                  return 'c, #, !';
                case 2:
                  return '*, !';
                case 3:
                  return '*';
              }
            }
          "
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mdiChevronDown, mdiRefresh } from '@mdi/js';
import { PropType, Ref } from 'vue';

import { TidyValue } from '@/types/blurr';
import { Column, DataframeObject } from '@/types/dataframe';
import { TableSelection } from '@/types/operations';
import { getType } from '@/utils/data-types';

const props = defineProps({
  column: {
    type: Object as PropType<Column>,
    required: true
  },
  expanded: {
    type: Boolean
  }
});

const dataframeObject = inject<Ref<DataframeObject | null>>(
  'dataframe-object',
  ref(null)
);

const tooltipValue = ref('');

const detailsExpanded = ref(props.expanded);

const patternsFrequency = ref<
  ({
    data: [string, number][];
    total: number;
  } | null)[]
>([null, null, null, null]);

const patternsResolution = ref(0);
const previousPatternsResolution = ref(0);

const percentage = (value: number, total: number): string => {
  const n = (value / total) * 100;
  // format n to have two decimal digits and return it
  return +n.toFixed(2) + '%';
};

const dataType = computed<string>(() => {
  return getType(props.column);
});

const qualityData = computed<[string, number, string][]>(() => {
  const stats = props.column.stats;
  if (!stats) {
    return [];
  }
  const total = stats.match + stats.missing + stats.mismatch;
  return [
    ['Matches', stats.match, percentage(stats.match, total)],
    ['Missing', stats.missing, percentage(stats.missing, total)],
    ['Mismatches', stats.mismatch, percentage(stats.mismatch, total)]
  ];
});

const loadPatternsFrequency = async () => {
  const df = dataframeObject.value?.df;

  if (!df) {
    return;
  }

  const resolution = patternsResolution.value;

  if (patternsFrequency.value[resolution]) {
    return;
  }

  const result = await df.cols.patternCounts({
    cols: props.column.title,
    tidy: true,
    n: 5,
    mode: resolution
  });

  const data = (result as TidyValue<typeof result>).values.map(
    value => [value.value, value.count] as [string, number]
  );

  patternsFrequency.value[resolution] = {
    data,
    total: dataframeObject.value?.profile?.summary?.rows_count || 1
  };
};

const selection = inject('selection') as Ref<TableSelection>;

const selectPattern = (row: [string, number], resolution: number) => {
  const pattern = row[0];
  selection.value = {
    columns: [props.column.title],
    values: null,
    ranges: null,
    indices: null,
    pattern,
    mode: resolution
  };
};

watch(patternsResolution, (_value, oldValue) => {
  previousPatternsResolution.value = oldValue;
  loadPatternsFrequency();
});

onMounted(() => {
  loadPatternsFrequency();
});
</script>

<style scoped lang="scss">
.details-container {
  .details {
    @apply text-neutral;
    h4 {
      @apply uppercase text-sm font-bold;
    }
  }
}
</style>
