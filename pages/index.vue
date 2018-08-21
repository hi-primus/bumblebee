<template>

  <div>
    <v-layout row wrap v-if="!$store.state.error">
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

    <v-layout row wrap v-if="$store.state.error">

      <v-jumbotron>
          <v-container fill-height>
            <v-layout align-center>
              <v-flex>
                <h3 class="display-3">Oops!</h3>

                <span class="subheading">The data.json file wasn't found or the file is not named properly.</span>

                <v-divider class="my-3"></v-divider>

                <div class="title mb-3">For additional help, please visit the repository</div>

                  <v-btn
                    class="mx-0"
                    color="primary"
                    large
                    href="https://github.com/ironmussa/Bumblebee"
                    target="_blank"
                  >
                    Go to repository
                  </v-btn>

              </v-flex>
            </v-layout>
          </v-container>
        </v-jumbotron>

    </v-layout>


  </div>

  

</template>

<script>
import TableBar from '@/components/TableBar';
import TopValues from '@/components/TopValues';
import Frequent from '@/components/Frequent';
import Stats from '@/components/Stats';

export default {

  middleware:'dataload',

  data(){
    return{
        dataset: [],
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
