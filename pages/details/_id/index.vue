<template>
  <v-layout row wrap>

      <v-flex xs12 sm12 md12>
        <h1>{{this.$route.params.id}} detailed view</h1>
      </v-flex>

      <v-flex xs12 sm6 md6>
        <TopValues :values="$store.state.dataset.columns[this.$route.params.id].frequency" :total="$store.state.dataset.rows_count"/>
      </v-flex>

      <v-flex xs12 sm6 md6>
        <Frequent :values="$store.state.dataset.columns[this.$route.params.id].frequency" :total="$store.state.dataset.columns[this.$route.params.id].frequency[0].count"/>
      </v-flex>

      <v-flex xs12 sm12 md12>
        <Stats :values="$store.state.dataset.columns[this.$route.params.id].stats"/>
      </v-flex>

      <v-flex xs12 sm12 md12 v-if="$store.state.dataset.columns[this.$route.params.id].hist">
        <Histogram :values="$store.state.dataset.columns[this.$route.params.id].hist" :total="$store.state.dataset.rows_count"/>
      </v-flex>


  </v-layout>
</template>

<script>

import TableBar from '@/components/TableBar';
import TopValues from '@/components/TopValues';
import Frequent from '@/components/Frequent';
import Stats from '@/components/Stats';
import Histogram from '@/components/Histogram';

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
    Histogram
  }

}
</script>
