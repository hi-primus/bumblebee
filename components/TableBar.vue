<template>
  <div class="dashboard-container">
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
      <transition name="fade">
        <div class="divider" v-if="detailedColumns.length>=1" />
      </transition>
      <transition name="fade">
        <span class="columns-operations" v-if="detailedColumns.length>=1" >
          <v-btn color="#888" text class="icon-btn" @click="deleteColumns" :loading="operation=='delete'">
            <v-icon>delete</v-icon>
          </v-btn>
        </span>
      </transition>
      <!-- <v-btn :color="(optionsActive) ? 'black' : '#888'" text class="icon-btn" @click="optionsActive = !optionsActive">
        <v-icon>code</v-icon>
      </v-btn> -->
    </div>

    <div class="sidebar-container" v-if="detailsActive || optionsActive">
      <template v-if="optionsActive && false">
        <div class="sidebar-header">
          Operations
          <v-icon class="right-button" color="black" @click="optionsActive = false">close</v-icon>
        </div>
        <div class="sidebar-content">
          <table class="sidebar-content option">
            <tbody>
              <tr class="input">
                <td>Input</td>
                <td style="width: 100%">
                  <textarea>2+2</textarea>
                </td>
              </tr>
              <tr class="output">
                <td>Output</td>
                <td style="width: 100%">
                  4
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <template v-else-if="detailsActive!==false">
        <div class="sidebar-header">
          Details
          <v-icon class="right-button" color="black" @click="detailsActive = false">close</v-icon>
        </div>
        <div class="sidebar-content">

          <div v-if="detailedColumns.length>1" class="sidebar-section pr-10 columns-selected">
            <!-- TODO: Navigate using .column-selected -->
            <CommandMenu button.class="right-button-center" :disabled="commandsDisabled" @command="commandHandle($event)"></CommandMenu>
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
import CommandMenu from '@/components/CommandMenu'
import ColumnDetails from '@/components/ColumnDetails'
import VegaEmbed from '@/components/VegaEmbed'
import dataTypesMixin from '@/plugins/mixins/data-types'

import { throttle } from '@/utils/functions.js'

export default {
	components: {
    GraphicsRenderer,
    CommandMenu,
    ColumnDetails,
    VegaEmbed
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

      detailsActive: false,

      optionsActive: false,

      commandsDisabled: false,

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
      switch (event.command) {
        case 'delete':
          this.deleteColumns(event.columns)
          break;

        default:
          break;
      }
    },

    deleteColumns (selected = []) {
      this.commandsDisabled = true
      this.operation = 'delete'
      setTimeout(() => {
        this.commandsDisabled = false
        this.operation = undefined
      }, 500);
      let toDelete = (selected.length) ? selected : this.detailedColumns.map(e=>this.dataset.columns[e.index].name)

      for (let i = toDelete.length - 1; i >= 0 ; i--) {
        const foundIndex = this.dataset.columns.findIndex((e)=>{ return e.name==toDelete[i] })
        this.$store.commit('deleteColumn', { dataset: this.currentTab, column: foundIndex })
      }

      console.log('toDelete',toDelete)
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
</style>

<style src="../node_modules/handsontable/dist/handsontable.full.css"></style>
