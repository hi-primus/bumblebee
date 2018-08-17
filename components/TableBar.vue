<template>
  <div class="tablecontainer">
    <v-layout justify-end>
      <v-flex xs12 sm4 md4 class="text-xs-center">
        <v-text-field
          append-icon="search"
          v-model="searchText"
          label="Search Column"
        ></v-text-field>
      </v-flex>
    </v-layout>


    <table class="table is-fullwidth">

      <tbody v-for="(data, index) in filteredTable" :key="index">

      <nuxt-link tag="tr" :to="'/details/'+ arrDataset[index].name" class="hoverable">
        <td>{{arrDataset[index].column_type}}</td>
        <td>{{arrDataset[index].name}}</td>
        <td>
          <DataBar :data1="data.stats.missing_count" :total="total"/>
        </td>
      </nuxt-link>

      </tbody>

    </table>


  </div>
</template>

<script>

  import DataBar from '.././components/DataBar';

  export default {

    props: ['dataset', 'total'],

    components: {
      DataBar
    },

    data() {
      return {
        searchText: '',
        arrDataset: []
      }
    },
    computed: {

      filteredTable: function () {
        return this.arrDataset.filter((data) => {
          return data.name.match(this.searchText);
        })
      },

    },
    created() {
      this.arrDataset = Object.keys(this.dataset).map(i => this.dataset[i]);
    }
  }
</script>

<style lang="scss" scoped>

</style>
