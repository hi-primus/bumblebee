<template>
	<div>
    <v-sheet elevation="4" class="mb-6">
      <v-container fluid class="py-0">
        <v-layout row wrap align-center>
          <v-btn icon color="primary" to="/" tag="a" class="mr-2">
            <v-icon>arrow_back</v-icon>
          </v-btn>
          <v-flex grow>
            <h2 class="headline">{{ this.$route.params.id }}</h2>
          </v-flex>
          <v-flex>
            {{ dataType($store.state.dataset.columns[this.$route.params.id].column_dtype) }}
          </v-flex>
          <v-flex>
            {{ $store.state.dataset.columns[this.$route.params.id].column_type }}
          </v-flex>

          <v-flex xs12>
            <DataBar
              class="main-data-bar"
              :data1="$store.state.dataset.columns[this.$route.params.id].stats.missing_count"
              :total="+$store.state.dataset.rows_count"
            />
          </v-flex>
        </v-layout>
      </v-container>
    </v-sheet>
    <v-sheet elevation="4">
      <v-container class="px-12 pt-8">
			<v-layout row wrap>
				<v-flex xs12 sm3 md3 class="component-container">
					<Stats :values="$store.state.dataset.columns[this.$route.params.id].stats" />
				</v-flex>

				<v-flex
					v-if="$store.state.dataset.columns[this.$route.params.id].stats.quantile!=undefined"
					xs12
					sm3
					md3
					class="component-container"
				>
					<Quantile :values="$store.state.dataset.columns[this.$route.params.id].stats" />
				</v-flex>

				<v-flex
					v-if="$store.state.dataset.columns[this.$route.params.id].stats.quantile!=undefined"
					xs12
					sm3
					md3
					class="component-container"
				>
					<Descriptive :values="$store.state.dataset.columns[this.$route.params.id].stats" />
				</v-flex>

				<v-flex
					v-if="$store.state.dataset.columns[this.$route.params.id].stats.quantile==undefined"
					xs12
					sm6
					md6
					class="component-container"
				>
					<TopValues
						:values="$store.state.dataset.columns[this.$route.params.id].frequency"
						:total="+$store.state.dataset.columns[this.$route.params.id].frequency[0].count"
					/>
				</v-flex>

				<v-flex xs12 sm3 md3 class="component-container">
					<DataTypes :values="$store.state.dataset.columns[this.$route.params.id].dtypes_stats" />
				</v-flex>
			</v-layout>

			<v-layout row wrap>
				<v-flex
					v-if="$store.state.dataset.columns[this.$route.params.id].hist"
					xs12
					sm12
					md12
					class="component-container"
				>
					<Histogram
						:values="$store.state.dataset.columns[this.$route.params.id].hist"
						:total="+$store.state.dataset.rows_count"
						title="Histogram"
					/>
				</v-flex>

				<v-flex
					v-if="$store.state.dataset.columns[this.$route.params.id].hist_year_years"
					xs12
					sm12
					md12
					class="component-container"
				>
					<Histogram
						:values="$store.state.dataset.columns[this.$route.params.id].hist_year_years"
						:total="+$store.state.dataset.rows_count"
						title="Years Histogram"
					/>
				</v-flex>

				<v-flex
					v-if="$store.state.dataset.columns[this.$route.params.id].hist_year_months"
					xs12
					sm6
					md6
					class="component-container"
				>
					<Histogram
						:values="$store.state.dataset.columns[this.$route.params.id].hist_year_months"
						:total="+$store.state.dataset.rows_count"
						title="Months Histogram"
					/>
				</v-flex>

				<v-flex
					v-if="$store.state.dataset.columns[this.$route.params.id].hist_year_weekdays"
					xs12
					sm6
					md6
					class="component-container"
				>
					<Histogram
						:values="$store.state.dataset.columns[this.$route.params.id].hist_year_weekdays"
						:total="+$store.state.dataset.rows_count"
						title="Week days Histogram"
					/>
				</v-flex>

				<v-flex
					v-if="$store.state.dataset.columns[this.$route.params.id].hist_year_hours"
					xs12
					sm6
					md6
					class="component-container"
				>
					<Histogram
						:values="$store.state.dataset.columns[this.$route.params.id].hist_year_hours"
						:total="+$store.state.dataset.rows_count"
						title="Hours Histogram"
					/>
				</v-flex>

				<v-flex
					v-if="$store.state.dataset.columns[this.$route.params.id].hist_year_minutes"
					xs12
					sm6
					md6
					class="component-container"
				>
					<Histogram
						:values="$store.state.dataset.columns[this.$route.params.id].hist_year_minutes"
						:total="+$store.state.dataset.rows_count"
						title="Minutes Histogram"
					/>
				</v-flex>

				<v-flex xs12 sm12 md12 class="component-container">
					<Frequent
						:values="$store.state.dataset.columns[this.$route.params.id].frequency"
						:total="+$store.state.dataset.columns[this.$route.params.id].frequency[0].count"
					/>
				</v-flex>

				<v-flex
					v-if="$store.state.dataset.columns[this.$route.params.id].stats.quantile!=undefined"
					xs12
					sm12
					md12
					class="component-container"
				>
					<TopValues
						:values="$store.state.dataset.columns[this.$route.params.id].frequency"
						:total="+$store.state.dataset.rows_count"
					/>
				</v-flex>
			</v-layout>
		</v-container>
    </v-sheet>
	</div>
</template>

<script>
import TableBar from "@/components/TableBar";
import TopValues from "@/components/TopValues";
import Frequent from "@/components/Frequent";
import Stats from "@/components/Stats";
import Quantile from "@/components/QuantileStats";
import Descriptive from "@/components/DescriptiveStats";
import Histogram from "@/components/Histogram";
import DataBar from "@/components/DataBar";
import DataTypes from "@/components/DataTypes";
import dataTypesMixin from "~/plugins/mixins/data-types";

export default {
	components: {
		TableBar,
		TopValues,
		Stats,
		Quantile,
		Descriptive,
		Frequent,
		Histogram,
		DataBar,
		DataTypes
	},

	mixins: [dataTypesMixin],

	data() {
		return {};
	},

	mounted() {}
};
</script>

<style lang="scss">
  .pbar.main-data-bar {
    height: 8px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
</style>
