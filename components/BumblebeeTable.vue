<template>
<div
  class="bbt-container"
  :class="{'range--selected': selectionType!='columns'}"
  ref="BbContainer"
>
  <v-menu
    v-if="columnMenuIndex!==false"
    v-model="columnMenuActive"
    outlined
    :key="columnMenuIndex"
    :close-on-content-click="false"
    attach=".active-menu-column"
    nudge-bottom="29px"
    nudge-left="4px"
    :min-width="(columnMenuIndex!==false ? Math.max(250,columns[columnMenuIndex].width+6) : 250) +'px'"
    width="250px"
    max-height="75vh"
    eager
  >
    <v-card
      class="column-menu font-reset pt-2"
      @dblclick="function(e){e.stopPropagation()}"
      style="cursor: initial"
    >
      <v-form
        @submit.prevent="saveColumnData"
        ref="column-menu"
      >
        <v-list>
          <v-list-item>
              <!-- filled -->
            <v-text-field
              outlined
              dense
              label="New column name"
              v-model="newColumnName"
            />
          </v-list-item>
          <v-list-item>
            <v-select
              outlined
              dense
              :items="allTypes"
              label="New column type"
              v-model="newColumnType"
            >
              <template v-slot:item="{ item }">
                <div class="data-type in-autocomplete">{{ dataType(item) }}</div> <span class="capitalize">{{ item }}</span>
              </template>
              <template v-slot:selection="{ item }">
                <div class="data-type in-autocomplete mr-2">{{ dataType(item) }}</div> <span class="capitalize">{{ item }}</span>
              </template>
            </v-select>
          </v-list-item>
        </v-list>

        <v-card-actions style="margin-top: -32px; margin-right: 8px; padding-bottom: 10px;">
          <v-spacer></v-spacer>
          <v-btn small text @click="columnMenuIndex = false">Cancel</v-btn>
          <v-btn small depressed color="primary" type="submit">Save</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-menu>
  <div
    class="bb-table-top-container" ref="BbTableTopContainer"
    v-if="columns && allColumns"
  >
    <div class="bb-table-header">
      <template v-for="(column, i) in allColumns">
        <div
          v-if="column.type=='duplicated'"
          :key="'d'+column.index"
          class="bb-table-h-cell bb-preview"
          :id="(column.previewIndex === previewColumns.length-1) ? 'bb-table-preview-last' : false"
          style="width: 170px"
        >
          <div class="column-title">
            {{column.name}}
          </div>
        </div>
        <div
          v-else-if="column.type=='preview'"
          :key="'p'+column.index"
          class="bb-table-h-cell bb-preview"
          :id="(column.previewIndex === previewColumns.length-1) ? 'bb-table-preview-last' : false"
          style="width: 170px"
        >
          <div class="column-title">
            {{ column.title }}
          </div>
        </div>
        <div
          v-else-if="columns[column.index]"
          :key="column.index"
          :id="'bb-table-'+columns[column.index].name"
          class="bb-table-h-cell"
          :class="{
            'active-menu-column': (columnMenuIndex===column.index),
            'bb-selected': selectionMap[column.index],
            'bb-drag-over': (dragOver===i && dragging!==i),
            'bb-drag-over-right': (dragOver===i && dragging<i),
          }"
          :style="{ width: column.width+'px' }"
          :draggable="selectionMap[column.index]"
          @dragstart="dragStart(i, $event)"
          @dragover.prevent="dragOver=i"
          @dragend="dragEnd"
          @drop="dragFinish(i, $event)"
          @click="selectColumn($event, column.index)"
          @dblclick="setMenu($event, column.index)"
        >
          <div class="data-type" :class="`type-${columns[column.index].column_dtype}`">
            {{ dataType(currentDataset.columns[column.index].column_dtype) }}
          </div>
          <div v-if="currentPreviewNames && currentPreviewNames[columns[column.index].name]" class="column-title title-preview-highlight">
            <span>{{ currentPreviewNames[columns[column.index].name] }}</span>
          </div>
          <div v-else class="column-title">
            {{ columns[column.index].name }}
          </div>
        </div>
      </template>
    </div>
    <div v-if="true" class="bb-table-plots">
      <template v-for="column in allColumns">
        <div
          :key="'p'+column.index"
          class="bb-table-plot bb-preview"
          v-if="column.type=='preview' && !column.hidden"
          :style="{ width: column.width+'px' }"
        >
          <transition name="slow-fade">
            <div v-if="previewPlotsData[column.name]">
              <DataBar
                :key="previewPlotsData[column.name].key+'databar'"
                :missing="previewPlotsData[column.name].missing"
                :total="+previewPlotsData[column.name].total"
                :mismatch="+previewPlotsData[column.name].mismatch"
                :nullV="+previewPlotsData[column.name].null"
                class="table-data-bar"
                bottom
              />
              <Frequent
                v-if="previewPlotsData[column.name].frequency"
                :key="previewPlotsData[column.name].key"
                :uniques="previewPlotsData[column.name].count_uniques"
                :values="previewPlotsData[column.name].frequency.values"
                :count="previewPlotsData[column.name].frequency.count"
                :total="+previewPlotsData[column.name].total"
                :columnIndex="column.index"
                class="histfreq"
                table
              />
              <Histogram
                v-else-if="previewPlotsData[column.name].hist"
                :key="previewPlotsData[column.name].key"
                :uniques="previewPlotsData[column.name].count_uniques"
                :values="previewPlotsData[column.name].hist"
                :total="+previewPlotsData[column.name].total"
                :columnIndex="column.index"
                class="histfreq"
                table
              />
              <Histogram
                v-else-if="previewPlotsData[column.name].hist_years"
                :key="previewPlotsData[column.name].key"
                :uniques="previewPlotsData[column.name].count_uniques"
                :values="previewPlotsData[column.name].hist_years"
                :total="+previewPlotsData[column.name].total"
                :columnIndex="column.index"
                class="histfreq"
                table
              />
              <div
                v-else
                class="aaa"
                :key="column.name"
              >
                {{previewPlotsData[column.name]}}
              </div>
            </div>
          </transition>
          <!-- <v-progress-circular
            v-else
            indeterminate
            color="primary"
            class="progress-middle"
            style="margin-top: 28px"
          /> -->

        </div>
        <div
          class="bb-table-plot"
          v-else-if="columns[column.index]"
          :key="''+column.type+column.index"
          :style="{ width: column.width+'px' }"
          :class="{
            'bb-selected': selectionMap[column.index] && column.type!=='duplicated',
            'bb-preview': column.type==='duplicated',
          }"
        >
          <div>
            <DataBar
              :key="plotsData[column.index].key+'databar'"
              :missing="plotsData[column.index].missing"
              :total="+plotsData[column.index].total"
              :mismatch="+plotsData[column.index].mismatch"
              :nullV="+plotsData[column.index].null"
              @clicked="clickedBar($event,column)"
              class="table-data-bar"
              bottom
            />
            <Frequent
              v-if="plotsData[column.index].frequency"
              :key="plotsData[column.index].key"
              :uniques="plotsData[column.index].count_uniques"
              :values="plotsData[column.index].frequency"
              :total="+plotsData[column.index].frequency[0].count"
              :columnIndex="column.index"
              class="histfreq"
              selectable
              table
            />
            <Histogram
              v-else-if="plotsData[column.index].hist"
              :key="plotsData[column.index].key"
              :uniques="plotsData[column.index].count_uniques"
              :values="plotsData[column.index].hist"
              :total="+plotsData[column.index].total"
              :columnIndex="column.index"
              class="histfreq"
              selectable
              table
            />
            <Histogram
              v-else-if="plotsData[column.index].hist_years"
              :key="plotsData[column.index].key"
              :uniques="plotsData[column.index].count_uniques"
              :values="plotsData[column.index].hist_years"
              :total="+plotsData[column.index].total"
              :columnIndex="column.index"
              class="histfreq"
              selectable
              table
            />
          </div>
        </div>
      </template>
    </div>
  </div>
  <div
    class="bb-table-container" ref="BbTableContainer"
  >
    <div class="bb-table" ref="BbTable" :style="tableStyle">
      <!-- v-show="((row.index>=visibleRowsTop) && (row.index<=visibleRowsBottom))" -->
      <div
        class="bb-table-row"
        v-for="(row, rowArrayIndex) in rows"
        :key="'r'+row.index"
        :class="['bb-highlight--'+getRowHighlight(rowArrayIndex)]"
        :style="{height: rowHeight+'px', top: row.index*rowHeight+'px'}"
      >
        <template v-for="column in allColumns">
          <template v-if="column.type==='preview' && rowsPreview && rowsPreview[rowArrayIndex] && rowsPreview[rowArrayIndex].value[column.previewIndex]">
            <div
              :key="'p'+column.index"
              class="bb-table-cell"
              :class="[
                ...column.classes,
                ...rowsPreview[rowArrayIndex].value[column.previewIndex].classes
              ]"
              :style="{width: column.width+'px'}"
              v-html="rowsPreview[rowArrayIndex].value[column.previewIndex].html"
            ></div>
          </template>
          <template v-else-if="column.type!=='preview' && row.value[column.index]">
            <div
              :key="''+column.type+column.index"
              class="bb-table-cell"
              :class="[
                ...column.classes,
                ...row.value[column.index].classes
              ]"
              :style="{width: column.width+'px'}"
              v-html="row.value[column.index].html"
            ></div>
          </template>
          <div v-else
            :key="rowArrayIndex+' '+column.index"
            class="bb-table-cell not-available --e"
            :class="column.classes"
            style="width: 170px"
          >
          </div>
        </template>
      </div>
    </div>

  </div>
</div>
</template>

<script>

import { mapState, mapGetters } from 'vuex';

import dataTypesMixin from '@/plugins/mixins/data-types'
import clientMixin from '@/plugins/mixins/client'

import Histogram from '@/components/Histogram'
import Frequent from '@/components/Frequent'
import DataBar from '@/components/DataBar'

import { parseResponse, arraysEqual, cancellablePromise, throttle, debounce, optimizeRanges, escapeQuotes, namesToIndices } from '@/utils/functions.js'

var doubleClick = false

const throttleScrollTime = 100

export default {

	components: {
		Histogram,
		Frequent,
		DataBar
	},

  mixins: [dataTypesMixin, clientMixin],

	props: {
    rowHeight: {
      default: 23,
      type: Number
    },
    bbColumns: {
      type: Array
    }
	},

  // index -> columnMenuIndex

	data () {
		return {
      maxChunks: 8, // 16,

      fetching: false,
      toFetch: [],

      rowsValues: [],
      rowsPreviewValues: [],

      columnMenuIndex: false,

      mustCheck: false,

      // visibleRowsTop: 0,
      // visibleRowsBottom: 100,
      loadedRowsTop: 0,
      loadedRowsBottom: 1,

      loadingRows: [],

      newColumnName: '',
      newColumnType: 'string',

      dragOver: -1,
      dragging: -1,

      selection: [],
      previousSelection : {},
      chunks: [],
      chunksPreview: [],
      chunksPreviewCode: '',
      columns: {}
		}
  },

	computed: {

    ...mapGetters([
      'currentSelection',
      'currentDataset',
      'selectionType',
      'currentColumnsPreview',
      'currentProfilePreview',
      'currentHighlights',
      'currentHighlightRows',
      'currentFocusedColumns',
      'currentPreviewCode',
      'currentDuplicatedColumns',
      'currentPreviewNames',
      'currentBuffer'
    ]),

    ...mapState(['allTypes']),

    rows () {
      return this.rowsValues.map((r,ri) => {
        var value = r.value.map((val, ci)=>this.getCellData(ci, ri, val ))
        return { ...r, value}
      })
    },

    rowsPreview () {
      return this.rowsPreviewValues.map((r, ri) => {
        var value = this.previewColumns.map(col=>{
          return this.getCellData(col.name, ri, r.value[col.index], true)
        })
        return { ...r, value}
      })
    },

    highlightMatches () {
      var hm = {}
      try {
        this.currentHighlights.matchColumns.forEach(column => {
          if (column.columnIndex>=0) {
            hm[column.columnIndex] = column
          } else {
            hm[column.columnTitle] = column
          }
        })
      } catch (err) {
        // console.error(err)
      }
      return hm
    },

    previewColumns () {
      try {
        var pc = this.currentColumnsPreview.length
        ? this.currentColumnsPreview.map((col)=>({
            ...col,
            type: 'preview',
            preview: true,
            name: col.title,
          }))
        : []

        var dc = this.currentDuplicatedColumns.length
        ? this.currentDuplicatedColumns.map((col)=>({
            type: 'duplicated',
            duplicated: true,
            index: this.currentDataset.columns.findIndex(c=>c.name===col.name),
            name: col.newName,
          }))
        : []

        return [...pc, ...dc].map((col,index)=>({
          ...col,
          previewIndex: index
        }))
      } catch (err) {
        return []
      }
    },

    allColumns () {
      var cols = this.bbColumns.map(index=>{
        var classes = []
        if (this.selectionMap[index]) {
          classes.push('bb-selected')
        }
        return {
          index,
          classes,
          width: 170,
          name: this.currentDataset.columns[index].name
        }
      })
      try {

        var after = []

        if (this.currentPreviewCode.from) {
          after = this.currentPreviewCode.from || after
        }
        if (!after.length && this.currentSelection.columns.length) {
          after = this.currentSelection.columns.map(s=>s.name)
        }

        var expectedColumns = this.currentPreviewCode.expectedColumns

        var pushedColumns = 0

        if (this.previewColumns.length && after) {

          if (this.previewColumns.length===1 && after.length!==1) {

            // TODO: cols unordered
            var insertIndex = Math.max(...namesToIndices(after,cols))+1

            cols.splice(insertIndex,0,{
              ...this.previewColumns[0],
              classes: ['bb-preview'],
              width: 170
            })
            pushedColumns++

          } else {

            var _after = after[0]
            var insertIndex = cols.findIndex(col=>_after===col.name)+1

            this.previewColumns.forEach((pcol, i)=>{

              if (i>=expectedColumns) {
                return
              }

              if (after[i]) {
                insertIndex = cols.findIndex(col=>after[i]===col.name)+1
              }

              if (insertIndex === 0) { // previews cannot be on position 0
                insertIndex = cols.length
              }

              cols.splice(insertIndex++,0,{
                ...pcol,
                classes: ['bb-preview'],
                width: 170
              })
              pushedColumns++
            })
          }
        }

        if (expectedColumns!==undefined && after && pushedColumns<expectedColumns){

          if (expectedColumns===1) {

            var insertIndex = Math.max(...after.map(colname=>cols.findIndex(col=>colname===col.name)))+1

            cols.splice(insertIndex, 0, {
              type: 'preview',
              index: -i,
              previewIndex: -i,
              preview: true,
              placeholder: true,
              classes: ['bb-preview', 'bb-placeholder'],
              width: 170
            })

          } else {
            for (let i = 0; i < expectedColumns-pushedColumns; i++) {

              if (after[i]) {
                insertIndex = cols.findIndex(col=>after[i]===col.name)+1+pushedColumns
              }

              if (insertIndex === 0) { // previews cannot be on position 0
                insertIndex = cols.length
              }

              cols.splice(insertIndex, 0, {
                type: 'preview',
                index: -i,
                previewIndex: -i,
                preview: true,
                placeholder: true,
                classes: ['bb-preview', 'bb-placeholder'],
                width: 170
              })
            }
          }


        }
      } catch (err) {
        console.error(err)
      }
      return cols
    },

    columnMenuActive: {
      get () {
        return this.columnMenuIndex!==false
      },
      set (v) {
        if (v!==false) {
          this.columnMenuIndex=v
        }
        else {
          this.columnMenuIndex=false
        }
      }
    },

    selectionMap() {
      return this.selection.reduce((p,v)=>{
        p[v] = true
        return p
      },{})
    },

    plotsData () {
			return this.currentDataset.columns.map((column, i) => {
				return {
          key: i,
          name: column.name,
          missing: (column.dtypes_stats.missing) ? +column.dtypes_stats.missing : 0,
          mismatch: (column.dtypes_stats.mismatch) ? +column.dtypes_stats.mismatch : 0,
          null: (column.dtypes_stats.null) ? +column.dtypes_stats.null : 0,
					// zeros: column.stats.zeros,
					total: this.currentDataset.summary.rows_count,
					count_uniques: column.stats.count_uniques,
					hist: (column.stats.hist && column.stats.hist[0]) ? column.stats.hist : undefined,
					hist_years: (column.stats.hist && column.stats.hist.years) ? column.stats.hist.years : undefined,
					frequency: ((column.stats.frequency) ? column.stats.frequency : undefined) || column.frequency || undefined
				}
			})
    },

    previewPlotsData () {
      try {

        var ppd = {}

        for (const colName in this.currentProfilePreview.columns) {
          const column = this.currentProfilePreview.columns[colName]
          ppd[colName] = {
            key: colName,
            name: colName,
            missing: (column.stats.missing) ? +column.stats.missing : 0,
            mismatch: (column.stats.mismatch) ? +column.stats.mismatch : 0,
            null: (column.stats.null) ? +column.stats.null : 0,
            // zeros: column.stats.zeros,
            total: this.currentProfilePreview.stats.rows_count,
            count_uniques: column.stats.count_uniques,
            hist: (column.stats.hist && column.stats.hist[0]) ? column.stats.hist : undefined,
            hist_years: (column.stats.hist && column.stats.hist.years) ? column.stats.hist.years : undefined,
            frequency: ((column.stats.frequency) ? column.stats.frequency : undefined) || column.frequency || undefined
          }
        }

        return ppd

      } catch (err) {
        console.error(err)
        return []
      }
    },

    rowsCount() {
      return this.currentDataset.summary.rows_count
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

    lastRow() {
      return Math.floor(this.rowsCount / this.chunkSize)
    }

  },

  mounted() {
    this.$refs['BbTableContainer'] && this.$refs['BbTableContainer'].addEventListener('scroll', this.throttledScrollCheck, {passive: true})

    this.$refs['BbTableContainer'] && this.$refs['BbTableContainer'].addEventListener('scroll', this.horizontalScrollCheckUp, {passive: true})
    this.$refs['BbTableTopContainer'] && this.$refs['BbTableTopContainer'].addEventListener('scroll', this.horizontalScrollCheckDown, {passive: true})

    this.scrollCheck()

    this.currentDataset.columns.forEach((column, index) => {
      this.$set(this.columns, index, {name: column.name, width: 170})
    });

    this.updateSelection(this.currentSelection)
  },

  beforeDestroy() {
    try {
      this.$refs['BbTableContainer'].removeEventListener('scroll', this.throttledScrollCheck)
      this.$refs['BbTableContainer'].removeEventListener('scroll', this.horizontalScrollCheckUp)
      this.$refs['BbTableTopContainer'].removeEventListener('scroll', this.horizontalScrollCheckDown)
    } catch (err) {
      console.error(err)
    }
  },

  watch: {

    currentSelection (value) {
      this.updateSelection(value)
    },

    currentColumnsPreview (value) {
      this.focusPreview()
    },

    currentPreviewCode: {
      handler () {
        if (this.chunksPreviewCode!==this.currentPreviewCode.code) {
          this.chunksPreview = []
          this.updateRows()
        }
        this.mustCheck = true
        this.debouncedThrottledScrollCheck()
      }
    },

  },

  methods: {

    getCurrentWindow () {
      var element = this.$refs['BbTableContainer']

      if (!element) {
        return false
      }

      var topPosition = element.scrollTop
      var bottomPosition = topPosition + element.clientHeight

      var top = Math.floor(topPosition/this.rowHeight)
      var bottom = Math.ceil(bottomPosition/this.rowHeight)

      return [top, bottom]
    },

    checkIncomingColumns (columns) {
      if (this.mustCheck) {
        if (columns.length>this.currentDataset.columns.length) { // TODO: Check for preview columns
          var receivedColumns = columns
						.map((column, index)=>({...column, index}))

					var columnNames = this.currentDataset.columns.map(e=>e.name)

          var previewColumns = receivedColumns
            .filter((column, index)=>(
              !columnNames.includes(column.title)
              &&
              !column.title.includes('__match_positions__')
              &&
              column.title!=='__match__'
            ))

          var matchRowsColumns = receivedColumns
            .filter((column, index)=>(column.title==='__match__'))

          var matchColumns = receivedColumns
            .filter((column, index)=>(
              !columnNames.includes(column.title)//index>=this.currentDataset.columns.length
              &&
              column.title.includes('__match_positions__')
              &&
              column.title!=='__match__'
            ))
            .map((column)=>{
              var columnTitle = column.title.split('__match_positions__')[0]
              return {
                ...column,
                columnTitle,
                columnIndex: this.currentDataset.columns.findIndex(col=>col.name===columnTitle)
              }
            })

          var color = this.currentPreviewCode.color

          if (matchRowsColumns[0]) {
            this.$store.commit('setHighlightRows', { ...matchRowsColumns[0], color })
          }

          this.$store.commit('setColumnsPreview', previewColumns)

          this.$store.commit('setHighlights', { matchColumns, color })

          if (previewColumns.length) {
            return true // must cehck
          }

        }
      }
      return false // no check
    },

    focusPreview () {
      this.$nextTick(() => {
        var columns = this.currentPreviewCode.from
        if (columns && columns.length) {
          columns.forEach(column => {
            var af = document.getElementById("bb-table-"+column)
            if (af) {
              af.scrollIntoView()
            }
          })
          var lp = document.getElementById("bb-table-preview-last") // TODO: Every preview?
          if (lp) {
            lp.scrollIntoView()
          }

          this.horizontalScrollCheckDown()
        }
      })
    },

    updateRows () {
      this.$nextTick(()=>{
        var rows = []
        var rowsPreview = []

        this.chunksPreview.forEach(chunk => {
            if (chunk.rows && chunk.rows.length) {
              rowsPreview = [...rowsPreview, ...chunk.rows]
            } else {
              console.warn(chunk)
            }
        })
        this.chunks.forEach(chunk => {
            if (chunk.rows && chunk.rows.length) {
              rows = [...rows, ...chunk.rows]
            } else {
              console.warn(chunk)
            }
        })
        rows.sort((a,b)=>a.index-b.index)
        rowsPreview.sort((a,b)=>a.index-b.index)

        this.rowsValues = [...new Set(rows)]
        this.rowsPreviewValues = [...new Set(rowsPreview)]

      })
    },

    /* drag events */

    dragStart(which, ev) {
      this.dragging = which
    },
    dragEnd(ev) {
      this.dragOver = -1
      this.dragging = -1
    },

    dragFinish(to, ev) {
      var columns = this.bbColumns
      var selection = this.currentSelection.columns.map(e=>e.index)

      if (this.dragging>to) {
        to--
      }

      columns = [
        ...columns.filter((e,i)=>(i<=to && selection.indexOf(e)==-1)),
        ...selection,
        ...columns.filter((e,i)=>(i>to && selection.indexOf(e)==-1)),
      ]
      this.$emit('sort',columns)
    },

    /* end of drag events */

    clickedBar (event, column) {
      if (column.type==='duplicated') {
        return
      }
      if (event==='missing') {
        var payload = {
          condition: 'null',
          action: 'drop'
        }
        this.commandHandle({
          command: 'filter rows',
          columns: [ this.columns[column.index].name ],
          payload
        })
      }
      if (event==='mismatch') {
        var payload = {
          condition: 'mismatch',
          action: 'drop'
        }
        this.commandHandle({
          command: 'filter rows',
          columns: [ this.columns[column.index].name ],
          payload
        })
      }
    },

    commandHandle(command) {
      this.$store.commit('commandHandle',command)
    },

    getRowHighlight (row) {
      var rows = this.rowsPreviewValues
      if (rows && rows.length && rows[row]) {
        var hlCol = this.currentHighlightRows.index
        var color = this.currentHighlightRows.color
        try {
          if (rows[row].value[hlCol]) {
            return this.currentHighlightRows.color || 'green'
          }
        } catch (err) {}
      }
      return ''
    },

    getCellData (col, ri, value, preview) {
      var classes = []
      if (value===null) {
        classes.push('none')
        value = ''
      } else if (value==='') {
        classes.push('missing')
      }
      var html = this.getCellContent(col, ri, value, preview)
      if (html===false) {
        classes.push('not-available')
      }
      return {
        html: html || '',
        classes
      }
    },

    getCellContent (col, ri, value, preview) {
      try {
        var hlCol = (this.highlightMatches[col]) ? this.highlightMatches[col].index : undefined
        if (hlCol!==undefined) {
          var color = this.currentHighlights.color['default'] ? this.currentHighlights.color[preview ? 'preview' : 'default'] : this.currentHighlights.color
          var hlv = this.rowsPreviewValues[ri].value[hlCol]
          if (hlv && hlv.length) {
            for (let i = hlv.length - 1; i >= 0; i--) {
              const [a,b] = hlv[i]
              value = value.substring(0,a)+`<span class="hlt--${color}">`+value.substring(a,b)+'</span>'+value.substring(b)
            }
          }
        }
        return `<span class="select-none">&nbsp;</span>${value}<span class="select-none">&nbsp;</span>`
      } catch (err) {
        if (value) {
          return `<span class="select-none">&nbsp;</span>${value}<span class="select-none">&nbsp;</span>`
        } else {
          return false
        }
      }
    },

    updateSelection(value) {
      var selectionArray = [...this.selection]
      var newSelection = (value.columns) ? [...value.columns] : []

      selectionArray.sort()
      newSelection.sort()

      if (!arraysEqual(selectionArray,newSelection)) {
        this.selection = value.columns.map(c=>c.index)
      }
    },

    selectColumn(event, columnIndex) {
      setTimeout(() => {

        if (doubleClick) {
          doubleClick = false
          return
        }

        // this.previousSelection = {...this.selection}
        var indexInSelection = this.selection.findIndex(e=>e==columnIndex)

        if (event.shiftKey) {
          if (this.selection.length>0) {

            var lastIndex = this.selection[this.selection.length-1]
            var sign = Math.sign(columnIndex - lastIndex)
            sign = sign || 1

            for (let i = lastIndex; (i-lastIndex)*(i-columnIndex)<=0; i+=sign) {
              var found = this.selection.findIndex(e=>e==i)
              if (found>=0) {
                this.$delete(this.selection,found)
              }
              this.$set(this.selection, this.selection.length, i)
            }
          }
          else {
            this.selection = [columnIndex]
          }
          if (indexInSelection>=0) {
            this.$delete(this.selection, indexInSelection)
          }
          else {
            this.$set(this.selection, this.selection.length, columnIndex)
          }
        }
        else if (event.ctrlKey) {
          if (indexInSelection>=0) {
            this.$delete(this.selection, indexInSelection)
          }
          else {
            this.$set(this.selection, this.selection.length, columnIndex)
          }
        }
        else {
          if (indexInSelection<0 || this.selection.length!=1) {
            this.selection = [columnIndex]
          }
          else {
            this.selection = []
          }
        }

        this.$emit('updatedSelection',this.selection)
      }, 5);
    },

    setMenu(event, index) {

      doubleClick = true

      this.newColumnName = this.currentDataset.columns[index].name
      this.newColumnType = this.currentDataset.columns[index].column_dtype

      this.columnMenuIndex = index

      this.selection = [index]
      //this.$set(this.selection, index, !this.selection[index])

      setTimeout(() => {
        var ref = this.$refs['column-menu']
        if (ref && ref.$el) {
          var el = ref.$el.getElementsByTagName('input')[0]
          if (el) {
            el.focus()
          }
          this.$nextTick(()=>{
            this.$refs['BbTableContainer'].scrollLeft = this.$refs['BbTableTopContainer'].scrollLeft
          })
          // if (this.previousSelection) {
          //   this.selection = {...this.previousSelection}
          //   this.previousSelection = false
          // }
        }
      }, 100);

    },

    saveColumnData() {
      var index = this.columnMenuIndex
      var prevName = this.currentDataset.columns[index].name
      var prevType = this.currentDataset.columns[index].column_dtype

      if (this.newColumnType != prevType) {
        var payload = {
          dtype: this.newColumnType
        }
        this.commandHandle({command: 'cast', columns: [prevName], payload})
      }

      this.$nextTick(()=>{
        if (this.newColumnName != prevName) {
          var payload = {
            output_cols: [this.newColumnName]
          }
          this.commandHandle({command: 'rename', columns: [prevName], payload, immediate: true})
        }
        this.$nextTick(()=>{
          this.columnMenuIndex = false
        })
      })
    },

    horizontalScrollCheckUp () {
      if (this.$refs['BbTableTopContainer'].scrollLeft != this.$refs['BbTableContainer'].scrollLeft) {
        this.$refs['BbTable'].style.minWidth = this.$refs['BbTableTopContainer'].scrollWidth + 'px'
        this.$refs['BbTableTopContainer'].scrollLeft = this.$refs['BbTableContainer'].scrollLeft
      }
    },

    horizontalScrollCheckDown () {
      if (this.$refs['BbTableContainer'].scrollLeft != this.$refs['BbTableTopContainer'].scrollLeft) {
        this.$refs['BbTable'].style.minWidth = this.$refs['BbTableTopContainer'].scrollWidth + 'px'
        this.$refs['BbTableContainer'].scrollLeft = this.$refs['BbTableTopContainer'].scrollLeft
      }
    },

    async setProfile (previewCode) {

      if (!previewCode) {
        this.$store.commit('setProfilePreview', false )
        return
      }

      if (this.currentProfilePreview.code !== previewCode) {

        this.$store.commit('setProfilePreview', {code: previewCode, columns: []})

        var cols = this.currentColumnsPreview.map(e=>escapeQuotes(e.title))

        var response = await this.evalCode(`_output = df.ext.buffer_window("*")${previewCode || ''}.ext.profile(["${cols.join('", "')}"], output="json")`)
        var dataset = parseResponse(response.data.result)
        if (!dataset) {
          response = await this.evalCode(`_output = df.ext.buffer_window("*")${previewCode || ''}.ext.profile(["${cols.join('", "')}"], output="json")`)
          dataset = parseResponse(response.data.result)
        }

        if (!dataset) {
          throw response
        }

        dataset = { ...dataset, code: previewCode }

        this.$store.commit('setProfilePreview', dataset)

        return true
      }
      return false
    },

    debouncedThrottledScrollCheck: debounce(function () {
      this.throttledScrollCheck()
    }, 400),

    throttledScrollCheck: throttle(function(aw = true) {this.scrollCheck(aw)} , throttleScrollTime),

    async scrollCheck (awaited = true) {
      try {
        if (!this.fetching) {

          this.fetching = true

          if (awaited) {
            var range = this.getCurrentWindow()
            if (range) {
              var [from, to] = range
              var length = to - from
              this.toFetch = [
                [from - (length*8), to + (length*8)],
                [from - (length*6), to + (length*6)],
                [from - (length*4), to + (length*4)],
                [from - (length*2), to + (length*2)],
                [from - 3, to + 3]
              ]

              for (let i = this.toFetch.length - 1; i >= 0; i--) {
                if (this.toFetch[i][0]<0 && this.toFetch[i][1]<0) {
                  this.toFetch.splice(i,1)
                  continue;
                }
              }
            }
          }

          var _awaited = false

          while (!_awaited && this.toFetch.length) {
             _awaited = await this.fetchRows()
          }

          this.fetching = false
          if (this.toFetch.length) {
            this.$nextTick(()=>{
              this.throttledScrollCheck(_awaited)
            })
            return true
          }

        }
        else if (this.toFetch.length) {
          this.$nextTick(()=>{
            this.throttledScrollCheck(false)
          })
          return false
        }
      } catch (err) {
        console.error(err)
        this.fetching = false
        if (this.toFetch.length) {
          this.$nextTick(()=>{
            this.throttledScrollCheck(false)
          })
          return false
        }
      }

    },

    async fetchRows () {

      var chunks = (this.currentPreviewCode) ? this.chunksPreview : this.chunks

      var values = this.getCurrentWindow()
      var currentFrom = (values && values[0]) ? values[0] : -1

      if (chunks.length>this.maxChunks && currentFrom>=0) {

        var distanceMap = chunks.map((chunk, index)=>({distance: Math.abs(currentFrom-chunk.from), index, from: chunk.from}))
          .filter(c=>c.from!==0)
          .sort((a,b)=>(a.distance-b.distance))
        var tries = 10

        while (chunks.length>this.maxChunks && tries--) {
          var toDelete = distanceMap.pop()
          if (toDelete) {
            chunks.splice(toDelete.index, 1)
            // console.log(`deleting ${toDelete.from} in chunks`)
          }
        }
      }

      var [from, to, force] = this.toFetch.pop()

      if (!to) {
        // console.log(`cancelling ${from} bc !to ${to}`)
        return false
      }

      from = Math.max( from, 0 )
      to = Math.min( to, this.rowsCount - 1 )

      var length = to - from

      var distanceFromWindow = Math.abs(currentFrom-from)

      var newChunks = optimizeRanges(
        [from,to],
        chunks.map(e=>[e.from,e.to])
      )

      if (!newChunks.length) {
        // console.log(`cancelling ${from} bc it is already loaded!`)
        return false // no chunks
      }


      for (let i = newChunks.length - 1; i >= 0 ; i--) {

        var previewCode = (this.currentPreviewCode ? this.currentPreviewCode.profileCode : false) || ''
        if (this.currentProfilePreview.code !== previewCode) {
          this.setProfile(false)
        }

        var checkProfile = await this.fetchChunk(newChunks[i][0], newChunks[i][1])

        this.updateRows()

        if (checkProfile) {
          if (this.currentProfilePreview.code !== previewCode) {
            await this.setProfile(previewCode)
          }
        }
      }

      // this.updateRows()

      return true

    },

    async fetchChunk(from, to) {

      var chunks = (this.currentPreviewCode) ? this.chunksPreview : this.chunks

      var index = chunks.length

      var previewCode = (this.currentPreviewCode ? this.currentPreviewCode.code : false) || ''

      // chunks[index] = { from, to, preview: previewCode || '' }

      if (!this.currentBuffer) {
        var buffer = await this.evalCode('_output = '+this.currentDataset.varname+'.ext.set_buffer("*")')
        this.$store.commit('setBuffer',true)
      }

      var response = await this.evalCode(`_output = ${this.currentDataset.varname}.ext.buffer_window("*", ${from}, ${to+1})${previewCode || ''}.ext.to_json("*")`)

      var parsed = parseResponse(response.data.result)

      if (parsed.sample) {

        var rows = parsed.sample.value.map((value,i)=>({
          value,
          index: from+i
        }))

        chunks[index] = { from, to, rows, preview: previewCode || '' }
        return this.checkIncomingColumns(parsed.sample.columns)

      } else {
        return undefined
      }
    }
  }

}
</script>

