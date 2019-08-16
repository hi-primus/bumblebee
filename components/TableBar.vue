<template>
	<div class="table-container">
		<v-flex xs12>
			<v-simple-table class="table-bar" v-show="view==0">
				<thead v-if="false">
					<tr>
						<th class>Data Type</th>
						<th class>Type</th>
						<th class>Name</th>
						<th class>Values</th>
					</tr>
				</thead>

				<tbody>
					<nuxt-link
						v-for="(col, index) in (filteredColumns)"
						:to="`/${currentTab}/${index}`"
						:key="index"
						tag="tr"
						class="hoverable"
					>
						<td
							style="max-width: 28px; padding-right: 0; padding-left: 4px"
							class="control-hide"
							@click.stop="hiddenColumns[col.name]=!hiddenColumns[col.name]; filterColumns()"
						>
							<v-tooltip bottom>
								<template v-slot:activator="{ on }">
                  <v-hover v-slot:default="{hover}">
                    <v-icon
                      v-on="on"
                      v-if="!!hover != !!hiddenColumns[col.name]"
                      style="opacity: 0.5"
                    >visibility_off</v-icon>
                    <v-icon v-on="on" v-else>visibility</v-icon>
                  </v-hover>
								</template>
								<span v-if="!hiddenColumns[col.name]">Hide column on table</span>
								<span v-else>Show column on table</span>
							</v-tooltip>
						</td>
						<td
							style="width: 64px;"
							class="column text-xs-left data-type"
							:class="`type-${col.column_dtype}`"
						>{{ dataType(col.column_dtype) }}</td>
						<td
							style="width: calc(15% - 84px);"
							class="column text-xs-left data-type-name"
						>{{ col.column_type }}</td>
						<td style="width:35%;" class="column text-xs-left data-name">{{ col.name }}</td>
						<td style="width:50%;" class="column text-xs-left">
							<DataBar :mismatches="col.stats.p_count_na" :total="+total" />
						</td>
					</nuxt-link>
				</tbody>
			</v-simple-table>
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
		</v-flex>
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
      default: "",
      type: String
    },
	},

	data() {
		return {
			filteredColumns: [],
			visibleColumns: [],
			hiddenColumns: {}
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
		}
	},

	watch: {
		searchText: {
			immediate: true,
			handler: "filterColumns"
		},

		hiddenColumns: {
			handler: "filterColumns",
			deep: true
		},

		currentTab: {
			handler() {
				// this.searchText = "";
			}
		}
	},

	methods: {
		async filterColumns() {
			try {

				this.filteredColumns = this.searchText
					? await this.$search(this.searchText, this.dataset.columns, {
							shouldSort: true,
							threshold: 0.1,
							keys: ["name"]
					  })
					: this.dataset.columns

				this.visibleColumns = this.filteredColumns.map( (e, index) => e.name ).filter(colName => {
					return !this.hiddenColumns[colName];
				});
			} catch (err) {
				console.error(err);
			}
		}
	}
};
</script>

<style lang="scss" scoped>
tbody {
	tr {
		td {
			height: 30px;
		}
	}
}

.controls-container {
	@include fluid-prop(
		max-width,
		(
			300px: 250px,
			980px: 900px,
			1920px: 1300px
		)
	);
	margin-left: auto;
	margin-right: auto;
}
</style>

<style lang="scss">
.table-bar {
	.v-icon {
		opacity: 0;
	}
	&.theme--light.v-data-table tbody tr:hover:not(.v-data-table__expand-row) {
		background: $data-highlight;
		.v-icon {
			opacity: 1;
		}
	}
  &.theme--light.v-data-table tbody tr:not(:last-child) {
    border-bottom: 0;
  }
}
</style>
