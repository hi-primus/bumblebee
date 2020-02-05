<template>
<div
  class="bbt-container"
  ref="BbContainer"
>
  <div class="bb-table-top-container" ref="BbTableTopContainer">
    <div
      v-if="columns && bbColumns"
      class="bb-table-header"
    >
      <template v-for="index in bbColumns">
        <div
          class="bb-table-h-cell"
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
    <!-- <div class="bb-table-plots">
      {{bbColumns}}
      {{columns}}
    </div> -->
  </div>
  <div
    class="bb-table-container" ref="BbTableContainer"
  >
    <div class="bb-table" ref="BbTable" :style="tableStyle">
      <template v-for="row in rows">
        <div :key="row.index" class="bb-table-row" :style="{height: rowHeight, top: row.index*rowHeight+'px'}">
          <template v-for="index in bbColumns">
            <div
              v-if="row.value[index]"
              :key="index"
              class="bb-table-cell"
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

export default {

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
      chunks: [],
      columns: {},
		}
  },

	computed: {

    ...mapGetters(['currentSelection','currentDataset']),

    rows() {
      var rows = []
      this.chunks.forEach(chunk => {
        rows = [...rows, ...chunk.rows]
      });
      rows = [...new Set(rows)];
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

    console.log(this.currentDataset.columns)

    this.currentDataset.columns.forEach((column, index) => {
      this.$set(this.columns, index, {name: column.name, width: 170})
    });
  },

  methods: {

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
