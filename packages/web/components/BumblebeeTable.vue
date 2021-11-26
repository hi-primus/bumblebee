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
    eager>
    <v-card
      class="column-menu font-reset pt-2 pb-0 mb-0 elevation-0"
      :class="{'menu-disabled': !selectionEnabled}"
      @click.stop
      style="cursor: initial"
      v-ripple="false"
      :link="false"
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
              label="Rename"
              v-model="newColumnName"
              hide-details
            />
          </v-list-item>
          <!-- <v-list-item>
            <v-select
              outlined
              dense
              :items="allTypes"
              label="New column type"
              v-model="newColumnType"
              hide-details class="mb-6"
            >
              <template v-slot:item="{ item }">
                <div class="data-type in-autocomplete">{{ dataTypeHint(item) }}</div> {{dataTypeNames[item]}}
              </template>
              <template v-slot:selection="{ item }">
                <div class="data-type mr-2">{{ dataTypeHint(item) }}</div> {{dataTypeNames[item]}}
              </template>
            </v-select>
          </v-list-item> -->
        </v-list>

        <v-card-actions v-if="isRename" style="margin-top: -14px; margin-right: 8px; margin-bottom: 0px;">
          <v-spacer></v-spacer>
          <v-btn small text @click="newColumnName = currentDataset.columns[columnMenuIndex].name">Cancel</v-btn>
          <v-btn small depressed color="primary" type="submit">Rename</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
    <h3
      class="grey--text pl-4 no-link"
      @click.stop
    >Set data type</h3>
    <v-list
      flat dense class="font-reset type-menu"
    >
      <v-list-item-group>
        <template v-for="(type, index) in mainTypes">
          <v-divider v-if="type==='|'" :key="index" @click.stop></v-divider>
          <v-list-item
            v-else :key="type"
            @click="setNewType($event, type)"
          >
            <span>
              <span class="data-type in-autocomplete"><span class="hint">{{ dataTypeHint(type) }}</span></span>
              <span class="data-type-title">
                {{dataTypeNames[type]}}
              </span>
            </span>
          </v-list-item>

        </template>
        <v-divider @click.stop></v-divider>
        <!-- <v-list-item>
          <span>
            <span class="data-type in-autocomplete">{{ dataTypeHint('decimal') }}</span> {{dataTypeNames['decimal']}}
          </span>
        </v-list-item> -->
        <v-list-group no-action @click.stop>
          <template v-slot:activator>
            <v-list-item-title>
              More types
            </v-list-item-title>
          </template>

          <v-list-item-group>
            <template v-for="(type, index) in moreTypes">
              <v-divider v-if="type==='|'" :key="index" @click.stop></v-divider>
              <v-list-item
                v-else :key="type"
                @click="setNewType($event, type)"
              >
                <span class="pl-6">
                  <span class="data-type in-autocomplete"><span class="hint">{{ dataTypeHint(type) }}</span></span>
                  <span class="data-type-title">
                    {{dataTypeNames[type]}}
                  </span>
                </span>
              </v-list-item>

            </template>
            <span id="more-types-end"></span>
            <!-- <v-list-item>
              <span class="pl-6">
                <span class="data-type in-autocomplete">{{ dataTypeHint('email') }}</span> {{dataTypeNames['email']}}
              </span>
            </v-list-item> -->
          </v-list-item-group>

        </v-list-group>
      </v-list-item-group>
    </v-list>
  </v-menu>
  <div
    class="bb-table-top-container" ref="BbTableTopContainer"
    @scroll.passive="tableTopContainerScroll"
    v-if="columns && allColumns"
  >
    <div class="rows-number-space" ref="BbTableRowsSpace"></div>
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
          :style="{ width: column.width+'px' }"
        >
          <div v-if="!(lazyColumns.length && !lazyColumns[i])" class="column-header-cell">
            <v-tooltip v-if="plotsData[column.name]" transition="tooltip-fade-transition" bottom>
              <template v-slot:activator="{ on }">
                <div
                  v-on="on"
                  class="data-type"
                  :class="columnDataTypeClass(column)">
                  <div class="hint">
                    {{ dataTypeHint(plotsData[column.name].inferred_data_type) }}
                  </div>
                </div>
              </template>
              <span>{{plotsData[column.name].full_data_type}}</span>
            </v-tooltip>
            <div class="preview-badge">
              preview
            </div>
            <div class="column-title" :title="column.name">
              {{column.name}}
            </div>
          </div>
          <div class="resize-handle" @click.stop @mousedown.prevent.stop="dragMouseDown($event, i)"></div>
        </div>
        <div
          v-else-if="column.type=='preview'"
          :key="'p'+column.index"
          class="bb-table-h-cell bb-preview"
          :class="[
            ...(column.classes || []),
          ]"
          :id="(column.previewIndex === previewColumns.length-1) ? 'bb-table-preview-last' : false"
          :style="{ width: column.width+'px' }"
        >
          <div v-if="!(lazyColumns.length && !lazyColumns[i])" class="column-header-cell">
            <div
              v-if="previewPlotsData[column.name]"
              class="data-type"
              :class="`type-${previewPlotsData[column.name].inferred_data_type}`">
              <div class="hint">
                {{ dataTypeHint(previewPlotsData[column.name].inferred_data_type) }}
              </div>
            </div>
            <div class="preview-badge">
              preview
            </div>
            <div
              v-if="currentPreviewNames && currentPreviewNames[column.name]"
              :title="currentPreviewNames[column.name]"
              class="column-title"
            >
              <span>{{ currentPreviewNames[column.name] }}</span>
            </div>
            <div
              v-else
              class="column-title"
              :title="column.title ? column.title.split(/__preview__|__new__/).join('') : ''"
            >
              {{ column.title ? column.title.split(/__preview__|__new__/).join('') : '' }}
            </div>
          </div>
          <div class="resize-handle" @click.stop @mousedown.prevent.stop="dragMouseDown($event, i)"></div>
        </div>
        <div
          v-else-if="!(lazyColumns.length && !lazyColumns[i]) && columns[column.index]"
          :key="column.index"
          :id="'bb-table-'+columns[column.index].name"
          class="bb-table-h-cell"
          :class="[
            {
              'active-menu-column': (columnMenuIndex===column.index),
              'bb-selected': selectionMap[column.index],
              'bb-drag-over': (dragOverIndex===i && dragging!==i),
              'bb-drag-over-right': (dragOverIndex===i && dragging<i),
            },
            ...(column.classes || []),
          ]"
          :style="{ width: column.width+'px' }"
          :draggable="selectionMap[column.index]"
          @dragstart="dragStart(i, $event)"
          @dragover.prevent="dragOver(i)"
          @dragend="dragEnd"
          @drop="dragDrop(i, $event)"
          @click="selectColumn($event, column.index)"
          @dblclick="setMenu($event, column.index)"
          @contextmenu.prevent="contextMenu($event, column.index)">
          <div class="column-header-cell">
            <v-tooltip v-if="plotsData[column.name]" transition="tooltip-fade-transition" bottom>
              <template v-slot:activator="{ on }">
                <div
                  v-on="on"
                  v-if="plotsData[column.name]"
                  class="data-type"
                  :class="columnDataTypeClass(column)">
                  <div class="hint">
                    {{ dataTypeHint(plotsData[column.name].inferred_data_type) }}
                  </div>
                </div>
              </template>
              <span>{{plotsData[column.name].full_data_type}}</span>
            </v-tooltip>
            <div class="drag-hint"></div>
            <div
              v-if="currentPreviewNames && currentPreviewNames[columns[column.index].name]"
              :title="currentPreviewNames[columns[column.index].name]"
              class="column-title title-preview-highlight"
            >
              <span>{{ currentPreviewNames[columns[column.index].name] }}</span>
            </div>
            <div
              v-else
              class="column-title"
              :title="column.title || columns[column.index].name"
            >
              {{ column.title || columns[column.index].name }}
            </div>
          </div>
          <div class="resize-handle" @contextmenu.prevent.stop @click.stop @mousedown.prevent.stop="dragMouseDown($event, i)"></div>
        </div>
        <div
          v-else
          :key="column.index"
          :id="'bb-table-'+columns[column.index].name"
          class="bb-table-h-cell"
          :style="{ width: column.width+'px' }"
        >
          <!-- <div class="resize-handle" @click.stop @mousedown.prevent.stop="dragMouseDown" draggable="true"></div> -->
        </div>
      </template>
    </div>
    <div v-if="true" class="bb-table-plots">
      <template v-for="(column, index) in allColumns">
				<div
          v-if="!column.hidden"
					:key="'plot'+column.type+column.index"
          :style="{ width: (column.width || defaultColumnWidth)+'px' }"
          class="bb-table-plot"
          :class="[
            {
              'bb-selected': !(column.type==='duplicated' || column.preview) && selectionMap[column.index],
              'bb-preview': column.type==='duplicated' || column.preview,
            },
            ...(column.classes || []),
          ]"
				>
          <div
            v-if="lazyColumns[index] && column.preview && previewPlotsData[column.name] && previewPlotsData[column.name].missing !== undefined"
            :key="'p'+column.index"
            class="bb-table-plot-content"
            :data-column="column.name">
            <div>
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
                :key="previewPlotsData[column.name].key+' '+columnsReloads[index]"
                :uniques="previewPlotsData[column.name].count_uniques"
                :values="previewPlotsData[column.name].frequency"
                :total="+previewPlotsData[column.name].total || 1"
                :columnIndex="column.index"
                class="histfreq"
              />
              <Histogram
                v-else-if="previewPlotsData[column.name].hist"
                :key="previewPlotsData[column.name].key+' '+columnsReloads[index]"
                :uniques="previewPlotsData[column.name].count_uniques"
                :values="previewPlotsData[column.name].hist"
                :total="+previewPlotsData[column.name].total"
                :columnIndex="column.index"
                class="histfreq"
              />
              <Histogram
                v-else-if="previewPlotsData[column.name].hist_years"
                :key="previewPlotsData[column.name].key+' '+columnsReloads[index]"
                :uniques="previewPlotsData[column.name].count_uniques"
                :values="previewPlotsData[column.name].hist_years"
                :total="+previewPlotsData[column.name].total"
                :columnIndex="column.index"
                class="histfreq"
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
            v-else-if="lazyColumns[index] && columns[column.index] && !column.preview && plotsData[column.name] && plotsData[column.name].missing !== undefined"
            :key="''+column.index"
            class="bb-table-plot-content"
            :data-column="column.index">
            <div>
              <DataBar
                :key="plotsData[column.name].key+'databar'"
                :missing="plotsData[column.name].missing"
                :total="+plotsData[column.name].total || 1"
                :match="+plotsData[column.name].match"
                :mismatch="+plotsData[column.name].mismatch"
                :nullV="+plotsData[column.name].null"
                @clicked="barClicked($event,column)"
                class="table-data-bar"
                bottom
              />
              <Frequent
                v-if="plotsData[column.name].frequency"
                :key="plotsData[column.name].key+' '+columnsReloads[index]"
                :uniques="plotsData[column.name].count_uniques"
                :values="plotsData[column.name].frequency"
                :total="+plotsData[column.name].total || 1"
                :columnIndex="column.index"
                :selectable="selectionEnabled"
                class="histfreq"
              />
              <Histogram
                v-else-if="plotsData[column.name].hist"
                :key="plotsData[column.name].key+' '+columnsReloads[index]"
                :uniques="plotsData[column.name].count_uniques"
                :values="plotsData[column.name].hist"
                :total="+plotsData[column.name].total || 1"
                :columnIndex="column.index"
                :selectable="selectionEnabled"
                class="histfreq"
              />
              <Histogram
                v-else-if="plotsData[column.name].hist_years"
                :key="plotsData[column.name].key+' '+columnsReloads[index]"
                :uniques="plotsData[column.name].count_uniques"
                :values="plotsData[column.name].hist_years"
                :total="+plotsData[column.name].total || 1"
                :columnIndex="column.index"
                :selectable="selectionEnabled"
                class="histfreq"
              />
            </div>
          </div>
          <div
            v-else
            :key="'placeholder'+index"
            class="bb-table-plot-content"
            :data-column="column.name || column.index"
          >
            <div class="plot-placeholders">
              <div class="databar-placeholder"></div>
              <div class="histfreq-placeholder"></div>
              <div class="label-placeholder"></div>
            </div>
          </div>
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
    <div class="bb-table-i" v-show="true" ref="BbTable" :style="tableStyle" @mouseover="checkCellsWidth">
      <div class="bb-table-i-rows" ref="BbTableRows" v-if="computedColumnValues[rowsColumn]">
        <template v-if="computedColumnValues['__match__'] && previewCode">
          <div
            v-for="(value) in computedColumnValues[rowsColumn].filter((e)=>e.index<rowsCount)"
            :key="'row'+value.index"
            class="bb-table-i-row mhl"
            :class="[getRowHighlight(value.index)]"
            :style="{ top: (rowHeight * value.index + 1)+'px' }"
            :data-row="value.index+1"
          >
          </div>
        </template>
        <div
          v-else
          v-for="value in computedColumnValues[rowsColumn].filter((e)=>e.index<rowsCount)"
          :key="'row'+value.index+' '+rowSelection[value.index]"
          class="bb-table-i-row row-selectable"
          :style="{ top: (rowHeight * value.index + 1)+'px' }"
          :data-row="value.index+1"
          :class="{'bb-highlight--blue row-selected': rowSelection[value.index]}"
          @click="$set(rowSelection,value.index,!rowSelection[value.index])"
        >
        </div>
        <div>

        </div>
      </div>
      <template v-for="(column, cindex) in allColumns">
        <div
          class="bb-table-i-column"
          :key="'column'+column.type+column.index"
          :style="{ minWidth: column.width+'px' }"
          :class="[
            ...(column.classes || []),
          ]"
          :data-column="column.sampleName+'/'+column.name"
        >
          <div class="bb-table-column-bg"></div>
          <template v-if="lazyColumns[cindex] && computedColumnValues[column.sampleName] && !((previewError && column.preview) || column.fillNone)">
            <template v-if="column.preview || column.duplicated">
              <template v-for="value in computedColumnValues[column.sampleName].filter((e)=>e!==undefined && e!==null && e.index<rowsCount)">
                <div
                  :key="'c'+column.index+'r'+value.index"
                  class="bb-table-i-cell"
                  :style="{ top: rowHeight * value.index+'px' }"
                  :title="value.value"
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
                  userSelect: (tableSelection==([idInSample[column.sampleName], value.index]).join()) ? 'text' : 'none'
                }"
                :title="value.value"
                v-html="value.html"
                @mousedown="clearSelection(); tableSelection = [idInSample[column.sampleName] || column.index, value.index].join()"
                @mouseup="checkSelection(idInSample[column.sampleName] || column.index, value.index)"
              >
              </div>
            </template>
          </template>
          <template v-else-if="!(lazyColumns.length && !lazyColumns[cindex]) && computedColumnValues[rowsColumn]">
            <div
              v-for="(value) in computedColumnValues[rowsColumn].filter((e)=>e.index<rowsCount)"
              :key="'cf'+cindex+'r'+value.index"
              class="bb-table-i-cell"
              :style="{ top: rowHeight * value.index+'px' }"
            >
              <div class="label-placeholder">
                <!-- None -->
              </div>
            </div>
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

import {
  parseResponse, arraysEqual,
  cancellablePromise, throttle,
  asyncDebounce, debounce, optimizeRanges,
  escapeQuotes, namesToIndices,
  getSelectedText, getPropertyAsync,
  replaceTags
} from 'bumblebee-utils'

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

      tableSelection: '',

      columnValues: {},

      columnMenuIndex: false,

      columnWidths: {},

      columnsReloads: [],

      rowSelection: [],

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

      dragOverIndex: -1,
      dragging: -1,

      selection: [],

      checkScrollAgain: false,

      chunks: [],
      chunksPreview: [],

      fetched: [],
      fetchedPreview: [],

      noBufferWindow: false,
      lessRows: false,

      loadedPreviewCode: '',

      indicesInSample: {},

      lazyColumns: [],
      defaultColumnWidth: 170,

      mainTypes: ['string', 'int', 'float', 'boolean', 'datetime', '|', 'object', 'array'],

      moreTypes: ['email', 'credit_card_number', 'gender', '|', 'zip_code', '|', 'ip', 'url']
		}
  },

	computed: {

    ...mapGetters([
      'currentSelection',
      'currentDataset',
      'currentDatasetUpdate',
      'selectionType',
      'currentPreviewColumns',
      'currentHighlights',
      'currentRowHighlights',
      'currentFocusedColumns',
      'previewCode',
      'currentDuplicatedColumns',
      'currentPreviewNames',
      'currentPreviewInfo',
      'loadPreview',
    ]),

    ...mapState(['allTypes', 'profilePreview']),

    gettingNewResults: {
      get () {
        return this.$store.state.gettingNewResults;
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'gettingNewResults', payload: value})
      }
    },

    selectionEnabled () {
      return !this.$store.getters.loadingStatus && !this.$store.state.editing;
    },

    previewError () {
      try {
        return this.currentPreviewInfo.error
      } catch (err) {
        return false
      }
    },

    columns () {
      let columns = [];
      if (this.currentDataset) {
        if (this.currentDataset.columns) {
          columns = this.currentDataset.columns.map(column=>({name: column.name, width: this.columnWidths[column.name] || this.defaultColumnWidth}));
        }
        if (this.$store.state.columns[this.currentDataset.dfName] && columns.length < this.$store.state.columns[this.currentDataset.dfName].length) {
          columns = this.$store.state.columns[this.currentDataset.dfName].map(column=>({name: column, width: this.columnWidths[column] || this.defaultColumnWidth}));
        }
      }
      return columns;
    },

    rowsColumn () {

      try {

        if (this.previewCode && this.columnValues['__match__'] && this.columnValues['__match__'].length) {
          return '__match__'
        }

        var columns = this.columnValues

        if (this.loadPreviewActive) { // || !loadPreview
          columns = this.loadPreviewColumnValues
        }

        var max = 0
        var sKey = Object.keys(columns)[0]

        for (var key in columns) {
          if (columns[key] && columns[key].length>max) {
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

    isRename () {
      return this.newColumnName !== this.columns[this.columnMenuIndex].name;
    },

    computedColumnValues () {
      if (this.loadPreviewActive) {
        return this.loadPreviewColumnValues;
      }

      var columnValues = { ...this.columnValues };

      if (this.gettingNewResults=='hide') {
        this.previewColumns.forEach(column => {
          if (column.type === 'preview' && !this.currentPreviewNames[column.name]) {
            var name = column.name.split('__new__').join('');
            columnValues[ name ] = columnValues[ column.name ]
          }
        });
      }

      var noHighlight = !this.previewCode.code;

      return this.computeColumnValues(columnValues, noHighlight, this.rowsCount);

    },

    loadPreviewColumnValues () {
      var columnValues = this.getValuesByColumns(this.loadPreview ? this.loadPreview.sample : false)
      return this.computeColumnValues(columnValues, true)
    },

    idInSample () {
      return this.indicesInSample // TO-DO: name mapping
    },

    loadPreviewActive () {
      return this.previewCode && this.previewCode.loadPreview && this.loadPreview
    },

    datasetPreview () {
      return this.previewCode && this.previewCode.datasetPreview
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

        var loadPreviewColumns = (this.loadPreviewActive && this.loadPreview.sample) ? this.loadPreview.sample.columns : []

        var dpc = loadPreviewColumns.length
        ? loadPreviewColumns.map((col, index)=>({
          ...col, // title
          index,
          preview: true,
          type: 'preview',
          name: col.title.split(/__preview__/).join(''),
          sampleName: col.title
        }))
        : []

        var pc = this.currentPreviewColumns.length
        ? this.currentPreviewColumns.map((col)=>({
            ...col,
            type: 'preview',
            preview: true,
            name: col.title.split(/__preview__/).join(''),
            sampleName: col.title
          }))
        : []

        var dc = this.currentDuplicatedColumns.length
        ? this.currentDuplicatedColumns.map((col)=>({
            type: 'duplicated',
            duplicated: true,
            index: this.columns.findIndex(c=>c.name===col.name),
            name: col.newName,
            sampleName: col.name,
          }))
        : []


        if (this.previewCode.joinPreview) {
          var jp = this.previewCode.joinPreview
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

      if ((this.datasetPreview || this.loadPreviewActive) && this.previewColumns && this.previewColumns.length) { // || !loadPreview
        // console.log('[COLUMNS] Only preview (dataset || load)')
        return this.previewColumns.map(c=>({
          ...c,
          classes: [...(c.classes || []), 'bb-preview'],
          width: this.columnWidths[c.name] || this.defaultColumnWidth
        }))
      }

      var cols = []
      var wholePreview = (this.previewCode.datasetPreview || this.previewCode.loadPreview)
      if (
        !this.previewCode
        ||
        !wholePreview
        ||
        (wholePreview && !(this.previewColumns && this.previewColumns.length))
        ) {
        // console.log('[COLUMNS] Concatenating default columns (!whole || empty preview)')
        cols = this.bbColumns.map(index=>{
          var classes = []
          if (this.selectionMap[index]) {
            classes.push('bb-selected')
          }
          if (!this.columns[index]) {
            return false;
          }
          var name = this.columns[index].name
          return {
            index,
            classes,
            name,
            width: this.columnWidths[name] || this.defaultColumnWidth,
            sampleName: name
          }
        }).filter(col => col);
      }

      if (
        (this.previewCode && wholePreview && !(this.previewColumns && this.previewColumns.length)) // No preview to show
        ||
        (!this.previewCode && !(this.currentDuplicatedColumns && this.currentDuplicatedColumns.length)) // No preview needed
        ||
        (this.gettingNewResults=='hide') // No preview needed
      ) {
        // console.log('[COLUMNS] No preview')
        return cols
      }

      try {

        // gets where to put the preview columns

        var after = []

        if (this.previewCode.from) {
          after = this.previewCode.from || after
        }

        if (!(after && after.length) && (this.currentSelection.columns && this.currentSelection.columns.length)) {
          after = this.currentSelection.columns.map(s=>s.name) || after
        }

        after = after || []

        // gets how many columns are expected and returns loaded columns if there are no columns needed

        var expectedColumns = (this.currentDuplicatedColumns) ? this.currentDuplicatedColumns.length : this.previewCode.expectedColumns

        var pushedColumns = 0

        var insertIndex = Math.max(...namesToIndices(after,cols))+1; // last position

        if (this.previewColumns.length) {

          if (this.previewColumns.length===1 && after.length>1) { // 1 -> 2+

            var previewColumn = this.previewColumns[0]

            cols.splice(insertIndex,0,{
              ...previewColumn,
              classes: [...(previewColumn.classes || []), 'bb-preview'],
              width: this.columnWidths[previewColumn.name] || this.defaultColumnWidth,
              // title: (this.currentPreviewNames && this.currentPreviewNames[previewColumn.title]) || previewColumn.title || ''
            })
            pushedColumns++

          } else if (after.length == this.previewColumns.length) { // n -> n

            var _after = after[0]
            insertIndex = _after ? cols.findIndex(col=>_after===col.name)+1 : 0

            this.previewColumns.forEach((previewColumn, i)=>{

              if (expectedColumns>=0 && i>=expectedColumns) return

              if (after[i]) insertIndex = cols.findIndex(col=>after[i]===col.name)+1

              if (insertIndex === 0) insertIndex = cols.length // previews cannot be on position 0

              cols.splice(insertIndex,0,{
                ...previewColumn,
                classes: [...(previewColumn.classes || []), 'bb-preview'],
                width: this.columnWidths[previewColumn.name] || this.defaultColumnWidth,
                // title: (this.currentPreviewNames && this.currentPreviewNames[previewColumn.title]) || previewColumn.title || ''
              })
              insertIndex++
              pushedColumns++
            })

          } else { // n -> m

            if (insertIndex === 0) insertIndex = cols.length // previews cannot be on position 0

            this.previewColumns.forEach((previewColumn, i)=>{

              if (expectedColumns>=0 && i>=expectedColumns) return

              cols.splice(insertIndex,0,{
                ...previewColumn,
                classes: [...(previewColumn.classes || []), 'bb-preview'],
                width: this.columnWidths[previewColumn.name] || this.defaultColumnWidth,
                // title: (this.currentPreviewNames && this.currentPreviewNames[previewColumn.title]) || previewColumn.title || ''
              })
              insertIndex++
              pushedColumns++
            })
          }
        }

        if (expectedColumns!==undefined && after && pushedColumns<expectedColumns){

          this.incompleteColumns = true

          if (expectedColumns===1) {

            insertIndex = Math.max(...after.map(colname=>cols.findIndex(col=>colname===col.name)))+1

            cols.splice(insertIndex, 0, {
              type: 'preview',
              index: -1,
              previewIndex: -1,
              preview: true,
              placeholder: true,
              classes: ['bb-preview', 'bb-placeholder'],
              width: this.defaultColumnWidth
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
                title: 'empty',
                type: 'preview',
                index: -i,
                previewIndex: -i,
                preview: true,
                placeholder: true,
                fillNone: true,
                classes: ['bb-preview', 'bb-placeholder'],
                width: this.defaultColumnWidth
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
      let plotsData = {};

      this.currentDataset.columns.forEach((column, i) => {
        if (column && column.stats) {
          let inferred_data_type = column.stats.inferred_data_type?.data_type;
          let data_type = column.data_type;
          let pure_data_type = data_type.includes(inferred_data_type) || !["bool", "float", "int", "datetime"].includes(inferred_data_type);

          let full_data_type = inferred_data_type;

          if (!pure_data_type) {
            full_data_type = `${inferred_data_type} (${data_type})`;
          }

          plotsData[column.name] = {
            key: i,
            name: column.name,
            missing: column.stats.missing,
            match: column.stats.match,
            mismatch: column.stats.mismatch,
            count_uniques: column.stats.count_uniques,
            hist: (column.stats.hist && column.stats.hist[0]) ? column.stats.hist : undefined,
            frequency: ((column.stats.frequency) ? column.stats.frequency : undefined) || column.frequency || undefined,
            total: +this.currentDataset.summary.rows_count,
            zeros: column.stats.zeros,
            null: column.stats.null,
            inferred_data_type,
            full_data_type,
            pure_data_type
          };
        }
      });

      return plotsData;
    },

    previewPlotsData () {
      try {

        var ppd = {}

        var profile

        if (this.loadPreviewActive && this.loadPreview.profile) {
          profile = this.loadPreview.profile
        } else {
          profile = this.profilePreview
        }

        for (const colName in profile.columns) {
          const column = profile.columns[colName]
          if (!column.stats) {
            console.error(column);
            console.error(`Stats not found on column '${colName}', see log above`);
            continue;
          }
          ppd[colName] = {
            key: colName,
            name: colName,
            missing: column.stats.missing,
            match: column.stats.match,
            mismatch: column.stats.mismatch,
            total: +profile.summary.rows_count,
            count_uniques: column.stats.count_uniques,
            hist: (column.stats.hist && column.stats.hist[0]) ? column.stats.hist : undefined,
            frequency: ((column.stats.frequency) ? column.stats.frequency : undefined) || column.frequency || undefined,
            zeros: column.stats.zeros,
            null: column.stats.null,
            inferred_data_type: column.stats.inferred_data_type.data_type || column.data_type
            // hist_years: (column.stats.hist && column.stats.hist.years) ? column.stats.hist.years : undefined,
          }
        }

        return ppd

      } catch (err) {
        console.error('Error getting preview plots data', err)
        return {}
      }
    },

    totalRowsCount () {
      try {
        if (this.previewCode.datasetPreview) {
          return this.rowsCount;
        }
        return Math.max(this.currentDataset.summary.rows_count, this.rowsCount);
      } catch (err) {
        return 1;
      }
    },

    rowsCount () {
      try {
        var value = 0
        if (this.loadPreviewActive && this.loadPreview.sample) {
          value = this.loadPreview.sample.value.length
          return value
        }
        if (this.previewCode && !this.incompleteColumns) {
          if (this.currentRowHighlights && typeof this.currentRowHighlights === 'number'){
            if (this.previewCode.lessRows) {
              value = this.currentRowHighlights
            }
          }
          if (this.profilePreview && this.profilePreview.summary && this.profilePreview.summary.rows_count) {
            this.previewRowsCount = this.profilePreview.summary.rows_count
            value = Math.max(value, this.profilePreview.summary.rows_count)
          }
          if (this.previewCode.datasetPreview && this.previewRowsCount) {
            value = Math.max(value, this.previewRowsCount)
          }
        }
        if (value<=0 && this.currentDataset && this.currentDataset.summary && this.currentDataset.summary.rows_count) {
          value = this.currentDataset.summary.rows_count
        }
      } catch (error) {
        console.error('rowsCount',error);
        value = 0;
      }
      return value

    },

    tableStyle () {
      var h = (this.rowHeight * (+this.rowsCount) + 1);
      return {
        maxHeight: h+'px',
        height: h+'px'
      };

    },

    moreElement () {
      if (window.moreElement) {
        return window.moreElement;
      }
      var clickOutsideExpandedCell = (e) => {
        if (!e.target.classList || !e.target.classList.contains('cell-expanded')) {
          this.restoreCell(false)
        }
      };
      window.moreElement = document.createElement('div');
      window.moreElement.classList.add('more-arrow');
      window.moreElement.classList.add('mdi');
      window.moreElement.onclick = (e)=>{
        var cell = e.target.parentElement;
        if (cell.classList.contains('cell-expanded')) {
          this.restoreCell(cell);
          document.onmousedown = null;
        } else {
          this.expandCell(cell);
          document.onmousedown = clickOutsideExpandedCell;
        }
      }
      return window.moreElement
    }
  },

  async mounted () {

    this.fixScroll();
    setTimeout(async () => {
      await this.checkVisibleColumns();
      await this.scrollCheck(true);
      this.mustUpdateRows = true;
      this.updateRows();
    }, 50);

  },

  watch: {

    previewError (value) {
      if (value) {
        this.removePreviewColumns()
      }
    },

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
      if (!value || !value.length) {
        if (!this.currentRowHighlights) {
          this.$nextTick(()=>{
            this.removePreviewColumns();
          });
        }
      } else {
        this.focusPreview();
      }
    },

    previewCode: {

      deep: true,

      async handler (previewCode) {

        var check = false;

        if (previewCode) {

          if (previewCode.latePreview && !this.profilePreview?.done) {
            console.debug('[FETCHING] Early profiling');
            await this.setProfile(previewCode.code, previewCode.codePayload, true);
          }

          var currentCode = await getPropertyAsync(previewCode.code);

          if (this.loadedPreviewCode !== currentCode) {
            this.loadedPreviewCode = currentCode;
            this.$delete(this.columnValues, '__match__');
            this.fetched = this.fetched.filter(e=>!e.code);
            if (!previewCode.load) {
              check = true;
            }
          }
        } else {
          this.loadedPreviewCode = false;
          this.removePreviewChunks();
        }

        var noBufferWindow = (previewCode && previewCode.noBufferWindow) ? true : false;
        
        var lessRows = (previewCode && previewCode.lessRows) ? true : false;

        if (this.noBufferWindow != noBufferWindow || this.lessRows != lessRows) {
          this.columnValues = {};
          this.fetched = [];
          check = true;
        }

        this.previousRange = -1;
        let updatePromise = false;

        if (check) {
          this.mustUpdateRows = true;
          this.mustCheck = true;
          updatePromise = this.scrollCheck(true); // await ? no
          this.updateRows();
        }

        this.noBufferWindow = noBufferWindow;
        this.lessRows = lessRows;
        await updatePromise;
        this.fixEmptyRows()
      },

    },

    currentDatasetUpdate: {
      // immediate: true,
      handler () {
        this.refreshValues();
      }
    },

    previewColumns () {
      return this.checkVisibleColumns(false)
    },

  },

  methods: {

    commandListener__profile_preview (response) {

      let code = response.reply.code;

      if (this.profilePreview.code !== code) {
        throw new Error(`Profile preview code changed, ${code} -> ${this.profilePreview.code}`);
      }

      if (!response || !response.data || !response.data.result || response.data.status == "error") {
        throw response;
      }

      let { profile, latePreview, early } = response.reply;

      if ((profile || latePreview || early) && response.data.result.profile) {
        let dataset = parseResponse(response.data.result.profile);

        if (!dataset) {
          throw response;
        }

        dataset = { ...dataset, done: true, code };

        this.$store.commit('mutation', {mutate: 'profilePreview', payload: dataset} )

      } else if (response.data.result.names) {

        let names = parseResponse(response.data.result.names);

        let columns = Object.fromEntries(names.map(c=>[c.title, {}]));

        let dataset = { columns, done: true, code };

        this.$store.commit('mutation', {mutate: 'profilePreview', payload: dataset, summary: {}})

      }

      if (response.data.result.matches_count!==undefined) {
        this.$store.commit('setPreviewInfo', {rowHighlights: +response.data.result.matches_count});
      }

      return true;
    },

    refreshValues () {
      this.updateSelection(this.currentSelection) // TEST
      this.fetched = [];
      this.toFetch = [];
      this.previousRange = -1
      this.$nextTick(() => {
        this.scrollCheck(true)
      })
    },

    removePreviewColumns () {
      let columnValues = {};
      if (this.currentDataset && this.columns && this.columns.length) {
        this.columns.forEach(column => {
          columnValues[ column.name ] = this.columnValues[ column.name ];
        });
        this.columnValues = columnValues;
      }
    },

    removePreviewChunks () {
      let length = this.fetched.length;
      this.fetched = this.fetched.filter(e=>!e.code);
      if (length !== this.fetched.length) {
        this.mustUpdateRows = true;
        this.recalculateRows = true;
        this.updateRows();
      }
    },

    async fixEmptyRows () {
      await new Promise (res => setTimeout(res, 100))
      if (!this.computedColumnValues || !Object.keys(this.computedColumnValues).length) {
        this.previousRange = -1;
        // this.mustUpdateRows = true;
        this.mustCheck = true;
        this.debouncedThrottledScrollCheck(true);
      }
    },
    
    async fixNotProfiledColumns () {
      let profiledColumns = Object.keys(this.currentDataset?.columns || {}).length;
      let totalColumns = this.currentDataset?.summary?.cols_count;

      if (totalColumns !== undefined && profiledColumns < totalColumns && !this.previewCode) {

        if (!this.$store.state.updatingWholeProfile) {
          
          this.$store.commit('mutation', {mutate: 'updatingWholeProfile', payload: true })

          let profilingResponse = await this.$store.dispatch('getProfiling', { payload: {
            socketPost: this.socketPost,
            dfName: this.currentDataset.dfName,
            avoidReload: true,
            clearPrevious: false,
            partial: true,
            methods: this.commandMethods
          }});
          
          return this.$store.dispatch('lateProfiles', {...profilingResponse, socketPost: this.socketPost});
        }
      } else if (this.$store.state.updatingWholeProfile) {
        return this.$store.commit('mutation', {mutate: 'updatingWholeProfile', payload: false })
      }
    },

    expandCell (cellElement) {
      var columnElement = cellElement.parentElement;
      var tableElement = columnElement.parentElement;
      tableElement.getElementsByClassName('has-expanded-cell').forEach(element=>element.classList.remove('has-expanded-cell'));
      tableElement.getElementsByClassName('cell-expanded').forEach(element=>element.classList.remove('cell-expanded'));
      columnElement.classList.add('has-expanded-cell');
      cellElement.classList.add('cell-expanded');
      window.cellElement = cellElement
    },

    restoreCell (cellElement) {
      cellElement = window.cellElement || cellElement;
      var columnElement = cellElement.parentElement;
      cellElement.classList.remove('cell-expanded');
      columnElement.classList.remove('has-expanded-cell');
    },

    checkCellsWidth (e) {
      e = e || window.event;
      var moreElement = this.moreElement;
      try {
        var element = e.target;
        if (element && element.className && element.classList.contains('bb-table-i-cell')) {
          if (element.classList.contains('cell-expanded')) {
            element.appendChild(moreElement)
          } else {
            var textWidth = element.innerText.length * 7;
            var width = element.offsetWidth - 12;
            if (textWidth>width) {
              element.classList.add('cell-to-expand');
              element.appendChild(moreElement);
            } else {
              element.classList.remove('cell-to-expand');
              throw false;
            }
          }
        }
      } catch (err) {
        if (moreElement && moreElement.parentElement) {
          moreElement.parentElement.removeChild(moreElement);
        }
      }
    },

    dragMouseDown (e, i) {
      e = e || window.event;
      e.preventDefault();
      e.stopPropagation();
      window.startX = e.clientX;
      window.newX = e.clientX;
      window.currentElement = e.target;
      window.currentElementIndex = i;
      var name = this.allColumns[i].name;
      window.startWidth = this.columnWidths[name] || 172;
      document.onmouseup = this.closeDragElement;
      document.onmousemove = this.elementDrag;
    },

    elementDrag (e) {
      e = e || window.event;
      e.preventDefault();
      e.stopPropagation();
      var pos = window.newX - e.clientX;
      window.newX = e.clientX;
      window.currentElement.style.left = (window.currentElement.offsetLeft - pos) + 'px'

      this.setColumnWidth();
    },

    closeDragElement () {
      this.reloadPlot(window.currentElementIndex);

      window.currentElement.style.left = null;
      document.onmouseup = null;
      document.onmousemove = null;
      window.newX = undefined;
      window.startX = undefined;
      window.currentElement = undefined;
      window.currentElementIndex = undefined;
    },

    setColumnWidth () {
      var grow = window.newX - window.startX;
      var name = this.allColumns[window.currentElementIndex].name;
      var width = window.startWidth;
      width += grow;
      width = Math.max(width, 150);

      this.$set(this.columnWidths, name, width);
    },

    reloadPlot (index) {
      var value = +(this.columnsReloads[index] || 0);
      this.$set(this.columnsReloads, index, value+1);
    },

    tableContainerScroll () {
      this.throttledScrollCheck()
      this.debouncedUpdateRows()
      this.horizontalScrollCheckUp()
      return this.checkVisibleColumns()
    },

    tableTopContainerScroll () {
      this.horizontalScrollCheckDown()
      return this.checkVisibleColumns()
    },

    computeColumnValues (columnValues, noHighlight = false, limit = Infinity) {
      var cValues = {}

      for (const name in columnValues) {
        // TO-DO: do not include highlights
        var array = []

        const values = columnValues[name]
        if (!values || !values.length) {
          return cValues[name] = []
          continue // TO-DO: Handling
        }
        const highlight = !noHighlight && this.highlightMatches && this.highlightMatches[name] && this.highlightMatches[name].title
        const hlValues = columnValues[highlight]
        if (highlight && hlValues && hlValues.length) {
          const preview = name.includes('__preview__') || name.includes('__new__') // TO-DO: Check
          const color = this.currentHighlights.color['default'] ? this.currentHighlights.color[preview ? 'preview' : 'default'] : this.currentHighlights.color
          for (const index in values) {
            if (index>=limit) {
              continue
            }
            var html = this.getCellHtmlHighlight(values[index], hlValues[index], color)
            array.push({html , index: +index, value: values[index]})
          }
        } else {
          for (const index in values) {
            if (index>=limit) {
              continue
            }
            var html = this.getCellHtml(values[index])
            array.push({html , index: +index, value: values[index]})
          }
        }

        cValues[name] = array
      }
      return cValues
    },

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

      try {

        var colName = this.columns[ci].name

        var {selectedText, selection} = getSelectedText()

        if (!selectedText && this.selectionType==='text') {
          this.$store.commit('selection',{ clear: true })
          return
        }

        selectedText = selectedText.split('\n')[0]

        if (this.tableSelection) {
          [ci, ri] = this.tableSelection.split(',')
        }
        var cellValue = this.columnValues[colName][ri]

        cellValue = cellValue ? cellValue.toString() : ''

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

      } catch (err) {

        console.error('Selection error', err);

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

      if (!top && !bottom) {
        bottom = 32;
        this.checkScrollAgain = true;
      }

      return [top, bottom]
    },

    getValuesByColumns (sample, clear, from = 0, prepend = '') {

      if (!sample || !sample.columns) {
        console.warn("Trying to get values from empty sample", sample);
        return {};
      }

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
          columnValuesObject[prepend+title] = columnValues[i]
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
        if (columns.map(c=>c.title).join()!==this.columns.map(c=>c.name).join()) {
          var receivedColumns = columns
						.map((column, index)=>({...column, index}))

					var columnNames = this.columns.map(e=>e.name)

          var previewColumns = []
          if (this.previewCode && this.previewCode.datasetPreview) {
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

          this.$store.commit('setHighlights', { matchColumns, color: this.previewCode.color })

          if (previewColumns.length || matchRowsColumns.length) {
            // console.debug('[DEBUG][checkIncomingColumns] check = true')
            return true // must cehck
          }

        }
      }

      // console.debug('[DEBUG][checkIncomingColumns] check = false')
      return false // no check
    },

    focusPreview () {
      this.$nextTick(() => {
        var columns = this.previewCode.from
        if (columns && columns.length) {
          columns.forEach(column => {
            var af = document.getElementById("bb-table-"+column)
            if (af) {
              af.scrollIntoView()
            }
          })
          var lp = document.getElementById("bb-table-preview-last") // TO-DO: Every preview?
          if (lp) {
            lp.scrollIntoView()
          }

          this.horizontalScrollCheckDown()
        }
      })
    },

    /* drag events */

    dragOver (index) {
      if (window.dragType=='columns') {
        this.dragOverIndex = index
      }
    },

    dragStart (which, ev) {
      window.dragType = 'columns'
      this.dragging = which
    },
    dragEnd (ev) {
      this.dragOverIndex = -1
      this.dragging = -1
    },

    dragDrop (to, ev) {
      try {
        if (this.dragging && window.dragType=='columns') {
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
        }
      } catch (err) {}
      this.dragOverIndex = -1
      this.dragging = -1
      delete window.dragType
    },

    /* end of drag events */

    barClicked (event, column) {
      
      if (column.type == 'duplicated' || !this.selectionEnabled) {
        return
      }

      if (event == 'missing') {
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
      if (event == 'mismatch') {
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
      this.$store.commit('commandHandle', command);
    },

    columnDataTypeClass (column) {
      let data = this.plotsData[column.name]
      let str = `type-${data.inferred_data_type}`
      if (data.pure_data_type === false) {
        str += ' type-not-pure'
      }
      return str;
    },

    getRowHighlight (row) {
      try {
        if (this.columnValues['__match__'][row]) {
          return 'bb-highlight--'+(this.previewCode.color || 'green')
        }
      } catch (err) {
        // console.error(err)
      }
      return  ''
    },

    getCellHtml (value) {
      if (value) {
        return replaceTags(value)
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
      var _value = replaceTags(value)
      try {
        if (hlv && hlv.length) {
          for (let i = hlv.length - 1; i >= 0; i--) {
            const [a,b] = hlv[i]
            _value = _value.substring(0,a)+`<span class="hlt--${color}">`+_value.substring(a,b)+'</span>'+_value.substring(b)
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
        var newSelection = (value.columns) ? [...value.columns] : [] // TO-DO: Check value

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

    contextMenu (event, index) {
      if (this.columnMenuIndex !== index) {
        this.setMenu(event, index);
      }
    },

    setMenu (event, index) {

      doubleClick = true

      if (index === this.columnMenuIndex || !this.currentDataset.columns[index]) {
        return;
      }

      this.newColumnName = this.currentDataset.columns[index].name
      this.newColumnType = this.currentDataset.columns[index].stats.inferred_data_type.data_type

      this.columnMenuIndex = index

      this.selection = [index]
      this.$emit('updatedSelection',this.selection)

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

    setNewType (event, type) {
      this.newColumnType = type;
      this.saveColumnData();
      event.stopPropagation();
    },

    saveColumnData () {
      var index = this.columnMenuIndex
      var prevName = this.currentDataset.columns[index].name
      var prevType = this.currentDataset.columns[index].stats.inferred_data_type.data_type

      if (this.newColumnType != prevType) {
        var payload = {
          data_type: this.newColumnType
        }
        this.commandHandle({command: 'set_data_type', columns: [prevName], payload})
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

    checkVisibleColumns: asyncDebounce( async function(fix = true) {
      try {
        var scrollLeft = this.$refs['BbTableTopContainer'].scrollLeft;
        var offsetWidth = this.$refs['BbTableTopContainer'].offsetWidth;

        var left = 48;
        var a = -1;
        var b = -1;

        for (let i = 0; i < this.allColumns.length; i++) {
          left += this.allColumns[i].width;
          if (left>=scrollLeft && a===-1) {
            a = i;
          }
          if (left>=scrollLeft+offsetWidth && b===-1 && offsetWidth!==0) {
            b = i+1;
          }
        }

        if (b===-1) {
          b = this.allColumns.length;
        }

        var numbers = []

        for (let n = a; n <= b; n++) {
          numbers[n] = true
        }

        this.lazyColumns = numbers
      } catch (err) {
        console.error(err)
        this.lazyColumns = []
      }

      this.fixNotProfiledColumns();

    }, 80),

    async fixScroll () {
      try {
        this.$refs['BbContainer'].scroll(0,0);
        let container = this.$refs['BbTableContainer'];
        if (container) {
          let left = container.scrollLeft;
          container.scroll(left+1,0);
          setTimeout(() => {
            container.scroll(left,0);
          }, 50);
        }
      } catch (err) {
        console.error(err);
      }
    },

    horizontalScrollCheckUp () {
      try {
        var topScrollLeft = this.$refs['BbTableTopContainer'].scrollLeft;
        var bottomScrollLeft = this.$refs['BbTableContainer'].scrollLeft;
        if (this.$refs['BbTableRows']) {
          this.$refs['BbTableRows'].style.left = (45 + bottomScrollLeft) + 'px';
        }
        if (topScrollLeft != bottomScrollLeft) {
          this.$refs['BbTable'].style.minWidth = this.$refs['BbTableTopContainer'].scrollWidth + 'px'
          this.$refs['BbTableTopContainer'].scrollLeft = bottomScrollLeft
        }
      } catch (err) {
        console.error(err);
      }
    },

    horizontalScrollCheckDown () {
      try {
        var topScrollLeft = this.$refs['BbTableTopContainer'].scrollLeft;
        var bottomScrollLeft = this.$refs['BbTableContainer'].scrollLeft;
        if (bottomScrollLeft != topScrollLeft) {
          this.$refs['BbTable'].style.minWidth = this.$refs['BbTableTopContainer'].scrollWidth + 'px'
          this.$refs['BbTableContainer'].scrollLeft = topScrollLeft
        }
      } catch (err) {
        console.error(err);
      }
    },

    async unsetProfile () {
      this.$store.commit('mutation', {mutate: 'profilePreview', payload: false} )
    },

    async setProfile (previewCode, previewPayload, early=false) {

      if (!previewCode) {
        return this.unsetProfile()
      }

      if (this.profilePreview.code !== previewCode) {

        let profile = (this.currentPreviewColumns && this.currentPreviewColumns.length);

        // Ask for fixed columns when is a rows highlighting preview
        profile = profile || this.currentRowHighlights;

        let fixedColumns = profile;

        // Do not ask for fixed columns when is a whole preview
        if (previewPayload.preview) {
          fixedColumns = fixedColumns && !previewPayload.preview.datasetPreview;
        }

        let requestMatches = this.currentRowHighlights !== undefined && this.currentRowHighlights !== false;

        let payload = {code: previewCode, payload: previewPayload, columns: [], done: false}
        this.$store.commit('mutation', {mutate: 'profilePreview', payload });

        let cols = [];

        let expectedColumns = (this.currentDuplicatedColumns) ? this.currentDuplicatedColumns.length : this.previewCode.expectedColumns

        if (fixedColumns && expectedColumns && expectedColumns>=1) {
          cols = this.currentPreviewColumns.map(e=>escapeQuotes(  e.title.split(/__preview__/).join('')  ))
        }

        cols = cols.length || !this.currentRowHighlights ? cols : false;

        let codePayload = {
          ...previewPayload,
          request: {
            ...previewPayload.request,
            type: 'profile',
            saveTo: 'df_preview',
            noExecute: true,
            buffer: true,
            profile: cols,
            names: cols === false,
            dfName: this.currentDataset.dfName,
            matches_count: requestMatches
          }
        };

        this.evalCode(codePayload, { 
          command: 'profile_preview',
          code: previewCode,
          profile,
          latePreview: previewCode.latePreview,
          early
        }, 'preview_profiling');

      }

      return false;
    },

    debouncedUpdateRows: debounce( function () {
      if (this.mustUpdateRows) {
        this.mustUpdateRows = false
        this.updateRows();
        if (this.gettingNewResults) {
          setTimeout(async () => {
            // next debouncedUpdateRows
            await this.$store.dispatch('afterNewResults');
            this.$store.commit('mutation', {mutate: 'updatingPreview', payload: false });
          }, 80);
        }
      }
    }, 80),

    debouncedThrottledScrollCheck: debounce( function () {
      this.throttledScrollCheck()
    }, 400),

    throttledScrollCheck: throttle( function (aw = true) {
      this.scrollCheck(aw)
    } , 100),

    async scrollCheck (getCurrentWindow = true) {
      if (this.previewCode.load) {
        return false
      }
      try {
        if (!this.fetching) {

          // default to true
          getCurrentWindow = (getCurrentWindow===undefined) ? true : getCurrentWindow;

          var range = false

          this.fetching = true

          if (getCurrentWindow) {
            range = this.getCurrentWindow()

            if (range) {

              var rangeJoin = range.join(",")
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

          let awaited = false

          while (!awaited && this.toFetch.length) {
            range = await this.fetchRows(range)
            awaited = (range===false)
          }

          if (!awaited) {
            this.previousRange = -1 // TO-DO: Check
          }

          this.fetching = false
          if (this.toFetch.length || this.checkScrollAgain) {
            this.checkScrollAgain = false;
            this.$nextTick(()=>{
              this.throttledScrollCheck(awaited)
            })
            return true
          }

        } else if (this.toFetch.length || this.checkScrollAgain) {
          this.checkScrollAgain = false;
          this.$nextTick(()=>{
            this.throttledScrollCheck(false)
          })
          return false
        }
      } catch (err) {
        console.error(err);
        this.fetching = false;
        if (err.bumblebeeType && (err.bumblebeeType.includes('(Error on profiling)') || err.bumblebeeType.includes('(Error on cells)'))) {
          throw err;
        }
        if (this.toFetch.length || this.checkScrollAgain) {
          this.checkScrollAgain = false;
          this.$nextTick(()=>{
            this.throttledScrollCheck(false)
          })
          return false;
        }
      }

    },

    async fetchRows (_range) {

      var range = (_range && _range.length) ? _range : this.getCurrentWindow();
      var currentFrom = (range && range[0]) ? range[0] : -1;

      // deletes

      let fetched;

      let previewCode = this.previewCode?.code;

      // get the valid fetches to know what to fetch next

      if (previewCode) {
        fetched = this.fetched.filter(e=>e.code && e.code===previewCode);
        if (!fetched.length) {
          this.fetched = this.fetched.filter(e=>!e.code);
          fetched = [];
          this.recalculateRows = true;
          this.debouncedUpdateRows();
        }
      } else {
        fetched = this.fetched.filter(e=>e.update===this.currentDatasetUpdate && !e.code);
        if (!fetched.length) {
          // this.fetched = this.fetched.filter(e=>e.update===this.currentDatasetUpdate)
          this.fetched = [];
          fetched = [];
          this.recalculateRows = true;
          this.debouncedUpdateRows();
        }
      }

      if (fetched.length>(this.maxChunks+2) && currentFrom>=0) {
        // +2 so it doesn't calculate a distanceMap every time
        let distanceMap = fetched.map((chunk, index)=>({
          distance: Math.abs(currentFrom-chunk.from),
          index,
          from: chunk.from
        }))
          .filter(c=>c.from!==0)
          .sort((a,b)=>(a.distance-b.distance));

        let chunksToDelete = distanceMap
          .filter((d, i) => i>this.maxChunks)
          .sort((a, b) => b.index-a.index);

        chunksToDelete.forEach(c => {
          if (c.distance<50) {
            return;
          }
          fetched.splice(c.index, 1);
        });

        if (chunksToDelete.length) {
          this.fetched = fetched
          this.recalculateRows = true;
        }
      }

      let [from, to, force] = this.toFetch.pop();

      if (!to) {
        return range;
      }

      from = Math.max( from, 0 );
      to = Math.min( to, this.totalRowsCount - 1 );

      let length = to - from;

      let distanceFromWindow = Math.abs(currentFrom-from);

      let newRanges = optimizeRanges(
        [from,to],
        fetched.filter(e=>(e.from || e.to)).map(e=>[e.from,e.to])
      );

      if (!newRanges.length) {
        return range; // no chunks
      }

      let returnValue = range;
      let forced = false;

      let profilePromise = false;

      for (let i = newRanges.length - 1; i >= 0 ; i--) {

        let previewCode = (this.previewCode ? this.previewCode.code : false) || '';
        let previewPayload = (this.previewCode ? this.previewCode.codePayload : false) || {};

        if (this.profilePreview && this.profilePreview.code !== previewCode) {
          console.log('[REQUESTING] resetting profile', this.profilePreview.code, previewCode)
          await this.unsetProfile();
        }

        let checkProfile = await this.fetchChunk(newRanges[i][0], newRanges[i][1], forced);
        console.debug('[FETCHING] Chunk done');

        this.mustUpdateRows = true;

        returnValue = (checkProfile===undefined) ? range : false;

        // repeats current check if neccessary
        if (checkProfile === 'forceSample' && !forced) {
          console.debug("[FETCHING] Repeating chunk check")
          forced = true;
          i++;
        }

        if (checkProfile && !profilePromise) {
          // console.log('[REQUESTING] profile must be checked')
          if (!this.profilePreview || this.profilePreview.code !== previewCode) {
            await this.setProfile(previewCode, previewPayload)
            console.debug('[FETCHING] Profiling done');
          }
        }
      }

      this.debouncedUpdateRows();

      return returnValue;

    },

    async fetchChunk(from, to, forced = false) {

      let addToFetch;
      let lessRowsFetched = false;
      let checkProfile = false;

      try {
        addToFetch = await this.$store.dispatch('getBufferWindow', {
          from,
          to,
          beforeCodeEval: this.previewCode.beforeCodeEval,
          socketPost: this.socketPost,
          methods: this.commandMethods
        });
      } catch (err) {
        err.message = '(Error on buffer request) ' + (err.message || '')
        throw err;
      }

      if (addToFetch) {
        
        // Less rows fetched
        if (addToFetch.to - addToFetch.from != addToFetch.sample.value.length-1) {
          lessRowsFetched = true;
          console.warn(`Chunk result does not match its requested range`, addToFetch);
          // No rows fetched
          if (!addToFetch.sample.value.length) {
            return 'forceSample';
          }
          addToFetch.to = addToFetch.from + addToFetch.sample.value.length-1;
        }
        
        this.fetched.push(addToFetch);
        this.mustUpdateRows = true;

        if (lessRowsFetched && !forced) {
          checkProfile = 'forceSample';
        } else {
          checkProfile = this.checkIncomingColumns(addToFetch.sample.columns);
        }
      } else {
        checkProfile = undefined;
      }

      return checkProfile;

    },

    updateRows () {
      var columnValues = {}
      for (const colName in this.columnValues) {
        columnValues[colName] = this.columnValues[colName];
      }
      if (this.recalculateRows) {
        this.recalculateRows = false
        columnValues = {}
        for (const index in this.fetched) {
          this.fetched[index].inTable = false
        }
      }
      columnValues = {};
      for (const index in this.fetched) {
        if (!this.fetched[index].inTable && this.fetched[index].sample) {
          columnValues = {...columnValues, ...this.getValuesByColumns(this.fetched[index].sample, false, this.fetched[index].from)}
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

