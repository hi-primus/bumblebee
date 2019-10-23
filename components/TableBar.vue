<template>
  <div class="dashboard-container">
    <template name="command-dialogs">
      <v-dialog v-if="currentCommand.command == 'rename'" :value="currentCommand.command == 'rename'" max-width="410" @click:outside="cancelCommand">
        <v-card>
          <v-card-title class="title mb-4">Rename {{ currentCommand.name }}</v-card-title>
          <v-card-text class="pb-0 command-card-text">
            <template v-for="column in currentCommand.renames">
                <v-text-field
                  :key="column.name"
                  v-model="column.newName"
                  :label="column.name"
                  dense
                  required
                  outlined
                ></v-text-field>
            </template>
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1"/>
            <v-btn
              color="primary"
              text
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              text
              :disabled="(!currentCommand.renames.every( (e)=>{ return (e.newName.trim().length>0) } ))"
              @click="confirmCommand()"
            >
              Accept
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-if="currentCommand.command == 'unnest'" :value="currentCommand.command == 'unnest'" max-width="410" @click:outside="cancelCommand">
        <v-card>
          <v-card-title class="title">Unnest column</v-card-title>
          <v-card-text class="pb-0 command-card-text">
            Unnest <span class="text-uppercase">"{{ currentCommand.columns[0] }}"</span>
            <v-select
              v-model="currentCommand.shape"
              class="mt-4"
              label="Shape"
              dense
              required
              outlined
              :items="[
                {text: 'None', value: ''},
                {text: 'String', value: 'string'},
                {text: 'Array', value: 'array'},
                {text: 'Vector', value: 'vector'}
              ]"
            ></v-select>
            <v-text-field
              v-model="currentCommand.separator"
              label="Separator"
              dense
              required
              outlined
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1"/>
            <v-btn
              color="primary"
              text
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              text
              @click="confirmCommand()"
            >
              Accept
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-if="currentCommand.command == 'replace'" :value="currentCommand.command == 'replace'" max-width="410" @click:outside="cancelCommand">
        <v-card>
          <v-card-title class="title" v-if="currentCommand.columns.length==1">
            Replace in column
          </v-card-title>
          <v-card-title class="title" v-else>
            Replace in columns
          </v-card-title>
          <v-card-text class="pb-0 command-card-text">
            Replace from "{{currentCommand.search}}" to "{{currentCommand.replace}}"
            <template v-if="currentCommand.columns.length==1">
              in <span class="text-uppercase">"{{currentCommand.columns[0]}}"</span>
            </template>
            <v-text-field
              v-model="currentCommand.search"
              class="mt-4"
              label="Find"
              dense
              required
              outlined
            ></v-text-field>
            <v-text-field
              v-model="currentCommand.replace"
              label="Replace"
              dense
              required
              outlined
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1"/>
            <v-btn
              color="primary"
              text
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              text
              :disabled="(currentCommand.search.length<=0)"
              @click="confirmCommand()"
            >
              Accept
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-if="currentCommand.command == 'fill'" :value="currentCommand.command == 'fill'" max-width="410" @click:outside="cancelCommand">
        <v-card>
          <v-card-title class="title" v-if="currentCommand.columns.length==1">
            Fill in column
          </v-card-title>
          <v-card-title class="title" v-else>
            Fill in columns
          </v-card-title>
          <v-card-text class="pb-0 command-card-text">
            Fill "{{currentCommand.search}}"
            <template v-if="currentCommand.columns.length==1">
              in <span class="text-uppercase">"{{currentCommand.columns[0]}}"</span>
            </template>
            <v-text-field
              v-model="currentCommand.fill"
              class="mt-2"
              label="Fill"
              dense
              required
              outlined
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1"/>
            <v-btn
              color="primary"
              text
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              text
              @click="confirmCommand()"
            >
              Accept
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </template>
    <div class="toolbar" :class="{'disabled': commandsDisabled}">
      <v-btn text class="icon-btn" @click="$emit('update:view',0)">
        <v-icon :color="(view==0) ? 'black' : '#888'">view_headline</v-icon>
      </v-btn>
      <v-btn text class="icon-btn" @click="$emit('update:view',1)">
        <v-icon :color="(view==1) ? 'black' : '#888'">view_module</v-icon>
      </v-btn>
      <div class="divider"/>
      <v-menu :close-on-content-click="false" offset-y>
        <template v-slot:activator="{ on: onSortBy }">
          <v-btn
            :color="sortBy[0] ? 'black' : '#888'"
            class="icon-btn"
            text
            v-on="onSortBy"
          >
            <!-- class="v-btn-icon-text" -->
            <v-icon>sort</v-icon>
            <span style="min-width: 2em;">
              {{ sortByLabel }}
            </span>
            <v-icon v-show="sortBy[0]" color="black" small>
              <template v-if="sortDesc[0]">arrow_downward</template>
              <template v-else>arrow_upward</template>
            </v-icon>
          </v-btn>
        </template>
        <v-list flat dense>
          <v-list-item-group :value="sortBy[0]" color="black">
            <v-list-item
              v-for="(item, i) in sortableColumnsTableHeaders"
              :key="i"
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
      <transition v-if="$route.query.obeta=='42'" name="fade">
        <div class="divider" v-if="detailedColumns.length>=1" />
      </transition>
      <transition v-if="$route.query.obeta=='42'" name="fade">
        <span class="columns-operations" v-if="detailedColumns.length>=1" >
          <v-btn color="#888" text class="icon-btn" @click="commandHandle({command: 'rename'})">
            <v-icon>edit</v-icon>
          </v-btn>
          <v-btn color="#888" text class="icon-btn" @click="commandHandle({command: 'keep'})">
            <v-icon>all_out</v-icon>
          </v-btn>
          <v-btn color="#888" text class="icon-btn" @click="commandHandle({command: 'drop'})">
            <v-icon>delete</v-icon>
          </v-btn>
          <transition name="fade">
            <v-btn v-if="detailedColumns.length>=2" color="#888" text class="icon-btn" @click="commandHandle({command: 'nest'})">
              <v-icon>link</v-icon>
            </v-btn>
          </transition>
          <v-btn color="#888" text class="icon-btn" @click="commandHandle({command: 'unnest'})">
            <v-icon>link_off</v-icon>
          </v-btn>
          <v-btn color="#888" text class="icon-btn" @click="commandHandle({command: 'replace'})">
            <v-icon>find_replace</v-icon>
          </v-btn>
          <v-btn color="#888" text class="icon-btn" @click="commandHandle({command: 'fill'})">
            <v-icon>brush</v-icon>
          </v-btn>
        </span>
      </transition>
      <v-spacer></v-spacer>
      <v-btn v-if="$route.query.obeta=='42'" :color="(optionsActive) ? 'black' : '#888'" text class="icon-btn" @click="optionsActive = !optionsActive">
        <v-icon>code</v-icon>
      </v-btn>
    </div>

    <div class="sidebar-container" :class="{'bigger': optionsActive}" v-if="detailsActive || (optionsActive && $route.query.obeta=='42')">

      <template v-if="optionsActive && $route.query.obeta=='42'">
        <div class="sidebar-header">
          Operations
          <v-icon class="right-button" color="black" @click="optionsActive = false">close</v-icon>
        </div>
				<v-progress-circular
          indeterminate
          v-if="commandsDisabled"
          class="progress-middle"
          color="#888"
          size="64"
        />
        <!-- <div class="toolbar pl-2 pr-12">
          <v-btn text class="icon-btn" @click="addCell()">
            <v-icon color="black">add</v-icon>Add a cell
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn text class="icon-btn" color="#888" v-if="cellsAreValid" @click="runCode()">
            <v-icon>play_arrow</v-icon>Run
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn text class="icon-btn" v-if="cells.length" color="error" @click="cells = [{content: '', id: 0, active: false}]">
            <v-icon>close</v-icon>Clear all
          </v-btn>
        </div> -->
        <draggable
          tag="div"
          class="sidebar-content options-fields"
          :class="{'no-pe disabled': commandsDisabled,'dragging': drag}"
          v-model="cells"
          v-bind="dragOptions"
          handle=".handle"
          ref="cells"
          @start="drag = true"
          @end="drag = false"
        >
          <transition-group type="transition" :name="!drag ? 'flip-list' : null">
            <div class="cell-container" v-for="(cell, index) in cells" :key="cell.id" :class="{'cell-error': cell.error,'done': cell.done,'active': cell.active}" @click="setActive(index)">

              <div class="cell">
                <div class="handle left-handle"></div>
                <!-- <div class="handle cell-title cell-type">{{index+1}}. {{cell.type}}</div> -->
                <CodeEditor
                  :active="cell.active"
                  @blur="runCodeLater()"
                  @update:active="setActive(index)"
                  v-model="cell.content"
                />
                <div class="cell-type cell-type-label" v-if="cell.type && cell.type!='code'">{{cell.type}}</div>
              </div>
            </div>
            <div key="controls" ref="cell-controls" class="cell-controls toolbar vertical">
              <v-btn v-if="activeCell>=0" text class="icon-btn" color="#888" @click.stop="removeCell(activeCell)">
                <v-icon>delete</v-icon>
              </v-btn>
              <v-btn text class="icon-btn" color="primary" @click="addCell(activeCell+1)">
                <v-icon>add</v-icon>
              </v-btn>
            </div>
          </transition-group>
        </draggable>
      </template>
      <template v-else-if="detailsActive!==false">
        <div class="sidebar-header">
          Details
          <v-icon class="right-button" color="black" @click="detailsActive = false">close</v-icon>
        </div>
        <div class="sidebar-content">

          <div v-if="detailedColumns.length>1" class="sidebar-section pr-10 columns-selected">
            <CommandMenu v-if="$route.query.obeta=='42'" :columnsNumber="detailedColumns.length" button.class="right-button-center" :disabled="commandsDisabled" @command="commandHandle($event)"></CommandMenu>
            <div class="column-selected" v-for="column in detailedColumns" :key="column.index">
              <span class="data-type" :class="`type-${dataset.columns[column.index].column_dtype}`">{{ dataType(dataset.columns[column.index].column_dtype) }}</span>
              <span class="data-type-name">{{ dataset.columns[column.index].name }}</span>
            </div>
          </div>
          <div v-if="detailsActive['heat-map']" class="heat-map plot">
            <div class="plot-title">
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
                  scale: {range: ['#e6fffd', '#8cd7d0', '#4db6ac']},
                  legend: { direction: 'vertical', type: 'gradient', gradientLength: 120, titleAlign: 'left', title: ' n' },
                  // condition: { test: 'datum.z<=0', value: 'white'}
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
          <template v-for="(column, i) in detailedColumns">
            <ColumnDetails
              :key="column.index"
              :startExpanded="i==0"
              :rowsCount="+dataset.summary.rows_count"
              :column="dataset.columns[column.index]"
              :commandsDisabled="commandsDisabled"
              @command="commandHandle($event)"
            ></ColumnDetails>
          </template>
        </div>
      </template>
    </div>

    <div class="table-container">
      <div v-if="view==0" class="table-view-container">
        <div class="table-controls d-flex">
          <v-btn text icon small @click="toggleColumnsSelection">
            <v-icon>
              <template v-if="selectionStatus==-1">indeterminate_check_box</template>
              <template v-else-if="selectionStatus==1">check_box</template>
              <template v-else>check_box_outline_blank</template>
            </v-icon>
          </v-btn>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn
                :class="{'active': selectionStatus!=0}"
                text
                icon
                small
                class="visibility-btn hideable tr-o"
                v-on="on"
                @click="toggleColumnsVisibility(!visibilityStatus)">
                <v-icon>
                  <template v-if="!visibilityStatus">visibility</template>
                  <template v-else>visibility_off</template>
                </v-icon>
              </v-btn>
            </template>
            <span v-if="!visibilityStatus">Show selected columns on table</span>
            <span v-else>Hide selected columns on table</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn
                :class="{'active': view==0 && selectionStatus==-1}"
                text
                icon
                small
                class="hideable tr-o"
                v-on="on"
                @click="invertSelection">
                <v-icon>
                  $vuetify.icons.check-box-invert
                </v-icon>
              </v-btn>
            </template>
            <span>Invert selection</span>
          </v-tooltip>
        </div>
        <v-data-table
          v-show="view==0"
          :headers="columnsTableHeaders"
          :items="filteredColumns"
          :sort-by.sync="sortBy"
          :sort-desc.sync="sortDesc"
          :mobile-breakpoint="0"
          :height="600"
          class="columns-table"
          disable-pagination
          hide-default-footer
          fixed-header
          @click:row="rowClicked"
        >
          <template v-slot:item.controls="{ item }">
            <div class="cell-controls">
              <v-icon class="control-button control-check" @click.stop="toggleColumnSelection(item.name)">
                <template v-if="selectedColumns[item.name]">check_box</template>
                <template v-else>check_box_outline_blank</template>
              </v-icon>
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-icon
                    :class="{'control-hide-hidden': hiddenColumns[item.name]}"
                    class="control-button control-hide"
                    @click.stop="toggleColumnVisibility(item.name)"
                    v-on="on"
                  >
                    <template v-if="!!hiddenColumns[item.name]">
                      visibility_off
                    </template>
                    <template v-else>
                      visibility
                    </template>
                  </v-icon>
                </template>
                <span v-if="!hiddenColumns[item.name]">Hide column on table</span>
                <span v-else>Show column on table</span>
              </v-tooltip>
            </div>
          </template>
          <template v-slot:item.column_dtype="{ item }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <div class="data-type pr-4" v-on="on">
                  {{ dataType(item.column_dtype) }}
                </div>
              </template>
              <span :key="'column-type-hint'" class="capitalize column-type">
                {{ item.column_dtype }}
                <template v-if="item.column_dtype==='string*'">
                  <br>
                  <span v-for="(subtype) in getSubTypes(item)" :key="subtype" class="subtype">
                    {{ subtype }}
                  </span>
                </template>
              </span>
            </v-tooltip>
          </template>
          <template
            v-slot:item.type="{item}"
          >
            <div class="data-type-name">
              {{ item.type }}
            </div>
          </template>
          <template v-slot:item.name="{ item }">
            <div class="pr-4">
              {{ item.name }}
            </div>
          </template>
          <template v-slot:item.stats.missing_count="{ item }">
            <div class="pr-4">
              {{ item.stats.missing_count | formatNumberInt }}
            </div>
          </template>
          <template v-slot:item.stats.count_na="{ item }">
            <div class="pr-4">
              {{ item.stats.count_na | formatNumberInt }}
            </div>
          </template>
          <template v-slot:item.stats.zeros="{ item }">
            <div class="pr-4">
              {{ item.stats.zeros | formatNumberInt }}
            </div>
          </template>
        </v-data-table>
      </div>
      <client-only>
        <div
          v-show="view==1"
          class="hot-table-container"
        >
          <HotTable
            v-if="dataset && dataset.sample && hotColumns.length>0"
            :settings="hotSettings"
            :key="tableKey"
            class="hot-table"
            ref="hot-table"
          >
            <HotColumn v-for="(column, i) in hotColumns" :key="i" :settings="column">
              <GraphicsRenderer hot-renderer/>
            </HotColumn>
          </HotTable>
        </div>
      </client-only>
    </div>
  </div>
</template>

<script>
import GraphicsRenderer from '@/components/GraphicsRenderer'
import CodeEditor from '@/components/CodeEditor'
import CommandMenu from '@/components/CommandMenu'
import ColumnDetails from '@/components/ColumnDetails'
import VegaEmbed from '@/components/VegaEmbed'
import dataTypesMixin from '@/plugins/mixins/data-types'
import axios from 'axios'

import { throttle } from '@/utils/functions.js'

export default {
	components: {
    GraphicsRenderer,
    CommandMenu,
    ColumnDetails,
    VegaEmbed,
    CodeEditor
	},

	mixins: [dataTypesMixin],

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
		view: {
			default: 0,
			type: Number
		},
		currentTab: {
			default: '',
			type: [Number, String]
		},
		searchText: {
			default: '',
			type: String
		},
		typesSelected: {
			default: () => ([]),
			type: Array
		}
	},

	data () {
		return {

      drag: false,

      detailsActive: false,

      optionsActive: false,

      activeCell: -1,

      cells: [],

      codeDone: '',

      lastCodeTry: false,

      commandsDisabled: false,

      currentCommand: false,

      operation: undefined,

      heatMap: [],
      heatMapEncoding: {},

      scatterPlotDisplay: [],

      detailedColumns: [],

			mustHandleSearchText: false,

			// searchText: '',

			resultsColumns: [], // search
			filteredColumns: [], // filter

			sortBy: [],
			sortDesc: [false],

			// affects table view only
			hotColumns: [],
			tableKey: 0,

			// controls
			hiddenColumns: {},
			selectedColumns: {},

			// status
			selectionStatus: false,
			visibilityStatus: 1, // visible

			HotTable: undefined,
			HotColumn: undefined,

			columnsTableHeaders: [
				{ text: '', sortable: false, width: '1%', value: 'controls' },
				{ hint: '#/A', text: 'Type', value: 'column_dtype', width: '1%' },
				{ hint: 'ABC', text: 'Name', value: 'name', width: '3%' },
				{ hint: '""', text: 'Missing values', width: '2%', value: '__missing' },
				{ hint: 'null', text: 'Null values', width: '2%', value: '__na' },
				{ hint: '0', text: 'Zeros', width: '2%', value: '__zeros' },
				{ text: '', sortable: false, width: '50%', value: '' }
			]
		}
  },

	computed: {

    dragOptions () {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost"
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

		colHeaders () {
			return this.dataset.columns.map((e) => {
				return e.name
			})
    },

    cellsAreValid() {
      return this.cells.map(e=>e.content).join('\n').trim().length>0
    },

		hotSettings () {
			return {
				// dropdownMenu: ['filter_by_condition', 'filter_operators', 'filter_by_condition2', 'filter_action_bar'],
				data: [this.graphicsData, ...this.dataset.sample.value],
				fixedRowsTop: 1,
				autoColumnSize: false,
				autoRowSize: false,
				colWidths: 170,
				rowHeaders: false,
				rowHeight: '30px',
				copyPaste: true,
				manualColumnResize: true,
				colHeaders: this.colHeaders,
				renderAllRows: false,
				height: '100vh',
				columnSorting: false,
				filters: true,
				disabledHover: true,
				afterSelectionEndByProp: this.selectionEvent,
				licenseKey: 'non-commercial-and-evaluation'
			}
		},

		graphicsData () {
			return this.dataset.columns.map((column, i) => {
				return {
					toString () {
						return ''
          },
          index: i,
          name: column.name,
          plotable: (
              ['decimal','float','double'].includes(column.column_dtype) ? 'quantitative'
              : (['int','integer'].includes(column.column_dtype) && column.stats.count_uniques>25) ? 'quantitative'
              : (column.stats.count_uniques<=25) ? column.stats.count_uniques
              : false
            ),
          mismatch: (column.dtypes_stats.mismatch) ? +column.dtypes_stats.mismatch : 0,
          null: (column.dtypes_stats.null) ? +column.dtypes_stats.null : 0,
					missing: column.stats.count_na,
					zeros: column.stats.zeros,
					total: this.dataset.summary.rows_count,
					count_uniques: column.stats.count_uniques,
					hist: (column.stats.hist && column.stats.hist[0]) ? column.stats.hist : undefined,
					hist_years: (column.stats.hist && column.stats.hist.years) ? column.stats.hist.years : undefined,
					frequency: (column.frequency) ? column.frequency : undefined
				}
			})
		}

	},

	watch: {

    // view () {
    //   this.detailsActive = false
    // },

		detailsActive: {
			deep: true,
			handler (value) {
				this.$nextTick(() => {
          try {
            this.$refs['hot-table'].hotInstance.render()
          }
          catch {}
				})
			}
		},

		searchText: {
			immediate: true,

			handler () {
				this.mustHandleSearchText = true

				this.searchTextWatch()
			}

		},

		sortBy: {
			handler: 'getHotColumns',
			deep: true
		},
		sortDesc: {
			handler: 'getHotColumns',
			deep: true
		},

		hiddenColumns: {
			handler () {
				this.getHotColumns()
			},
			deep: true
		},

		typesSelected: {
			handler () {
				this.getFilteredColumns()
			},
			deep: true
		}
	},

	methods: {

    commandHandle ( event ) {

      var payload = undefined

      if (!event.columns || !event.columns.length)
        event.columns = this.detailedColumns.map(e=>this.dataset.columns[e.index].name)

      switch (event.command) {
        case 'rename':
          this.currentCommand = {
            command: 'rename',
            columns: event.columns,
            name: (event.columns.length==1) ? `"${event.columns[0].toUpperCase()}"` : 'columns',
            renames: event.columns.map((e)=>{
              return{
                name: e,
                newName: ''
              }
            })
          }
          break;
        case 'unnest':
          this.currentCommand = {command: 'unnest', columns: event.columns, shape: 'string', separator: ', '}
          payload = {shape: 'string', separator: ', '}
          break;
        case 'replace':
          this.currentCommand = {command: 'replace', columns: event.columns, search: '', replace: ''}
          break;
        case 'fill':
          this.currentCommand = {command: 'fill', columns: event.columns, fill: ''}
          break;
        default:
        case 'drop':
        case 'keep':
        case 'nest':
          payload = undefined
          this.addCell(-1, event.command, event.columns, payload )
          break;
      }
    },

    confirmCommand() {
      this.addCell(-1, this.currentCommand.command, this.currentCommand.columns, this.currentCommand )
      this.currentCommand = false
    },

    cancelCommand() {
      this.currentCommand = false
    },

    setActive (index) {
      for (let i = 0; i < this.cells.length; i++) {
        this.cells[i].active = false
      }
      if (this.cells[index]) {
        this.cells[index].active = true
        this.activeCell = index
        if (this.$refs.cells && this.$refs['cell-controls']) {
          this.$refs['cell-controls'].style.top = (this.$refs.cells.$el.getElementsByClassName('cell-container')[index].offsetTop) + 'px'
        }
      }
      else {
        this.activeCell = -1
        if (this.$refs['cell-controls']) {
          this.$refs['cell-controls'].style.top = '18px'
        }
      }
    },

    removeCell (index) {
      if (index<0)
        return

      this.cells.splice(index,1)
      if (this.cells.length==index) {
        index--
      }
      this.setActive(index)
    },

    markCells(mark = true) {
      for (let i = 0; i < this.cells.length; i++) {
        if (this.cells[i].content) {
          this.cells[i].done = mark
        }
        this.cells[i].error = false
      }

      if (mark)
        this.codeDone = this.cells.map(e=>(e.content!=='') ? e.content+'\n' : '').join('').trim()
      else
        this.codeDone = ''

    },
    markCellsError() {
      for (let i = 0; i < this.cells.length; i++) {
        if (!this.cells[i].done && this.cells[i].content)
          this.cells[i].error = true // TODO: trying
      }
    },

    addCell (at = -1,type = 'code', columns = [], payload) {

      this.optionsActive = true

      var content = ''

      if (!columns.length)
        columns = this.detailedColumns.map(e=>this.dataset.columns[e.index].name)

      switch (type) {
        case 'drop':
          content = `df = df.cols.drop(["${columns.join('", "')}"])`
          break;
        case 'rename':
          if (payload.renames.length==1) {
            content = `df = df.cols.rename("${payload.renames[0].name}", "${payload.renames[0].newName}")`
          }
          else {
            content = `df = df.cols.rename([${payload.renames.map(e=>`("${e.name}", "${e.newName}")`)}])`
          }
          break;
        case 'keep':
          content = `df = df.cols.keep(["${columns.join('", "')}"])`
          break;
        case 'nest':
          content = `df = df.cols.nest(["${columns.join('", "')}"])`
          break;
        case 'unnest':
          var _argument = (columns.length==1) ? `"${columns[0]}"` : `["${columns.join('", "')}"]`
          content = `df = df.cols.unnest(${_argument}${ (payload.shape) ? `, shape="${payload.shape}"` : ''}${ (payload.separator) ? `, separator="${payload.separator}"` : ''})`
          break;
        case 'replace':
          var _argument = (columns.length==1) ? `"${columns[0]}"` : `["${columns.join('", "')}"]`
          content = `df = df.cols.replace(${_argument}, search="${payload.search}", replace_by="${payload.replace}")`
          break;
        case 'fill':
          var _argument = (columns.length==1) ? `"${columns[0]}"` : `["${columns.join('", "')}"]`
          content = `df = df.cols.fill_na(${_argument}, "${payload.fill}")`
          // todo: ...fill_na(input_cols, value=None, output_cols=None):
          break;
        default:

          break;
      }

      if (at==-1)
        at = this.cells.length

      this.cells.splice(at,0,{ type, content, id: Number(new Date()), active: false })

      this.$nextTick(()=>{
        if (this.activeCell<0)
          this.setActive(0)
        if (content.length)
          this.runCode()
      })

    },

    runCodeLater() {
      setTimeout(() => {
        this.runCode()
      }, 400);
    },

    async runCode() {

      var code = this.cells.map(e=>(e.content!=='') ? e.content+'\n' : '').join('').trim()
      var codeDone = this.codeDone.trim()
      var rerun

      if (code == codeDone){
        console.log('no run')
        return;
      }
      else if (code.indexOf(codeDone)!=0 || codeDone=='') {
        console.log('re-run')
        rerun = true
      }
      else {
        console.log('no re-run')
        code = this.cells.filter(e=>!e.done).map(e=>e.content).join('\n')
      }

      if (code===this.lastCodeTry) {
        console.log('no retry')
        return;
      }

      if (rerun)
        this.markCells(false)

      this.commandsDisabled = true;

      try {
        var response = await axios.post(process.env.API_URL+(rerun ? '/run-load' : '/run'),
        {
          code,
          name: this.dataset.name
        })
        console.log('response',response)
        this.commandsDisabled = false;
        if (response.data.content === '\'run ok\'') {
          this.markCells()
          this.lastCodeTry = false
        }
        else {
          this.markCellsError()
          this.lastCodeTry = code
        }
      } catch (error) {
        console.error(error)
      }


    },

    displaySelection: throttle ( async function (item) {
			if (item) {
				this.scatterPlotDisplay = item.values
      }
      else {
        // this.scatterPlotDisplay = ''
      }
    },100),

    calculateHeatMap (xindex,yindex,xsize,ysize) {

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

		getSubTypes (item) {
			if (item.dtypes_stats) {
				return Object.keys(item.dtypes_stats)
					.filter((k) => {
						return (!!item.dtypes_stats[k] && k !== 'string' && k !== 'missing' && k !== 'null')
					})
					.map((k) => {
						return item.dtypes_stats[k] + ' ' + k
					})
			}
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

		searchTextWatch: throttle(async function () {
			try {
				this.resultsColumns = this.searchText
					? await this.$search(this.searchText, this.dataset.columns, {
						shouldSort: true,
						threshold: 0.1,
						keys: ['name']
					})
					: this.dataset.columns

				this.getFilteredColumns()
			} catch (err) {
				console.error(err)
			}
			this.mustHandleSearchText = false
		}, 1000),

		rowClicked (e) {
      // this.$router.push(`${this.currentTab}/${e.name}`)
      this.toggleColumnSelection(e.name)
		},

		selectionEvent (row, prop, row2, prop2) {
			if (row <= 0) {

				const tableInstance = this.$refs['hot-table'].hotInstance;

        var selected = tableInstance.getSelected()

        if (!selected.length) {
					this.detailsActive = false
          return;
        }

        let plotableIndices = [];
        let selectedIndices = [];

        selected.forEach(selection => {

          for (let i = selection[1]; i <= selection[3]; i++) {

            const columnData = tableInstance.getDataAtCell(0,i)

            let found = selectedIndices.findIndex( (e) => { return (e === columnData.index.toString()) } )

            if (found===-1) {
              selectedIndices.push({index: columnData.index.toString(), type: columnData.plotable})
              if (columnData.plotable) { // TODO: remove 'plotable'
                plotableIndices.push({index: columnData.index.toString(), type: columnData.plotable})
              }
            }

          }

        });

        this.handleSelection(selectedIndices,plotableIndices)
			}
    },

    handleSelection (selected, plotable = []) {
      if (selected.length) {
        this.detailsActive = {}
        if (plotable.length==2 && selected.length==2) {
          // this.detailsActive['scatter-plot'] = true
          this.detailsActive['heat-map'] = true
          this.heatMap = this.calculateHeatMap(plotable[0].index,plotable[1].index,plotable[0].type,plotable[1].type)


          let _x =
          (plotable[0].type==='quantitative') ? {
            x: {
              field: 'x',
              title: this.dataset.columns[plotable[0].index].name,
              type: plotable[0].type,
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
              title: this.dataset.columns[plotable[0].index].name,
              type: 'ordinal'
            }
          }

          let _y =
          (plotable[1].type==='quantitative') ? {
            y: {
              field: 'y',
              title: this.dataset.columns[plotable[1].index].name,
              type: plotable[1].type,
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
              title: this.dataset.columns[plotable[1].index].name,
              type: 'ordinal'
            }
          }

          this.heatMapEncoding ={
            ..._x,
            ..._y
          }
        }
      }
      else {
        this.detailsActive = false
      }

      this.detailedColumns = selected;
    },

		getHotColumns () {
			this.hotColumns = this.filteredColumns.filter((column) => {
				return !this.hiddenColumns[column.name]
			})

			if (this.sortBy[0]) {
				if (typeof this.hotColumns[0][this.sortBy[0]] === 'string') {
					this.hotColumns.sort((a, b) => {
						let _a = a[this.sortBy[0]].toLowerCase()
						let _b = b[this.sortBy[0]].toLowerCase()
						return (_a < _b) ? -1 : (_a > _b) ? 1 : 0
					})
				} else {
					this.hotColumns.sort((a, b) => {
						let _a = a[this.sortBy[0]]
						let _b = b[this.sortBy[0]]
						return (_a < _b) ? -1 : (_a > _b) ? 1 : 0
					})
				}
				if (this.sortDesc[0]) { this.hotColumns.reverse() }
			}

			this.hotColumns = this.hotColumns.map((e, i) => {
				return {
					data: this.dataset.columns.findIndex(de => de.name === e.name),
					editor: false,
					readOnly: true,
					title: `
            <span class="data-type-in-table abs data-type type-${e.column_dtype}">
              ${this.dataType(e.column_dtype)}
            </span>
            <span class="data-title">
              ${e.name}
            </span>`
				}
			})

			this.tableKey = this.tableKey + 1
		},

		getFilteredColumns () {
			if (this.typesSelected.length > 0) {
				this.filteredColumns = this.resultsColumns.filter((column) => {
					return this.typesSelected.includes(column.column_dtype)
				})
			} else {
				this.filteredColumns = this.resultsColumns
			}

			this.filteredColumns = this.filteredColumns.map((column) => {
				return {
					__missing: +column.dtypes_stats.missing || 0,
					__na: +column.stats.count_na || 0,
					__zeros: +column.stats.zeros || 0,
					...column
				}
      })

      let _selected = []
      let _plotable = []

      for (let i = 0; i < this.dataset.columns.length; i++) {
        const column = this.dataset.columns[i];
        if (this.selectedColumns[column.name]){
          if (this.graphicsData[i].plotable)
            _plotable.push({index: i, type: this.graphicsData[i].plotable})
          _selected.push({index: i, type: this.graphicsData[i].plotable})
        }
      }

      this.handleSelection( _selected, _plotable )

			this.getHotColumns()
			this.setSelectionStatus()
			this.setVisibilityStatus()
		},

		toggleColumnSelection (value) {
			if (this.selectedColumns[value]) {
				this.selectedColumns[value] = false
				delete this.selectedColumns[value]
			} else { this.selectedColumns[value] = true }

			this.getFilteredColumns()
		},

		toggleColumnsSelection () {
			let select = this.selectionStatus !== 1

			if (!select) {
				this.selectedColumns = {}
			} else {
				for (let i = 0; i < this.filteredColumns.length; i++) {
					const column = this.filteredColumns[i]
					this.selectedColumns[column.name] = select
				}
			}

			this.selectionStatus = +select

			this.getFilteredColumns()
		},

		invertSelection () {
			for (let i = 0; i < this.filteredColumns.length; i++) {
				const column = this.filteredColumns[i]
				if (this.selectedColumns[column.name]) { delete this.selectedColumns[column.name] } else { this.selectedColumns[column.name] = true }
			}

			this.getFilteredColumns()
		},

		toggleColumnsVisibility (value) {
			for (let i = 0; i < this.filteredColumns.length; i++) {
				const column = this.filteredColumns[i]
				if (this.selectedColumns[column.name]) { this.hiddenColumns[column.name] = !value }
			}

			this.setVisibilityStatus()
			this.getHotColumns()
			this.getFilteredColumns()
		},

		toggleColumnVisibility (colName) {
			this.hiddenColumns[colName] = !this.hiddenColumns[colName]
			this.setVisibilityStatus()
			this.getHotColumns()
		},

		setSelectionStatus () {
			let status

			for (let i = 0; i < this.filteredColumns.length; i++) {
				const column = this.filteredColumns[i]
				if (status !== undefined && status === +!this.selectedColumns[column.name]) { // different from previous value
					this.selectionStatus = -1 // indeterminate
					return -1
				}
				status = +!!this.selectedColumns[column.name] // all or none selected
			}

			this.selectionStatus = +!!status
			return +!!status
		},

		setVisibilityStatus () {
			for (let i = 0; i < this.filteredColumns.length; i++) {
				const column = this.filteredColumns[i]
				if (this.selectedColumns[column.name] && this.hiddenColumns[column.name]) {
					this.visibilityStatus = 0 // at least one is hidden
					return 0
				}
			}
			this.visibilityStatus = 1
			return 1
		}
	}
}
</script>

<style lang="scss">

.v-icon.control-button {
  user-select: none;
}

.hot-table-container {
  margin-top: -1px;
  padding-left: 9px;

  .wtHolder, .ht_master {
    height: inherit !important;
  }
  .wtHolder {
    overflow: scroll;
  }
}

</style>

<style lang="scss">
  .handsontable .colHeader {
    width: 100%;
  }
  .data-type-in-table.abs {
    position: absolute;
    left: 4px;
    pointer-events: none;
    top: 6px;
		max-width: 32px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .columnSorting {
    position: initial !important;
    &::before {
      right: 22px !important;
    }
  }
  .data-title {
    max-width: calc(100% - 46px);
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    top: 4px;
    left: 32px;
    position: relative;
  }

  .hot-table {
    height: calc(100vh - 191px) !important;
    max-height: calc(100vh - 191px) !important;
    overflow: hidden;
  }

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
  .options-fields {
    min-height: 81px;
    padding-bottom: 81px;
    max-height: calc(100vh - 320px);
  }
</style>

<style src="../node_modules/handsontable/dist/handsontable.full.css"></style>
