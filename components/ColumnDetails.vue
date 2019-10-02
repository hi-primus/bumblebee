<template>
  <div>

    <div class="sidebar-subheader hoverable column-title" @click="expanded = !expanded">
      <span class="data-type" :class="`type-${column.column_dtype}`">{{ dataType(column.column_dtype) }}</span>
      <span class="data-type-name">{{ column.name }}</span>
      <CommandMenu activatorClass="right-button-2" :disabled="commandsDisabled" @command="$emit('command',{command: $event.command, columns: [column.name]})"></CommandMenu>
      <v-icon class="right-button flippable" :class="{'flipped': expanded}" color="black">expand_more</v-icon>
    </div>

    <div class="sidebar-section pt-1" v-if="expanded">
      <div class="component-container">
        <General :rowsCount="rowsCount" :dtypes="column.dtypes_stats" :values="column.stats" />
      </div>

      <div
        v-if="column.stats.percentile || column.stats.percentile===0"
        class="component-container"
      >
        <Percentile :values="column.stats" />
      </div>

      <div
        v-if="column.stats"
        class="component-container"
      >
        <Descriptive :values="column.stats" />
      </div>

      <div class="component-container">
        <DataTypes :values="column.dtypes_stats" />
      </div>

      <div
        v-if="column.stats.percentile==undefined"
        class="component-container"
      >
        <TopValues
          v-if="column.frequency"
          :values="column.frequency"
          :total="+column.frequency[0].count"
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

      <div class="component-container">
        <Frequent
          v-if="column.frequency"
          :uniques="column.stats.count_uniques"
          :values="column.frequency"
          :total="+column.frequency[0].count"
        />
      </div>

      <div
        v-if="column.stats.percentile || column.stats.percentile===0"
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
import CommandMenu from '@/components/CommandMenu'
import TopValues from '@/components/TopValues'
import Frequent from '@/components/Frequent'
import General from '@/components/General'
import Percentile from '@/components/PercentileStats'
import Descriptive from '@/components/Stats'
import Histogram from '@/components/Histogram'
import DataTypes from '@/components/DataTypes'
import dataTypesMixin from '~/plugins/mixins/data-types'

export default {
	components: {
		CommandMenu,
		TopValues,
		General,
		Percentile,
		Descriptive,
		Frequent,
		Histogram,
		DataTypes
	},

  mixins: [dataTypesMixin],

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
