<template>
	<div class="table-container">
    <div class="controls-in-container">
      <div class="table-controls mb-2 narrow-buttons d-flex" :class="{'controls-list': view==0}">
        <span class="controls-container">
        <v-btn class="first-button hideable" :class="{'active': view==0}" text icon small @click="toggleColumnsSelection">
          <v-icon>
            <template v-if="selectionStatus==-1">indeterminate_check_box</template>
            <template v-else-if="selectionStatus==1">check_box</template>
            <template v-else>check_box_outline_blank</template>
          </v-icon>
        </v-btn>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn text icon small class="hideable tr-o" v-on="on" :class="{'active': view==0 && selectionStatus!=0}" @click="toggleColumnsVisibility(!visibilityStatus)">
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
            <v-btn text icon small class="hideable tr-o mr-4" v-on="on" :class="{'active': view==0 && selectionStatus==-1}" @click="invertSelection">
              <v-icon>
                $vuetify.icons.check-box-invert
              </v-icon>
            </v-btn>
          </template>
          <span>Invert selection</span>
        </v-tooltip>

        <v-chip-group
          multiple
          v-model="typesSelected"
          style="margin-top: -4px"
          class="filter-chip-group"
          active-class="active-chip"
          color="white"
        >
          <v-chip :value="key" v-for="(type, key) in types" :key="key">
            {{ type.label }}
          </v-chip>
        </v-chip-group>
        <v-spacer></v-spacer>
        <v-btn text icon small class="hideable tr-o mr-4" :class="{'active': view==0}" @click="toggleSortType">
          <v-icon>
            <template v-if="sortType==1">
              fas fa-sort-alpha-down
            </template>
            <template v-else-if="sortType==-1">
              fas fa-sort-alpha-down-alt
            </template>
            <template v-else>
              fas fa-sort
            </template>
          </v-icon>
        </v-btn>
        <v-text-field
          small
          class="search-filter mr-3"
          style="max-width: 500px"
          v-model="searchText"
          append-icon="search"
          label="Search column"
          :color="'info darken-1'"
          clearable
        />
        </span>
      </div>
			<v-simple-table v-show="view==0" class="columns-table">
				<tbody>
					<nuxt-link
						v-for="col in filteredColumns"
						:to="`/${currentTab}/${col.name}`"
						:key="col.name"
						tag="tr"
						class="hoverable table-column"
					>
						<td class="cell-controls">
              <v-icon @click.stop="toggleColumnSelection(col.name)" class="control-button control-check">
                <template v-if="selectedColumns[col.name]">check_box</template>
                <template v-else>check_box_outline_blank</template>
              </v-icon>
							<v-tooltip bottom>
								<template v-slot:activator="{ on }">
                  <v-icon
                    class="control-button control-hide" :class="{'control-hide-hidden': hiddenColumns[col.name]}"
                    @click.stop="toggleColumnVisibility(col.name)"
                    v-on="on"
                  >
                    <template v-if="!!hiddenColumns[col.name]">
                      visibility_off
                    </template>
                    <template v-else>
                      visibility
                    </template>
                  </v-icon>
								</template>
								<span v-if="!hiddenColumns[col.name]">Hide column on table</span>
								<span v-else>Show column on table</span>
							</v-tooltip>
						</td>
						<td
							style="width: 64px;"
							class="column-cell text-xs-left data-type"
							:class="`type-${col.column_dtype}`"
						>{{ dataType(col.column_dtype) }}</td>
						<td
							style="width: calc(15% - 84px);"
							class="column-cell text-xs-left data-type-name"
						>{{ col.column_type }}</td>
						<td style="width:35%;" class="column-cell text-xs-left data-name">{{ col.name }}</td>
						<td style="width:50%;" class="column-cell text-xs-left pr-6">
							<DataBar :mismatches="col.stats.p_count_na" :total="+total" />
						</td>
					</nuxt-link>
				</tbody>
			</v-simple-table>
    </div>
			<BigdataTable
				v-show="view==1"
				v-if="dataset && dataset.sample"
				:headerHeight="14"
				:rowHeight="22"
				:colWidth="120"
				sortable
				disabledHover
				titleLinks
				:currentTab="currentTab"
				:sortIndex="sortIndex"
				:columns="columnsTitles"
				:value="dataset.sample.value"
				:dataColumns="dataset.columns"
				:visibleColumns="visibleColumns"
				style="max-height: calc(100vh - 234px); min-height: 600px;"
			/>
	</div>
</template>

<script>
import DataBar from "@/components/DataBar";
import dataTypesMixin from "@/plugins/mixins/data-types";
import BigdataTable from "@/components/BigdataTable";

export default {
	components: {
		DataBar,
		BigdataTable
	},

	mixins: [dataTypesMixin],

	props: {
		dataset: {
			default: () => {
				return {};
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
			default: ""
		}
	},

	data() {
		return {

      searchText: '',
      sortType: 0,

      resultsColumns: [], // search
      filteredColumns: [], // filter
      orderedColumns: [], // order

      // affects table view only
			visibleColumns: [],

      // controls
      hiddenColumns: {},
      selectedColumns: {},

      //status
      selectionStatus: false,
      visibilityStatus: 1, // visible

      typesSelected: ['string','int','date','decimal','boolean','binary','array'],
      types: {
        string: { label: 'String' },
        int: { label: 'Integer' },
        date: { label: 'Date' },
        decimal: { label: 'Decimal' },
        boolean: { label: 'Boolean' },
        binary: { label: 'Binary' },
        array: { label: 'Array' }
      }
		};
	},

	computed: {
		sortIndex() {
			return this.dataset.columns.map((e, i) => i);
		},

		columnsTitles() {
			return this.dataset.columns.map(e => {
				return { title: e.name };
			});
    },
	},

	watch: {
		searchText: {
			immediate: true,
			async handler() {
        try {

          this.resultsColumns = this.searchText
            ? await this.$search(this.searchText, this.dataset.columns, {
                shouldSort: true,
                threshold: 0.1,
                keys: ["name"]
              })
            : this.dataset.columns

            this.getFilteredColumns();

        } catch (err) {
          console.error(err);
        }
      },
		},

		hiddenColumns: {
			handler() {
        this.getVisibleColumns()
      },
			deep: true
    },

    typesSelected: {
      handler () {
        this.getFilteredColumns();
      },
      deep: true
    }
	},

	methods: {

    toggleSortType () {
      this.sortType = (this.sortType + 2) % 3 -1
      this.getFilteredColumns();
    },

    getVisibleColumns () {
      this.visibleColumns = this.filteredColumns.map( (e, index) => e.name ).filter(colName => {
			  return !this.hiddenColumns[colName];
			});
    },

    getFilteredColumns () {
      this.filteredColumns = this.resultsColumns.filter(column => {
        return this.typesSelected.includes(column.column_dtype)
      })

      if (this.sortType!=0) {
        this.filteredColumns.sort((a,b)=>{
          const _a = a.name.toLowerCase()
          const _b = b.name.toLowerCase()
          if ( _a < _b ){
            return -1 * (this.sortType);
          }
          if ( _a > _b ){
            return 1 * (this.sortType);
          }
          return 0;
        })
      }

      this.getVisibleColumns();
      this.setSelectionStatus();
      this.setVisibilityStatus();
    },

    toggleColumnSelection(value) {
      console.log("TCL: toggleColumnSelection -> value", value)
      if (this.selectedColumns[value]){
        this.selectedColumns[value] = false;
        delete this.selectedColumns[value];
      }
      else
        this.selectedColumns[value] = true;

      this.getFilteredColumns()

    },

    toggleColumnsSelection() {
      let select = (this.selectionStatus == 1) ? false : true;

      if (!select) {
        this.selectedColumns = {};
      }
      else for (let i = 0; i < this.filteredColumns.length; i++) {
        const column = this.filteredColumns[i];
        this.selectedColumns[column.name] = select;
      }

      this.selectionStatus = +select;

      this.getFilteredColumns()
    },

    invertSelection() {
      console.log("TCL: invertSelection")
      for (let i = 0; i < this.filteredColumns.length; i++) {
        const column = this.filteredColumns[i];
        if (this.selectedColumns[column.name])
          delete this.selectedColumns[column.name]
        else
          this.selectedColumns[column.name] = true
      }

      this.getFilteredColumns()
    },

    toggleColumnsVisibility(value) {
      console.log("TCL: toggleColumnsVisibility -> value", value)
      for (let i = 0; i < this.filteredColumns.length; i++) {
        const column = this.filteredColumns[i];
        if (this.selectedColumns[column.name])
          this.hiddenColumns[column.name] = !value
      }

      this.setVisibilityStatus()
      this.getVisibleColumns()
    },

    toggleColumnVisibility(colName) {
      this.hiddenColumns[colName]=!this.hiddenColumns[colName]
      this.setVisibilityStatus()
      this.getVisibleColumns()
    },

    setSelectionStatus() {

      let status = undefined

      for (let i = 0; i < this.filteredColumns.length; i++) {
        const column = this.filteredColumns[i];
        console.log("TCL: setSelectionStatus -> +!!this.selectedColumns["+column.name+"]", +!!this.selectedColumns[column.name])
        if (status!==undefined && status===+!this.selectedColumns[column.name]) { // different from previous value
          this.selectionStatus = -1 // indeterminate
          return -1
        }
        status = +!!this.selectedColumns[column.name] // all or none selected
      }

      this.selectionStatus = +!!status
      return +!!status;
    },

    setVisibilityStatus() {

      for (let i = 0; i < this.filteredColumns.length; i++) {
        const column = this.filteredColumns[i];
        if (this.selectedColumns[column.name] && this.hiddenColumns[column.name]) {
          this.visibilityStatus = 0 // at least one is hidden
          return 0
        }
      }
      this.visibilityStatus = 1
      return 1
    }
	}
};
</script>

<style lang="scss">
.table-container {
  .controls-in-container {
    margin-left: -16px;
    margin-right: -16px;

    .table-controls {
      height: 54px;
      padding: 6px 16px;
      width: 100%;
      &.controls-list {
        border-top: 1px solid #eee;
        border-bottom: 1px solid #eee;
      }
      &:not(.controls-list) {
        margin-top: -63px;
      }
      // border-radius: 4px;
      &>span {
        transition: opacity ease-in-out .3s;
        .inactive-controls {
          pointer-events: none;
          opacity: 0;
        }
      }
      .search-filter {
        position: relative;
        top: -12px;
        height: 16px;
      }
    }

    .columns-table {

      td {
        padding: 0 8px;
        &.cell-controls {
          padding-left: 24px;

          .control-check{
            opacity: 0.75;
            padding-right: 8px;
          }
          .control-hide{
            opacity: 0;
            &.control-hide-hidden {
              opacity: 0.5;
            }
          }
        }
      }

      &.v-data-table tbody {
        tr:not(:last-child) {
          border-bottom: 0;
        }
        tr.table-column{
          white-space: nowrap;
          &>td {
            height: 30px;
          }
          &:hover:not(.v-data-table__expand-row) {
            background: $data-highlight;
            .v-icon {
              opacity: 1;
            }
          }
        }
      }
    }

  }
}


.v-icon.control-button {
  user-select: none;
}
</style>
