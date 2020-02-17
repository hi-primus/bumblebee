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

const debounceScrollTime = 300

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
      maxChunks: 20/5,
      fetching: false,

      visibleChunkTop: 0,
      visibleChunkBottom: 100,

      selection: {},
      chunks: [],
      columns: {}
		}
  },

	computed: {

    ...mapGetters(['currentSelection','currentDataset']),

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
      console.log({visibleChunkTop: this.visibleChunkTop, visibleChunkBottom: this.visibleChunkBottom})
      this.chunks.forEach(chunk => {
        if ((chunk.index>=this.visibleChunkTop) && (chunk.index<=this.visibleChunkBottom)) {
          rows = [...rows, ...chunk.rows]
        }
      })
      // rows = [...new Set(rows)];
      rows.sort((a,b)=>a.index-b.index)
      return rows
    },

    visibleRows () {

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
    this.$refs['BbTableContainer'] & this.$refs['BbTableContainer'].addEventListener('scroll', this.scrollLeftCheck)
    this.$refs['BbTableContainer'] & this.$refs['BbTableContainer'].addEventListener('scroll', this.debounceCheckScroll)
    this.checkScroll()

    this.currentDataset.columns.forEach((column, index) => {
      this.$set(this.columns, index, {name: column.name, width: 170})
    });

    this.updateSelection(this.currentSelection)
  },

  watch: {

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

    selectColumn(index) {
      console.log("selectColumn index",index, !this.selection[index])
      this.$set(this.selection, index, !this.selection[index])
      this.$emit('updatedSelection',this.selection)
    },

    scrollLeftCheck() {
      this.$refs['BbTableTopContainer'].scrollLeft = this.$refs['BbTableContainer'].scrollLeft
    },

    debounceCheckScroll: debounce(function(e) {this.checkScroll(e)} , debounceScrollTime), // TODO: Parameter

    async checkScroll () {

      var element = this.$refs['BbTableContainer']

      var topPosition = (element) ? element.scrollTop : 0
      var bottomPosition = topPosition + ((element) ? element.clientHeight : 1080)

      var startRow = Math.floor(topPosition/this.rowHeight)
      var endRow = Math.ceil(bottomPosition/this.rowHeight)

      console.log("checking position and rows",{topPosition, bottomPosition, startRow, endRow})

      var time = - new Date()

      await this.fetchChunks(startRow, endRow+1)

      time += new Date()

      console.log({ time })

      this.fetchChunks(startRow, endRow+1)

    },

    async fetchChunks(start, end) {

      var from = Math.max( Math.floor(start/this.chunkSize), 0 )
      var to = Math.min( Math.ceil(end/this.chunkSize), this.lastChunk )

      this.visibleChunkTop = from-1
      this.visibleChunkBottom = to+1

      console.log({from, to})

      var promises = []

      for (let i = from; i <= to; i++) {
        promises.push(this.fetchChunk(i))
      }

      return await Promise.all(promises)
    },

    async fetchChunk(index) {

      // console.log({checking: index})

      this.fetching = true

      var result = this.chunks.findIndex(chunk => {
        return chunk && chunk.index === index
      })

      if (result!==-1) {
        // console.log({result: this.chunks[result]})
        return true
      }

      // console.log({loading: index})

      // console.log({chunksBefore: this.chunks.map(c=>c.index).join()})

      var chunkIndexInArray = this.chunks.push({ index: index, rows: []}) - 1

      var response = await this.$axios.$post('api/rows', {
        page: index,
        page_size: this.chunkSize,
        dataset: this.currentDataset.id
      })

      console.log({response})

      var from = index*this.chunkSize

      var rows = response.data.map((r,i)=>({
        value: r.value,
        index: from+i
      }))

      var chunk = { index: index, rows }

      this.$set(this.chunks, chunkIndexInArray, chunk)

      if (this.chunks.length>this.maxChunks){
        this.chunks.splice(0,1)
      }

      console.log({chunksAfter: this.chunks.map(c=>c.index).join()})

    }
  }

}
</script>
