<template>
<div
  class="bbt-container"
  :class="{'range--selected': selectionType!='columns'}"
  ref="BbContainer"
>
  <div
    class="bb-table-top-container" ref="BbTableTopContainer"
    v-if="columns && bbColumns"
  >
    <div class="bb-table-header">
      <template v-for="index in bbColumns">
        <div
          @click="selectColumn($event,index)"
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
        <!-- v-show="((row.index>=visibleRowsTop) && (row.index<=visibleRowsBottom))" -->
        <div
          class="bb-table-row"
          :key="'r'+row.index"
          :style="{height: rowHeight+'px', top: row.index*rowHeight+'px'}"
        >
          <template v-for="index in bbColumns">
              <!-- v-if="row.value[index]" -->
            <div
              :key="index"
              v-if="row.value"
              class="bb-table-cell"
              :class="{
                'bb-selected': selection[index],
                'missing': row.value[index]==='',
                'none': row.value[index]===null
              }"
              :style="{width: columns[index].width+'px'}"
              :data-val="row.value[index]"
            >&nbsp;{{row.value[index]}}&nbsp;</div>
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

const throttleScrollTime = 500

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
    bbColumns: {
      type: Array
    }
	},

	data() {
		return {
      maxChunks: 10,
      fetching: false,

      // visibleRowsTop: 0,
      // visibleRowsBottom: 100,
      loadedChunksTop: 0,
      loadedChunksBottom: 1,

      selection: {},
      chunks: [],
      columns: {}
		}
  },

	computed: {

    ...mapGetters(['currentSelection','currentDataset','selectionType']),

    postochunk() {
      return 1/(this.rowHeight*this.chunkSize)
    },

    chunkSize () {
      return Math.max(Math.ceil(300/this.currentDataset.columns.length),40)
    },

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

    rows () {
      var rows = []
      // this.chunks.sort((a,b)=>a.index-b.index) // NO
      this.chunks.forEach(chunk => {
        if ((chunk.index>=this.loadedChunksTop) && (chunk.index<=this.loadedChunksBottom)) {
          rows = [...rows, ...chunk.rows]
        }
      })
      // rows = [...new Set(rows)];
      rows.sort((a,b)=>a.index-b.index)
      return rows
    },

    rowsCount() {
      return this.currentDataset.sample_length
    },

    rowStyle() {
      return { maxHeight: (this.rowHeight) + 'px' }
    },

    tableStyle() {
      return {
        maxHeight: (this.rowHeight * this.rowsCount ) + 'px',
        height: (this.rowHeight * this.rowsCount ) + 'px',
      }
    },

    lastChunk() {
      return Math.floor(this.rowsCount / this.chunkSize)
    }

  },

  mounted() {
    this.$refs['BbTableContainer'] & this.$refs['BbTableContainer'].addEventListener('scroll', this.throttleCheckScroll, {passive: true})
    this.$refs['BbTableContainer'] & this.$refs['BbTableContainer'].addEventListener('scroll', this.scrollLeftCheck, {passive: true})
    this.checkScroll()

    this.currentDataset.columns.forEach((column, index) => {
      this.$set(this.columns, index, {name: column.name, width: 170})
    });

    this.updateSelection(this.currentSelection)
  },

  beforeDestroy() {
    try {
      this.$refs['BbTableContainer'].removeEventListener('scroll', this.throttleCheckScroll)
      this.$refs['BbTableContainer'].removeEventListener('scroll', this.scrollLeftCheck)
    }
    catch (err) {
      console.error(err)
    }
  },

  watch: {

    currentSelection (value) {
      this.updateSelection(value)
    }
  },

  methods: {

    updateSelection(value) {
      var selectionArray = []

      for (const index in this.selection) {
        if (this.selection[index]) {
          selectionArray.push(index)
        }
      }

      var newSelection = []

      if (value.columns) {
        newSelection = value.columns.map(e=>e.index)
      }

      selectionArray.sort()
      newSelection.sort()

      if (!arraysEqual(selectionArray,newSelection)) {
        this.selection = newSelection.reduce((p,v)=>{
          p[v] = true
          return p
        },{})

      }
    },

    selectColumn(event, index) {
      if (!event.ctrlKey && !this.selection[index]) {
        this.selection = {}
      }
      this.$set(this.selection, index, !this.selection[index])

      this.$emit('updatedSelection',this.selection)
    },

    scrollLeftCheck() {
      this.$refs['BbTableTopContainer'].scrollLeft = this.$refs['BbTableContainer'].scrollLeft
    },

    throttleCheckScroll: throttle(function(e) {this.checkScroll(e)} , throttleScrollTime),

    async checkScroll () {

      var element = this.$refs['BbTableContainer']

      var topPosition = element.scrollTop
      var bottomPosition = topPosition + element.clientHeight

      this.fetchChunks(topPosition, bottomPosition)

      // this.visibleRowsTop = topPosition/this.rowHeight - 80
      // this.visibleRowsBottom = bottomPosition/this.rowHeight + 80

      // this.fetchChunks(startRow, endRow+1)
    },

    async fetchChunks(start, end) {

      var from = Math.max( Math.floor(start*this.postochunk), 0 )
      var to = Math.min( Math.ceil(end*this.postochunk), this.lastChunk )

      this.loadedChunksTop = from - 3
      this.loadedChunksBottom = to + 3

      var promises = []

      this.fetching = true

      for (let i = from; i <= to; i++) {
        promises.push(this.fetchChunk(i))
      }

      await Promise.all(promises)

      this.fetching = false

      if (this.chunks.length>this.maxChunks){
        this.chunks.splice(0,this.chunks.length-this.maxChunks)
        // console.log({removing: this.chunks.length-this.maxChunks})
      }

      // console.log({length: this.chunks.length})
    },

    async fetchChunk(index) {

      var foundIndex = this.chunks.findIndex(chunk => {
        return chunk && chunk.index === index
      })

      if (foundIndex!==-1) {
        return false
      }

      var chunkIndexInArray = this.chunks.push({ index: index, rows: []}) - 1

      var response = await this.$axios.$post('api/rows', {
        page: index,
        page_size: this.chunkSize,
        dataset: this.currentDataset.id
      })

      var from = index*this.chunkSize

      var rows = response.data.map((r,i)=>({
        value: r.value,
        index: from+i
      }))

      this.$set(this.chunks,chunkIndexInArray,{ index: index, rows })

      return true

    }
  }

}
</script>
