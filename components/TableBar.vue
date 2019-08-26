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
              <v-btn text icon small class="hideable tr-o" v-on="on" :class="{'active': selectionStatus!=0}" @click="toggleColumnsVisibility(!visibilityStatus)">
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
          <DataBar :key="item.name+'missing'" style="min-width: calc(20vw + 50px); max-width: 100%;" :missing="+item.missing" :total="+total" />
        </template>
			</v-data-table>
    </div>
			<BigdataTable
				v-show="view==1"
				v-if="dataset && dataset.sample"
				:headerHeight="14"
				:rowHeight="22"
				:colWidth="170"
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
		},
		searchText: {
			default: ""
		}
	},

	data() {
		return {

      // searchText: '',
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
    tableItems() {
      return this.filteredColumns.map((e,i)=>{
        return {
          controls: true,
          name: e.name,
          type: e.column_type,
          dtype: e.column_dtype,
          missing: e.stats.count_na + " "
        }
      })
    },

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

		rowClicked (e) {
			this.$router.push(`${this.currentTab}/${e.name}`)
		},

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

      this.getVisibleColumns();
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
</style>
