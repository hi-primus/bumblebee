<template>
	<div class="table-container">
    <div class="px-4 filter-container">
      <v-autocomplete
        dense
        v-model="typesSelected"
        :items="typesAvailable"
        :append-icon="''"
        chips
        deletable-chips
        color="grey darken-3"
        class="placeholder-chip"
        label="Data type"
        full-width
        hide-details
        hide-no-data
        hide-selected
        multiple
        single-line
      >
        <template v-slot:item="{ item }">
          <div class="data-type in-autocomplete">{{dataType(item.value)}}</div> {{item.text}}
        </template>
      </v-autocomplete>
    </div>
    <div class="controls-in-container" v-if="view==0">
      <div class="table-controls mb-2 d-flex">
          <v-btn text icon small @click="toggleColumnsSelection">
            <v-icon>
              <template v-if="selectionStatus==-1">indeterminate_check_box</template>
              <template v-else-if="selectionStatus==1">check_box</template>
              <template v-else>check_box_outline_blank</template>
            </v-icon>
          </v-btn>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn text icon small class="visibility-btn hideable tr-o" v-on="on" :class="{'active': selectionStatus!=0}" @click="toggleColumnsVisibility(!visibilityStatus)">
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
              <v-btn text icon small class="hideable tr-o" v-on="on" :class="{'active': view==0 && selectionStatus==-1}" @click="invertSelection">
                <v-icon>
                  $vuetify.icons.check-box-invert
                </v-icon>
              </v-btn>
            </template>
            <span>Invert selection</span>
          </v-tooltip>
      </div>
          <!-- {text: 'Type',width: 'calc(20% - 100px)', value:'type'}, -->
			<v-data-table
				@click:row="rowClicked"
        v-show="view==0"
        class="columns-table"
        :headers="[
          {text: '', sortable:false, width: '1%', value:'controls'},
          {text: 'Type', value:'dtype', width: '1%'},
          {text: 'Name', value:'name', width: '3%'},
          {text: 'Missing values', width: '2%', value:'missing'},
          {text: 'Valid values', width: '2%', value:'valid'},
          {text: '', sortable:false, width: '50%', value:''}
        ]"
        :items="tableItems"
				disable-pagination
        hide-default-footer
        fixed-header
        :mobile-breakpoint="0"
        :height="600"
      >
        <template v-slot:item.controls="{ item }">
          <div class="cell-controls">
            <v-icon @click.stop="toggleColumnSelection(item.name)" class="control-button control-check">
              <template v-if="selectedColumns[item.name]">check_box</template>
              <template v-else>check_box_outline_blank</template>
            </v-icon>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-icon
                  class="control-button control-hide" :class="{'control-hide-hidden': hiddenColumns[item.name]}"
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
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <div v-on="on" class="data-type pr-4">
                {{dataType(item.dtype)}}
              </div>
            </template>
            <span class="capitalize">{{item.dtype}}</span>
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
            {{item.name}}
          </div>
        </template>
        <template v-slot:item.missing="{ item }">
          <div class="pr-4">
            {{item.missing}}
          </div>
        </template>
        <template v-slot:item.valid="{ item }">
          <div class="pr-4">
            {{item.valid}}
          </div>
        </template>
        <!-- <template v-slot:item.missing="{ item }">
          <DataBar :key="item.name+'missing'" style="min-width: calc(20vw + 50px); max-width: 100%;" :missing="+item.missing" :total="+total" />
        </template> -->
			</v-data-table>
    </div>
    <client-only>
			<HotTable
				v-show="view==1"
				v-if="dataset && dataset.sample && hotColumns.length>0"
        :settings="hotSettings"
        :key="tableKey"
				class="hot-table"
			>
        <HotColumn v-for="(column, i) in hotColumns" :key="i" :settings="column">
          <GraphicsRenderer :graphicsData="{a: 1}" hot-renderer>
          </GraphicsRenderer>
        </HotColumn>
      </HotTable>
    </client-only>
	</div>
</template>

<script>
import DataBar from "@/components/DataBar";
import GraphicsRenderer from "@/components/GraphicsRenderer";
import dataTypesMixin from "@/plugins/mixins/data-types";

import { throttle } from "@/utils/functions.js"

export default {
	components: {
    DataBar,
    GraphicsRenderer
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
		},
		searchText: {
			default: ""
		}
	},

	data() {
		return {

      mustHandleSearchText: false,

      // searchText: '',
      sortType: 0,

      resultsColumns: [], // search
      filteredColumns: [], // filter

      // affects table view only
      hotColumns: [],
      tableKey: 0,

      // controls
      hiddenColumns: {},
      selectedColumns: {},

      //status
      selectionStatus: false,
      visibilityStatus: 1, // visible

      typesAvailable: [
        {text: 'String', value: 'string' },
        {text: 'Integer', value: 'int' },
        {text: 'Decimal', value: 'decimal' },
        {text: 'Date', value: 'date' },
        {text: 'Boolean', value: 'boolean' },
        {text: 'Binary', value: 'binary' },
        {text: 'Array', value: 'array' },
        {text: 'Null', value: 'null' }
      ],
      typesSelected: [],

      HotTable: undefined,
      HotColumn: undefined,
		};
	},

	computed: {
    tableItems() {
      return this.filteredColumns.map((e,i)=>{
        return {
          controls: true,
          name: e.name,
          type: e.column_type,
          dtype: e.column_dtype,
          missing: e.stats.count_na + " ",
          valid: (this.dataset.summary.rows_count - e.stats.count_na) + " "
        }
      })
    },

		colHeaders() {
			return this.dataset.columns.map(e => {
				return e.name;
			});
    },

    hotSettings() {
      return {
        // dropdownMenu: ['filter_by_condition', 'filter_operators', 'filter_by_condition2', 'filter_action_bar'],
				data: [this.graphicsData,...this.dataset.sample.value],
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
        height: 'calc(100vh - 255px)',
        columnSorting: false,
        // hiddenColumns: {columns: this.hotColumns, indicators: false},
        // columns: this.hotColumns,
        filters: true,
				disabledHover: true,
        beforeOnCellMouseUp: this.columnHeaderClicked,
        licenseKey: 'non-commercial-and-evaluation'
      }
    },

    graphicsData() {
      return this.dataset.columns.map( (column, i) => {
				return {
          toString() {
            return ''
          },
          missing: column.stats.count_na,
          total: this.dataset.summary.rows_count,
          count_uniques: column.stats.count_uniques,
          hist: (column.stats.hist && column.stats.hist[0]) ? column.stats.hist : undefined,
          hist_years: (column.stats.hist && column.stats.hist.years) ? column.stats.hist.years : undefined,
          frequency: (column.frequency) ? column.frequency : undefined,
        };
			});
    },

  },

	watch: {
		searchText: {
      immediate: true,

      handler() {

        this.mustHandleSearchText = true;

        this.searchTextWatch();

      },


		},

		hiddenColumns: {
			handler() {
        this.getHotColumns()
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

    searchTextWatch: throttle( async function(){
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
      this.mustHandleSearchText = false;
    },1000),

		rowClicked (e) {
			this.$router.push(`${this.currentTab}/${e.name}`)
		},

    columnHeaderClicked (event,coords) {
      if (coords.row<0 && event.which==1){
        let dataName;
        try {
          dataName = event.target.getElementsByClassName('data-title')[0].innerText;
        } catch {
          dataName = event.target.innerText;
        }
        event.preventDefault();
        this.$router.push(`${this.currentTab}/${dataName || this.dataset.columns[coords.col].name}`)
      }
		},

    getHotColumns () {

      this.hotColumns = this.filteredColumns.filter((column)=>{
        return !this.hiddenColumns[column.name]
      }).map( (e, i) => {
        return {
          data: this.dataset.columns.indexOf(e),
          editor: false,
          readOnly: true,
          title: `
            <span class="data-type-in-table abs data-type type-${e.column_dtype}">
              ${this.dataType(e.column_dtype)}
            </span>
            <span class="data-title">
              ${e.name}
            </span>`
        };
      })

      this.tableKey = this.tableKey + 1;
    },

    getFilteredColumns () {
      if (this.typesSelected.length>0){
        this.filteredColumns = this.resultsColumns.filter(column => {
          return this.typesSelected.includes(column.column_dtype)
        })
      }
      else {
        this.filteredColumns = this.resultsColumns
      }

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

      this.getHotColumns();
      this.setSelectionStatus();
      this.setVisibilityStatus();
    },

    toggleColumnSelection(value) {
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
      for (let i = 0; i < this.filteredColumns.length; i++) {
        const column = this.filteredColumns[i];
        if (this.selectedColumns[column.name])
          this.hiddenColumns[column.name] = !value
      }

      this.setVisibilityStatus()
      this.getHotColumns()
    },

    toggleColumnVisibility(colName) {
      this.hiddenColumns[colName]=!this.hiddenColumns[colName]
      this.setVisibilityStatus()
      this.getHotColumns()
    },

    setSelectionStatus() {

      let status = undefined

      for (let i = 0; i < this.filteredColumns.length; i++) {
        const column = this.filteredColumns[i];
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


.v-icon.control-button {
  user-select: none;
}

.hot-table {
  .wtHolder, .ht_master {
    height: inherit !important;
  }
  .wtHolder {
    overflow: scroll;
  }
}

</style>

<style lang="scss">
  .handsontable span.colHeader {
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    top: 4px;
    left: 32px;
    position: relative;
  }

  .hot-table {
    height: calc(100vh - 210px) !important;
    max-height: calc(100vh - 210px) !important;
    width: 100% !important;
    overflow: hidden;
  }
</style>

<style src="../node_modules/handsontable/dist/handsontable.full.css"></style>

