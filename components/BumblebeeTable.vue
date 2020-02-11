<template>
<div
  class="bbt-container"
  ref="BbContainer"
>
  <div
    class="bb-table-top-container" ref="BbTableTopContainer"
    v-if="columns && bbColumns"
  >
    <div class="bb-table-header">
      <template v-for="index in bbColumns">
        <div
          @click="selectColumn(index)"
          class="bb-table-h-cell"
          :class="{'bb-selected': selection[index]}"
          v-if="columns[index]"
          :key="index"
          :style="{width: columns[index].width+'px'}"
        >
          <div class="data-type" :class="`type-${columns[index].column_dtype}`">
            {{ dataType(currentDataset.columns[index].column_dtype) }}
          </div>
          <div class="column-title">
            {{columns[index].name}}
          </div>
        </div>
      </template>
    </div>
    <div v-if="true" class="bb-table-plots">
      <template v-for="index in bbColumns">
        <div
          class="bb-table-plot"
          v-if="columns[index]"
          :key="index"
          :style="{width: columns[index].width+'px'}"
          :class="{'bb-selected': selection[index]}"
        >
          <DataBar
            :key="plotsData[index].key+'databar'"
            :missing="plotsData[index].missing"
            :total="+plotsData[index].total"
            :mismatch="+plotsData[index].mismatch"
            :nullV="+plotsData[index].null"
            class="table-data-bar"
            bottom
          />
          <Frequent
            v-if="plotsData[index].frequency"
            :key="plotsData[index].key"
            :uniques="plotsData[index].count_uniques"
            :values="plotsData[index].frequency"
            :total="+plotsData[index].frequency[0].count"
            :columnIndex="index"
            class="histfreq"
            table
          />
          <Histogram
            v-else-if="plotsData[index].hist"
            :key="plotsData[index].key"
            :uniques="plotsData[index].count_uniques"
            :values="plotsData[index].hist"
            :total="+plotsData[index].total"
            :columnIndex="index"
            class="histfreq"
            table
          />
          <Histogram
            v-else-if="plotsData[index].hist_years"
            :key="plotsData[index].key"
            :uniques="plotsData[index].count_uniques"
            :values="plotsData[index].hist_years"
            :total="+plotsData[index].total"
            :columnIndex="index"
            class="histfreq"
            table
          />
        </div>
      </template>
    </div>
  </div>
  <div
    class="bb-table-container" ref="BbTableContainer"
  >
    <div class="bb-table" ref="BbTable" :style="tableStyle">
      <template v-for="row in rows">
        <div :key="'r'+row.index" class="bb-table-row" :style="{height: rowHeight+'px', top: row.index*rowHeight+'px'}">
          <template v-for="index in bbColumns">
            <div
              v-if="row.value[index]"
              :key="index"
              class="bb-table-cell"
              :class="{'bb-selected': selection[index]}"
              :style="{width: columns[index].width+'px'}"
            >
              {{ row.value[index] }}
            </div>
          </template>
        </div>
      </template>
    </div>

  </div>
</div>
</template>

<script>

import { throttle, debounce } from '@/utils/functions.js'
import { mapGetters } from 'vuex'

import dataTypesMixin from '@/plugins/mixins/data-types'

import Histogram from '@/components/Histogram'
import Frequent from '@/components/Frequent'
import DataBar from '@/components/DataBar'

import { arraysEqual } from '@/utils/functions.js'

export default {

	components: {
		Histogram,
		Frequent,
		DataBar
	},

  mixins: [dataTypesMixin],

	props: {
    rowHeight: {
      default: 23,
      type: Number
    },
    chunkSize: {
      default: 15,
      type: Number
    },
    maxChunks: {
      default: 10,
      type: Number
    },
    bbColumns: {
      type: Array
    }
	},

	data() {
		return {
      selection: {},
      chunks: [],
      columns: {}
		}
  },

	computed: {

    ...mapGetters(['currentSelection','currentDataset']),

    plotsData () {
			return this.currentDataset.columns.map((column, i) => {
				return {
          name: column.name,
          mismatch: (column.dtypes_stats.mismatch) ? +column.dtypes_stats.mismatch : 0,
          null: (column.dtypes_stats.null) ? +column.dtypes_stats.null : 0,
          missing: (column.dtypes_stats.missing) ? +column.dtypes_stats.missing : 0,
					zeros: column.stats.zeros,
					total: this.currentDataset.summary.rows_count,
					count_uniques: column.stats.count_uniques,
					hist: (column.stats.hist && column.stats.hist[0]) ? column.stats.hist : undefined,
					hist_years: (column.stats.hist && column.stats.hist.years) ? column.stats.hist.years : undefined,
					frequency: (column.frequency) ? column.frequency : undefined
				}
			})
    },

    rows() {
      var rows = []
      this.chunks.forEach(chunk => {
        rows = [...rows, ...chunk.rows]
      });
      // rows = [...new Set(rows)];
      rows.sort((a,b)=>a.index-b.index)
      return rows
    },

    rowsCount() {
      return 10001
    },

    rowStyle() {
      return { maxHeight: (this.rowHeight) + 'px' }
    },

    tableStyle() {
      return {
        maxHeight: (this.rowHeight * this.rowsCount -1) + 'px',
        height: (this.rowHeight * this.rowsCount -1) + 'px',
      }
    },

    lastChunk() {
      return Math.floor(this.rowsCount / this.chunkSize)
    }

  },

  mounted() {
    this.$refs['BbTableContainer'] & this.$refs['BbTableContainer'].addEventListener('scroll', this.scrollLeftCheck)
    this.$refs['BbTableContainer'] & this.$refs['BbTableContainer'].addEventListener('scroll', this.debounceCheck)
    this.check()

    this.currentDataset.columns.forEach((column, index) => {
      this.$set(this.columns, index, {name: column.name, width: 170})
    });

    this.updateSelection(this.currentSelection)
  },

  watch: {

    selection (value) {
      //
    },

    currentSelection (value) {
      this.updateSelection(value)
    }
  },

  methods: {

    updateSelection(value) {
      console.log("updating selection")

      var selectionArray = []

      for (const index in this.selection) {
        if (this.selection[index]) {
          selectionArray.push(index)
        }
      }

      var newSelection = value.columns.map(e=>e.index)

      selectionArray.sort()
      newSelection.sort()

      if (!arraysEqual(selectionArray,newSelection)) {

        this.selection = newSelection.reduce((p,v)=>{
          p[v] = true
          return p
        },{})

      }
    },

    selectColumn(index) {
      console.log("selectColumn index",index, !this.selection[index])
      this.$set(this.selection, index, !this.selection[index])
      this.$emit('updatedSelection',this.selection)
    },

    scrollLeftCheck() {
      this.$refs['BbTableTopContainer'].scrollLeft = this.$refs['BbTableContainer'].scrollLeft
    },

    debounceCheck: debounce(function(e) {this.check(e)} ,300), // TODO: Parameter

    check() {

      var topPosition = this.$refs['BbTableContainer'].scrollTop
      var bottomPosition = topPosition+this.$refs['BbTableContainer'].clientHeight

      var topRow = Math.floor(topPosition/this.rowHeight)
      var bottomRow = Math.ceil(bottomPosition/this.rowHeight)

      this.loadChunks(topRow, bottomRow)

    },

    loadChunks(top, bottom) {

      var chunk0 = Math.max(Math.floor(top/this.chunkSize)-1,0)
      var chunk1 = Math.min(Math.ceil(bottom/this.chunkSize)+1,this.lastChunk)

      for (let i = chunk0; i <= chunk1; i++) {

        var result = this.chunks.find(chunk => {
          return chunk.index === i
        })

        if (result===undefined) {
          this.loadChunk(i)
        }

      }
    },

    loadChunk(index) {

      setTimeout(() => {
        var from = index*this.chunkSize
        var to = Math.min(from+this.chunkSize,this.rowsCount)

        // debug
        var rows = []
        for (let i = from; i < to; i++) {
          rows.push({
            index: i,
            value: this.currentDataset.sample.value[i%15]
          })
          //rows.push({ index: i, value: ['row '+i,'name','04/02/2020'] })
        }
        // debug

        var chunk = { index, rows }

        if (this.chunks.length>this.maxChunks){
          this.chunks.splice(0,1)
        }
        this.chunks.push(chunk)
      }, 200);
    }
  }

}
</script>
