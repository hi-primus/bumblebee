<template>
  <div v-if="column">
    <div class="sidebar-subheader hoverable column-title" @click="expanded = !expanded">
      <div class="data-column-data">
        <span class="data-type" v-if="column.stats && column.stats.inferred_data_type" :class="`type-${column.stats.inferred_data_type.data_type}`">{{ dataTypeHint(column.stats.inferred_data_type.data_type) }}</span>
        <span class="data-column-name">{{ column.name }}</span>
      </div>
      <v-icon class="right-button flippable" :class="{'flipped': expanded}" color="black">expand_more</v-icon>
    </div>

    <div class="sidebar-section pt-1" v-if="expanded">

      <template v-if="column.stats">

        <div v-if="column.stats.missing !== undefined" class="component-container">
          <General
          @barClicked="barClicked"
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
            <!-- <VegaEmbed
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
            /> -->
          </div>
        </div>

        <div
          v-if="column.stats"
          class="component-container"
        >
          <Descriptive :values="column.stats" />
        </div>

        <div
          v-if="false && column.stats.percentile==undefined && frequency"
          class="component-container"
        >
          <h3>Top values</h3>
          <TopValues
            v-if="frequency"
            :values="frequency"
            :total="rowsCount"
          />
        </div>

        <template v-if="hist">
          <div
            v-if="hist[0]"
            class="component-container"
          >
            <h3>Histogram</h3>
            <Histogram
              :values="hist"
              :total="rowsCount"
              :height="90"
              :columnIndex="column.index"
              :selectable="selectionEnabled"
            />
          </div>

          <div
            v-if="hist.years"
            class="component-container"
          >
            <h3>Years Histogram</h3>
            <Histogram
              :values="hist.years"
              :total="rowsCount"
              :height="90"
              :columnIndex="column.index"
              :selectable="selectionEnabled"
            />
          </div>

          <div
            v-if="hist.months"
            class="component-container"
          >
            <h3>Months Histogram</h3>
            <Histogram
              :values="hist.months"
              :total="rowsCount"
              :height="90"
              :columnIndex="column.index"
              :selectable="selectionEnabled"
            />
          </div>

          <div
            v-if="hist.weekdays"
            class="component-container"
          >
            <h3>Week days Histogram</h3>
            <Histogram
              :values="hist.weekdays"
              :total="rowsCount"
              :height="90"
              :columnIndex="column.index"
              :selectable="selectionEnabled"
            />
          </div>

          <div
            v-if="hist.hours"
            class="component-container"
          >
            <h3>Hours Histogram</h3>
            <Histogram
              :values="hist.hours"
              :total="rowsCount"
              :height="90"
              :columnIndex="column.index"
              :selectable="selectionEnabled"
            />
          </div>

          <div
            v-if="hist.minutes"
            class="component-container"
          >
            <h3>Minutes Histogram</h3>
            <Histogram
              :values="hist.minutes"
              :total="rowsCount"
              :height="90"
              :columnIndex="column.index"
              :selectable="selectionEnabled"
            />
          </div>

        </template>

        <div
          v-if="frequency && frequency.values !== null"
          class="component-container"
        >
          <h3>Frequent values</h3>
          <Frequent
            :uniques="frequency.count_uniques || countUniques"
            :values="frequency"
            :total="rowsCount"
            :height="90"
            :columnIndex="column.index"
            :selectable="selectionEnabled"
          />
        </div>

      </template>

      <!-- <DeckMap
        :columns="[column]"
        :currentDataset="currentDataset"
        class="component-container"
      /> -->

      <div
        v-if="patternsFrequency"
        class="component-container"
        style="position: relative;"
      >
        <div style="margin-top: -1px;">
          <h3 class="d-inline">Frequent patterns</h3>
          <span class="info-tooltip-container">
            <span style="position: relative;">
              <v-icon small color="grey" class="hoverable">
                mdi-information-outline
              </v-icon>
              <div class="info-tooltip-tip elevation-3"></div>
            </span>
            <div class="info-tooltip-content elevation-3">
              <span class="font-mono">c: </span>Letter<br/>
              <span class="font-mono">U: </span>Uppercase letter<br/>
              <span class="font-mono">l: </span>Lowercase letter<br/>
              <span class="font-mono">*: </span>Alphanumeric digit<br/>
              <span class="font-mono">#: </span>Numeric digit<br/>
              <span class="font-mono">!: </span>Punctuation
            </div>
          </span>
          <v-progress-circular
            v-if="patternsLoading"
            class="progress-small"
            indeterminate
            color="#AAA"
            width="2"
            size="14"
          />
        </div>
        <div style="min-height: 128px;" class="vertical-center">
          <placeholder-bars
            v-if="patternsFrequency[patternsResolution]==='loading' || !patternsFrequency[patternsResolution]"
            class="mx-auto d-flex"
          />
          <placeholder-bars
            v-else-if="patternsFrequency[patternsResolution]==='error'"
            @click="getPatterns"
            class="mx-auto d-flex"
          />
          <template v-else>
            <TopValues
              class="align-self-start"
              :key="patternsResolution"
              :values="patternsFrequency[patternsResolution]"
              :total="rowsCount"
              @click:item="patternClicked($event)"
            />
          </template>
          <!-- selectable -->
        </div>
        <v-slider
          class="small-label"
          dense
          hide-details
          label="Detail"
          v-model="patternsResolution"
          min="0"
          max="3"
          track-color="grey"
        >
        </v-slider>
        <!-- <div class="mx-auto" style="max-width: 72px">
        </div> -->
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import TopValues from '@/components/TopValues'
import Frequent from '@/components/Frequent'
import General from '@/components/General'
import Percentile from '@/components/PercentileStats'
import Descriptive from '@/components/Stats'
import Histogram from '@/components/Histogram'
import DataTypes from '@/components/DataTypes'
import DeckMap from '@/components/DeckMap'
import PlaceholderBars from '@/components/placeholders/PlaceholderBars'

import dataTypesMixin from '~/plugins/mixins/data-types'
import applicationMixin from '~/plugins/mixins/application'
import clientMixin from '~/plugins/mixins/client'

import VegaEmbed from '@/components/VegaEmbed'

import { ErrorWithResponse } from 'bumblebee-utils'

export default {
	components: {
		TopValues,
		General,
		Percentile,
		Descriptive,
		Frequent,
		Histogram,
    DataTypes,
    DeckMap,
    PlaceholderBars,
    VegaEmbed
	},

  mixins: [dataTypesMixin, applicationMixin, clientMixin],

  data () {
    return {
      expanded: false,
      patternsFrequency: [],
      patternsResolution: 3,
      patternsLoading: false,
      sampleSize: 100000,
      deckMap: false
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

  computed: {
    ...mapGetters([
      'currentDataset'
    ]),

    selectionEnabled () {
      return !this.$store.getters.loadingStatus && !this.$store.state.editing;
    },

    hist () {
      return this.column.stats.hist || this.column.hist;
    },
    
    frequency () {
      return this.column.stats.frequency || this.column.frequency;
    },

    countUniques () {
      return this.column.stats.count_uniques || this.column.count_uniques;
    },

    commandsDisabled: {
      get () {
        return this.$store.state.commandsDisabled
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'commandsDisabled', payload: value})
      }
    }
  },

  mounted () {

  },

  methods: {

    async commandListener__patterns_count (response) {
      try {

        if (response.reply.column !== this.column.name || response.reply.dfName !== this.currentDataset.dfName) {
          return;
        }

        if (!response || !response.data || !response.data.result || response.data.status == "error") {
          throw new ErrorWithResponse('Bad response', response);
        }

        let result = response.data.result;
        let complete = result?.complete;
        
        if (result) {
          if (result.values && typeof result.values !== 'function') {
            result = result.values
          }
          this.$set(this.patternsFrequency, this.patternsResolution, result);
          if (!complete && response.reply.sample[1] < this.rowsCount) {
            this.sampleSize = this.sampleSize * 4;
            this.sampleSize = Math.min(this.sampleSize, 2000000);
            this.requestPatterns(response.reply.sample[1], response.reply.sample[1]+this.sampleSize, false);
          } else {
            this.patternsLoading = false;
          }
        }

      } catch (err) {
        console.error(err, err.response);
        this.$set(this.patternsFrequency, this.patternsResolution, 'error')
        this.patternsLoading = false;
      }
    },

    async getPatterns () {
      try {

        let payload = {
          socketPost: this.socketPost,
          dfName: this.currentDataset.dfName,
          methods: this.commandMethods
        };

        let executeResult = await this.$store.dispatch('getExecute', payload );

        if (this.patternsFrequency[this.patternsResolution] && this.patternsFrequency[this.patternsResolution]!=='error') {
          return
        }
        this.$set(this.patternsFrequency, this.patternsResolution, 'loading')
        this.patternsLoading = true;
        this.requestPatterns(0, this.sampleSize, true);

      } catch (err) {
        console.error(err, err.response);
        this.$set(this.patternsFrequency, this.patternsResolution, 'error')
        this.patternsLoading = false;
      }
    },

    async requestPatterns (from, to, clearPrevious=false) {
        let dfName = this.currentDataset.dfName;
        let column = this.column.name;
        let mode = 3-this.patternsResolution;
        let codePayload = {
          command: 'pattern_counts_cache',
          sample: [from, to],
          dfName,
          column,
          mode,
          clearPrevious,
          lastSample: to>=this.rowsCount,
          cache_key: `pattern_counts_${dfName}_${column}_${mode}`,
          n: 5,
          request: {
            isAsync: true,
            async_priority: -20
          }
        };
        let replyPayload = { 
          command: 'patterns_count',
          sample: [from, to],
          n: 5,
          dfName,
          column
        };

        await this.interrupt({handler: 'patterns_count'});

        this.evalCode(codePayload, replyPayload, 'info');
    },

    patternClicked (item) {

      if (!this.selectionEnabled) {
        return;
      }

      var command = {
        command: 'filterRows',
        columns: [ this.column.name ],
        payload: {
          condition: 'match_pattern',
          value: item.value,
          columns: [ this.column.name ],
        }
      }

      this.commandHandle(command)
    },

    barClicked (event) {

      if (!this.selectionEnabled) {
        return;
      }

      if (event == 'missing') {
        var payload = {
          rowsType: 'missing',
          action: 'drop'
        }
        this.commandHandle({
          command: 'REMOVE_KEEP_SET',
          columns: [ this.column.name ],
          payload
        })
      }
      if (event == 'mismatch') {
        var payload = {
          rowsType: 'mismatch',
          action: 'drop'
        }
        this.commandHandle({
          command: 'REMOVE_KEEP_SET',
          columns: [ this.column.name ],
          payload
        })
      }
      if (event == 'match') {
        var payload = {
          rowsType: 'match',
          action: 'select'
        }
        this.commandHandle({
          command: 'REMOVE_KEEP_SET',
          columns: [ this.column.name ],
          payload
        })
      }
    },

    commandHandle (event) {
      this.$store.commit('commandHandle',event)
    },
  },

  watch: {
    startExpanded: {
      immediate: true,
      handler (value) {
        if (value) {
          this.expanded = true;
        }
      }
    },

    expanded: {
      immediate: true,
      handler (expanded) {
        if (this.column && expanded) {
          this.getPatterns();
        }
      }
    },

    patternsResolution () {
      if (this.column) {
        this.getPatterns();
      }
    },

    column (value) {
      if (!value) {
        this.expanded = false;
        this.patternsFrequency = [];
        this.patternsResolution = 3;
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
