<template>
  <div class="tablecontainer">
    <v-layout justify-end>
      <v-flex xs12 sm4 md4 class="text-xs-center">
        <v-text-field
          append-icon="search"
          label="Search Column"
          v-model="searchText"
        ></v-text-field>
      </v-flex>
    </v-layout>



    <table class="table">

      <thead>
        <tr>
          <th class="">Data Type</th>
          <th class="">Type</th>
          <th class="">Name</th>
          <th class="">Values</th>
        </tr>
      </thead>

      <tbody v-for="(data, index) in filteredTable" :key="index">
        

      <nuxt-link tag="tr" :to="'/details/'+ data.name" class="hoverable">
        <td style="width:25%;" class="column text-xs-left">{{dataType(data.column_dtype)}}</td>
        <td style="width:25%;" class="column text-xs-left">{{data.column_type}}</td>
        <td style="width:25%;" class="column text-xs-left">{{data.name}}</td>
        <td style="width:25%;" class="column text-xs-left">
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

      filteredTable(){

        var format = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

        if( !format.test(this.searchText) ){
          
          return this.arrDataset.filter((data) => {
  
            return data.name.toLowerCase().match(this.searchText.toLowerCase());
  
          })

        }




      }

    },
    methods:{
      dataType(data){
        if(data == 'string'){
          return 'ABC';
        }
        else if(data == 'int'){
          return '#';
        }
        else if(data == 'float'){
          return '##.#';
        }
        else if(data == 'boolean'){
          return '0/1';
        }
        else if(data == 'date'){
          return '##/##/####';
        }

      },

    },
    created() {
      this.arrDataset = Object.keys(this.dataset).map(i => this.dataset[i]);
    }
  }
</script>

<style lang="scss" scoped>

</style>
