<template>
  <div class="tablecontainer">
    <v-layout justify-end>
      <v-flex xs12 sm4 md4 class="text-xs-center">
        <v-text-field
          v-model="searchText"
          append-icon="search"
          label="Search column"
          :color="(filteredTable.length) ? 'success' : 'error'"
          clearable
          solo
        />
      </v-flex>
    </v-layout>

    <v-sheet elevation="4" class="pa-4">

      <v-btn-toggle mandatory v-model="viewMode" class="mb-4">
        <v-btn text>
          <v-icon>view_headline</v-icon>
        </v-btn>
        <v-btn text>
          <v-icon>view_module</v-icon>
        </v-btn>
      </v-btn-toggle>

      <v-simple-table class="table-bar" v-show="viewMode==0">

        <thead v-if="false">
          <tr>
            <th class="">Data Type</th>
            <th class="">Type</th>
            <th class="">Name</th>
            <th class="">Values</th>
          </tr>
        </thead>

        <tbody v-for="(data, index) in filteredTable" :key="index">

          <nuxt-link :to="'/details/'+ data.name" tag="tr" class="hoverable">
            <td style="width: 42px;" class="column text-xs-left data-type" :class="`type-${data.column_dtype}`">{{ dataType(data.column_dtype) }}</td>
            <td style="width: calc(15% - 42px);" class="column text-xs-left data-type-name">{{ data.column_type }}</td>
            <td style="width:35%;" class="column text-xs-left data-name">{{ data.name }}</td>
            <td style="width:50%;" class="column text-xs-left">
              <DataBar :data1="data.stats.missing_count" :total="+total"/>
            </td>
          </nuxt-link>

        </tbody>

      </v-simple-table>
      <BigdataTable
        v-show="viewMode==1"
        sortable
        disabledHover
        titleLinks
        :rowHeight="28"
        :sortIndex="0"
        :colWidth="120"
        :columns="$store.state.datasets[0].sample.columns"
        :value="$store.state.datasets[0].sample.parsedValue"
        :dataColumns="$store.state.datasets[0].columns"
        :filterColumns="searchText"
        @on-click-title="clickedTitle"
      />
    </v-sheet>

  </div>
</template>

<script>

import DataBar from '@/components/DataBar'
import dataTypesMixin from '@/plugins/mixins/data-types'
import BigdataTable from '@/components/BigdataTable'

export default {

	components: {
    DataBar,
    BigdataTable
	},

	mixins: [dataTypesMixin],

	props: {
		dataset: {
			default: {},
			type: Object
		},
		total: {
			default: 1,
			type: Number
		}
	},

	data () {
		return {
			searchText: '',
      arrDataset: [],
      viewMode: 0
		}
	},
	computed: {

		filteredTable () {
      if (!this.searchText)
        return this.arrDataset;

			const format = new RegExp('[ !@#$%^&*()_+-=[]{ };\':"\\|,.<>/?]')

			if (!format.test(this.searchText)) {
				return this.arrDataset.filter((data) => {
					return data.name.toLowerCase().match(this.searchText.toLowerCase())
				})
			}
		}

	},
	created () {
		this.arrDataset = Object.keys(this.dataset).map(i => this.dataset[i])
	},
}
</script>

<style lang="scss" scoped>
  tbody{
    tr{
      td{
        height: 30px;
      }
    }
  }

  .data-type {
    font-family: "Roboto Mono", monospace;
    transform-origin: 16px center;
    font-weight: 700;
    &.type-float, &.type-double {
      transform: scaleX(0.75);
    }
    &.type-int {
      font-weight: 400;
      transform: scaleX(1.5);
    }
  }
  .data-type-name {
    text-transform: uppercase;
    font-size: 0.66em;
  }
  .data-name {
    font-weight: 700;
  }
</style>
<style lang="scss">
  .table-bar {
    &.theme--light.v-data-table tbody tr:hover:not(.v-data-table__expand-row) {
      background: $data-highlight;
    }
  }
</style>
