<template>
  <v-layout row wrap>

      <v-layout row wrap>

        <v-flex xs3 sm3 md3 class="component-container" >
          <h1>{{this.$route.params.id}}</h1>
          <p>{{$store.state.dataset.columns[this.$route.params.id].column_type}}</p>
        </v-flex>

        <v-flex xs9 sm9 md9 class="component-container bar-adjust" >
          <DataBar :data1="$store.state.dataset.columns[this.$route.params.id].stats.missing_count" :total="$store.state.dataset.rows_count"/>
        </v-flex>

      </v-layout>


      <v-flex xs12 sm12 md12 class="component-container" >
        <Stats :values="$store.state.dataset.columns[this.$route.params.id].stats"/>
      </v-flex>
      
      <v-flex xs12 sm12 md12 class="component-container"  v-if="$store.state.dataset.columns[this.$route.params.id].hist">
        <Histogram :values="$store.state.dataset.columns[this.$route.params.id].hist" :total="$store.state.dataset.rows_count"/>
      </v-flex>

      <v-flex xs12 sm12 md12 class="component-container" >
        <Frequent :values="$store.state.dataset.columns[this.$route.params.id].frequency" :total="$store.state.dataset.columns[this.$route.params.id].frequency[0].count"/>
      </v-flex>

      <v-flex xs12 sm12 md12 class="component-container" >
        <TopValues :values="$store.state.dataset.columns[this.$route.params.id].frequency" :total="$store.state.dataset.rows_count"/>
      </v-flex>

  </v-layout>
</template>

<script>

import TableBar from '@/components/TableBar';
import TopValues from '@/components/TopValues';
import Frequent from '@/components/Frequent';
import Stats from '@/components/Stats';
import Histogram from '@/components/Histogram';
import DataBar from '@/components/DataBar';

export default {

  middleware:'dataload',

  data(){
    return{

    }
  },

  components: {
    TableBar,
    TopValues,
    Stats,
    Frequent,
    Histogram,
    DataBar
  }

}
</script>
