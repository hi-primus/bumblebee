<template>
  <v-layout row wrap>


      <v-flex xs12 sm12 md12>
        <TableBar :dataset="$store.state.dataset.columns" :total="$store.state.dataset.rows_count"/>
      </v-flex>

    <v-footer fixed="fixed" app>
      <v-layout row justify-space-between>
        <span>Iron &copy; 2018</span>
        <span>Rows: {{$store.state.dataset.rows_count}},  Columns: {{$store.state.dataset.summary.cols_count}}, Size: {{$store.state.dataset.summary.size}} </span>
      </v-layout>
    </v-footer>
  </v-layout>
</template>

<script>
import TableBar from '@/components/TableBar';
import TopValues from '@/components/TopValues';
import Frequent from '@/components/Frequent';
import Stats from '@/components/Stats';
import Logo from '~/components/Logo.vue'
import VuetifyLogo from '~/components/VuetifyLogo.vue'

export default {

  middleware:'dataload',

  data(){
    return{
        dataset: []
    }
  },

  components: {
    TableBar,
    TopValues,
    Stats,
    Frequent
  }

}
</script>
