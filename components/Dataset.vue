<template>
	<div class="table-container">
    <div v-if="!(currentDataset && currentDataset.summary) && !loadPreview" class="no-data">
      <div v-if="appError" class="title grey--text text-center text-with-icons">
        There's a problem <br/><br/>
        <v-btn color="primary" depressed @click="reloadInit">Reload</v-btn>
      </div>
      <div
        v-else-if="(commandsDisabled || $store.state.kernel=='loading')"
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
      <div v-else class="title grey--text text-center text-with-icons">
        Use <v-icon>cloud_upload</v-icon> or <v-icon>storage</v-icon> to load some data
      </div>

    </div>
		<div v-else-if="currentListView && !loadPreview" class="table-view-container">
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
							:class="{'active': currentListView && selectionStatus==-1}"
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
				v-show="currentListView"
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
				<template v-slot:item.dtype="{ item }">
					<v-tooltip transition="fade-transition" bottom>
						<template v-slot:activator="{ on }">
							<div class="data-type pr-4" v-on="on">
								{{ dataType(item.dtype) }}
							</div>
						</template>
						<span :key="'column-type-hint'" class="capitalize column-type">
							{{ item.dtype }}
							<template v-if="item.dtype==='string*'">
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
				<template v-slot:item.missing="{ item }">
					<div class="pr-4">
						{{ item.missing | formatNumberInt }}
					</div>
				</template>
				<template v-slot:item.null="{ item }">
					<div class="pr-4" v-if="item.null!==undefined">
						{{ item.null | formatNumberInt }}
					</div>
				</template>
        <template v-slot:item.zeros="{ item }">
					<div class="pr-4" v-if="item.zeros!==undefined">
						{{ item.zeros | formatNumberInt }}
					</div>
				</template>
			</v-data-table>
		</div>
		<client-only>
			<div
				v-show="!currentListView && (currentDataset && currentDataset.summary || loadPreview)"
				class="the-table-container"
			>
        <BumblebeeTable
					v-if="!currentListView && (currentDataset && currentDataset.summary || loadPreview)"
          :bbColumns="bbColumns"
          @sort="updateSortedColumns"
          @updatedSelection="selectionEvent"
          ref="bumblebeeTable"
        />
			</div>
		</client-only>
	</div>
</template>

<script>

import { parseResponse, debounce, throttle } from '@/utils/functions.js'
import { mapGetters } from 'vuex'
import dataTypesMixin from '@/plugins/mixins/data-types'
import clientMixin from '@/plugins/mixins/client'
import BumblebeeTable from '@/components/BumblebeeTable'

export default {

  mixins: [
    dataTypesMixin,
    clientMixin
  ],

  components: {
    BumblebeeTable
  },

  props: {
    operationsActive: {
      type: Boolean,
      default: false
    },
    commandsDisabled: {
      type: Boolean,
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
    },
    searchText: {
      default: '',
      type: String
    }
  },

  data () {
    return {

			hiddenColumns: {},

      resultsColumnsData: false, // search
      selectedColumns: {},

      sortedColumns: [], // table manual sorting

      isMounted: false,

      loadedPreviewCode: ''
    }
  },

  computed: {

    ...mapGetters([
      'currentSelection',
      'currentDataset',
      'currentListView',
      'currentPreviewCode',
      'currentLoadPreview',
      'appError'
    ]),

    loadPreview () {
      try {
        return (this.currentPreviewCode.loadPreview && this.currentLoadPreview)
      } catch (error) {
        return false
      }
    },

    customSortedColumns () {
      if (this.sortedColumns.length && this.currentDataset && this.currentDataset.columns && this.currentDataset.columns.length) {
        return this.sortedColumns.map(i=>this.currentDataset.columns[i])
      }
      else if (this.currentDataset && this.currentDataset.columns) {
        return this.currentDataset.columns
      }
      else {
        return []
      }
    },

    selectionStatus () {

      let status

      if (this.filteredColumns && this.filteredColumns.length) {
        for (let i = 0; i < this.filteredColumns.length; i++) {
          const column = this.filteredColumns[i]
          if (status !== undefined && status === +!this.selectedColumns[column.name]) { // different from previous value
            return -1 // indeterminate
          }
          status = +!!this.selectedColumns[column.name] // all or none selected
        }
      }
			return +!!status
    },

    visibilityStatus () {

      if (this.filteredColumns && this.filteredColumns.length) {
        for (let i = 0; i < this.filteredColumns.length; i++) {
          const column = this.filteredColumns[i]
          if (this.selectedColumns[column.name] && this.hiddenColumns[column.name]) {
            return 0 // at least one is hidden
          }
        }
      }
			return 1
    },

    // affects table view only
    bbColumns () {
      var bbColumns = this.filteredColumns ? [...this.filteredColumns.filter((column) => {
				return !this.hiddenColumns[column.name]
      })] : []

      let selectColumns = Array.from(this.customSortedColumns)// [...(this.customSortedColumns || [])]

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

      if (this.currentDataset.columns && this.currentDataset.columns.length) {
        return bbColumns.map(e=>this.currentDataset.columns.findIndex(de => de.name === e.name))
      } else {
        return bbColumns.map((e,i)=>i)
      }


    },

    resultsColumns () {
      if (!this.resultsColumnsData || !this.resultsColumnsData.length)
        return this.customSortedColumns
      else
        return this.resultsColumnsData
    },

    filteredColumns () {

      try {
        var filteredColumns

        if (this.typesSelected.length > 0) {
          filteredColumns = this.resultsColumns.filter((column) => {
            return this.typesSelected.includes(column.dtype)
          })
        } else {
          filteredColumns = this.resultsColumns
        }

        if (filteredColumns) {

          this.$nextTick(()=>{
            let _selected = []

            if (this.currentDataset.columns) {
              for (let i = 0; i < this.currentDataset.columns.length; i++) {
              const column = this.currentDataset.columns[i];
              if (this.selectedColumns[column.name]) {
                  _selected.push(i)
                }
              }
            }
            this.handleSelection( _selected, true )
          })


        }
        return filteredColumns
      } catch (error) {
        return []
      }
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

    reloadInit () {
      this.$store.commit('setAppStatus',{status: 'receiving'})
    },

    async updateResults() {

      if (this.searchText) {
        this.resultsColumnsData = await this.$search(this.searchText, this.customSortedColumns, {
          shouldSort: true,
          threshold: 0.1,
          keys: ['name']
        })
      } else {
        this.resultsColumnsData = false
      }
    },

    updateSortedColumns(event) {
      this.$emit('sortDrag')
      this.sortedColumns = []
      this.sortedColumns = event
      this.updateResults()
    },

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
        this.updateResults()
      } catch (err) {
        // console.error(err)
      }
    }, 1000),

		toggleColumnsSelection () {
			let select = this.selectionStatus !== 1

			if (!select) {
				this.selectedColumns = {}
			} else {
				for (let i = 0; i < this.filteredColumns.length; i++) {
					const column = this.filteredColumns[i]
					this.$set(this.selectedColumns, column.name, select)
				}
			}

		},

		getSubTypes (item) {
			if (item.stats) {
				return Object.keys(item.stats)
					.filter((k) => {
						return (!!item.stats[k] && k !== 'string' && k !== 'missing' && k !== 'null')
					})
					.map((k) => {
						return item.stats[k] + ' ' + k
					})
			}
		},

		rowClicked (e) {
      this.toggleColumnSelection(e.name)
    },

    selectionEvent (selection) {
      this.handleSelection(selection,true)
    },

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
			for (let i = 0; i < this.filteredColumns.length; i++) {
				const column = this.filteredColumns[i]
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
			for (let i = 0; i < this.filteredColumns.length; i++) {
				const column = this.filteredColumns[i]
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

    currentDataset () {
      this.sortedColumns = []
    },

    operationsActive () {
      this.$refs.bumblebeeTable && this.$refs.bumblebeeTable.checkVisibleColumns()
    },

    currentPreviewCode: {
      deep: true,
      async handler () {
        try {
          if (this.loadedPreviewCode!==this.currentPreviewCode.code) {
            this.loadedPreviewCode = this.currentPreviewCode.code
            if (this.currentPreviewCode.load) {
              var varname = 'preview_df'
              var code = `${varname} = ${this.currentPreviewCode.code} \n`

              code += `_output = {**${varname}.ext.to_json("*"), "meta": ${varname}.meta.get() if (${varname}.meta and ${varname}.meta.get) else {} } \n`

              // if (this.currentPreviewCode.infer) {
              //   code += `_output = {**${varname}.ext.to_json("*"), "meta": ${varname}.meta.get() if (${varname}.meta and ${varname}.meta.get) else {} } \n`
              // } else {
              //   code += `_output = {**${varname}.ext.to_json("*")} \n`
              // }

              var response = await this.evalCode(code)

              this.$store.commit('setLoadPreview', {sample: response.data.result.sample} )

              if (response.data.result.meta) {
                this.$store.commit('setLoadPreview', {meta: response.data.result.meta} )
              }


              var pCode = `_output = ${varname}.ext.profile(columns="*", infer=True, output="json")`

              var pResponse = await this.evalCode(pCode)

              var profile = parseResponse(pResponse.data.result)

              this.$store.commit('setLoadPreview', { profile } )


            }
          }
        } catch (error) {
          console.error(error)
        }
      },
    },

    selectedColumns: {
      deep: true,
      handler (v) {
        this.handleSelection(Object.entries(v).filter((e)=>e[1]).map(e=>e[0]) || [], false)
      }
    },

    currentSelection() {
      this.getSelectionFromStore()
    },

    searchText: {
			immediate: true,
			handler: 'watchSearchText'
		}
	},


}
</script>
