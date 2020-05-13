<template>
  <div class="dashboard-container">
    <div class="toolbar bb-toolbar" :class="{'disabled': commandsDisabled}">
      <v-tooltip transition="fade-transition" bottom>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" text class="icon-btn" @click="listView=true" :disabled="!(dataset && dataset.summary)">
            <v-icon :color="(listView) ? 'black' : '#888'">
              view_headline
            </v-icon>
          </v-btn>
        </template>
        <span>Columns list view</span>
      </v-tooltip>
      <v-tooltip transition="fade-transition" bottom>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" text class="icon-btn" @click="listView=false" :disabled="!(dataset && dataset.summary)">
            <v-icon :color="(!listView) ? 'black' : '#888'">
              view_module
            </v-icon>
          </v-btn>
        </template>
        <span>Table view</span>
      </v-tooltip>
      <div class="divider"/>
      <template v-for="(element, index) in (toolbarElements.filter(e=>!+e.hidden))">
        <div v-if="element.divider" :key="index" class="divider"/>
        <template v-else-if="element.type=='button'">
          <v-tooltip :key="'toolbar'+index" transition="fade-transition" bottom>
            <template v-slot:activator="{ on }">
              <div class="icon-btn-container" v-on="on">
                <v-btn
                  text
                  class="icon-btn"
                  @click="element.onClick"
                  :disabled="!!+element.disabled"
                >
                  <template v-for="(icon, ii) in element.icons">
                    <v-icon
                      :key="ii"
                      :color="icon.color || '#888'"
                      :style="icon.style || {}"
                    >
                      {{icon.icon}}
                    </v-icon>
                  </template>
                </v-btn>
              </div>
            </template>
            <span>{{element.tooltip}}</span>
          </v-tooltip>
        </template>
        <template v-else-if="element.type=='menu'">
          <v-menu
            v-model="menus[element.group]"
            offset-y
            :key="'toolbar'+index"
          >
            <template v-slot:activator="{ on: menu }">
              <v-tooltip :disabled="menus[element.group]" transition="fade-transition" bottom>
                <template v-slot:activator="{ on: tooltip }">
                  <div class="icon-btn-container" v-on="{...tooltip}">
                    <v-btn
                      :color="'#888'"
                      :disabled="!!+element.disabled"
                      class="icon-btn"
                      text
                      v-on="{...menu}"
                    >
                      <template v-for="(icon, ii) in element.icons">
                        <v-icon
                          :key="ii"
                          :color="icon.color || '#888'"
                          :style="icon.style || {}"
                        >
                          {{icon.icon}}
                        </v-icon>
                      </template>
                      <v-icon style="margin-right: -8px; margin-left: -6px" :color="menus[element.group] ? 'black' : '#888'">
                        arrow_drop_down
                      </v-icon>
                    </v-btn>
                  </div>
                </template>
                <span>{{element.tooltip}}</span>
              </v-tooltip>
            </template>
            <v-list dense style="max-height: 400px; min-width: 160px;" class="scroll-y">
              <v-list-item-group color="black">
                <v-list-item
                  v-for="(item, i) in menuItems(element.group).filter(e=>!+e.hidden)"
                  :key="i+'mc'"
                  @click="commandHandle(item)"
                  :disabled="(item.max && selectedColumns.length>item.max) || (item.min && selectedColumns.length<item.min)"
                >
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ item.text }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-menu>
        </template>
        <v-menu v-else-if="element.type=='sort'" :key="index" :close-on-content-click="false" @input="menus['sort'] = $event" offset-y>
          <template v-slot:activator="{ on: menu }">
              <v-tooltip :disabled="menus['sort']" transition="fade-transition" bottom>
                <template v-slot:activator="{ on: tooltip }">
                  <v-btn
                    :color="sortBy[0] ? 'black' : '#888'"
                    :disabled="!(dataset && dataset.summary)"
                    class="icon-btn"
                    text
                    v-on="{...tooltip, ...menu}"
                  >
                    <v-icon>sort</v-icon>
                    <span style="min-width: 2em; margin-left: -2px">
                      {{ sortByLabel }}
                    </span>
                    <v-icon v-show="sortBy[0]" color="black" small>
                      <template v-if="sortDesc[0]">arrow_downward</template>
                      <template v-else>arrow_upward</template>
                    </v-icon>
                  </v-btn>
                </template>
                <span>Sort columns</span>
              </v-tooltip>
            </template>
            <v-list dense>
              <v-list-item-group :value="sortBy[0]" color="black">
                <v-list-item
                  v-for="(item, i) in sortableColumnsTableHeaders"
                  :key="i+'scth'"
                  :value="item.value"
                  @click="clickSort(item.value)"
                >
                  <v-list-item-content>
                    <v-list-item-title>
                      <span class="sort-hint">
                        {{ item.hint }}
                      </span>
                      {{ item.text }}
                    </v-list-item-title>
                  </v-list-item-content>
                  <v-list-item-icon>
                    <v-icon v-show="item.value===sortBy[0]" color="black">
                      <template v-if="sortDesc[0]">arrow_downward</template>
                      <template v-else>arrow_upward</template>
                    </v-icon>
                  </v-list-item-icon>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-menu>
      </template>
      <v-spacer></v-spacer>
      <v-menu
        v-model="searchMenu"
        :close-on-content-click="false"
        offset-y
      >
        <template v-slot:activator="{ on: menu }">
          <v-tooltip :disabled="searchMenu" transition="fade-transition" bottom>
            <template v-slot:activator="{ on: tooltip }">
              <div class="icon-btn-container mr-2" v-on="{...tooltip}">
                <v-badge
                  :value="typesSelected.length || searchText"
                  color="primary lighten-2"
                  dot
                  overlap
                >
                  <v-btn
                    :color="'#888'"
                    class="icon-btn"
                    text
                    :disabled="!(currentDataset && currentDataset.summary)"
                    v-on="{...menu}"
                  >
                    <v-icon color="#888">search </v-icon>
                  </v-btn>
                </v-badge>
              </div>
            </template>
            <span>Search / filter columns</span>
          </v-tooltip>
        </template>
        <div class="controls-container text-xs-center">
          <v-text-field
            autocomplete="off"
            v-model="searchText"
            :color="'grey darken-3'"
            clearable
            dense
            full-width
            solo flat
            class="search-filter mt-2 mr-4 elevation-0"
            prepend-inner-icon="search"
            label="Search column"
            :disabled="!(currentDataset && currentDataset.summary)"
          />
          <div class="filter-container">
            <v-autocomplete
              autocomplete="off"
              ref="autocomplete"
              v-model="typesSelected"
              :items="typesAvailable"
              :append-icon="''"
              :search-input.sync="typesInput"
              dense
              full-width
              solo flat
              chips
              deletable-chips
              color="grey darken-3"
              class="placeholder-chip primary--chips capitalized--chips"
              label="Data type"
              hide-details
              hide-no-data
              hide-selected
              multiple
              single-line
              :menu-props="{
                closeOnContentClick: true
              }"
              @change="typesUpdated"
              :disabled="!(currentDataset && currentDataset.summary)"
            >
              <template v-slot:item="{ item }">
                <div class="data-type in-autocomplete">{{ dataType(item) }}</div> <span class="capitalize">{{ item }}</span>
              </template>
            </v-autocomplete>
          </div>
        </div>

      </v-menu>
      <v-badge
        :value="cellsError!=='' || (operationsTitle && operationsTitle!='operations') && cells.length!=0"
        :color="(operationsTitle!='operations') ? 'primary lighten-2' : 'error'"
        dot
        overlap
      >
        <v-btn
          v-if="useKernel"
          :color="(operationsActive!=false) ? 'black' : '#888'"
          text
          class="icon-btn"
          :disabled="!(cells.length || operationsTitle!='operations')"
          @click="operationsActive = !operationsActive"
        >
          <v-icon>code</v-icon>
        </v-btn>
      </v-badge>
    </div>
    <Dataset
      :key="'dataset'+currentTab"
      :commandsDisabled="commandsDisabled"
      :sortBy.sync="sortBy"
      :sortDesc.sync="sortDesc"
      :operationsActive="!!operationsActive"
      :searchText="searchText"
      @selection="selectionEvent($event)"
      @sortDrag="callSort=true"
      @sort="lastSort=$event"
      :typesSelected="typesSelected"
      :columnsTableHeaders="columnsTableHeaders"
    />
    <div class="sidebar-container" :class="{'bigger': (operationsActive && bigOptions)}" v-show="detailsActive || (operationsActive && useKernel)">

      <template>
        <div class="sidebar-header" v-show="operationsActive && operationsTitle=='operations' && useKernel">
          Operations
          <v-icon class="right-button" color="black" @click="operationsActive = false">close</v-icon>
        </div>
        <div class="sidebar-header" v-show="operationsTitle!='operations' && operationsActive && useKernel">
          {{operationsTitle}}
          <v-icon class="right-button" color="black" @click="cancelCommand">close</v-icon>
        </div>
        <div class="sidebar-top" v-show="operationsTitle=='operations' && operationsActive && useKernel">
          <v-tooltip transition="fade-transition" bottom color="dataprimary darken-2" v-model="copied">
            <template v-slot:activator="{on: success}">
              <v-menu offset-y left min-width="200" >
                <template v-slot:activator="{ on: more }">
                  <v-icon v-on="more" class="right-button" color="black" @click.stop="">more_vert</v-icon>
                </template>
                <v-list flat dense style="max-height: 400px; min-width: 160px;" class="scroll-y">
                  <v-list-item-group color="black">
                    <v-list-item
                      @click="copyCodeToClipboard"
                    >
                      <v-list-item-content>
                        <v-list-item-title>
                          Copy code to clipboard
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
              </v-menu>
              <!-- <v-tooltip :disabled="copied" transition="fade-transition" bottom>
                <template v-slot:activator="{ on: hint }">
                  <v-btn
                    text
                    color="#888"
                    class="icon-btn"
                    :disabled="commandsDisabled"
                    v-on="hint"
                    @click="copyCodeToClipboard"
                  >
                    <v-icon>
                      file_copy
                    </v-icon>
                  </v-btn>
                </template>
                <span>
                  Copy code to clipboard
                </span>
              </v-tooltip> -->
            </template>
            <span>Copied succesfully</span>
          </v-tooltip>
        </div>
        <Cells
          v-show="operationsActive && useKernel"
          ref="cells"
          :big.sync="bigOptions"
          :view="operationsTitle"
          @updateOperations="updateOperations"
          :codeError.sync="cellsError"
          :columns="selectedColumns || []"
          :commandsDisabled.sync="commandsDisabled"
          :dataset="dataset"
        />
				<!-- <v-progress-linear
          indeterminate
          v-if="commandsDisabled && operationsActive && operationsTitle=='operations' && useKernel"
          color="#888"
          size="64"
          style="position: absolute; left: 0; top: 34px;"
        /> -->
      </template>
      <template v-if="detailsActive!==false && !operationsActive">
        <div class="sidebar-header">
          Details
          <v-icon class="right-button" color="black" @click="clearSelection">close</v-icon>
        </div>
        <div class="sidebar-content">

          <div v-if="detailedColumns.length>1" class="sidebar-section pr-10 columns-selected">
            <div class="column-selected" v-for="(index, i) in detailedColumns" :key="index+'selc'+i">
              <span class="data-type" :class="`type-${dataset.columns[index].dtype}`">{{ dataType(dataset.columns[index].dtype) }}</span>
              <span class="data-column-name">{{ dataset.columns[index].name }}</span>
            </div>
          </div>
          <div v-if="detailsActive['heat-map']" class="heat-map plot">
            <div class="plot-title" v-if="heatMap">
              Heat Map
            </div>
            <VegaEmbed
              :name="'heatmap'"
              :autosize="{
                type: 'fit'
              }"
              ref="heat-map"
              class="heat-map-grid"
              v-if="heatMap"
              :data="{values: heatMap}"
              :mark="{
                type: 'rect',
                tooltip: true
              }"
              :height="(heatMapEncoding.y2) ? 300 : undefined"
              :width="(heatMapEncoding.x2) ? 336 : undefined"
              :encoding="{
                ...heatMapEncoding,
                'color': {
                  'field': 'z',
                  title: 'n',
                  'type': 'quantitative',
                  scale: {range: ['#dcedf7', '#84c6f0', '#309ee3']},
                  legend: { direction: 'vertical', type: 'gradient', gradientLength: 120, titleAlign: 'left', title: ' n' }
                }
              }"
              :config="{
                view: {
                  strokeWidth: 0,
                  stroke: 'transparent',
                  step: 13
                },
                axis: {
                  titleOpacity: 0,
                  domainColor: '#fff',
                  title: 0,
                  gridColor: '#fff',
                  ticks: false,
                  domainOpacity: 0,
                  gridOpacity: 0,
                  tickOpacity: 0,
                  labelPadding: 0,
                  labels: false,
                },
              }"
              >
            </VegaEmbed>
          </div>
          <template v-for="(index, i) in detailedColumns">
            <ColumnDetails
              :key="index+'cd'"
              :startExpanded="i==0"
              :rowsCount="+dataset.summary.rows_count"
              :column="dataset.columns[index]"
              :commandsDisabled="commandsDisabled"
              @command="commandHandle($event)"
            ></ColumnDetails>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import ColumnDetails from '@/components/ColumnDetails'
import Cells from '@/components/Cells'
import Dataset from '@/components/Dataset'
import VegaEmbed from '@/components/VegaEmbed'
import clientMixin from '@/plugins/mixins/client'
import dataTypesMixin from '@/plugins/mixins/data-types'
import applicationMixin from '@/plugins/mixins/application'
import { copyToClipboard, namesToIndices } from '@/utils/functions.js'
import { mapState, mapGetters } from 'vuex';

const api_url = process.env.API_URL || 'http://localhost:5000'

export default {
	components: {
    ColumnDetails,
    Cells,
    Dataset,
    VegaEmbed
	},

	mixins: [clientMixin, dataTypesMixin, applicationMixin],

	props: {
		dataset: {
			default: () => {
				return {}
			},
			type: Object
		},
		total: {
			default: 1,
			type: Number
		},
		searchText: {
			default: '',
			type: String
    },
    isOperating: {
      type: Boolean,
      default: false
    },
		// typesSelected: {
		// 	default: () => ([]),
		// 	type: Array
		// }
	},

	data () {
		return {

      typesSelected: [],
			typesInput: '',

      cellsError: '',
      copied: false,

      file: {dialog: false},

      scatterPlotDisplay: [],

      operationsActive: false,
      operationsTitle: 'operations',
      bigOptions: false,
      commandsDisabled: false,
      operation: undefined,
      heatMap: [],
      heatMapEncoding: {},

      menus: {},
      searchMenu: false,

      lastSort: [],
      callSort: false,

      commandItems: [

				{command: 'drop rows', text: 'Drop rows', type: 'FILTER'},
        {command: 'keep rows', text: 'Keep rows', type: 'FILTER'},


				{command: 'lower', text: 'To lower case', type: 'STRING'},
				{command: 'upper', text: 'To upper case', type: 'STRING'},
				{command: 'remove_accents', text: 'Remove accents', type: 'STRING'},
				{command: 'remove_special_chars', text: 'Remove special chars', type: 'STRING'},
        {command: 'trim', text: 'Trim white space', type: 'STRING'},
        {command: 'string clustering', text: 'String clustering', type: 'STRING', max: 1, min: 1, hidden: { valueOf: ()=>(this.appStable) }},

				// {command: 'random_split',     teaxt: 'Split train and test', type: 'PREPARE'},

				{command: 'sample_n', text: 'Random Sampling', type: 'ML'},
        {command: 'stratified_sample', text: 'Stratified Sampling', type: 'ML', min: 1, max: 1},
				{command: 'bucketizer',       text: 'Create Bins',          type: 'ML', max: 1}, // TODO: Check limit
				{command: 'impute',           text: 'Impute rows',          type: 'ML', min: 1},
				{command: 'values_to_cols',   text: 'Values to Columns',    type: 'ML', max: 1},
				{command: 'string_to_index',  text: 'Strings to Index',     type: 'ML', min: 1},
				{command: 'index_to_string',  text: 'Indices to Strings',     type: 'ML', min: 1},
        {command: 'z_score',          text: 'Standard Scaler',  type: 'ML', min: 1},
        {command: 'min_max_scaler',   text: 'Min max Scaler',   type: 'ML', min: 1},
        {command: 'max_abs_scaler',   text: 'Max abs Scaler',   type: 'ML', min: 1},
        {command: 'outliers',   text: 'Outliers',   type: 'ML', min: 1, max: 1},

        {command: 'cast', dtype: 'int',     text: 'Int', type: 'CAST'},
				{command: 'cast', dtype: 'float',   text: 'Float', type: 'CAST'},
				{command: 'cast', dtype: 'double',  text: 'Double', type: 'CAST'},
				{command: 'cast', dtype: 'string',  text: 'String', type: 'CAST'},
				{command: 'cast', dtype: 'boolean', text: 'Boolean', type: 'CAST'},
				{command: 'cast', dtype: 'struct',  text: 'Struct', type: 'CAST'},
				{command: 'cast', dtype: 'array',   text: 'Array', type: 'CAST'},
				{command: 'cast', dtype: 'bigint',  text: 'Big Int', type: 'CAST'},
				{command: 'cast', dtype: 'date',    text: 'Date', type: 'CAST'},
				{command: 'cast', dtype: 'byte',    text: 'Byte', type: 'CAST'},
				{command: 'cast', dtype: 'short',   text: 'Short', type: 'CAST'},
				{command: 'cast', dtype: 'datetime', text: 'Datetime', type: 'CAST'},
				{command: 'cast', dtype: 'binary',  text: 'Binary', type: 'CAST'},
				{command: 'cast', dtype: 'null',    text: 'Null', type: 'CAST'},
				{command: 'cast', dtype: 'vector',  text: 'Vector', type: 'CAST'}
      ],

      sortBy: [],
      sortDesc: [false],
      columnsTableHeaders: [
				{ text: '', sortable: false, width: '1%', value: 'controls' },
				{ hint: '#/A', sortable: false, text: 'Type', value: 'dtype', width: '1.5%' },
				{ hint: 'ABC', sortable: false, text: 'Name', value: 'name', width: '3%' },
				{ hint: '""', sortable: false, text: 'Missing values', width: '2%', value: 'missing' },
				// { hint: 'null', text: 'Null values', width: '2%', value: 'null' },
        // { hint: '0', text: 'Zeros', width: '2%', value: 'zeros' },
        // TODO: Zeros?
				{ text: '', sortable: false, width: '50%', value: '' }
			]
    }
  },

	computed: {

    ...mapGetters(['currentSelection', 'hasSecondaryDatasets', 'currentCells','currentListView','selectionType', 'currentDataset', 'typesAvailable','currentTab']),

    ...mapState(['nextCommand']),

    listView: {
      get () {
        return this.currentListView
      },
      set (view) {
        this.$store.commit('setListView',view)
      }
    },

    detailsActive() {

      var selected = this.selectedColumns.map(e=>e.index)
      var detailsActive = false
      if (this.selectionType=='columns' && !selected.length) {
        detailsActive = false
      }
      else {
        detailsActive = {}
        this.operationsActive = false
      }
      if (selected.length) {

        var plotable = selected.map( (i)=>{
          var column = this.dataset.columns[i]
          return ['decimal','float','double','float64'].includes(column.dtype) ? 'quantitative'
            : (['int','integer','int64'].includes(column.dtype) && column.stats.count_uniques>25) ? 'quantitative'
            : (column.stats.count_uniques<=25) ? column.stats.count_uniques
            : false
        })

        if (plotable.length==2 && selected.length==2) {

          this.heatMap = this.calculateHeatMap(selected[0], selected[1], plotable[0], plotable[1])

          if (this.heatMap) {
            detailsActive['heat-map'] = true

            let _x =
            (plotable[0]==='quantitative') ? {
              x: {
                field: 'x',
                title: this.dataset.columns[selected[0]].name,
                type: plotable[0],
                bin: {
                  binned: true
                }
              },
              x2: {
                field: 'x2',
              },
            }
            : {
              x: {
                field: 'x',
                title: this.dataset.columns[selected[0]].name,
                type: 'ordinal'
              }
            }

            let _y =
            (plotable[1]==='quantitative') ? {
              y: {
                field: 'y',
                title: this.dataset.columns[selected[1]].name,
                type: plotable[1],
                bin: {
                  binned: true
                }
              },
              y2: {
                field: 'y2',
              },
            }
            : {
              y: {
                field: 'y',
                title: this.dataset.columns[selected[1]].name,
                type: 'ordinal'
              }
            }

            this.heatMapEncoding ={
              ..._x,
              ..._y
            }
          }
        }
      }

      return detailsActive
    },

    cells: {
      get() {
        return Array.from(this.currentCells || [])
      },
      set(value) {
        this.$store.commit('setCells', value)
      }
    },

    toolbarElements () {
      return [
        {
          type: 'button',
          onClick: () => {
            this.commandHandle({command: 'load file', noOperations: true})
          },
          icons: [{ icon: 'cloud_upload' }],
          tooltip: 'Load file',
          disabled: {
            valueOf: ()=>(this.$store.state.kernel!='done')
          }
        },
        {
          type: 'button',
          onClick: () => {
            this.$refs.cells & this.$refs.cells.downloadDataset(event)
          },
          icons: [{ icon: 'save' }],
          tooltip: 'Download file',
          disabled: {
            valueOf: ()=>!(this.dataset && this.dataset.summary)
          }
        },
        {
          divider: true,
          hidden: {
              valueOf: ()=>(this.appStable)
            }
        },
        {
          type: 'button',
          onClick: () => {
            this.commandHandle({command: 'load from database', noOperations: true})
          },
          icons: [{ icon: 'storage' }],
          tooltip: 'Connect a database',
          disabled: {
            valueOf: ()=>(this.$store.state.kernel!='done')
          },
          hidden: {
            valueOf: ()=>(this.appStable)
          }
        },
        {
          type: 'button',
          onClick: () => {
            this.commandHandle({command: 'save to database'})
          },
          icons: [
            { icon: 'storage' },
            { icon: 'check', style: {marginLeft: '-4px'} }
          ],
          tooltip: 'Save dataset to database',
          disabled: {
            valueOf: ()=>!(this.dataset && this.dataset.summary && this.$store.state.database)
          },
          hidden: {
            valueOf: ()=>(this.appStable)
          }
        },
        { divider: true },
        {
          type: 'button',
          onClick: () => {
            this.commandHandle({command: 'join'})
          },
          icons: [
            { icon: 'playlist_add' },
          ],
          tooltip: 'Join dataframes',
          disabled: {
            valueOf: ()=>!(this.dataset && this.dataset.summary && this.hasSecondaryDatasets)
          }
        },
        {
          type: 'button',
          onClick: () => {
            this.commandHandle({command: 'aggregations'})
          },
          icons: [
            { icon: 'add' },
          ],
          tooltip: 'Get aggregations',
          disabled: {
            valueOf: ()=>!(!['values','ranges'].includes(this.selectionType) && this.dataset && this.dataset.summary)
          }
        },
        // { divider: true },
        // {
        //   type: 'sort'
        // },
        // {
        //   type: 'button',
        //   onClick: ()=>this.commandHandle({command: 'apply sort', columns: this.lastSort}),
        //   disabled: {
        //     valueOf: ()=>!(this.dataset && this.dataset.summary && this.sortBy[0])
        //   },
        //   icons: [{icon: 'sort'},{icon: 'check', style: {marginLeft: '-8px'}}],
        //   tooltip: 'Apply sorting',
        //   hidden: {
        //     valueOf: ()=>(this.appStable)
        //   }
        // },
        { divider: true },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'sort rows'}),
          tooltip: 'Sort rows',
          disabled: { valueOf: ()=>['values','ranges'].includes(this.selectionType) || this.selectedColumns.length<1 },
          icons: [
            {
              icon: 'arrow_right_alt',
              style: {
                transform: 'rotate(90deg)',
                marginLeft: '-5px',
                marginRight: '-7px'
              }
            },
            {
              icon: 'arrow_right_alt',
              style: {
                transform: 'rotate(-90deg)',
                marginLeft: '-7px',
                marginRight: '-5px'
              }
            }
          ],
          hidden: {
            valueOf: ()=>(this.appStable)
          }
        },
        {
          type: 'button',// {toString: ()=>(this.selectionType=='columns' ? 'button' : 'menu')},
          // group: 'FILTER',
          onClick: ()=>{
            var command = { command: 'filter rows' }
            if (['values','ranges'].includes(this.selectionType) && this.currentSelection && this.currentSelection.ranged) {
              command = { command: 'REMOVE_KEEP_SET' }
              command.columns = [ this.dataset.columns[this.currentSelection.ranged.index].name ]
              command.payload = { rowsType: this.selectionType }
              if (this.selectionType==='ranges') {
                command.payload.selection = this.currentSelection.ranged.ranges
              } else if (this.selectionType==='values') {
                command.payload.selection = this.currentSelection.ranged.values
              }
            } else if (this.selectionType==='text') {
              command.payload = {
                columns: [this.currentSelection.text.column],
                text: this.currentSelection.text.value
              }
            }
            this.commandHandle(command)
          },
          tooltip: 'Filter rows',
          disabled: { valueOf: ()=>!(['values','ranges','text'].includes(this.selectionType) || this.selectedColumns.length==1) },
          icons: [{icon: 'filter_list'}]
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'drop empty rows'}),
          tooltip: 'Drop empty rows',
          icons: [
            { icon: 'delete' },
            { icon: 'menu', style: {
              marginLeft: '-6px',
              transform: 'scaleX(0.75)'
            } }
          ],
          disabled: {
            valueOf: ()=>!(this.dataset && this.dataset.summary && this.hasSecondaryDatasets)
          }
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'drop duplicates'}),
          tooltip: 'Drop duplicates',
          icons: [
            { icon: 'flip_to_back' },
          ],
          disabled: {
            valueOf: ()=>!(this.dataset && this.dataset.summary && this.hasSecondaryDatasets)
          }
        },
        { divider: true },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'set'}),
          tooltip: 'New column',
          icons: [{icon: 'add_box'}],
          disabled: {valueOf: ()=>!(this.selectionType=='columns' && this.dataset && this.dataset.summary)}
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'rename'}),
          tooltip: { toString: ()=> 'Rename column'+ (this.selectedColumns.length!=1 ? 's' : '')},
          icons: [{icon: 'edit'}],
          disabled: {valueOf: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)}
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'duplicate'}),
          tooltip: { toString: ()=> 'Duplicate column'+ (this.selectedColumns.length!=1 ? 's' : '')},
          icons: [{icon: 'file_copy'}],
          disabled: {valueOf: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)}
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'keep', type: 'DROP_KEEP'}),
          tooltip: { toString: ()=> 'Keep column'+ (this.selectedColumns.length!=1 ? 's' : '')},
          icons: [{icon: 'all_out'}],
          disabled: {valueOf: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)}
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'drop', type: 'DROP_KEEP'}),
          tooltip: { toString: ()=> 'Drop column'+ (this.selectedColumns.length!=1 ? 's' : '')},
          // icons: [{icon: 'delete'}],
          icons: [
            { icon: 'delete' },
            // { icon: 'menu', style: {transform: 'rotate(90deg)', marginLeft: '-6px'} }
          ],
          disabled: {valueOf: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)}
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'nest'}),
          tooltip: 'Nest columns',
          icons: [{icon: 'link'}],
          disabled: {valueOf: ()=>['values','ranges'].includes(this.selectionType) || this.selectedColumns.length<=1 || !this.dataset.summary}
        },
        {
          type: 'button',
          onClick: ()=>{
            var payload = undefined
            if (this.selectionType==='text') {
              payload = {
                separator: this.currentSelection.text.value,
                columns: [ this.currentSelection.text.column]
              }
            }
            this.commandHandle({command: 'unnest', payload})
          },
          tooltip: { toString: ()=> 'Unnest column'+ (this.selectedColumns.length!=1 ? 's' : '')},
          icons: [{icon: 'link_off'}],
          disabled: {valueOf: ()=>!((this.selectionType=='columns' && this.selectedColumns.length>0) || this.selectionType==='text')}
        },
        { divider: true },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'fill_na'}),
          tooltip: { toString: ()=> 'Fill column'+ (this.selectedColumns.length!=1 ? 's' : '')},
          icons: [{icon: 'brush'}],
          disabled: {valueOf: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)}
        },
        {
          type: 'button', // rows
          onClick: ()=>{
            if (this.selectionType=='columns') {
              this.commandHandle({command: 'replace'})
            }
            else if (this.selectionType=='text') {
              var payload = {
                columns: [this.currentSelection.text.column],
                search: [this.currentSelection.text.value]
              }
              this.commandHandle({command: 'replace', payload})
            }
            else {
              this.commandHandle({command: 'replace'})
            }
          },
          tooltip: {
            toString: ()=>{
              return 'Replace in column'+ (this.selectedColumns.length>1 ? 's' : '')
            }
          },
          icons: [{icon: 'find_replace'}],
          disabled: {valueOf: ()=>!(['text'].includes(this.selectionType) || this.selectedColumns.length>0)}
        },
        {
          type: 'menu',
          group: 'STRING',
          icons: [{ icon: 'text_format' }],
          tooltip: 'String operations',
          disabled: { valueOf: ()=>!(this.selectionType=='columns' && this.dataset && this.dataset.summary && this.selectedColumns.length>=0)}
        },
        {
          type: 'menu',
          group: 'CAST',
          icons: [{ icon: 'category' }],
          tooltip: 'Cast',
          disabled: { valueOf: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)}
        },
        {
          type: 'menu',
          group: 'ML',
          icons: [{ icon: 'timeline' }],
          tooltip: 'Machine Learning',
          disabled: { valueOf: ()=>!(this.selectionType=='columns' && this.dataset && this.dataset.summary) }, // Sampling
          hidden: {
            valueOf: ()=>(this.appStable)
          }
        },
      ]
    },

    detailedColumns() {
      if (this.selectionType==='text') {
        return [this.currentSelection.text.index]
      }
      if (['values','ranges'].includes(this.selectionType)) {
        return [this.currentSelection.ranged.index]
      }
      return this.selectedColumns.map(e=>e.index)
    },

    selectedColumns: {
      set (c) {
        if (this.isMounted) {
          this.$store.commit('selection',{ columns: c })
        }
      },
      get () {
        try {
          return [...this.currentSelection.columns] || []
        } catch (error) {}
        return []
      }
    },

    tableKey () {
			return this.$store.state.datasetUpdates * 100 + this.$store.state.tab
		},

		sortByLabel () {
			if (this.sortBy[0]) {
				try {
					return this.sortableColumnsTableHeaders.find(e => e.value === this.sortBy[0]).text.split(' ')[0]
				} catch {}
			}
			return 'Sort'
		},

		sortableColumnsTableHeaders () {
			return this.columnsTableHeaders.filter(e => e.sortable !== false)
    },

    computedIsOperating () {
      return (this.operationsTitle!=='operations' && this.operationsActive)
    }

  },

  mounted () {
    this.isMounted = true
  },

  watch: {
    lastSort (lastSort) {
      this.$nextTick(()=>{
        if (this.callSort && lastSort.length) {
          this.callSort = false
          this.commandHandle({
            command: 'apply sort',
            columns: lastSort,
            ignoreCell: true,
            deleteOtherCells: true
          })
        }
      })
    },
    computedIsOperating (value) {
      this.$emit('update:isOperating', value)
    },
    currentDataset () {
      this.lastSort = []
    },
    cellsError (value) {
      if (value!='') {
        this.operationsActive = true
        this.operationsTitle = 'operations'
      }
    },
    nextCommand (command) {
      if (command) {
        this.commandHandle(command)
      }
    },
    cells (cells) {
      if (cells.length==0) {
        this.operationsActive = false
      }
    },
  },

  methods: {

    typesUpdated () {
      this.typesInput = ''
      this.$refs.autocomplete.loseFocus
		},

    updateOperations (event) {
      var {active, title} = event
      if (active!==undefined) this.operationsActive = active
      this.operationsTitle = title
    },

    clearSelection () {
      this.$store.commit('selection',{ clear: true })
    },

    menuItems (type) {
      return this.commandItems.filter(e => e.type==type)
    },

    copyCodeToClipboard () {
      var code = 'from optimus import Optimus\n'
      +'op = Optimus(master="local[*]", app_name="optimus", comm=True)\n' // TODO: Update
      + this.cells.map(e=>e.code).filter(c=>c.trim()).join('\n')
      copyToClipboard(code)
      this.copied = true
      setTimeout(() => {
        this.copied = false
      }, 2000);
    },

    cancelCommand () {
      this.$nextTick(()=>{
        this.$refs.cells & this.$refs.cells.cancelCommand()
      })
    },

    commandHandle (event) {
      this.$nextTick(()=>{
        this.$refs.cells & this.$refs.cells.commandHandle(event)
      })
    },

    clickSort (by) {
			if (this.sortBy[0] !== by) {
				this.sortBy = [by]
				this.sortDesc = [false]
			} else if (this.sortDesc[0] === false) {
				this.sortDesc = [true]
			} else if (this.sortDesc[0] === true) {
				this.sortDesc = [false]
				this.sortBy = []
			}
    },

    selectionEvent (event) {
      if (event!==false) {
        this.handleSelection(event.selected, event.indices)
      }
    },


    calculateHeatMap (xindex,yindex,xsize,ysize) {

      if (!this.dataset.sample || !this.dataset.sample.value) {
        return false
      }

      let xint = (xsize===+xsize)
      let yint = (ysize===+ysize)

      let xbinsize = (!xint) ? 25 : xsize
      let ybinsize = (!yint) ? 25 : ysize

      let minX = this.dataset.columns[xindex].stats.min
      let minY = this.dataset.columns[yindex].stats.min

      let maxX = this.dataset.columns[xindex].stats.max
      let maxY = this.dataset.columns[yindex].stats.max

      let jumpX = (maxX - minX) / xbinsize
      let jumpY = (maxY - minY) / ybinsize


      if (jumpX===0) {
        jumpX = 0.1
        maxX = minX + jumpX*xbinsize
      }

      if (jumpY===0) {
        jumpY = 0.1
        maxY = minY + jumpY*xbinsize
      }

      let bin = {}
      let _binElement = {}

      if (!yint)
        for (let i = 0; i < ybinsize; i++) {
          let binYIndex = (minY + jumpY*i)
          _binElement[binYIndex] = 0
        }

      if (!xint)
        for (let i = 0; i < xbinsize; i++) {
          let binXIndex = (minX + jumpX*i)
          bin[binXIndex] = {..._binElement}
        }

      for (let i = 0; i < this.dataset.sample.value.length; i++) {

        let _xv = this.dataset.sample.value[i][xindex]
        let _yv = this.dataset.sample.value[i][yindex]

        let _x = undefined
        let _y = undefined

        if (xint)
          _x = _xv
        else
          for (var x in bin) {
            if (_xv<=+x+jumpX) {
              _x = x
              break
            }
          }

        if (yint)
          _y = _yv
        else
          for (var y in bin[_x]) {
            if (_yv<=+y+jumpY) {
              _y = y
              break
            }
          }

        if (_x===undefined && !xint) {
          _x = minX + jumpX*(xbinsize-1)
        }

        if (_y===undefined && !yint) {
          _y = minY + jumpY*(ybinsize-1)
        }

        if (bin[_x] === undefined) {
          bin[_x] = {}
        }

        if (bin[_x][_y] === undefined) {
          bin[_x][_y] = 0
        }

        bin[_x][_y] = bin[_x][_y]+1
      }


      let data = []

      for (var x in bin) {
        for (var y in bin[x]) {
          if (+(bin[x][y]) != 0)
            data.push({x: x, x2: +x+jumpX, y: y, y2: +y+jumpY, z: +(bin[x][y])})
        }
      }

      return data

    },

     handleSelection (selected, indices = true) {

      if (!indices) {
        selected = namesToIndices(selected, this.dataset.columns)
      }

      this.selectedColumns = selected.map(e=>({index: e, name: this.dataset.columns[e].name}))
    },
  }

}
</script>

<style lang="scss">

  // drag

  .button {
    margin-top: 35px;
  }
  .flip-list-move {
    transition: transform 0.5s;
  }
  .no-move {
    transition: transform 0s;
  }
  .ghost {
    opacity: 0.5;
  }
</style>
