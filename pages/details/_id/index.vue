<template>

  <div>
    <v-btn icon to="/" tag="a">
      <v-icon>arrow_back</v-icon>
    </v-btn>
    <v-layout row wrap>

      <v-flex xs4 sm2 md2 flexclass="component-container">
        <h2 style="margin-top: -7px;">{{ this.$route.params.id }}</h2>
      </v-flex>

      <v-flex
        xs4
        sm1
        md1
        flexjustify-center
        align-content-center
        class="component-container">
        <p>{{ dataType($store.state.dataset.columns[this.$route.params.id].column_dtype) }}</p>
      </v-flex>

      <v-flex xs4 sm1 md1 flex>
        <p>{{ $store.state.dataset.columns[this.$route.params.id].column_type }}</p>
      </v-flex>

      <v-flex xs12 sm8 md8 class="component-container bar-adjust" >
        <DataBar :data1="$store.state.dataset.columns[this.$route.params.id].stats.missing_count" :total="+$store.state.dataset.rows_count"/>
      </v-flex>

    </v-layout>

    <v-layout row wrap>

      <v-flex xs12 sm3 md3 class="component-container" >
        <Stats :values="$store.state.dataset.columns[this.$route.params.id].stats"/>
      </v-flex>

      <v-flex v-if="$store.state.dataset.columns[this.$route.params.id].stats.quantile!=undefined" xs12 sm3 md3 class="component-container">
        <Quantile :values="$store.state.dataset.columns[this.$route.params.id].stats"/>
      </v-flex>

      <v-flex v-if="$store.state.dataset.columns[this.$route.params.id].stats.quantile!=undefined" xs12 sm3 md3 class="component-container">
        <Descriptive :values="$store.state.dataset.columns[this.$route.params.id].stats"/>
      </v-flex>

      <v-flex v-if="$store.state.dataset.columns[this.$route.params.id].stats.quantile==undefined" xs12 sm6 md6 class="component-container">
        <TopValues :values="$store.state.dataset.columns[this.$route.params.id].frequency" :total="+$store.state.dataset.columns[this.$route.params.id].frequency[0].count"/>
      </v-flex>

      <v-flex xs12 sm3 md3 class="component-container">
        <DataTypes :values="$store.state.dataset.columns[this.$route.params.id].dtypes_stats" />
      </v-flex>

    </v-layout>

    <v-layout row wrap>

      <v-flex v-if="$store.state.dataset.columns[this.$route.params.id].hist" xs12 sm12 md12 class="component-container">
        <Histogram :values="$store.state.dataset.columns[this.$route.params.id].hist" :total="+$store.state.dataset.rows_count" title="Histogram"/>
      </v-flex>

      <v-flex v-if="$store.state.dataset.columns[this.$route.params.id].hist_year_years" xs12 sm12 md12 class="component-container">
        <Histogram :values="$store.state.dataset.columns[this.$route.params.id].hist_year_years" :total="+$store.state.dataset.rows_count" title="Years Histogram"/>
      </v-flex>

      <v-flex v-if="$store.state.dataset.columns[this.$route.params.id].hist_year_months" xs12 sm6 md6 class="component-container">
        <Histogram :values="$store.state.dataset.columns[this.$route.params.id].hist_year_months" :total="+$store.state.dataset.rows_count" title="Months Histogram"/>
      </v-flex>

      <v-flex v-if="$store.state.dataset.columns[this.$route.params.id].hist_year_weekdays" xs12 sm6 md6 class="component-container">
        <Histogram :values="$store.state.dataset.columns[this.$route.params.id].hist_year_weekdays" :total="+$store.state.dataset.rows_count" title="Week days Histogram"/>
      </v-flex>

      <v-flex v-if="$store.state.dataset.columns[this.$route.params.id].hist_year_hours" xs12 sm6 md6 class="component-container">
        <Histogram :values="$store.state.dataset.columns[this.$route.params.id].hist_year_hours" :total="+$store.state.dataset.rows_count" title="Hours Histogram"/>
      </v-flex>

      <v-flex v-if="$store.state.dataset.columns[this.$route.params.id].hist_year_minutes" xs12 sm6 md6 class="component-container">
        <Histogram :values="$store.state.dataset.columns[this.$route.params.id].hist_year_minutes" :total="+$store.state.dataset.rows_count" title="Minutes Histogram"/>
      </v-flex>

      <v-flex xs12 sm12 md12 class="component-container" >
        <Frequent :values="$store.state.dataset.columns[this.$route.params.id].frequency" :total="+$store.state.dataset.columns[this.$route.params.id].frequency[0].count"/>
      </v-flex>

      <v-flex v-if="$store.state.dataset.columns[this.$route.params.id].stats.quantile!=undefined" xs12 sm12 md12 class="component-container">
        <TopValues :values="$store.state.dataset.columns[this.$route.params.id].frequency" :total="+$store.state.dataset.rows_count"/>
      </v-flex>

    </v-layout>
  </div>

</template>

<script>

import TableBar from '@/components/TableBar'
import TopValues from '@/components/TopValues'
import Frequent from '@/components/Frequent'
import Stats from '@/components/Stats'
import Quantile from '@/components/QuantileStats'
import Descriptive from '@/components/DescriptiveStats'
import Histogram from '@/components/Histogram'
import DataBar from '@/components/DataBar'
import DataTypes from '@/components/DataTypes'
import myMixin from '~/plugins/mixins'

export default {

	middleware: 'dataload',

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

	mixins: [myMixin],

	data () {
		return {

		}
	}

}
</script>
