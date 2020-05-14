<template>
  <div v-if="column">

    <div class="sidebar-subheader hoverable column-title" @click="expanded = !expanded">
      <div class="data-column-data">
        <span class="data-type" :class="`type-${column.profiler_dtype}`">{{ dataType(column.profiler_dtype) }}</span>
        <span class="data-column-name">{{ column.name }}</span>
      </div>
      <v-icon class="right-button flippable" :class="{'flipped': expanded}" color="black">expand_more</v-icon>
    </div>

    <div class="sidebar-section pt-1" v-if="expanded">
      <div class="component-container">
        <General
         :rowsCount="rowsCount"
         :values="column.stats"
        />
      </div>

      <div
        v-if="column.stats.percentile || column.stats.percentile===0"
        class="component-container"
      >
        <Percentile :values="column.stats" />
        <div
          v-if="column.stats.range!=0"
          class="component-container"
          style="margin-top: -16px; margin-bottom: -12px; z-index:-1"
        >
          <VegaEmbed
            :name="'box-plot'"
            ref="box-plot"
            class="box-plot-grid mb-2"
            v-if="dataset && dataset.sample"
            :data="{values: dataset.sample.value}"
            :mark="{
              type: 'boxplot',
              whisker: {
                title: 'fff',
                size: 10
              },
              box: {
                title: 'fff',
              },
              outliers: {
                type: 'point',
                filled: true,
                color: '#4db6ac'
              },
              tooltip: [
              {
                field: index.toString(),
                type: 'quantitative'
              },
              {
                field: (index+1).toString()
              },
              ],
            }"
            width="366"
            :encoding="{
              tooltip: [
                {
                  field: index.toString(),
                  type: 'quantitative',
                },
                {
                  field: index.toString(),
                  type: 'quantitative',
                  aggregate: 'median',
                  title: 'Median'
                },
              ],
              x: {
                field: index.toString(),
                axis: {
                  title: null
                },
                type: 'quantitative',
              },
              color: {
                value: '#4db6ac'
              }
            }"
            :config="{
              axis: {
                domainColor: '#fff',
                gridColor: '#fff',
                ticks: false,
                domainOpacity: 0,
                gridOpacity: 0,
                tickOpacity: 0,
                title: null
              },
              view: {
                stroke: 'transparent'
              }
            }"
          />
        </div>
      </div>

      <div
        v-if="column.stats"
        class="component-container"
      >
        <Descriptive :values="column.stats" />
      </div>

      <div
        v-if="false && column.stats.percentile==undefined && column.stats.frequency"
        class="component-container"
      >
        <TopValues
          v-if="column.stats.frequency"
          :values="column.stats.frequency"
          :total="rowsCount"
        />
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

      <div
        v-if="column.stats.frequency"
        class="component-container"
      >
        <Frequent
          :uniques="column.stats.count_uniques"
          :values="column.stats.frequency"
          :total="rowsCount"
        />
      </div>
    </div>
  </div>
</template>

<script>
import TopValues from '@/components/TopValues'
import Frequent from '@/components/Frequent'
import General from '@/components/General'
import Percentile from '@/components/PercentileStats'
import Descriptive from '@/components/Stats'
import Histogram from '@/components/Histogram'
import DataTypes from '@/components/DataTypes'
import dataTypesMixin from '~/plugins/mixins/data-types'
import applicationMixin from '~/plugins/mixins/application'
import VegaEmbed from '@/components/VegaEmbed'

export default {
	components: {
		TopValues,
		General,
		Percentile,
		Descriptive,
		Frequent,
		Histogram,
		DataTypes,
    VegaEmbed
	},

  mixins: [dataTypesMixin, applicationMixin],

  data () {
    return {
      expanded: false,
    }
  },

  props: {
    commandsDisabled: {
      type: Boolean,
      default: false
    },
    column: {
      type: Object
    },
    dataset: {
      type: Object
    },
    rowsCount: {
      type: Number
    },
    index: {
      type: Number
    },
    startExpanded: {
      type: Boolean,
      default: false
    }
  },

  watch: {
    startExpanded: {
      immediate: true,
      handler (value) {
        if (value)
          this.expanded = true
      }
    }
  }
}
</script>

<style lang="scss">
  .data-bar.main-data-bar {
    font-size: 8px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
</style>
