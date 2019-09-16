<template>
  <div>
    <div class="toolbar">
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
            :color="sortBy[0] ? 'black' : '#555'"
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
    </div>
    <div class="table-container">
      <div v-if="view==0" class="controls-in-container">
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
          >
            <HotColumn v-for="(column, i) in hotColumns" :key="i" :settings="column">
              <GraphicsRenderer :graphics-data="{a: 1}" hot-renderer/>
            </HotColumn>
          </HotTable>
        </div>
      </client-only>
    </div>
  </div>
</template>

<script>
import DataBar from '@/components/DataBar'
import GraphicsRenderer from '@/components/GraphicsRenderer'
import dataTypesMixin from '@/plugins/mixins/data-types'

import { throttle } from '@/utils/functions.js'

export default {
	components: {
		DataBar,
		GraphicsRenderer
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
				beforeOnCellMouseUp: this.columnHeaderClicked,
				licenseKey: 'non-commercial-and-evaluation'
			}
		},

		graphicsData () {
			return this.dataset.columns.map((column, i) => {
				return {
					toString () {
						return ''
					},
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
			this.$router.push(`${this.currentTab}/${e.name}`)
		},

		columnHeaderClicked (event, coords) {
			// if (coords.row < 0 && event.which === 1) {
			// 	let dataName
			// 	try {
			// 		dataName = event.target.getElementsByClassName('data-title')[0].textContent
			// 	} catch {
			// 		dataName = event.target.textContent
			// 	}
			// 	event.preventDefault()
			// 	this.$router.push(`${this.currentTab}/${dataName.trim() || this.dataset.columns[coords.col].name}`)
			// }
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
					__missing: +column.dtypes_stats.missing,
					__na: +column.stats.count_na,
					__zeros: +column.stats.zeros || 0,
					...column
				}
			})

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
