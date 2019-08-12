<template>
  <v-layout row wrap>
    <template v-if="status=='waiting' || status=='loading'">
      <v-card
        width="100%"
        style="max-width: 700px; margin: auto"
        :loading="(status=='loading') ? 'success' : false"
      >
        <v-form @submit="subscribe" class="py-10 px-8">
          <v-card-title>
            <h1 class="display-3 mb-4">Bumblebee</h1>
          </v-card-title>
          <v-card-text>
              <v-text-field
                v-model="inputSession"
                label="Session"
                required
                outlined
                rounded
                clearable
              ></v-text-field>

              <v-text-field
                v-model="inputKey"
                :append-icon="showKey ? 'visibility' : 'visibility_off'"
                :type="(showKey) ? 'text' : 'password'"
                @click:append="showKey = !showKey"
                label="Key"
                required
                outlined
                rounded
                clearable
              ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" large rounded depressed @click="subscribe">Subscribe</v-btn>
            <v-spacer></v-spacer>
          </v-card-actions>
        </v-form>
      </v-card>
    </template>
    <template v-else-if="!statusError">
      <div v-if="$store.state.datasets.length==0" class="center-screen-inside success--text">
        <v-progress-circular
          indeterminate
          color="success"
          class="mr-4"
        />
        <span class="title">Waiting for data</span>
        <span class="subtitle text-center pt-6" style="width: 100%;">
          <span class="hoverable" @click="stopClient">
            <v-icon color="success">arrow_back</v-icon>
            Disconnect
          </span>
        </span>
      </div>
      <template v-else>
        <v-flex xs12 sm12 md12>
          <TableBar :dataset="$store.state.datasets[0].columns" :total="+$store.state.datasets[0].rows_count" />
        </v-flex>

        <v-footer fixed="fixed" app>
          <v-layout class="px-4" row justify-space-between>
            <span>Iron &copy; 2018</span>
            <span
              v-if="$store.state.datasets[0] && $store.state.datasets[0].summary"
            >Rows: {{ $store.state.datasets[0].rows_count }}, Columns: {{ $store.state.datasets[0].summary.cols_count }}, Size: {{ $store.state.datasets[0].summary.size }}</span>
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

  data() {
    return {
      showKey: false,
      inputKey: '',
      inputSession: '',
    }
  },

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
		},
		status () {
      return this.$store.state.status
		}
	},

  methods: {
    subscribe() {
      this.startClient(this.inputSession,this.inputKey)
    }
  }
}
</script>
