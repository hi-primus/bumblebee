<template>
<div class="bb-table-container" ref="BbTableContainer">
  <div class="bb-table" ref="BbTable" :style="tableStyle">
    <template v-for="row in rows">
      <div :key="row.index" class="bb-table-row" :style="{height: rowHeight, top: row.index*rowHeight+'px'}">
        <div v-for="(value,k) in row.value" :key="k" class="bb-table-cell">
          {{ value }}
        </div>
      </div>
    </template>
  </div>
  <!-- {{this.chunks}} -->
</div>
</template>

<script>

import { debounce, throttle } from '@/utils/functions.js'
import { mapGetters } from 'vuex'

export default {

	props: {
    rowHeight: {
      default: 16,
      type: Number
    },
    chunkSize: {
      default: 15,
      type: Number
    },
    maxChunks: {
      default: 10,
      type: Number
    }
	},

	data() {
		return {
      chunks: []
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
        maxHeight: (this.rowHeight * this.rowsCount) + 'px',
        height: (this.rowHeight * this.rowsCount) + 'px'
      }
    },

    lastChunk() {
      return Math.floor(this.rowsCount / this.chunkSize)
    }

  },

  mounted() {
    this.$refs['BbTableContainer'].addEventListener('scroll', this.throttle_check)
    this.check()
  },

  methods: {
    throttle_check: throttle(function(e) {this.check(e)} ,300), // TODO: Parameter

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

      var from = index*this.chunkSize
      var to = Math.min(from+this.chunkSize,this.rowsCount)

      // debug
      var rows = []
      for (let i = from; i < to; i++) {
        rows.push({ index: i, value: ['row '+i,'name','04/02/2020'] })
      }
      // debug

      var chunk = { index, rows }

      if (this.chunks.length>this.maxChunks){
        this.chunks.splice(0,1)
      }
      this.chunks.push(chunk)

    }
  }

}
</script>
