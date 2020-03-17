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
          v-if="column.type=='preview' && !column.hidden"
          :key="'p'+column.index"
          class="bb-table-h-cell bb-preview"
          :id="(column.previewIndex === previewColumns.length-1) ? 'bb-table-preview-last' : false"
          style="width: 170px"
        >
          <!-- <div class="data-type" :class="`type-${columns[column.index].column_dtype}`">
            {{ dataType(currentDataset.columns[column.index].column_dtype) }}
          </div> -->
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
          :style="{ width: columns[column.index].width+'px' }"
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
          <div class="column-title">
            {{columns[column.index].name}}
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
          style="width: 170px"
        >
          <template v-if="previewPlotsData[column.name]">
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
          </template>
        </div>
        <div
          class="bb-table-plot"
          v-else-if="columns[column.index]"
          :key="column.index"
          :style="{width: columns[column.index].width+'px'}"
          :class="{'bb-selected': selectionMap[column.index]}"
        >
          <DataBar
            :key="plotsData[column.index].key+'databar'"
            :missing="plotsData[column.index].missing"
            :total="+plotsData[column.index].total"
            :mismatch="+plotsData[column.index].mismatch"
            :nullV="+plotsData[column.index].null"
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
      </template>
    </div>
  </div>
  <div
    class="bb-table-container" ref="BbTableContainer"
  >
    <div class="bb-table" ref="BbTable" :style="tableStyle">
      <template v-for="(row, rowArrayIndex) in rows">
        <!-- v-show="((row.index>=visibleRowsTop) && (row.index<=visibleRowsBottom))" -->
        <div
          class="bb-table-row"
          :key="'r'+row.index+rowArrayIndex"
          :data-rai="rowArrayIndex"
          :data-ri="row.index"
          :class="[(currentHighlightRows && currentHighlightRows.indices.includes(row.index)) ? 'bb-highlight--'+(currentHighlightRows.color || 'green') : '']"
          :style="{height: rowHeight+'px', top: row.index*rowHeight+'px'}"
        >
          <template v-for="column in allColumns">
            <template v-if="row.value">
              <div
                :key="column.index"
                class="bb-table-cell"
                :class="{
                  'bb-selected': selectionMap[column.index],
                  'missing': row.value[column.index]==='',
                  'none': row.value[column.index]===null,
                  'bb-preview': column.type=='preview'
                }"
                :style="{width: (columns[column.index] || {width: 170}).width+'px'}"
                v-html="getCell(column.index,rowArrayIndex)"
              ></div>
            </template>
          </template>
        </div>
      </template>
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

import { parseResponse, arraysEqual, cancellablePromise, throttle, debounce } from '@/utils/functions.js'

var doubleClick = false

const throttleScrollTime = 500

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
      maxChunks: 10,
      fetching: false,
      cancelFetch: false,

      columnMenuIndex: false,

      mustCheck: false,
      mustCheckProfile: false,

      // visibleRowsTop: 0,
      // visibleRowsBottom: 100,
      loadedChunksTop: 0,
      loadedChunksBottom: 1,

      newColumnName: '',
      newColumnType: 'string',

      dragOver: -1,
      dragging: -1,

      selection: [],
      previousSelection : {},
      chunks: [],
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
      'currentBuffer'
    ]),

    ...mapState(['allTypes']),

    highlightMatches () {
      var hm = {}
      try {
        this.currentHighlights.matchColumns.forEach(column => {
          hm[column.columnIndex] = column
        })
      } catch (err) {
        // console.error(err)
      }
      return hm
    },

    previewColumns () {
      try {
        return this.currentColumnsPreview
        .map((col, index)=>({
          ...col,
					type: 'preview',
          name: col.title,
          previewIndex: index
        })) || []
      } catch (err) {
        return []
      }
    },

    allColumns () {
      var arr = this.bbColumns.map(index=>({index}))
      try {
        var after = this.currentPreviewCode.from

        if (this.previewColumns.length && after) {
          var insertIndex = arr.findIndex(e=>this.currentDataset.columns[e.index].name===after)+1
          this.previewColumns.forEach(e=>{
            arr.splice(insertIndex++,0,e)
          })
        }
      } catch (err) {
        console.error(err)
      }
      return arr
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

    postochunk() {
      return 1/(this.rowHeight*this.chunkSize)
    },

    chunkSize () {
      return Math.max(Math.ceil(300/this.currentDataset.columns.length),40)
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
      return [...new Set(rows)]
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
      handler (value) {
        this.mustCheck = true
        this.throttledScrollCheck()
      }
    },

  },

  methods: {

    async checkIncomingColumns (columns) {
      if (this.mustCheck) {
        if (columns.length>this.currentDataset.columns.length) { // TODO: Check for preview columns
          var receivedColumns = columns
						.map((column, index)=>({...column, index}))

					var columnNames = this.currentDataset.columns.map(e=>e.name)

          var previewColumns = receivedColumns
            .filter((column, index)=>(
              !columnNames.includes(column.title)//index>=this.currentDataset.columns.length
              &&
              !column.title.includes('__match_positions__')
            ))

          var matchColumns = receivedColumns
            .filter((column, index)=>(
              !columnNames.includes(column.title)//index>=this.currentDataset.columns.length
              &&
              column.title.includes('__match_positions__')
            ))
            .map((column)=>{
              var columnTitle = column.title.split('__match_positions__')[0]
              return {
                ...column,
                columnTitle,
                columnIndex: this.currentDataset.columns.findIndex(col=>col.name===columnTitle)
              }
            })

          this.$store.commit('setColumnsPreview', previewColumns)

          var color = this.currentPreviewCode.color

          this.$store.commit('setHighlights', { matchColumns, color })

          if (previewColumns.length) {
            this.mustCheckProfile = true
          }

        }
      }
    },

    focusPreview (column = undefined) {
      this.$nextTick(()=>{
        column = (column!==undefined) ? column : this.currentPreviewCode.from
        if (column!==undefined) {
          var af = document.getElementById("bb-table-"+column)
          af && af.scrollIntoView();
          var lp = document.getElementById("bb-table-preview-last")
          lp && lp.scrollIntoView();

          this.horizontalScrollCheckDown()
        }
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

    commandHandle(command) {
      this.$store.commit('commandHandle',command)
    },

    getCell (column, row) {
      var content
      try {
        content = (this.rows[row].value[column]!==null && this.rows[row].value[column]!==undefined) ? this.rows[row].value[column] : ''
      } catch (err) {
        console.error('err',err)
        content = 'ERROR.'
      }
      try {
        var hlCol = this.highlightMatches[column] && this.highlightMatches[column].index
        if (hlCol) {
          for (let i = this.rows[row].value[hlCol].length - 1; i >= 0; i--) {
            const [a,b] = this.rows[row].value[hlCol][i]
            content = content.substring(0,a)+`<span class="hlt--${this.currentHighlights.color}">`+content.substring(a,b)+'</span>'+content.substring(b)
          }
        }
      } catch (err) {}
      return `<span class="select-none">&nbsp;</span>${content}<span class="select-none">&nbsp;</span>`
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
        if (ref && ref.$el){
          var el = ref.$el.getElementsByTagName('input')[0]
          if (el)
            el.focus()
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
          columns: [prevName],
          dtype: this.newColumnType
        }
        this.commandHandle({command: 'cast', ...payload})
        // commandHandle(...)
      }

      this.$nextTick(()=>{
        if (this.newColumnName != prevName) {
          var payload = {
            columns: [prevName],
            output_cols: [this.newColumnName]
          }
          this.commandHandle({command: 'rename', payload, immediate: true})
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

    debouncedSetProfile: debounce(function(p) {
      this.setProfile(p)
    } , 100 ),

    async setProfile (previewCode) {
      if (this.currentProfilePreview.code !== previewCode) {
        const response = await this.evalCode(`df.ext.buffer_window("*")${previewCode || ''}.ext.profile("*", output="json")`)
        var dataset = parseResponse(response.content)

        dataset = { ...dataset, code: previewCode }

        this.$store.commit('setProfilePreview', dataset)

        this.mustCheckProfile = false
      }
    },

    throttledScrollCheck: throttle(function(e) {this.scrollCheck(e)} , throttleScrollTime),

    async scrollCheck () {

      try {

        var element = this.$refs['BbTableContainer']

        var topPosition = element.scrollTop
        var bottomPosition = topPosition + element.clientHeight

        var top = Math.floor(topPosition/this.rowHeight)
        var bottom = Math.ceil(bottomPosition/this.rowHeight)
        var length = bottom-top

        this.$store.commit('setWindow',[
          Math.max(top-length,0),
          Math.min(bottom+length,this.currentDataset.summary.rows_count)
        ])

        if (this.cancelFetch!==false) {
          try {
            this.cancelFetch('cancelling')
          } catch (err) {}
        }

        var {promise, cancel} = cancellablePromise( this.fetchChunks(topPosition, bottomPosition) )

        this.cancelFetch = cancel

        await promise

        this.cancelFetch = false

      } catch (err) {
        // console.error(err)
      }

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
        await this.fetchChunk(i)
      }

      this.fetching = false

      if (this.chunks.length>this.maxChunks){
        this.chunks.splice(0,this.chunks.length-this.maxChunks)
      }

      if (this.mustCheckProfile) {
        var previewCode = (this.currentPreviewCode ? this.currentPreviewCode.profileCode : false) || ''

        if (this.currentProfilePreview.code !== previewCode) {
          this.debouncedSetProfile(previewCode)
        }
      }

    },

    async fetchChunk(index) {

      var previewCode = (this.currentPreviewCode ? this.currentPreviewCode.code : false) || ''
      var foundIndex = this.chunks.findIndex(chunk => {
        return chunk && (chunk.index === index)
      })

      if (foundIndex!==-1 && (this.chunks[foundIndex].preview === previewCode)) {
        return false
      }

      var chunkIndexInArray = (foundIndex!==-1) ? foundIndex : this.chunks.push({ index: index, rows: []}) - 1

      this.$set(this.chunks, chunkIndexInArray,{ index: index, rows: [], preview: previewCode || '' })

      if (!this.currentBuffer) {
        var buffer = await this.evalCode(this.currentDataset.varname+'.ext.set_buffer("*")\n"0"')
        this.$store.commit('setBuffer',true)
      }

      var response = await this.evalCode(`${this.currentDataset.varname}.ext.buffer_window("*", ${index*this.chunkSize}, ${((index+1)*this.chunkSize)})${previewCode || ''}.ext.to_json("*")`)

      var parsed = parseResponse(response.content)

      var from = index*this.chunkSize

      if (parsed.sample) {

        var rows = parsed.sample.value.map((value,i)=>({
          value,
          index: from+i
        }))
        this.checkIncomingColumns(parsed.sample.columns)
        this.$set(this.chunks, chunkIndexInArray,{ index: index, rows, preview: previewCode || '' })
        return true
      } else {
        return false
      }
    }
  }

}
</script>

