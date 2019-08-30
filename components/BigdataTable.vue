<template>
	<div
		class="vue-bigdata-table-outer"
		ref="outer"
		@DOMMouseScroll="handleScroll"
		@scroll="handleScroll"
		:style="{'--graphics-height': (showGraphic) ? graphicsHeight+'px' : '0', '--header-height': headerHeight+'px' }"
	>
		<style type="text/css" v-html="filterStyle"></style>
		<div :class="wrapperClasses" :style="tableWidthStyles">
			<div class="vue-bigdata-table-wrapper" ref="outWrapper">
				<div
					:class="['vue-bigdata-table-header-wrapper', fixed ? 'header-wrapper-fixed' : '']"
					:style="{transform: 'translateX(0)'}"
				>
					<slot name="top" :colWidthArr="widthArr"></slot>
					<table
						v-if="fixedCol >= 0"
						:class="['vue-bigdata-table-fixed-header', showFixedBoxShadow ? 'box-shadow' : '']"
						cellspacing="0"
						cellpadding="0"
						border="0"
					>
						<colgroup>
              <template v-for="(width, i) in widthArr">
                <col
                  v-if="(i <= fixedCol)"
                  :width="width"
                  :key="'header-key-fixed-' + i"
                />
              </template>
						</colgroup>
						<tr
							:style="{cursor: cursorOnHeader}"
							:data-update="updateID"
							@mousemove.capture.prevent="handleMousemove"
							@mousedown="handleMousedown"
							@mouseup="canNotMove"
							@mouseleave="canNotMove"
						>
              <template v-for="(col, i) in columnsHandled">
                <th
                  v-if="(i <= fixedCol)"
                  :data-index="i"
                  :key="`table-title-${i}`"
                  style="border-right: 1px solid #e9eaec;"
                >
                  <span v-if="!col.render">
                    {{ col.title }}
                    <sort-button
                      v-if="showSortBtn(i)"
                      :col-index="i"
                      @on-sort="handleSort"
                      @on-cancel-sort="handleCancelSort"
                      :current-sort-col-index="sortedByColIndex"
                      :current-sort-type="sortedType"
                    ></sort-button>
                  </span>
                  <render-dom v-else :render="col.render" :back-value="getComputedTableDataIndex(i)"></render-dom>
                </th>
              </template>
						</tr>
					</table>
					<table
						ref="headerTable"
						style="position: absolute;left: 0;top: 0;"
						cellspacing="0"
						cellpadding="0"
						border="0"
						width="100%"
					>
						<colgroup>
							<col :width="width" v-for="(width, i) in widthArr" :key="'header-key-' + i" />
						</colgroup>
						<tr
							class="table-header-titles"
							:style="{cursor: cursorOnHeader}"
							:data-update="updateID"
							@mousemove.capture.prevent="handleMousemove"
							@mousedown="handleMousedown"
							@mouseup="canNotMove"
							@mouseleave="canNotMove"
              v-if="$store.state.datasets[currentTab]"
						>
							<th
								v-for="(col, i) in columnsHandled"
								:data-index="i"
								:key="`table-title-${i}`"
								class="header-title-cell"
							>
								<span v-if="!col.render && (i > fixedCol)">
									<nuxt-link
										v-if="titleLinks"
										:to="`/${currentTab}/${col.title}`"
										class="hoverable header-title-link"
									></nuxt-link>
									<span
										class="data-type-in-table data-type"
										:class="`type-${$store.state.datasets[currentTab].columns[i].column_dtype}`"
									>{{ dataType($store.state.datasets[currentTab].columns[i].column_dtype) }}</span>
									<span class="table-header-text">{{ col.title }}</span>
									<sort-button
										v-if="showSortBtn(i)"
										:col-index="i"
										@on-sort="handleSort"
										@on-cancel-sort="handleCancelSort"
										@click.stop.prevent.capture="e=>e"
										:current-sort-col-index="sortedByColIndex"
										:current-sort-type="sortedType"
									></sort-button>
								</span>
								<render-dom
									v-else-if="(i > fixedCol)"
									:render="col.render"
									:back-value="getComputedTableDataIndex(i)"
								></render-dom>
							</th>
						</tr>
						<tr v-if="showGraphic" class="table-graphics">
							<td
								v-for="(column, key) in dataColumns"
								:key="`table-g-${key}`"
								style="border-right: 1px solid #e9eaec; border-bottom: 1px solid #e9eaec"
							>
								<DataBar
									class="table-data-bar"
									bottom
									:missing="$store.state.datasets[currentTab].columns[key].stats.count_na"
									:total="+$store.state.datasets[currentTab].summary.rows_count"
								/>
								<template v-if="column.stats.hist && column.stats.hist[0]">
									<Histogram table :values="column.stats.hist" :total="10" />
								</template>
								<template v-else-if="column.stats.hist && column.stats.hist.years">
									<Histogram table :values="column.stats.hist.years" :total="10" />
								</template>
								<template v-else-if="column.frequency">
									<Frequent table :values="column.frequency" :total="column.frequency[0].count" />
								</template>
							</td>
						</tr>
					</table>
				</div>
				<div class="vue-bigdata-table-content" @mousedown="handleMousedownOnTable">
					<div :style="{height: `${topPlaceholderHeight}px`}"></div>
					<render-dom :render="renderTable"></render-dom>
					<div :style="{height: `${bottomPlaceholderHeight}px`}"></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Histogram from "@/components/Histogram";
import Frequent from "@/components/Frequent";
import DataBar from "@/components/DataBar";
import VueBigdataTable from "vue-bigdata-table/src/vue-bigdata-table/vue-bigdata-table.vue";

import dataTypesMixin from "@/plugins/mixins/data-types";

export default {
	extends: VueBigdataTable,

	data() {
		return {
			filterStyle: ""
		};
	},

	components: {
		Histogram,
		Frequent,
		DataBar
	},

	mixins: [dataTypesMixin],

	props: {
		graphicsHeight: {
			type: Number,
			default: 80
		},
		dataColumns: {
			type: Array,
			default: []
		},
		visibleColumns: {
			type: Array,
			default: []
		},
		titleLinks: {
			type: Boolean,
			default: false
		},
		currentTab: {
			default: 0
		}
	},

	computed: {
		showGraphic() {
			return this.dataColumns != {};
		}
	},

	watch: {
		visibleColumns: {
			handler: "filterColumns",
			deep: true
		}
	},

	methods: {
		filterColumns() {
			try {
				let filterStyleArray = [];

				for (let i = 0; i < this.columns.length; i++) {
					if (!this.visibleColumns.includes(this.columns[i].title))
						filterStyleArray.push(
							`.vue-bigdata-table-wrapper tr>*:nth-child(${i + 1})`
						);
				}

				this.filterStyle =
					filterStyleArray.join(", ") +
					` {
          display: none;
        }`;
			} catch (err) {
				console.error(err);
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.vue-bigdata-table-header-wrapper {
	height: calc(
		calc(var(--graphics-height, 80px) + var(--header-height, 24px)) + 32px
	);
}
.table-graphics {
	& > td {
		vertical-align: top;
		height: calc(var(--graphics-height, 80px) + 16px);
		& > div {
			max-height: var(--graphics-height, 80px);
		}
	}
}

.table-data-bar {
	border-radius: 0;
	margin-bottom: 2px;
}
</style>
