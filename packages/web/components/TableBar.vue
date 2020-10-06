<template>
  <div class="dashboard-container">
    <div class="toolbar bb-toolbar" :class="{'disabled': commandsDisabled}">
      <v-tooltip transition="fade-transition" bottom>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" text class="icon-btn" @click="listView=true" :disabled="!(currentDataset && currentDataset.summary)">
            <v-icon :color="(listView) ? 'black' : '#888'">
              mdi-format-list-checkbox
            </v-icon>
          </v-btn>
        </template>
        <span>Columns list view</span>
      </v-tooltip>
      <v-tooltip transition="fade-transition" bottom>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" text class="icon-btn" @click="listView=false" :disabled="!(currentDataset && currentDataset.summary)">
            <v-icon :color="(!listView) ? 'black' : '#888'">
              mdi-table
            </v-icon>
          </v-btn>
        </template>
        <span>Table view</span>
      </v-tooltip>
      <div class="divider"/>
      <template v-for="(element, index) in (toolbarElements.filter(e=>!getProperty(e.hidden)))">
        <div v-if="element.divider" :key="index" class="divider"/>
        <template v-else-if="element.type=='button'">
          <v-tooltip :key="'toolbar'+index" transition="fade-transition" bottom>
            <template v-slot:activator="{ on }">
              <div class="icon-btn-container" v-on="on">
                <v-btn
                  text
                  class="icon-btn"
                  @click="element.onClick"
                  :disabled="getProperty(element.disabled)"
                >
                  <template v-for="(icon, ii) in element.icons">
                    <v-icon
                      :key="ii"
                      :color="icon.color || '#888'"
                      :style="icon.style || {}"
                      :class="icon.class || {}"
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
                      :disabled="getProperty(element.disabled)"
                      class="icon-btn"
                      text
                      v-on="{...menu}"
                    >
                      <template v-for="(icon, ii) in element.icons">
                        <v-icon
                          :key="ii"
                          :color="icon.color || '#888'"
                          :style="icon.style || {}"
                          :class="icon.class || {}"
                        >
                          {{icon.icon}}
                        </v-icon>
                      </template>
                      <v-icon class="dropdown-icon" :color="menus[element.group] ? 'black' : '#888'">
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
                <template
                  v-for="(item, i) in menuItems(element.group).filter(e=>!getProperty(e.hidden))"
                >
                  <v-divider
                    v-if="item.divider"
                    :key="i+'mc'"
                  ></v-divider>
                  <v-list-item
                    v-else
                    :key="i+'mc'"
                    @click="commandHandle(item)"
                    :disabled="getProperty(item.disabled) || !checkDataTypes(item.allowedTypes) || (item.max && selectedColumns.length>item.max) || (item.min && selectedColumns.length<item.min)"
                  >
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ item.text }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </template>
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
                    :disabled="!(currentDataset && currentDataset.summary)"
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
            spellcheck="false"
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
                <div class="data-type in-autocomplete">{{ dataTypeHint(item) }}</div> <span class="capitalize">{{ item }}</span>
              </template>
            </v-autocomplete>
          </div>
        </div>

      </v-menu>
      <v-badge
        :value="codeError!=='' || (operationsTitle && operationsTitle!='operations') && cells.length!=0"
        :color="(operationsTitle!='operations') ? 'primary lighten-2' : 'error'"
        dot
        overlap
      >
        <v-btn
          :color="(operationsActive!=false) ? 'black' : '#888'"
          text
          class="icon-btn"
          :disabled="!(cells.length || operationsTitle!=='operations' || codeError!=='')"
          @click="operationsActive = !operationsActive"
        >
          <v-icon>code</v-icon>
        </v-btn>
      </v-badge>
    </div>
    <Dataset
      :key="'dataset'+currentTab"
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
    <div class="sidebar-container" :class="{'bigger': (operationsActive && bigOptions)}" v-show="detailsActive || operationsActive">

      <template>
        <div class="sidebar-header" v-show="operationsActive && operationsTitle=='operations'">
          Operations
          <v-icon class="right-button" color="black" @click="operationsActive = false">close</v-icon>
        </div>
        <div class="sidebar-header" v-show="operationsTitle!='operations' && operationsActive">
          {{operationsTitle}}
          <v-icon class="right-button" color="black" @click="cancelCommand">close</v-icon>
        </div>
        <div class="sidebar-top" v-show="operationsTitle=='operations' && operationsActive">
          <v-tooltip transition="fade-transition" bottom color="dataprimary darken-2" v-model="copied">
            <template v-slot:activator="{on: success}">
              <v-menu offset-y left min-width="200" >
                <template v-slot:activator="{ on: more }">
                  <v-icon v-on="more" class="right-button" color="black" @click.stop="">more_vert</v-icon>
                </template>
                <v-list flat dense style="max-height: 400px; min-width: 160px;" class="scroll-y">
                  <v-list-item-group color="black">
                    <!-- <v-list-item
                      @click="copyCodeToClipboard"
                    >
                      <v-list-item-content>
                        <v-list-item-title>
                          Copy code to clipboard
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item> -->
                    <v-list-item
                      v-for="engine in engines"
                      :key="engine.name"
                      :disabled="!engine.init"
                      @click="copyCodeToClipboard(engine.init)"
                    >
                      <v-list-item-content>
                        <v-list-item-title>
                          Export to {{engine.prettyName}}
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
              </v-menu>
            </template>
            <span>Copied succesfully</span>
          </v-tooltip>
        </div>
        <Cells
          v-show="operationsActive"
          ref="cells"
          :big.sync="bigOptions"
          :view="operationsTitle"
          @updateOperations="updateOperations"
          :columns="selectedColumns || []"
        />
				<!-- <v-progress-linear
          indeterminate
          v-if="commandsDisabled && operationsActive && operationsTitle=='operations'"
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
              <span class="data-type" :class="`type-${currentDataset.columns[index].profiler_dtype.dtype}`">{{ dataTypeHint(currentDataset.columns[index].profiler_dtype.dtype) }}</span>
              <span class="data-column-name">{{ currentDataset.columns[index].name }}</span>
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
              :rowsCount="+currentDataset.summary.rows_count"
              :column="currentDataset.columns[index]"
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
import { copyToClipboard, namesToIndices, getProperty, ENGINES, TYPES_NAMES, TIME_NAMES } from 'bumblebee-utils'
import { mapState, mapGetters } from 'vuex'

export default {
	components: {
    ColumnDetails,
    Cells,
    Dataset,
    VegaEmbed
	},

	mixins: [clientMixin, dataTypesMixin, applicationMixin],

	props: {
		total: {
			default: 1,
			type: Number
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

      engines: [
        {name: 'dask', prettyName: ENGINES.dask, init: '"dask", n_workers=1, threads_per_worker=8, processes=False, memory_limit="3G", comm=True'},
        {name: 'dask_cudf', prettyName: ENGINES.dask_cudf, init: '"dask_cudf", process=True'},
        {name: 'cudf', prettyName: ENGINES.cudf, init: '"cudf"'},
        {name: 'pandas', prettyName: ENGINES.pandas, init: '"cudf"'},
        {name: 'vaex', prettyName: 'Vaex'},
      ],

      typesSelected: [],
			typesInput: '',

      copied: false,

      file: {dialog: false},

      scatterPlotDisplay: [],

      operationsActive: false,
      operationsTitle: 'operations',
      bigOptions: false,
      operation: undefined,
      heatMap: [],
      heatMapEncoding: {},

      menus: {},
      searchMenu: false,

      lastSort: [],
      callSort: false,

      searchText: '',

      commandItems: [

				{command: 'load file', text: 'Add from file', type: 'DATA_SOURCE'},
        {command: 'load from database', text: 'Add from database', type: 'DATA_SOURCE'},
				{command: 'load from data source', text: 'Add from a loaded data source', type: 'DATA_SOURCE', hidden: true},
        {command: 'manage data sources', text: 'Manage data sources', type: 'DATA_SOURCE', hidden: true},

        {command: 'download', text: 'Download', type: 'SAVE', disabled: ()=>true},
        {command: 'keep rows', text: 'Save to database', type: 'SAVE', disabled: ()=>!(this.currentDataset && this.currentDataset.summary && this.$store.state.database)},


				{command: 'lower', text: 'To lower case', type: 'STRING'},
				{command: 'upper', text: 'To upper case', type: 'STRING'},
				{command: 'remove_accents', text: 'Remove accents', type: 'STRING'},
				{command: 'remove_special_chars', text: 'Remove special chars', type: 'STRING'},
        {command: 'trim', text: 'Trim white space', type: 'STRING'},
        {command: 'string clustering', text: 'String clustering', type: 'STRING', max: 1, min: 1, hidden: ()=>(this.hideOperations) },

        // {command: 'set_column_format', text: 'Set column format', type: 'TIME'},
        {command: 'transform_format', text: 'Transform format', type: 'TIME'},

        {divider: true, type: 'TIME'},

        ...Object.entries(TIME_NAMES).map(
          ([output_type, name])=>({command: 'get_from_datetime', payload: { output_type }, text: `Get ${name}`, type: 'TIME'})
        ),

				// {command: 'random_split',     teaxt: 'Split train and test', type: 'PREPARE'},

				{command: 'sample_n', text: 'Random Sampling', type: 'ML'},
        {command: 'stratified_sample', text: 'Stratified Sampling', type: 'ML', min: 1, max: 1},
				{command: 'bucketizer',       text: 'Create Bins',          type: 'ML', max: 1}, // TO-DO: Check limit
				{command: 'impute',           text: 'Impute rows',          type: 'ML', min: 1},
				{command: 'values_to_cols',   text: 'Values to Columns',    type: 'ML', max: 1},
				{command: 'string_to_index',  text: 'Strings to Index',     type: 'ML', min: 1},
				{command: 'index_to_string',  text: 'Indices to Strings',     type: 'ML', min: 1},
        {command: 'z_score',          text: 'Standard Scaler',  type: 'ML', min: 1},
        {command: 'min_max_scaler',   text: 'Min max Scaler',   type: 'ML', min: 1},
        {command: 'max_abs_scaler',   text: 'Max abs Scaler',   type: 'ML', min: 1},
        {command: 'outliers',   text: 'Outliers',   type: 'ML', min: 1, max: 1},

        ...Object.entries(TYPES_NAMES).map(
          ([dtype, text])=>({command: 'set_profiler_dtypes', payload: { dtype }, text, type: 'CAST'})
        )
      ],

      sortBy: [],
      sortDesc: [false],
      columnsTableHeaders: [
				{ text: '', sortable: false, width: '1%', value: 'controls' },
				{ hint: '#/A', sortable: false, text: 'Type', value: 'profilerDtype', width: '1.5%' },
				{ hint: 'ABC', sortable: false, text: 'Name', value: 'name', width: '3%' },
				{ hint: '""', sortable: false, text: 'Missing values', width: '2%', value: 'missing' },
				// { hint: 'null', text: 'Null values', width: '2%', value: 'null' },
        // { hint: '0', text: 'Zeros', width: '2%', value: 'zeros' },
        // TO-DO: Zeros?
				{ text: '', sortable: false, width: '50%', value: '' }
			]
    }
  },

	computed: {

    ...mapGetters([
      'currentSelection',
      'hasSecondaryDatasets',
      'workspaceCells',
      'currentListView',
      'selectionType',
      'currentDataset',
      'typesAvailable',
      'currentTab'
    ]),

    ...mapState(['nextCommand']),

    codeError: {
      get () {
        return this.$store.state.codeError;
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'codeError', payload: value})
      }
    },

    commandsDisabled: {
      get () {
        return this.$store.state.commandsDisabled
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'commandsDisabled', payload: value})
      }
    },

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
          var column = this.currentDataset.columns[i]
          return ['decimal','float','double','float64'].includes(column.profiler_dtype.dtype) ? 'quantitative'
            : (['int','integer','int64'].includes(column.profiler_dtype.dtype) && column.stats.count_uniques>25) ? 'quantitative'
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
                title: this.currentDataset.columns[selected[0]].name,
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
                title: this.currentDataset.columns[selected[0]].name,
                type: 'ordinal'
              }
            }

            let _y =
            (plotable[1]==='quantitative') ? {
              y: {
                field: 'y',
                title: this.currentDataset.columns[selected[1]].name,
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
                title: this.currentDataset.columns[selected[1]].name,
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
        return Array.from(this.workspaceCells)
      },
      set(value) {
        // -
      }
    },

    toolbarElements () {
      return [
        {
          type: 'menu',
          group: 'DATA_SOURCE',
          icons: [{ icon: 'mdi-cloud-upload-outline' }],
          tooltip: 'Add data source',
          disabled: ()=>(this.$store.state.kernel!='done')
        },
        {
          type: 'menu',
          group: 'SAVE',
          icons: [{ icon: 'mdi-content-save-outline' }],
          tooltip: 'Save',
          disabled: ()=>!(this.currentDataset && this.currentDataset.summary)
        },
        {
          divider: true,
          hidden: ()=>(this.hideOperations)
        },
        {
          type: 'button',
          onClick: () => {
            this.commandHandle({command: 'join'})
          },
          icons: [
            { icon: 'mdi-set-center' },
          ],
          tooltip: 'Join dataframes',
          disabled: ()=>!(this.currentDataset && this.currentDataset.summary && this.hasSecondaryDatasets)
        },
        {
          type: 'button',
          onClick: () => {
            this.commandHandle({command: 'concat'})
          },
          icons: [
            { icon: 'mdi-table-row-plus-after' },
          ],
          tooltip: 'Concat dataframes',
          disabled: ()=>!(this.currentDataset && this.currentDataset.summary && this.hasSecondaryDatasets)
        },
        {
          type: 'button',
          onClick: () => {
            this.commandHandle({command: 'aggregations'})
          },
          icons: [
            { icon: 'mdi-set-merge' },
          ],
          tooltip: 'Get aggregations',
          disabled: ()=>!(!['values','ranges'].includes(this.selectionType) && this.currentDataset && this.currentDataset.summary)
        },
        { divider: true },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'sort rows'}),
          tooltip: 'Sort rows',
          disabled: ()=>['values','ranges'].includes(this.selectionType) || this.selectedColumns.length<1,
          icons: [
            { icon: 'mdi-sort-alphabetical-ascending' }
            // {
            //   icon: 'arrow_right_alt',
            //   style: {
            //     transform: 'rotate(90deg)',
            //     marginLeft: '-0.20833333em',
            //     marginRight: '-0.291666em'
            //   }
            // },
            // {
            //   icon: 'arrow_right_alt',
            //   style: {
            //     transform: 'rotate(-90deg)',
            //     marginLeft: '-0.291666em',
            //     marginRight: '-0.20833333em'
            //   }
            // }
          ],
          hidden: ()=>(this.hideOperations)
        },
        {
          type: 'button',// {toString: ()=>(this.selectionType=='columns' ? 'button' : 'menu')},
          // group: 'FILTER',
          onClick: ()=>{
            var command = { command: 'filter rows' }
            if (['values','ranges'].includes(this.selectionType) && this.currentSelection && this.currentSelection.ranged) {
              command = { command: 'REMOVE_KEEP_SET' }
              command.columns = [ this.currentDataset.columns[this.currentSelection.ranged.index].name ]
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
          disabled: ()=>!(['values','ranges','text'].includes(this.selectionType) || this.selectedColumns.length==1),
          icons: [{icon: 'mdi-filter-variant'}]
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'drop empty rows'}),
          tooltip: 'Drop empty rows',
          icons: [
            { icon: 'mdi-delete-outline' },
            { icon: 'menu', style: {
              marginLeft: '-0.33333333em',
              transform: 'scaleX(0.75)'
            } }
          ],
          disabled: ()=>!(this.currentDataset && this.currentDataset.summary && this.hasSecondaryDatasets)
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'drop duplicates'}),
          tooltip: 'Drop duplicates',
          icons: [
            // { icon: 'mdi-layers-remove' },
            { icon: 'mdi-close-box-multiple-outline',
              style: {
                transform: 'scaleY(-1)'
              }
            },
          ],
          disabled: ()=>!(this.currentDataset && this.currentDataset.summary && this.hasSecondaryDatasets)
        },
        { divider: true },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'set'}),
          tooltip: { toString: ()=>this.selectedColumns.length ? 'Set column' : 'New column'},
          icons: [{icon: 'mdi-plus-box-outline'}],
          disabled: ()=>!(this.selectionType=='columns' && this.selectedColumns.length<=1 && this.currentDataset && this.currentDataset.summary)
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'rename'}),
          tooltip: { toString: ()=> 'Rename column'+ (this.selectedColumns.length!=1 ? 's' : '')},
          icons: [{icon: 'mdi-pencil-outline'}],
          disabled: ()=> !(this.selectionType=='columns' && this.selectedColumns.length>0)
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'duplicate'}),
          tooltip: { toString: ()=> 'Duplicate column'+ (this.selectedColumns.length!=1 ? 's' : '')},
          icons: [{icon: 'mdi-content-duplicate'}],
          disabled: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'keep', type: 'DROP_KEEP'}),
          tooltip: { toString: ()=> 'Keep column'+ (this.selectedColumns.length!=1 ? 's' : '')},
          icons: [{icon: 'all_out'}],
          disabled: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'drop', type: 'DROP_KEEP'}),
          tooltip: { toString: ()=> 'Drop column'+ (this.selectedColumns.length!=1 ? 's' : '')},
          icons: [{ icon: 'mdi-delete-outline' }],
          disabled: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)
        },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'nest'}),
          tooltip: 'Nest columns',
          icons: [{icon: 'mdi-table-merge-cells'}],
          disabled: ()=>['values','ranges'].includes(this.selectionType) || this.selectedColumns.length<=1 || !this.currentDataset.summary
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
          icons: [{icon: 'mdi-arrow-split-vertical'}],
          disabled: ()=>!((this.selectionType=='columns' && this.selectedColumns.length>0) || this.selectionType==='text')
        },
        { divider: true },
        {
          type: 'button',
          onClick: ()=>this.commandHandle({command: 'fill_na'}),
          tooltip: { toString: ()=> 'Fill column'+ (this.selectedColumns.length!=1 ? 's' : '')},
          icons: [{icon: 'brush', class: 'material-icons-outlined'}],
          disabled: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)
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
          disabled: ()=>!(['text'].includes(this.selectionType) || this.selectedColumns.length>0)
        },
        {
          type: 'menu',
          group: 'STRING',
          icons: [{ icon: 'text_format' }],
          tooltip: 'String operations',
          disabled: ()=>!(this.checkDataTypes(['string']) && this.selectionType=='columns' && this.currentDataset && this.currentDataset.summary && this.selectedColumns.length>=0)
        },
        // TO-DO: Datetime operations
        {
          type: 'menu',
          group: 'TIME',
          icons: [{ icon: 'calendar_today' }],
          tooltip: 'Datetime functions',
          disabled: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)
        },
        // TO-DO: Check cast
        // {
        //   type: 'menu',
        //   group: 'CAST',
        //   icons: [{ icon: 'category' }],
        //   tooltip: 'Cast',
        //   disabled: ()=>!(this.selectionType=='columns' && this.selectedColumns.length>0)
        // },
        {
          type: 'menu',
          group: 'ML',
          icons: [{icon: 'timeline', class: 'material-icons-outlined'}],
          tooltip: 'Machine Learning',
          disabled: ()=>!(this.selectionType=='columns' && this.currentDataset && this.currentDataset.summary) , // Sampling
          hidden: ()=>(this.hideOperations)
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

    selectedDataTypes () {
      try {
        var columns = []
        if (this.selectionType==='columns') {
          if (!this.currentSelection.columns || !this.currentSelection.columns.length) {
            return []
          }
          columns = this.currentSelection.columns.map(e=>e.index)
        }
        else if (this.selectionType==='text') {
          columns = [this.currentSelection.text.index]
        }
        else {
          columns = [this.currentSelection.ranged.index]
        }
        if (!columns.length) {
          return []
        }
        return [...new Set(columns.map(i=>this.currentDataset.columns[i].profiler_dtype.dtype))]
      } catch (err) {
        console.error(err)
        return []
      }
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
            // ignoreCell: true,
            noCall: true,
            deleteOtherCells: true
          })
        }
      })
    },
    socketAvailable (value) {
      if (!value && this.commandsDisabled) {
        this.commandsDisabled = false
      }
    },
    computedIsOperating (value) {
      this.$emit('update:isOperating', value)
    },
    currentDataset () {
      this.lastSort = []
    },
    codeError (value) {
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

    getProperty,

    async runCodeNow () {
      return await this.$refs.cells.runCodeNow()
    },

    downloadDataset () {
      this.$refs.cells & this.$refs.cells.downloadDataset(event)
    },

    checkDataTypes (allowedTypes) {
      if (!allowedTypes || !allowedTypes.length) {
        return true
      }

      return this.selectedDataTypes.every(t=>allowedTypes.indexOf(t)>=0)
    },

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

    copyCodeToClipboard (engineText) {
      var code = 'from optimus import Optimus\n'
      +'from optimus.expressions import Parser\n'
      +'p = Parser()\n'
      +`op = Optimus(${engineText})\n`
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

      if (event.command==='download') {
        this.downloadDataset()
        return
      }

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

      if (!this.currentDataset.sample || !this.currentDataset.sample.value) {
        return false
      }

      let xint = (xsize===+xsize)
      let yint = (ysize===+ysize)

      let xbinsize = (!xint) ? 25 : xsize
      let ybinsize = (!yint) ? 25 : ysize

      let minX = this.currentDataset.columns[xindex].stats.min
      let minY = this.currentDataset.columns[yindex].stats.min

      let maxX = this.currentDataset.columns[xindex].stats.max
      let maxY = this.currentDataset.columns[yindex].stats.max

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

      for (let i = 0; i < this.currentDataset.sample.value.length; i++) {

        let _xv = this.currentDataset.sample.value[i][xindex]
        let _yv = this.currentDataset.sample.value[i][yindex]

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
        selected = namesToIndices(selected, this.currentDataset.columns)
      }

      this.selectedColumns = selected.map(e=>({index: e, name: this.currentDataset.columns[e].name}))
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
