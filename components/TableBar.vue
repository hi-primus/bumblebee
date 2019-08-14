<template>
  <div class="table-container">

    <v-flex xs12 class="controls-container text-xs-center d-flex">
      <v-btn-toggle
        mandatory :value="view"
        @change="$emit('update:view',$event)"
        class=""

      >
        <v-btn text>
          <v-icon>view_headline</v-icon>
        </v-btn>
        <v-btn text>
          <v-icon>view_module</v-icon>
        </v-btn>
      </v-btn-toggle>
      <v-spacer></v-spacer>
      <v-text-field
        style="max-width: 500px"
        v-model="searchText"
        append-icon="search"
        label="Search column"
        :color="(filteredTable.length) ? 'info darken-1' : 'error'"
        clearable
      />
    </v-flex>

    <v-flex xs12>

      <v-simple-table class="table-bar" v-show="view==0">

        <thead v-if="false">
          <tr>
            <th class="">Data Type</th>
            <th class="">Type</th>
            <th class="">Name</th>
            <th class="">Values</th>
          </tr>
        </thead>

        <tbody v-for="(data, index) in (searchText ? filteredTable : dataset.columns)" :key="index">

          <nuxt-link :to="`/${currentTab}/${data.name}`" tag="tr" class="hoverable">
            <td style="width: 42px;" class="column text-xs-left data-type" :class="`type-${data.column_dtype}`">{{ dataType(data.column_dtype) }}</td>
            <td style="width: calc(15% - 42px);" class="column text-xs-left data-type-name">{{ data.column_type }}</td>
            <td style="width:35%;" class="column text-xs-left data-name">{{ data.name }}</td>
            <td style="width:50%;" class="column text-xs-left">
              <DataBar :mismatches="data.stats.missing_count" :total="+total"/>
            </td>
          </nuxt-link>

        </tbody>

      </v-simple-table>
      <BigdataTable
        v-show="view==1"
        v-if="dataset && dataset.sample"
        sortable
        disabledHover
        titleLinks
        :currentTab="currentTab"
        :rowHeight="24"
        :sortIndex="sortIndex"
        :colWidth="120"
        :columns="dataset.sample.columns"
        :value="dataset.sample.value"
        :dataColumns="dataset.columns"
        :filterColumns="searchText"
        style="max-height: calc(90vh - 200px)"
      />
    </v-flex>
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
			default: ()=>{return {}},
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
      default: ''
    }
	},

	data () {
		return {
			searchText: '',
      filteredTable: []
		}
  },

  watch: {
    searchText: {

      immediate: true,

      async handler () {
        try {
          if (this.searchText=='') {
            this.filteredTable = this.dataset.columns
          }
          else {
            this.filteredTable = await this.$search(this.searchText, this.dataset, {
              shouldSort: true,
              tokenize: true,
              keys: [
                "name"
              ]
            })
          }
        } catch (err) {
          console.error(err)
        }
      }
    },

    currentTab: {
      handler () {
        this.searchText = ''
      }
    }
  },

	computed: {

    sortIndex () {
      return this.dataset.sample.columns.map((e,i)=>i)
    },

	}
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

  .controls-container {
    @include fluid-prop(max-width, (300px: 250px, 980px: 900px, 1920px: 1300px));
    margin-left: auto;
    margin-right: auto;
  }

</style>

<style lang="scss">
  .table-bar {
    &.theme--light.v-data-table tbody tr:hover:not(.v-data-table__expand-row) {
      background: $data-highlight;
    }
  }
</style>
