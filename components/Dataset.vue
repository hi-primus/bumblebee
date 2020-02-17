<template>
	<div class="table-container">
    <div v-if="!(currentDataset && currentDataset.summary)" class="no-data">
      <div
        v-if="commandsDisabled || $store.state.kernel=='loading'"
        class="progress-middle title grey--text text-center"
        :class="{'has-text': $store.state.kernel=='loading'}"
      >
        <v-progress-circular
          indeterminate
          color="#888"
          size="64"
        />
        <template v-if="$store.state.kernel=='loading'">
          Initializing
        </template>
      </div>
      <!-- <v-progress-linear
        indeterminate
        v-if="commandsDisabled"
        class="progress-top"
        color="#888"
      /> -->
      <div v-else class="title grey--text text-center text-with-icons">
        Use <v-icon>cloud_upload</v-icon> or <v-icon>storage</v-icon> to load some data
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
				<v-tooltip transition="fade-transition" bottom>
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
				<v-tooltip transition="fade-transition" bottom>
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
				:items="newFilteredColumns"
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
						<v-tooltip transition="fade-transition" bottom>
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
					<v-tooltip transition="fade-transition" bottom>
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
				<template v-slot:item.stats.null="{ item }">
					<div class="pr-4">
						{{ item.stats.null | formatNumberInt }}
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
				v-show="view==1 && currentDataset && currentDataset.summary"
				class="the-table-container"
			>
        <BumblebeeTable
					v-if="view==1 && currentDataset && (currentDataset.sample || currentDataset.id)"
          :bbColumns="bbColumns"
          @updatedSelection="selectionEvent"
          ref="bumblebeeTable"
        />
			</div>
		</client-only>
	</div>
</template>

<script>

import { debounce, throttle } from '@/utils/functions.js'
import { mapGetters } from 'vuex'
import dataTypesMixin from '@/plugins/mixins/data-types'
import GraphicsRenderer from '@/components/GraphicsRenderer'
import BumblebeeTable from '@/components/BumblebeeTable'

export default {

  mixins: [
    dataTypesMixin
  ],

  components: {
    GraphicsRenderer,
    BumblebeeTable
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
    },
    searchText: {
      default: '',
      type: String
    }
  },

  data () {
    return {

			tableUpdate: 0,

			hiddenColumns: {},

			HotTable: undefined,
      HotColumn: undefined,

      resultsColumns: [], // search
      selectedColumns: {},

      isMounted: false
    }
  },

  computed: {

    ...mapGetters(['currentSelection','currentDataset']),

    selectionStatus () {

      let status

			for (let i = 0; i < this.newFilteredColumns.length; i++) {
				const column = this.newFilteredColumns[i]
				if (status !== undefined && status === +!this.selectedColumns[column.name]) { // different from previous value
					return -1 // indeterminate
				}
				status = +!!this.selectedColumns[column.name] // all or none selected
			}
			return +!!status
    },

    visibilityStatus () {

			for (let i = 0; i < this.newFilteredColumns.length; i++) {
				const column = this.newFilteredColumns[i]
				if (this.selectedColumns[column.name] && this.hiddenColumns[column.name]) {
					return 0 // at least one is hidden
				}
			}
			return 1
    },

    // affects table view only
    bbColumns () {
      var bbColumns = this.newFilteredColumns ? [...this.newFilteredColumns.filter((column) => {
				return !this.hiddenColumns[column.name]
      })] : []

      let selectColumns = [...(this.currentDataset.columns || [])]

			if (this.sortBy[0] && bbColumns.length) {
				if (typeof bbColumns[0][this.sortBy[0]] === 'string') {
					bbColumns.sort((a, b) => {
						let _a = a[this.sortBy[0]].toLowerCase()
						let _b = b[this.sortBy[0]].toLowerCase()
						return (_a < _b) ? -1 : (_a > _b) ? 1 : 0
          })
          selectColumns.sort((a, b) => {
						let _a = a[this.sortBy[0]].toLowerCase()
						let _b = b[this.sortBy[0]].toLowerCase()
						return (_a < _b) ? -1 : (_a > _b) ? 1 : 0
          })
				} else {
					bbColumns.sort((a, b) => {
						let _a = a[this.sortBy[0]]
						let _b = b[this.sortBy[0]]
						return (_a < _b) ? -1 : (_a > _b) ? 1 : 0
          })
          selectColumns.sort((a, b) => {
						let _a = a[this.sortBy[0]]
						let _b = b[this.sortBy[0]]
						return (_a < _b) ? -1 : (_a > _b) ? 1 : 0
          })
				}
				if (this.sortDesc[0]) {
          bbColumns.reverse()
          selectColumns.reverse()
        }
      }

      this.$emit('sort',selectColumns.map(e=>e.name))

			return bbColumns.map(e=> this.currentDataset.columns.findIndex(de => de.name === e.name))

    },

    bbColumnsJoin () {
      return this.bbColumns.map(e=>e.data).join('')
    },

    newFilteredColumns () {

      var filteredColumns

      if (this.typesSelected.length > 0) {
				filteredColumns = this.resultsColumns.filter((column) => {
					return this.typesSelected.includes(column.column_dtype)
				})
			} else {
				filteredColumns = this.resultsColumns
      }

      if (filteredColumns) {
        filteredColumns = filteredColumns.map((column) => {
          return {
            __missing: +column.dtypes_stats.missing || 0,
            __na: +column.dtypes_stats.null || 0,
            __zeros: +column.stats.zeros || 0,
            ...column
          }
        })

        this.$nextTick(()=>{
          let _selected = []

          if (this.currentDataset.columns) {
            for (let i = 0; i < this.currentDataset.columns.length; i++) {
            const column = this.currentDataset.columns[i];
            if (this.selectedColumns[column.name]){
                _selected.push(i)
              }
            }
          }
          this.handleSelection( _selected, true )
        })


      }
      return filteredColumns
    },

    tableKey () {
			return this.$store.state.datasetUpdates * 100 + this.$store.state.tab
		},

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

    columnsHeader () {
			return this.currentDataset.columns.map((e) => {
				return e.name
			})
    },
  },

  beforeCreate() {
    this.isMounted = false
  },

  mounted() {

    try {
      this.getSelectionFromStore()
    } catch (error) {}

    this.$nextTick(()=>{
      this.isMounted = true
    })

  },

  methods: {

    getSelectionFromStore () {
      var selectedColumns = {}
      var storeSelectedColumns = this.currentSelection.columns

      if (storeSelectedColumns) {
        for (let index = 0; index < storeSelectedColumns.length; index++) {
            selectedColumns[storeSelectedColumns[index].name] = true
        }
      }

      if (JSON.stringify(selectedColumns) !== JSON.stringify(this.selectedColumns)) {
        this.selectedColumns = selectedColumns
      }

    },


    displaySelection: throttle( async function (item) {
			if (item) {
				this.scatterPlotDisplay = item.values
      }
    },100),

    watchSearchText: throttle( async function() {
      try {
        this.resultsColumns = this.searchText
          ? await this.$search(this.searchText, this.currentDataset.columns, {
            shouldSort: true,
            threshold: 0.1,
            keys: ['name']
          })
          : this.currentDataset.columns

      } catch (err) {}
    }, 1000),

		toggleColumnsSelection () {
			let select = this.selectionStatus !== 1

			if (!select) {
				this.selectedColumns = {}
			} else {
				for (let i = 0; i < this.newFilteredColumns.length; i++) {
					const column = this.newFilteredColumns[i]
					this.$set(this.selectedColumns, column.name, select)
				}
			}

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

		rowClicked (e) {
      this.toggleColumnSelection(e.name)
    },

    selectionEvent (selection) {

      var selectedIndices = []

      for (const key in selection) {
        if (selection[key]) {
          selectedIndices.push(key)
        }
      }

      this.handleSelection(selectedIndices,true)
    },

		oldselectionEvent: debounce( function(row, prop, row2, prop2) {

			if (row <= 0) {

        const tableInstance = this.$refs['hotTable'].hotInstance;

        var selected = tableInstance.getSelected()

        if (!selected.length && this.isMounted) {
          this.$emit('selection',false)
          return;
        }

        let selectedIndices = [];

        selected.forEach(selection => {

          var smin = Math.min(selection[1],selection[3])
          var smax = Math.max(selection[1],selection[3])

          for (let i = smin; i <= smax; i++)  {

            const columnData = tableInstance.getDataAtCell(0,i)

            var found = selectedIndices.findIndex( (e) => { return (e === columnData.index.toString()) } )

            var index = +columnData.index.toString()

            if (found===-1 && !selectedIndices.includes(index)) {
              selectedIndices.push(index)
            }

          }

        });

        this.handleSelection(selectedIndices,true)

			}
    }, 200),

    handleSelection (selected, indices = false) {

      if (this.isMounted) {
        this.$emit('selection',{selected, indices})
      }

    },

		toggleColumnSelection (value) {
			if (this.selectedColumns[value]) {
				this.$set(this.selectedColumns, value, false)
				delete this.selectedColumns[value]
      }
      else {
        this.$set(this.selectedColumns, value, true)
      }
		},

		invertSelection () {
			for (let i = 0; i < this.newFilteredColumns.length; i++) {
				const column = this.newFilteredColumns[i]
				if (this.selectedColumns[column.name]) {
          // this.$delete(this.cSelectedColumn, column.name)
          this.$set(this.selectedColumns, column.name, false)
        }
        else {
          this.$set(this.selectedColumns, column.name, true)
        }
			}
		},

		toggleColumnsVisibility (value) {
			for (let i = 0; i < this.newFilteredColumns.length; i++) {
				const column = this.newFilteredColumns[i]
				if (this.selectedColumns[column.name]) {
          this.$set(this.hiddenColumns, column.name, !value)
        }
			}
		},

		toggleColumnVisibility (colName) {
			this.$set(this.hiddenColumns, colName, !this.hiddenColumns[colName])
    }

  },

  watch: {

    selectedColumns: {
      deep: true,
      handler (v) {
        this.handleSelection(Object.entries(v).filter((e)=>e[1]).map(e=>e[0]) || [], false)
      }
    },

    currentSelection() {
      this.getSelectionFromStore()
    },

    bbColumnsJoin () {
      this.$nextTick(()=>{
        this.tableUpdate = this.tableUpdate + 1
      })
    },

    searchText: {
			immediate: true,
			handler: 'watchSearchText'
		}
	},


}
</script>
