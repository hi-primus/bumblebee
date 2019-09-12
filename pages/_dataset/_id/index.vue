<template>
  <Layout>
    <v-sheet elevation="0" class="mb-6 mt-4">
      <v-container fluid class="py-0">
        <v-layout row wrap align-center style="height: 48px">
          <v-btn icon color="grey darken-3" tag="a" class="mr-2" @click="back">
            <v-icon>arrow_back</v-icon>
          </v-btn>
          <v-flex grow>
            <h2 class="headline">{{ column.name }}</h2>
          </v-flex>
          <v-flex shrink class="data-type-name pr-4">
            {{ column.column_type }}
          </v-flex>
          <v-flex :class="`type-${column.column_dtype}`" shrink class="data-type pr-7">
            {{ dataType(column.column_dtype) }}
          </v-flex>

          <v-flex xs12>
            <DataBar
              :missing="column.stats.count_na"
              :total="+$store.state.datasets[this.$route.params.dataset].summary.rows_count"
              class="main-data-bar"
              bottom
            />
          </v-flex>
        </v-layout>
      </v-container>
    </v-sheet>
    <v-sheet elevation="0">
      <v-container class="px-12 pt-8">
        <v-layout row wrap>
          <v-flex xs12 sm3 md3 class="component-container">
            <Stats :values="column.stats" />
          </v-flex>

          <v-flex
            v-if="column.stats.quantile!=undefined"
            xs12
            sm3
            md3
            class="component-container"
          >
            <Quantile :values="column.stats" />
          </v-flex>

          <v-flex
            v-if="column.stats.quantile!=undefined"
            xs12
            sm3
            md3
            class="component-container"
          >
            <Descriptive :values="column.stats" />
          </v-flex>

          <v-flex
            v-if="column.stats.quantile==undefined"
            xs12
            sm6
            md6
            class="component-container"
          >
            <TopValues
              :values="column.frequency"
              :total="+column.frequency[0].count"
            />
          </v-flex>

          <v-flex xs12 sm3 md3 class="component-container">
            <DataTypes :values="column.dtypes_stats" />
          </v-flex>
        </v-layout>

        <v-layout row wrap>
          <template v-if="column.stats.hist">
            <v-flex
              v-if="column.stats.hist[0]"
              xs12
              sm12
              md12
              class="component-container"
            >
              <Histogram
                :values="column.stats.hist"
                :total="+$store.state.datasets[this.$route.params.dataset].summary.rows_count"
                title="Histogram"
              />
            </v-flex>

            <v-flex
              v-if="column.stats.hist.years"
              xs12
              sm12
              md12
              class="component-container"
            >
              <Histogram
                :values="column.stats.hist.years"
                :total="+$store.state.datasets[this.$route.params.dataset].summary.rows_count"
                title="Years Histogram"
              />
            </v-flex>

            <v-flex
              v-if="column.stats.hist.months"
              xs12
              sm6
              md6
              class="component-container"
            >
              <Histogram
                :values="column.stats.hist.months"
                :total="+$store.state.datasets[this.$route.params.dataset].summary.rows_count"
                title="Months Histogram"
              />
            </v-flex>

            <v-flex
              v-if="column.stats.hist.weekdays"
              xs12
              sm6
              md6
              class="component-container"
            >
              <Histogram
                :values="column.stats.hist.weekdays"
                :total="+$store.state.datasets[this.$route.params.dataset].summary.rows_count"
                title="Week days Histogram"
              />
            </v-flex>

            <v-flex
              v-if="column.stats.hist.hours"
              xs12
              sm6
              md6
              class="component-container"
            >
              <Histogram
                :values="column.stats.hist.hours"
                :total="+$store.state.datasets[this.$route.params.dataset].summary.rows_count"
                title="Hours Histogram"
              />
            </v-flex>

            <v-flex
              v-if="column.stats.hist.minutes"
              xs12
              sm6
              md6
              class="component-container"
            >
              <Histogram
                :values="column.stats.hist.minutes"
                :total="+$store.state.datasets[this.$route.params.dataset].summary.rows_count"
                title="Minutes Histogram"
              />
            </v-flex>

          </template>

          <v-flex xs12 sm12 md12 class="component-container">
            <Frequent
              :uniques="column.stats.count_uniques"
              :values="column.frequency"
              :total="+column.frequency[0].count"
            />
          </v-flex>

          <v-flex
            v-if="column.stats.quantile!=undefined"
            xs12
            sm12
            md12
            class="component-container"
          >
            <TopValues
              :values="column.frequency"
              :total="column.frequency[0].count"
            />
          </v-flex>
        </v-layout>
      </v-container>
    </v-sheet>
  </Layout>
</template>

<script>
import Layout from '@/components/Layout'
import TopValues from '@/components/TopValues'
import Frequent from '@/components/Frequent'
import Stats from '@/components/Stats'
import Quantile from '@/components/QuantileStats'
import Descriptive from '@/components/DescriptiveStats'
import Histogram from '@/components/Histogram'
import DataBar from '@/components/DataBar'
import DataTypes from '@/components/DataTypes'
import dataTypesMixin from '~/plugins/mixins/data-types'

export default {
	components: {
		Layout,
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

	computed: {
		column () {
			try {
				return this.$store.state.datasets[this.$route.params.dataset].columns.find((e) => { return e.name === this.$route.params.id })
			} catch (error) {
				this.$router.push('/')
			}
		}
	},

	methods: {
		back () {
			if (process.client && history.length > 2) {
				history.back()
			} else {
				this.$router.push('/')
			}
		}
	},

	validate ({ store, params }) {
		return true
	}
}
</script>

<style lang="scss">
  .data-bar.main-data-bar {
    height: 8px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
</style>
