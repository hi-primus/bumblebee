<template>
  <div>

    <div class="sidebar-subheader hoverable column-title" @click="expanded = !expanded">
      <span class="data-type" :class="`type-${column.column_dtype}`">{{ dataType(column.column_dtype) }}</span>
      <span class="data-type-name">{{ column.name }}</span>
      <v-icon class="right-button flippable" :class="{'flipped': expanded}" color="black">expand_more</v-icon>
    </div>

    <div class="sidebar-section pt-1" v-if="expanded">
      <div class="component-container">
        <Stats :values="column.stats" />
      </div>

      <div
        v-if="column.stats.quantile!=undefined"
        class="component-container"
      >
        <Quantile :values="column.stats" />
      </div>

      <div
        v-if="column.stats.quantile!=undefined"
        class="component-container"
      >
        <Descriptive :values="column.stats" />
      </div>

      <div
        v-if="column.stats.quantile==undefined"
        class="component-container"
      >
        <TopValues
          v-if="column.frequency"
          :values="column.frequency"
          :total="+column.frequency[0].count"
        />
      </div>

      <div class="component-container">
        <DataTypes :values="column.dtypes_stats" />
      </div>

      <template v-if="column.stats.hist">
        <div
          v-if="column.stats.hist[0]"
          class="component-container"
        >
          <Histogram
            :values="column.stats.hist"
            :total="rowsCount"
            title="Histogram"
          />
        </div>

        <div
          v-if="column.stats.hist.years"
          class="component-container"
        >
          <Histogram
            :values="column.stats.hist.years"
            :total="rowsCount"
            title="Years Histogram"
          />
        </div>

        <div
          v-if="column.stats.hist.months"
          class="component-container"
        >
          <Histogram
            :values="column.stats.hist.months"
            :total="rowsCount"
            title="Months Histogram"
          />
        </div>

        <div
          v-if="column.stats.hist.weekdays"
          class="component-container"
        >
          <Histogram
            :values="column.stats.hist.weekdays"
            :total="rowsCount"
            title="Week days Histogram"
          />
        </div>

        <div
          v-if="column.stats.hist.hours"
          class="component-container"
        >
          <Histogram
            :values="column.stats.hist.hours"
            :total="rowsCount"
            title="Hours Histogram"
          />
        </div>

        <div
          v-if="column.stats.hist.minutes"
          class="component-container"
        >
          <Histogram
            :values="column.stats.hist.minutes"
            :total="rowsCount"
            title="Minutes Histogram"
          />
        </div>

      </template>

      <div class="component-container">
        <Frequent
          v-if="column.frequency"
          :uniques="column.stats.count_uniques"
          :values="column.frequency"
          :total="+column.frequency[0].count"
        />
      </div>

      <div
        v-if="column.stats.quantile!=undefined"
        class="component-container"
      >
        <TopValues
          v-if="column.frequency"
          :values="column.frequency"
          :total="column.frequency[0].count"
        />
      </div>
    </div>
  </div>
</template>

<script>
import TopValues from '@/components/TopValues'
import Frequent from '@/components/Frequent'
import Stats from '@/components/Stats'
import Quantile from '@/components/QuantileStats'
import Descriptive from '@/components/DescriptiveStats'
import Histogram from '@/components/Histogram'
import DataBar from '@/components/DataBar'
import DataTypes from '@/components/DataTypes'
import dataTypesMixin from '~/plugins/mixins/data-types'

export default {
	components: {
		TopValues,
		Stats,
		Quantile,
		Descriptive,
		Frequent,
		Histogram,
		DataBar,
		DataTypes
	},

  mixins: [dataTypesMixin],

  data () {
    return {
      expanded: false,
    }
  },

  props: {
    column: {
      type: Object
    },
    rowsCount: {
      type: Number
    },
    startExpanded: {
      type: Boolean,
      default: false
    }
  },

  mounted() {
    if (this.startExpanded) {
      this.expanded = true;
    }
  }
}
</script>

<style lang="scss">
  .data-bar.main-data-bar {
    height: 8px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
</style>
