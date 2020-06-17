<template>
<div
  class="bbt-container"
  :class="{'range--selected': ['values','ranges'].includes(selectionType)}"
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
                <div class="data-type in-autocomplete">{{ dataTypeHint(item) }}</div> {{dataTypeNames[item]}}
              </template>
              <template v-slot:selection="{ item }">
                <div class="data-type mr-2">{{ dataTypeHint(item) }}</div> {{dataTypeNames[item]}}
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
    @scroll.passive="tableTopContainerScroll"
    v-if="columns && allColumns"
  >
    <div class="bb-table-header">
      <template v-for="(column, i) in allColumns">
        <div
          v-if="column.type=='duplicated'"
          :key="'d'+column.index"
          class="bb-table-h-cell bb-preview"
          :class="[
            ...(column.classes || []),
          ]"
          :id="(column.previewIndex === previewColumns.length-1) ? 'bb-table-preview-last' : false"
          style="width: 170px"
        >
          <div
            class="data-type"
            :class="`type-${currentDataset.columns[column.index].profiler_dtype}`">
            {{ dataTypeHint(currentDataset.columns[column.index].profiler_dtype) }}
          </div>
          <div class="column-title">
            {{column.name}}
          </div>
        </div>
        <div
          v-else-if="column.type=='preview'"
          :key="'p'+column.index"
          class="bb-table-h-cell bb-preview"
          :class="[
            ...(column.classes || []),
          ]"
          :id="(column.previewIndex === previewColumns.length-1) ? 'bb-table-preview-last' : false"
          style="width: 170px"
        >
          <div
            v-if="previewPlotsData[column.name]"
            class="data-type"
            :class="`type-${previewPlotsData[column.name].dtype}`">
            {{ dataTypeHint(previewPlotsData[column.name].dtype) }}
          </div>
          <div v-if="currentPreviewNames && currentPreviewNames[column.title]" class="column-title">
            <span>{{ currentPreviewNames[column.title] }}</span>
          </div>
          <div v-else class="column-title">
            {{ column.title ? column.title.split('__preview__').join('') : '' }}
          </div>
        </div>
        <div
          v-else-if="columns[column.index]"
          :key="column.index"
          :id="'bb-table-'+columns[column.index].name"
          class="bb-table-h-cell"
          :class="[
            {
              'active-menu-column': (columnMenuIndex===column.index),
              'bb-selected': selectionMap[column.index],
              'bb-drag-over': (dragOver===i && dragging!==i),
              'bb-drag-over-right': (dragOver===i && dragging<i),
            },
            ...(column.classes || []),
          ]"
          :style="{ width: column.width+'px' }"
          :draggable="selectionMap[column.index]"
          @dragstart="dragStart(i, $event)"
          @dragover.prevent="dragOver=i"
          @dragend="dragEnd"
          @drop="dragFinish(i, $event)"
          @click="selectColumn($event, column.index)"
          @dblclick="setMenu($event, column.index)"
        >
          <div class="data-type" :class="`type-${currentDataset.columns[column.index].profiler_dtype}`">
            {{ dataTypeHint(currentDataset.columns[column.index].profiler_dtype) }}
          </div>
          <div class="drag-hint"></div>
          <div v-if="currentPreviewNames && currentPreviewNames[columns[column.index].name]" class="column-title title-preview-highlight">
            <span>{{ currentPreviewNames[columns[column.index].name] }}</span>
          </div>
          <div v-else class="column-title">
            {{ column.title || columns[column.index].name }}
          </div>
        </div>
      </template>
    </div>
    <div v-if="true" class="bb-table-plots">
      <template v-for="(column, index) in allColumns">
				<div
          v-if="!column.hidden"
					:key="'plot'+column.type+column.index"
          :style="{ width: column.width+'px' }"
          class="bb-table-plot"
          :class="[
            {
              'bb-selected': !(column.type==='duplicated' || column.preview) && selectionMap[column.index],
              'bb-preview': column.type==='duplicated' || column.preview,
            },
            ...(column.classes || []),
          ]"
				>
          <transition name="quick-fade" appear mode="out-in">
            <template v-if="!lazyColumns.length || lazyColumns[index]">
              <div
                v-if="column.preview"
                :key="'p'+column.index"
                class="bb-table-plot-content"
              >
                  <div v-if="previewPlotsData[column.name]">
                    <DataBar
                      :key="previewPlotsData[column.name].key+'databar'"
                      :missing="previewPlotsData[column.name].missing"
                      :total="+previewPlotsData[column.name].total"
                      :match="+previewPlotsData[column.name].match"
                      :mismatch="+previewPlotsData[column.name].mismatch"
                      :nullV="+previewPlotsData[column.name].null"
                      class="table-data-bar"
                      bottom
                    />
                    <Frequent
                      v-if="previewPlotsData[column.name].frequency"
                      :key="previewPlotsData[column.name].key"
                      :uniques="previewPlotsData[column.name].count_uniques"
                      :values="previewPlotsData[column.name].frequency"
                      :total="+previewPlotsData[column.name].total || 1"
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
                      class="hidden-error"
                      :key="column.name"
                    >
                      {{previewPlotsData[column.name]}}
                    </div>
                  </div>

              </div>
              <div
                v-else-if="columns[column.index]"
                :key="''+column.index"
                class="bb-table-plot-content"
              >
                <div>
                  <DataBar
                    :key="plotsData[column.index].key+'databar'"
                    :missing="plotsData[column.index].missing"
                    :total="+plotsData[column.index].total || 1"
                    :match="+plotsData[column.index].match"
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
                    :total="+plotsData[column.index].total || 1"
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
                    :total="+plotsData[column.index].total || 1"
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
                    :total="+plotsData[column.index].total || 1"
                    :columnIndex="column.index"
                    class="histfreq"
                    selectable
                    table
                  />
                </div>
              </div>

            </template>
          </transition>
				</div>
      </template>
    </div>
  </div>
  <div
    class="bb-table-container" ref="BbTableContainer"
    @scroll.passive="tableContainerScroll"
  >
    <!-- <style>
      .bb-table-i-cell, .bb-table-i-row {
        height: {{rowHeight}}px;
      }
    </style> -->
    <div class="bb-table-i" v-show="true" ref="BbTable" :style="tableStyle">
      <div class="bb-table-i-rows" v-if="computedColumnValues[rowsColumn]">
        <template v-if="computedColumnValues['__match__'] && currentPreviewCode">
          <div
            v-for="(value) in computedColumnValues[rowsColumn].filter((e)=>e.index<rowsCount)"
            :key="'row'+value.index"
            class="bb-table-i-row mhl"
            :data-debug="value"
            :class="[getRowHighlight(value.index)]"
            :style="{ top: rowHeight * value.index+'px' }"
            :data-row="value.index+1"
          >
          </div>
        </template>
        <div
          v-else
          v-for="value in computedColumnValues[rowsColumn].filter((e)=>e.index<rowsCount)"
          :key="'row'+value.index"
          class="bb-table-i-row"
          :style="{ top: rowHeight * value.index+'px' }"
          :data-row="value.index+1"
        >
        </div>
        <div>

        </div>
      </div>
      <template v-for="(column, cindex) in allColumns">
        <div
          class="bb-table-i-column"
          :key="'column'+column.type+column.index"
          :style="{minWidth: (column.width || 170)+'px'}"
          :class="[
            ...(column.classes || []),
          ]"
        >
          <template v-if="!(lazyColumns.length && !lazyColumns[cindex]) && computedColumnValues[column.sampleName]">
            <template v-if="column.preview || column.duplicated">
              <template v-for="value in computedColumnValues[column.sampleName].filter((e)=>e!==undefined && e!==null && e.index<rowsCount)">
                <div
                  :key="'c'+column.index+'r'+value.index"
                  class="bb-table-i-cell"
                  :style="{ top: rowHeight * value.index+'px' }"
                  v-html="value.html"
                >
                </div>
              </template>
            </template>
            <template v-else v-for="value in computedColumnValues[column.name].filter((e)=>e!==undefined && e!==null)">
              <div
                :key="'c'+column.index+'r'+value.index"
                class="bb-table-i-cell"
                :style="{
                  top: rowHeight * value.index+'px',
                  userSelect: (cellsSelection==([idInSample[column.sampleName], value.index]).join()) ? 'text' : 'none'
                }"
                v-html="value.html"
                @mousedown="clearSelection(); cellsSelection = [idInSample[column.sampleName] || column.index, value.index].join()"
                @mouseup="checkSelection(idInSample[column.sampleName] || column.index, value.index)"
              >
              </div>
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

/*bu*/ import {
  parseResponse, arraysEqual,
  cancellablePromise, throttle,
  debounce, optimizeRanges,
  escapeQuotes, namesToIndices,
  getSelectedText, getPropertyAsync
} from 'bumblebee-utils' /*bu*/

var doubleClick = false

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

	data () {
		return {
      maxChunks: 8, // 16,

      fetching: false,
      toFetch: [],

      previousRange: '',

      cellsSelection: '',

      columnValues: {},

      columnMenuIndex: false,

      incompleteColumns: false,

      mustCheck: false,
      mustUpdateRows: false,
      recalculateRows: false,

      loadedRowsTop: 0,
      loadedRowsBottom: 1,

      loadingRows: [],
      previewRowsCount: 0,

      newColumnName: '',
      newColumnType: 'string',

      dragOver: -1,
      dragging: -1,

      selection: [],

      chunks: [],
      chunksPreview: [],

      fetched: [],
      fetchedPreview: [],

      loadedPreviewCode: '',

      indicesInSample: {},

      lazyColumns: [],
		}
  },

	computed: {

    ...mapGetters([
      'currentSelection',
      'currentDataset',
      'currentDatasetUpdate',
      'selectionType',
      'currentPreviewColumns',
      'currentProfilePreview',
      'currentHighlights',
      'currentRowHighlights',
      'currentFocusedColumns',
      'currentPreviewCode',
      'currentDuplicatedColumns',
      'currentPreviewNames',
      'currentLoadPreview',
      'currentBuffer'
    ]),

    ...mapState(['allTypes']),

    columns () {
      if (this.currentDataset.columns && this.currentDataset.columns.length) {
        return this.currentDataset.columns.map(column=>({name: column.name, width: 170}))
      }
      return []
    },

    rowsColumn () {

      try {

        if (this.currentPreviewCode && this.columnValues['__match__'] && this.columnValues['__match__'].length) {
          return '__match__'
        }

        var columns = this.columnValues

        if (this.loadPreview) {
          columns = this.loadPreviewColumnValues
        }

        var max = 0
        var sKey = Object.keys(columns)[0]

        for (var key in columns) {
          if (columns[key].length>max) {
            max = columns[key].length
            sKey = key
          }
        }

        return sKey

      } catch (err) {
        console.error(err)
      }
      return Object.keys(this.columnValues)[0]
    },

    computedColumnValues () {
      if (this.loadPreview) {
        return this.loadPreviewColumnValues
      }
      var noHighlight = !this.currentPreviewCode.code
      return this.computeColumnValues(this.columnValues, noHighlight, this.rowsCount)
    },

    loadPreviewColumnValues () {
      var columnValues = this.getValuesByColumns(this.currentLoadPreview.sample)
      return this.computeColumnValues(columnValues, true)
    },

    idInSample () {
      return this.indicesInSample // TODO: name mapping
    },

    loadPreview () {
      return this.currentPreviewCode && this.currentPreviewCode.loadPreview
    },

    datasetPreview () {
      return this.currentPreviewCode && this.currentPreviewCode.datasetPreview
    },

    highlightMatches () {
      var hm = {}
      try {
        this.currentHighlights.matchColumns.forEach(column => {
          hm[column.columnTitle] = column
        })
      } catch (err) {
        // console.error(err)
      }
      return hm
    },

    previewColumns () {
      try {

        var loadPreviewColumns = (this.loadPreview && this.currentLoadPreview && this.currentLoadPreview.sample) ? this.currentLoadPreview.sample.columns : []

        var dpc = loadPreviewColumns.length
        ? loadPreviewColumns.map((col, index)=>({
          ...col, // title
          index,
          preview: true,
          type: 'preview',
          name: col.title.split('__preview__').join(''),
          sampleName: col.title
        }))
        : []

        var pc = this.currentPreviewColumns.length
        ? this.currentPreviewColumns.map((col)=>({
            ...col,
            type: 'preview',
            preview: true,
            name: col.title.split('__preview__').join(''),
            sampleName: col.title
          }))
        : []

        var dc = this.currentDuplicatedColumns.length
        ? this.currentDuplicatedColumns.map((col)=>({
            type: 'duplicated',
            duplicated: true,
            index: this.currentDataset.columns.findIndex(c=>c.name===col.name),
            name: col.newName,
            sampleName: col.name,
          }))
        : []


        if (this.currentPreviewCode.joinPreview) {
          var jp = this.currentPreviewCode.joinPreview
          for (var index = 0; index<pc.length; index++) {
            for (var jindex = 0; jindex<jp.length; jindex++) {
              if (jp[jindex].indexOf(pc[index].name)>=0) {
                pc[index].classes = ['bb-preview-join-'+jindex]
              }
            }
          }
        }

        return [...pc, ...dc, ...dpc].map((col,index)=>({
          ...col,
          previewIndex: index
        }))
      } catch (err) {
        console.error(err)
        return []
      }
    },

    allColumns () {

      this.incompleteColumns = false

      if ((this.datasetPreview || this.loadPreview) && this.previewColumns && this.previewColumns.length) {
        return this.previewColumns.map(c=>({
          ...c,
          classes: [...(c.classes || []), 'bb-preview'],
          width: 170
        }))
      }

      var cols = []
      var wholePreview = (this.currentPreviewCode.datasetPreview || this.currentPreviewCode.loadPreview)
      if (
        !this.currentPreviewCode
        ||
        !wholePreview
        ||
        (wholePreview && !(this.previewColumns && this.previewColumns.length))
        ) {
        cols = this.bbColumns.map(index=>{
          var classes = []
          if (this.selectionMap[index]) {
            classes.push('bb-selected')
          }
          return {
            index,
            classes,
            width: 170,
            name: this.currentDataset.columns[index].name,
            sampleName: this.currentDataset.columns[index].name
          }
        })
      }

      if (
        (this.currentPreviewCode && wholePreview && !(this.previewColumns && this.previewColumns.length))
        ||
        (!this.currentPreviewCode && !(this.currentDuplicatedColumns && this.currentDuplicatedColumns.length))
      ) {
        return cols
      }

      try {

        var after = []

        if (this.currentPreviewCode.from) {
          after = this.currentPreviewCode.from || after
        }

        if (!(after && after.length) && (this.currentSelection.columns && this.currentSelection.columns.length)) {
          after = this.currentSelection.columns.map(s=>s.name) || after
        }

        after = after || []

        var expectedColumns = (this.currentDuplicatedColumns) ? this.currentDuplicatedColumns.length : this.currentPreviewCode.expectedColumns

        if (expectedColumns===0) {
          return cols
        }

        var pushedColumns = 0

        if (this.previewColumns.length) {

          if (this.previewColumns.length===1 && after.length>1) {

            var insertIndex = Math.max(...namesToIndices(after,cols))+1

            var column = this.previewColumns[0]

            cols.splice(insertIndex,0,{
              ...column,
              classes: [...(column.classes || []), 'bb-preview'],
              width: 170,
              // title: (this.currentPreviewNames && this.currentPreviewNames[column.title]) || column.title || ''
            })
            pushedColumns++

          } else {

            var _after = after[0]
            var insertIndex = _after ? cols.findIndex(col=>_after===col.name)+1 : 0

            this.previewColumns.forEach((pcol, i)=>{

              if (expectedColumns>=0 && i>=expectedColumns) {
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
                classes: [...(pcol.classes || []), 'bb-preview'],
                width: 170,
                // title: (this.currentPreviewNames && this.currentPreviewNames[pcol.title]) || pcol.title || ''
              })
              pushedColumns++
            })
          }
        }

        if (expectedColumns!==undefined && after && pushedColumns<expectedColumns){

          this.incompleteColumns = true

          if (expectedColumns===1) {

            var insertIndex = Math.max(...after.map(colname=>cols.findIndex(col=>colname===col.name)))+1

            cols.splice(insertIndex, 0, {
              type: 'preview',
              index: -1,
              previewIndex: -1,
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

      var valueIndices = cols.map(col=>col.index)
      valueIndices.sort((a,b)=>a-b)

      return cols.map((col,i)=>({...col, valueIndex: valueIndices.findIndex((vi)=>vi===col.index)}))
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
          missing: (column.stats.missing) ? +column.stats.missing : 0,
          match: (column.stats.match) ? +column.stats.match : 0,
          mismatch: (column.stats.mismatch) ? +column.stats.mismatch : 0,
					count_uniques: column.stats.count_uniques,
					hist: (column.stats.hist && column.stats.hist[0]) ? column.stats.hist : undefined,
					frequency: ((column.stats.frequency) ? column.stats.frequency : undefined) || column.frequency || undefined,
					total: +this.currentDataset.summary.rows_count,
					zeros: column.stats.zeros,
          null: column.stats.null,
					// hist_years: (column.stats.hist && column.stats.hist.years) ? column.stats.hist.years : undefined
				}
			})
    },

    previewPlotsData () {
      try {

        var ppd = {}

        var profile

        if (this.loadPreview && this.currentLoadPreview && this.currentLoadPreview.profile) {
          profile = this.currentLoadPreview.profile
        } else {
          profile = this.currentProfilePreview
        }

        for (const colName in profile.columns) {
          const column = profile.columns[colName]
          ppd[colName] = {
            key: colName,
            name: colName,
            missing: (column.stats.missing) ? +column.stats.missing : 0,
            match: (column.stats.match) ? +column.stats.match : 0,
            mismatch: (column.stats.mismatch) ? +column.stats.mismatch : 0,
            total: +profile.summary.rows_count,
            count_uniques: column.stats.count_uniques,
            hist: (column.stats.hist && column.stats.hist[0]) ? column.stats.hist : undefined,
            frequency: ((column.stats.frequency) ? column.stats.frequency : undefined) || column.frequency || undefined,
            zeros: column.stats.zeros,
            null: column.stats.null,
            dtype: column.profiler_dtype || column.dtype
            // hist_years: (column.stats.hist && column.stats.hist.years) ? column.stats.hist.years : undefined,
          }
        }

        return ppd

      } catch (err) {
        console.error(err)
        return []
      }
    },

    totalRowsCount () {
      return Math.max(this.currentDataset.summary.rows_count, this.rowsCount)
    },

    rowsCount () {
      try {
        var value = 0
        if (this.loadPreview && this.currentLoadPreview && this.currentLoadPreview.sample) {
          value = this.currentLoadPreview.sample.value.length
          return value
        }
        if (this.currentPreviewCode && !this.incompleteColumns) {
          if (this.currentRowHighlights && typeof this.currentRowHighlights === 'number'){
            if (this.currentPreviewCode.noBufferWindow) {
              value = this.currentRowHighlights
            }
          }
          if (this.currentProfilePreview && this.currentProfilePreview.summary && this.currentProfilePreview.summary.rows_count) {
            this.previewRowsCount = this.currentProfilePreview.summary.rows_count
            value = Math.max(value, this.currentProfilePreview.summary.rows_count)
          }
          if (this.currentPreviewCode.datasetPreview && this.previewRowsCount) {
            value = Math.max(value, this.previewRowsCount)
          }
        }
        if (value<=0) {
          value = this.currentDataset.summary.rows_count
        }
      } catch (error) {
        console.error('rowsCount',error)
        value = this.currentDataset.summary.rows_count || 0
      }
      return value

    },

    tableStyle() {
      var h = this.rowHeight * (+this.rowsCount)
      return {
        maxHeight: h+'px',
        height: h+'px'
      }

    }
  },

  mounted() {

    this.checkVisibleColumns()

    this.mustUpdateRows = true
    this.updateRows()

    // this.$refs['BbTableContainer'] && this.$refs['BbTableContainer'].addEventListener('scroll', this.throttledScrollCheck, {passive: true})
    // this.$refs['BbTableContainer'] && this.$refs['BbTableContainer'].addEventListener('scroll', this.debouncedScrollCheck, {passive: true})

    // this.$refs['BbTableContainer'] && this.$refs['BbTableContainer'].addEventListener('scroll', this.horizontalScrollCheckUp, {passive: true})
    // this.$refs['BbTableTopContainer'] && this.$refs['BbTableTopContainer'].addEventListener('scroll', this.horizontalScrollCheckDown, {passive: true})

    // this.$refs['BbTableContainer'] && this.$refs['BbTableContainer'].addEventListener('scroll', this.checkVisibleColumns, {passive: true})
    // this.$refs['BbTableTopContainer'] && this.$refs['BbTableTopContainer'].addEventListener('scroll', this.checkVisibleColumns, {passive: true})
  },

  // beforeDestroy() {
  //   try {
  //     this.$refs['BbTableContainer'].removeEventListener('scroll', this.throttledScrollCheck)
  //     this.$refs['BbTableContainer'].removeEventListener('scroll', this.debouncedScrollCheck)
  //     this.$refs['BbTableContainer'].removeEventListener('scroll', this.horizontalScrollCheckUp)
  //     this.$refs['BbTableTopContainer'].removeEventListener('scroll', this.horizontalScrollCheckDown)
  //     this.$refs['BbTableContainer'].removeEventListener('scroll', this.checkVisibleColumns)
  //     this.$refs['BbTableTopContainer'].removeEventListener('scroll', this.checkVisibleColumns)
  //   } catch (err) {
  //     console.error(err)
  //   }
  // },

  watch: {

    currentPreviewNames (value) {

      var indicesInSample = {}

      Object.entries(value).forEach(([previousName, newName])=>{
        indicesInSample[newName] = this.indicesInSample[previousName]
      })

      this.indicesInSample = {...this.indicesInSample, ...indicesInSample}
    },

    currentSelection (value) {
      this.updateSelection(value)
    },

    currentPreviewColumns (value) {
      this.focusPreview()
    },

    currentPreviewCode: {

      deep: true,

      async handler (currentPreviewCode) {
        var currentCode = await getPropertyAsync(currentPreviewCode.code)
        if (this.loadedPreviewCode!==currentCode) {
          this.loadedPreviewCode = currentCode
          if (currentCode) { // a new code
            delete this.columnValues['__match__']
            this.fetched = this.fetched.filter(e=>!e.code)
          }
          if (!currentPreviewCode.load) {
            this.previousRange = -1
            await this.scrollCheck(true) // await?
            this.mustUpdateRows = true
            this.updateRows()
            this.mustCheck = true
          }
        }
      },

    },

    currentDatasetUpdate: {
      immediate: true,
      handler () {

        this.updateSelection(this.currentSelection) // TEST
        this.fetched = []
        this.previousRange = -1
        this.$nextTick(() => {
          this.scrollCheck(true)
        })
      }
    },

    previewColumns () {
      this.checkVisibleColumns()
    },

  },

  methods: {

    tableContainerScroll () {
      this.throttledScrollCheck()
      this.debouncedScrollCheck()
      this.horizontalScrollCheckUp()
      this.checkVisibleColumns()
    },

    tableTopContainerScroll () {
      this.horizontalScrollCheckDown()
      this.checkVisibleColumns()
    },

    computeColumnValues (columnValues, noHighlight = false, limit = Infinity) {
      var cValues = {}

      for (const name in columnValues) {
        // TODO: not include highlights
        var array = []
        const values = columnValues[name]
        if (!values || !values.length) {
          return cValues[name] = []
          continue // TODO: Handling
        }
        const highlight = !noHighlight && this.highlightMatches && this.highlightMatches[name] && this.highlightMatches[name].title
        const hlValues = columnValues[highlight]
        if (highlight && hlValues && hlValues.length) {
          const preview = name.includes('__preview__') || name.includes('new ') // TODO: Check
          const color = this.currentHighlights.color['default'] ? this.currentHighlights.color[preview ? 'preview' : 'default'] : this.currentHighlights.color
          for (const index in values) {
            if (index>=limit) {
              continue
            }
            var html = this.getCellHtmlHighlight(values[index], hlValues[index], color)
            array.push({html , index: +index})
          }
        } else {
          for (const index in values) {
            if (index>=limit) {
              continue
            }
            var html = this.getCellHtml(values[index])
            array.push({html , index: +index})
          }
        }

        cValues[name] = array
      }
      return cValues
    },

    setBuffer: debounce( async function () {
      try {
        var buffer = await this.evalCode('_output = '+this.currentDataset.varname+'.ext.set_buffer("*")')
        this.$store.commit('setBuffer',true)
        this.$nextTick(()=>{
          this.debouncedThrottledScrollCheck()
        })
      } catch (error) {
        console.error(error)
      }
    }, 300),

    clearSelection () {
      if (window.getSelection) {
        window.getSelection().removeAllRanges()
      }
      else if (document.selection) {
        document.selection.empty()
      }
      this.$store.commit('selection',{ clear: true })
    },

    checkSelection (ci, ri) {

      var colName = this.columns[ci].name

      var {selectedText, selection} = getSelectedText()

      if (!selectedText && this.selectionType==='text') {
        this.$store.commit('selection',{ clear: true })
        return
      }

      selectedText = selectedText.split('\n')[0]

			if (this.cellsSelection) {
        [ci, ri] = this.cellsSelection.split(',')
			}
      var cellValue = this.columnValues[colName][ri]

      cellValue = cellValue ? cellValue.toString() : ''

      // if (selectedText.endsWith(' ') && !cellValue.endsWith(' ')) {
      //   selectedText = selectedText.substr(0,selectedText.length - 1) // remove unwanted extra space
      // }

			if (cellValue && cellValue.includes(selectedText)) {
        this.$store.commit('selection',{
          text: {
            column: this.columns[ci].name,
            index: ci,
            value: selectedText,
            selection
          }
        })
			}
    },

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

    getValuesByColumns (sample, clear, from = 0, preppend = '') {
      try {
        var columnValues = []

        sample.columns.forEach(({title}, i) => {
          columnValues[i] = (clear) ? [] : (this.columnValues[title] || [])
        })

        sample.value.forEach((row, i) => {
          row.forEach((value,j)=>{
            columnValues[j][from+i] = value
          })
        })

        var columnValuesObject = {}

        sample.columns.forEach(({title}, i) => {
          columnValuesObject[preppend+title] = columnValues[i]
        })

        if (clear) {
          return columnValuesObject
        } else {
          return {...this.columnValues, ...columnValuesObject}
        }
      } catch (error) {
        console.error(error)
        return {}
      }
    },

    checkIncomingColumns (columns) {

      var indicesInSample = {}

      columns.forEach((column, index)=>{
        indicesInSample[column.title] = index
      })

      this.indicesInSample = {...indicesInSample}

      if (this.mustCheck) {
        if (columns.map(c=>c.title).join()!==this.currentDataset.columns.map(c=>c.name).join()) {
          var receivedColumns = columns
						.map((column, index)=>({...column, index}))

					var columnNames = this.currentDataset.columns.map(e=>e.name)

          var previewColumns = []
          if (this.currentPreviewCode && this.currentPreviewCode.datasetPreview) {
            previewColumns = receivedColumns
              .filter((column, index)=>(
                !column.title.includes('__match_positions__')
                &&
                column.title!=='__match__'
              ))
            } else {
            previewColumns = receivedColumns
              .filter((column, index)=>(
                !columnNames.includes(column.title)
                &&
                !column.title.includes('__match_positions__')
                &&
                column.title!=='__match__'
              ))

          }

          var matchRowsColumns = receivedColumns
            .filter((column, index)=>(column.title==='__match__'))

          var matchColumns = receivedColumns
            .filter((column, index)=>(
              !columnNames.includes(column.title)
              &&
              column.title.includes('__match_positions__')
              &&
              column.title!=='__match__'
            ))
            .map((column)=>{
              var columnTitle = column.title.split('__match_positions__')[0]
              return {
                ...column,
                columnTitle
              }
            })

          var color = this.currentPreviewCode.color

          if (matchRowsColumns[0]) {
            if (typeof this.currentRowHighlights !== 'number') {
              // this.$store.commit('setRowHighlights', true)
              this.$store.commit('setPreviewInfo', {rowHighlights: true})
            }
          } else {
            // this.$store.commit('setRowHighlights', false)
            this.$store.commit('setPreviewInfo', {rowHighlights: false})
          }

          this.$store.commit('setPreviewColumns', previewColumns)

          this.$store.commit('setHighlights', { matchColumns, color })

          if (previewColumns.length || matchRowsColumns.length) {
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
          rowsType: 'missing',
          action: 'drop'
        }
        this.commandHandle({
          command: 'REMOVE_KEEP_SET',
          columns: [ this.columns[column.index].name ],
          payload
        })
      }
      if (event==='mismatch') {
        var payload = {
          rowsType: 'mismatch',
          action: 'drop'
        }
        this.commandHandle({
          command: 'REMOVE_KEEP_SET',
          columns: [ this.columns[column.index].name ],
          payload
        })
      }
    },

    commandHandle (command) {
      this.$store.commit('commandHandle',command)
    },

    getRowHighlight (row) {
      try {
        if (this.columnValues['__match__'][row]) {
          return 'bb-highlight--'+(this.currentPreviewCode.color || 'green')
        }
      } catch (err) {
        // console.error(err)
      }
      return  ''
    },

    getCellHtml (value) {
      if (value) {
        return value
      } else if (value==='') {
        return '<span class="null-cell">Empty</span>'
      } else if (value===null) {
        return '<span class="null-cell">None</span>'
      }
      return value
    },

    getCellHtmlHighlight (value, hlv = [], color = 'green') {
      if (value==='') {
        return '<span class="null-cell">Empty</span>'
      } else if (value===null) {
        return '<span class="null-cell">None</span>'
      } else if (!value) {
        return value
      }
      var _value = value
      try {
        if (hlv && hlv.length) {
          for (let i = hlv.length - 1; i >= 0; i--) {
            const [a,b] = hlv[i]
            _value = value.substring(0,a)+`<span class="hlt--${color}">`+value.substring(a,b)+'</span>'+value.substring(b)
          }
        }
        return _value
      } catch (err) {
        if (value) {
          return value
        } else if (_value) {
          return _value
        } else {
          return '<span class="null-cell">Null</span>'
        }
      }
    },

    updateSelection (value) {
      try {

        var selectionArray = [...this.selection]
        var newSelection = (value.columns) ? [...value.columns] : [] // TODO: Check value

        selectionArray.sort()
        newSelection.sort()

        if (!arraysEqual(selectionArray,newSelection)) {
          this.selection = newSelection.map(c=>c.index)
        }
      } catch (error) {
        console.error(error)
      }
    },

    selectColumn (event, columnIndex) {
      setTimeout(() => {

        if (doubleClick) {
          doubleClick = false
          return
        }

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

    setMenu (event, index) {

      doubleClick = true

      this.newColumnName = this.currentDataset.columns[index].name
      this.newColumnType = this.currentDataset.columns[index].profiler_dtype

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
        }
      }, 100);

    },

    saveColumnData () {
      var index = this.columnMenuIndex
      var prevName = this.currentDataset.columns[index].name
      var prevType = this.currentDataset.columns[index].profiler_dtype

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
          this.commandHandle({
            command: 'rename',
            columns: [prevName],
            payload,
            immediate: true
          })
        }
        this.$nextTick(()=>{
          this.columnMenuIndex = false
        })
      })
    },

    checkVisibleColumns: debounce( function(event) {
      try {
        var scrollLeft = this.$refs['BbTableTopContainer'].scrollLeft

        var a = scrollLeft/170
        var b = (scrollLeft + this.$refs['BbTableTopContainer'].offsetWidth)/170

        a = Math.floor((a)-0.1)
        b = Math.ceil((b))


        var numbers = []

        for (let n = a; n <= b; n++) {
          numbers[n] = true
        }

        this.lazyColumns = numbers
      } catch (error) {
        this.lazyColumns = []
      }

    }, 80),

    horizontalScrollCheckUp () {
      var topScrollLeft = this.$refs['BbTableTopContainer'].scrollLeft
      var bottomScrollLeft = this.$refs['BbTableContainer'].scrollLeft
      if (topScrollLeft != bottomScrollLeft) {
        this.$refs['BbTable'].style.minWidth = this.$refs['BbTableTopContainer'].scrollWidth + 'px'
        this.$refs['BbTableTopContainer'].scrollLeft = bottomScrollLeft
      }
    },

    horizontalScrollCheckDown () {
      var topScrollLeft = this.$refs['BbTableTopContainer'].scrollLeft
      var bottomScrollLeft = this.$refs['BbTableContainer'].scrollLeft
      if (bottomScrollLeft != topScrollLeft) {
        this.$refs['BbTable'].style.minWidth = this.$refs['BbTableTopContainer'].scrollWidth + 'px'
        this.$refs['BbTableContainer'].scrollLeft = topScrollLeft
      }
    },

    async setProfile (previewCode) {

      if (!previewCode) {
        this.$store.commit('setProfilePreview', false )
        return
      }

      if (this.currentProfilePreview.code !== previewCode) {

        var profile = (this.currentPreviewColumns && this.currentPreviewColumns.length)

        var matches = this.currentRowHighlights

        this.$store.commit('setProfilePreview', {code: previewCode, columns: []})

        var cols = this.currentPreviewColumns.map(e=>escapeQuotes(  e.title.split('__preview__').join('')  ))

        var code = `_df_profile = ${this.currentDataset.varname}.ext.buffer_window("*")${await getPropertyAsync(previewCode) || ''}`
        + `\n_output = { `
        + (profile ? `"profile": _df_profile.ext.profile(["${cols.join('", "')}"], output="json")` : '')
        + (profile && matches ? `, ` : '')
        + (matches ? `"matches_count": len(_df_profile.rows.select('df["__match__"]!=False'))` : '')
        + `}`

        var response = await this.evalCode(code)

        if (!response) {
          throw response
        }

        if (profile && response.data.result.profile) {
          var dataset = parseResponse(response.data.result.profile)

          if (!dataset) {
            throw response
          }

          dataset = { ...dataset, code: previewCode }

          this.$store.commit('setProfilePreview', dataset)
        }

        if (matches && response.data.result.matches_count!==undefined) {

          this.$store.commit('setPreviewInfo', {rowHighlights: +response.data.result.matches_count})

        }



        return true
      }
      return false
    },

    debouncedScrollCheck: debounce( function () {
      if (this.mustUpdateRows) {
        this.mustUpdateRows = false
        this.updateRows()
      }
    }, 80),

    debouncedThrottledScrollCheck: debounce( function () {
      this.throttledScrollCheck()
    }, 400),

    throttledScrollCheck: throttle( function (aw = true) {
      this.scrollCheck(aw)
    } , 100),

    async scrollCheck (awaited = true) {
      if (this.currentPreviewCode.load) {
        return false
      }
      try {
        if (!this.fetching) {

          awaited = (awaited===undefined) ? true : awaited

          var range = false

          this.fetching = true

          if (awaited) {
            range = this.getCurrentWindow()

            if (range) {

              var rangeJoin = range.join()
              if (rangeJoin === this.previousRange) {
                this.fetching = false
                return false
              }
              this.previousRange = rangeJoin

              var [from, to] = range
              var length = to - from
              var realLength

              if (length>18) {
                realLength = length
                to = from + 18
                length = to - from
              }

              if (realLength) {
                this.toFetch = [
                  [from - (length*6), to + (length*6)],
                  [from - (length*4), to + (length*4)],
                  [from - (length*2), to + (length*2)],
                  [from - 3, from+realLength + 3]
                ]
              } else {
                this.toFetch = [
                  [from - (length*6), to + (length*6)],
                  [from - (length*4), to + (length*4)],
                  [from - (length*2), to + (length*2)],
                  [from - 3, to + 3]
                ]

              }

              for (let i = this.toFetch.length - 1; i >= 0; i--) {
                if (this.toFetch[i][0]<0 && this.toFetch[i][1]<0) {
                  this.toFetch.splice(i,1)
                  continue;
                }
              }
            }
          }

          awaited = false

          while (!awaited && this.toFetch.length) {
            range = await this.fetchRows(range)
            awaited = (range===false)
          }

          if (!awaited) {
            this.previousRange = -1 // TODO: Check
          }

          this.fetching = false
          if (this.toFetch.length) {
            this.$nextTick(()=>{
              this.throttledScrollCheck(awaited)
            })
            return true
          }

          // if (!this.fetched.length) {
          //   this.$nextTick(()=>{
          //     this.throttledScrollCheck(true)
          //   })
          // }

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

    async fetchRows (_range) {

      var range = (_range && _range.length) ? _range : this.getCurrentWindow()
      var currentFrom = (range && range[0]) ? range[0] : -1

      // deletes

      var fetched

      // get the valid fetches to know what to fetch next

      if (this.currentPreviewCode) {
        fetched = this.fetched.filter(e=>e.code===this.currentPreviewCode.code)
        if (!fetched.length) {
          this.fetched = this.fetched.filter(e=>!e.code)
          this.recalculateRows = true
        }
      } else {
        fetched = this.fetched.filter(e=>e.update===this.currentDatasetUpdate)
        if (!fetched.length) {
          // this.fetched = this.fetched.filter(e=>e.update===this.currentDatasetUpdate)
          this.fetched = []
          this.recalculateRows = true
        }
      }

      if (this.fetched.length>(this.maxChunks+2) && currentFrom>=0) {
        // +2 so it doesn't calculate a distanceMap every time
        var distanceMap = this.fetched.map((chunk, index)=>({
          distance: Math.abs(currentFrom-chunk.from),
          index,
          from: chunk.from
        }))
          .filter(c=>c.from!==0)
          .sort((a,b)=>(a.distance-b.distance))
        var tries = 10

        while (this.fetched.length>this.maxChunks && tries--) {
          var toDelete = distanceMap.pop()
          if (toDelete) {
            this.fetched.splice(toDelete.index, 1)
            this.recalculateRows = true
          }
        }
      }

      var [from, to, force] = this.toFetch.pop()

      if (!to) {
        return range
      }

      from = Math.max( from, 0 )
      to = Math.min( to, this.totalRowsCount - 1 )

      var length = to - from

      var distanceFromWindow = Math.abs(currentFrom-from)

      var newRanges = optimizeRanges(
        [from,to],
        fetched.map(e=>[e.from,e.to])
      )

      if (!newRanges.length) {
        return range // no chunks
      }

      var toret = range

      for (let i = newRanges.length - 1; i >= 0 ; i--) {

        var previewCode = (this.currentPreviewCode ? this.currentPreviewCode.profileCode : false) || ''
        if (this.currentProfilePreview.code !== previewCode) {
          this.setProfile(false)
        }

        var checkProfile = await this.fetchChunk(newRanges[i][0], newRanges[i][1])

        this.mustUpdateRows = true

        toret = (checkProfile===undefined) ? range : false

        if (checkProfile) {
          if (this.currentProfilePreview.code !== previewCode) {
            await this.setProfile(previewCode)
          }
        }
      }

      this.debouncedScrollCheck()

      return toret

    },

    async fetchChunk(from, to) {

      var previewCode = ''
      var noBufferWindow = false
      var forceName = false

      if (this.currentPreviewCode) {
        previewCode = this.currentPreviewCode.code
        noBufferWindow = this.currentPreviewCode.noBufferWindow
        forceName = !!this.currentPreviewCode.datasetPreview
      }

      if (!this.currentBuffer) {
        this.setBuffer()
        return undefined
      }

      var code = await getPropertyAsync(previewCode, [from, to+1]) || ''

      var referenceCode = await getPropertyAsync(previewCode) || ''

      if (this.currentPreviewCode.beforeCodeEval) {
        this.currentPreviewCode.beforeCodeEval()
      }

      var response = await this.evalCode(`_output = ${this.currentDataset.varname}.ext.buffer_window("*"${(noBufferWindow) ? '' : ', '+from+', '+(to+1)})${code}.ext.to_json("*")`)

      if (response.data.status === 'error') {
        this.$store.commit('setPreviewInfo', {error: response.data.error})
      } else {
        this.$store.commit('setPreviewInfo', {error: false})
      }

      var parsed = response && response.data && response.data.result ? parseResponse(response.data.result) : undefined

      if (parsed && parsed.sample) {

        var pre = forceName ? '__preview__' : ''

        parsed.sample.columns = parsed.sample.columns.map(e=>({...e, title: pre+e.title}))

        // this.columnValues = this.getValuesByColumns(parsed.sample, false, from)

        this.fetched.push({
          code: referenceCode,
          update: this.currentDatasetUpdate,
          from,
          to,
          sample: parsed.sample,
          inTable: false
        })

        this.mustUpdateRows = true

        return this.checkIncomingColumns(parsed.sample.columns)

      } else {
        return 0
      }
    },

    updateRows () {
      var columnValues = {...(this.columnValues || {})}
      if (this.recalculateRows) {
        this.recalculateRows = false
        columnValues = []
        for (const index in this.fetched) {
          this.fetched[index].inTable = false
        }
      }
      for (const index in this.fetched) {
        if (!this.fetched[index].inTable) {
          columnValues = this.getValuesByColumns(this.fetched[index].sample, false, this.fetched[index].from)
          this.fetched[index].inTable = true
        }
      }
      if (Object.keys(columnValues).length) {
        this.columnValues = columnValues
      }
    }
  }

}
</script>

