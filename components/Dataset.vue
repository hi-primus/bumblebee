<template>
	<div class="table-container">
    <div v-if="!(dataset && dataset.summary)" class="no-data">
      <v-progress-circular
        indeterminate
        v-if="commandsDisabled"
        class="progress-middle"
        color="#888"
        size="64"
      />
      <div v-else class="title grey--text text-center">
        No data to display
      </div>
    </div>
		<div v-else-if="view==0" class="table-view-container">
			<div class="table-controls d-flex">
				<v-btn
          color="#888" text icon small @click="toggleColumnsSelection">
					<v-icon>
						<template v-if="selectionStatus==-1">indeterminate_check_box</template>
						<template v-else-if="selectionStatus==1">check_box</template>
						<template v-else>check_box_outline_blank</template>
					</v-icon>
				</v-btn>
				<v-tooltip bottom>
					<template v-slot:activator="{ on }">
						<v-btn
              color="#888"
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
              color="#888"
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
				:sort-by.sync="_sortBy"
				:sort-desc.sync="_sortDesc"
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
				v-show="view==1 && dataset && dataset.summary"
				class="hot-table-container"
			>
				<HotTable
					v-if="dataset && dataset.sample && hotColumns.length>0"
					:settings="hotSettings"
					:key="tableUpdate"
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
</template>

<script>

import { throttle } from '@/utils/functions.js'
import dataTypesMixin from '@/plugins/mixins/data-types'
import GraphicsRenderer from '@/components/GraphicsRenderer'

export default {

  mixins: [
    dataTypesMixin
  ],

  components: {
    GraphicsRenderer
  },

  props: {
    commandsDisabled: {
      type: Boolean,
      default: false
    },
    view: {
      default: 0,
      type: Number
    },
    dataset: {
			default: () => {
				return {}
			},
			type: Object
		},
    detailsActive: {
      default: false
    },
    optionsActive: {
      default: false
    },
    sortBy: {
      type: Array,
      default: ()=>{return []}
    },
    sortDesc: {
      type: Array,
      default: ()=>{return [false]}
    },
    columnsTableHeaders: {
      type: Array,
      default: ()=>{return []}
    },
		typesSelected: {
			default: () => ([]),
			type: Array
		}
  },

  data () {
    return {
			// affects table view only
			hotColumns: [],
			tableUpdate: 0,
			// controls
			hiddenColumns: {},
			selectedColumns: {},
			// status
			selectionStatus: false,
			visibilityStatus: 1, // visible

			HotTable: undefined,
      HotColumn: undefined,

      resultsColumns: [], // search
			filteredColumns: [], // filter
    }
  },

  computed: {

    _sortBy: {
      get () {
        return this.sortBy
      },
      set (v) {
        this.$emit('update:sortBy',v)
      }
    },
    _sortDesc: {
      get () {
        return this.sortDesc
      },
      set (v) {
        this.$emit('update:sortDesc',v)
      }
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

  methods: {
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

    displaySelection: throttle ( async function (item) {
			if (item) {
				this.scatterPlotDisplay = item.values
      }
      else {
        // this.scatterPlotDisplay = ''
      }
    },100),


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
          this.$emit('selection',false)
          return;
        }

        let plotableIndices = [];
        let selectedIndices = [];

        selected.forEach(selection => {

          var smin = Math.min(selection[1],selection[3])
          var smax = Math.max(selection[1],selection[3])

          for (let i = smin; i <= smax; i++)  {

            const columnData = tableInstance.getDataAtCell(0,i)

            let found = selectedIndices.findIndex( (e) => { return (e === columnData.index.toString()) } )

            if (found===-1) {
              selectedIndices.push({index: columnData.index.toString(), type: columnData.plotable})
              if (columnData.plotable) {
                plotableIndices.push({index: columnData.index.toString(), type: columnData.plotable})
              }
            }

          }

        });

        this.handleSelection(selectedIndices,plotableIndices)
			}
    },

    handleSelection (selected, plotable = []) {

      this.$emit('selection',{selected,plotable})

      return;
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

			this.tableUpdate = this.tableUpdate + 1
		},

		getFilteredColumns () {
			if (this.typesSelected.length > 0) {
				this.filteredColumns = this.resultsColumns.filter((column) => {
					return this.typesSelected.includes(column.column_dtype)
				})
			} else {
				this.filteredColumns = this.resultsColumns
      }

      if (!this.filteredColumns)
        return

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
  },

  watch: {
    searchText: {
			immediate: true,

			handler () {
				this.searchTextWatch()
			}

		},

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

    optionsActive: {
      handler (value) {
				this.$nextTick(() => {
          try {
            this.$refs['hot-table'].hotInstance.render()
          }
          catch {}
				})
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


}
</script>
