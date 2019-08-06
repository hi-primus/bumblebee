<template>
  <v-layout row wrap>
    <template v-if="!statusError">
      <div v-if="$store.state.dataset===false" class="center-screen-inside">
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </div>
      <template v-else>
        <v-flex xs12 sm12 md12>
          <TableBar :dataset="$store.state.dataset.columns" :total="+$store.state.dataset.rows_count" />
        </v-flex>

        <v-footer fixed="fixed" app>
          <v-layout class="px-4" row justify-space-between>
            <span>Iron &copy; 2018</span>
            <span
              v-if="$store.state.dataset && $store.state.dataset.summary"
            >Rows: {{ $store.state.dataset.rows_count }}, Columns: {{ $store.state.dataset.summary.cols_count }}, Size: {{ $store.state.dataset.summary.size }}</span>
          </v-layout>
        </v-footer>
      </template>
    </template>
    <template v-else style="min-height: 400px;">
      <v-container fluid fill-height>
        <v-layout align-center>
          <v-flex>
            <h3 class="display-3">Oops!</h3>

            <span class="subheading">There was an error loading your data.</span>

            <v-divider class="my-8" />

            <div class="title mb-8">For additional help, please visit the repository</div>

            <v-btn
              class="mx-0"
              color="primary"
              large
              href="https://github.com/ironmussa/Bumblebee"
              target="_blank"
            >Go to repository</v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </template>
  </v-layout>
</template>

<script>
import TableBar from '@/components/TableBar'
import TopValues from '@/components/TopValues'
import Frequent from '@/components/Frequent'
import Stats from '@/components/Stats'
import clientMixin from '@/plugins/mixins/client'

export default {
	components: {
		TableBar,
		TopValues,
		Stats,
		Frequent
	},

	mixins: [clientMixin],

	computed: {
		statusError () {
			try {
				return (typeof this.$store.state.status === Object && this.$store.state.status instanceof Error)
			} catch {
				return false
			}
		}
	},

	mounted () {
		this.startClient('e68a9789-8a04-4bc1-9467-1b8f9517f401')
	}
}
</script>
