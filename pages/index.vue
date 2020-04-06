<template>
  <Layout>
    <v-dialog v-if="$store.state.datasets[confirmDelete]" :value="confirmDelete>=0" max-width="290" @click:outside="confirmDelete=-1">
      <v-card>
        <v-card-title class="title">Close tab</v-card-title>
        <v-card-text>
          Close "{{ $store.state.datasets[confirmDelete].name }}"?
        </v-card-text>
        <v-card-actions>
          <div class="flex-grow-1"/>
          <v-btn
            color="primary"
            text
            @click="confirmDelete=-1"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="deleteTab(confirmDelete)"
          >
            Accept
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-layout row wrap class="elevation-0 d-flex flex-column align-top justify-start">
      <template v-if="status=='waiting' || status=='loading' || statusError">
        <v-card
          :loading="(status=='loading') ? 'primary' : false"
          class="elevation-0"
          width="100%"
          style="max-width: 700px; margin: auto"
        >
          <v-form class="py-8 px-6" @submit="subscribe">
            <v-card-title>
              <h1 class="display-3 mb-4">Bumblebee</h1>
            </v-card-title>
            <v-card-text>
              <v-text-field
                v-model="inputUsername"
                label="Username"
                required
                outlined
                clearable
              />

              <v-text-field
                v-if="$route.query.kernel=='1'"
                v-model="inputPassword"
                :append-icon="showPassword ? 'visibility' : 'visibility_off'"
                :type="(showPassword) ? 'text' : 'password'"
                autocomplete="current-password"
                label="Password"
                required
                outlined
                clearable
                @click:append="showPassword = !showPassword"
              />
              <v-text-field
                v-else
                v-model="inputPassword"
                :append-icon="showPassword ? 'visibility' : 'visibility_off'"
                :type="(showPassword) ? 'text' : 'password'"
                autocomplete="current-key"
                label="Key"
                required
                outlined
                clearable
                @click:append="showPassword = !showPassword"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer/>
              <v-btn color="primary darken-1" large depressed @click="subscribe">{{($route.query.kernel=='1') ? 'Sign in' : 'Subscribe'}}</v-btn>
              <v-spacer/>
            </v-card-actions>
            <v-card-text v-if="statusError" class="pb-0" >
              <v-alert type="error" class="mb-2" dismissible @input="resetStatus($event)">
                {{ status.message }}
              </v-alert>
            </v-card-text>
          </v-form>
        </v-card>
      </template>
      <template v-else-if="!statusError">
        <template v-if="$store.state.datasets.length==0">
          <div class="center-screen-inside black--text">
            <v-progress-circular
              indeterminate
              color="black"
              class="mr-4"
            />
            <span class="title">Waiting for data</span>
            <div class="mb-8" style="width: 100%"/>
            <v-card class="elevation-0">
              <v-card-text class="title mb-2">Now send info from your notebook. Try something like:</v-card-text>
              <v-card-text class="subtitle text-code">
                <span class="comment"># Install Optimus</span><br>
                !pip install optimuspyspark<br>
                <br>
                <span class="comment"># Load Optimus</span><br>
                <span class="keyword">from</span> optimus <span class="keyword">import</span> Optimus<br>
                <br>
                <span class="comment"># Let's Optimus call Bumblebee</span><br>
                op = Optimus(comm=<span class="keyword">True</span>)<br>
                <br>
                <span class="comment"># Load some data</span><br>
                df = op.load.csv(<span class="string">"https://raw.githubusercontent.com/ironmussa/Optimus/master/examples/data/Meteorite_Landings.csv"</span>)<br>
                <br>
                <span class="comment"># Visualize</span><br>
                df.ext.send(<span class="string">"Meteorite"</span>)
              </v-card-text>
            </v-card>

          </div>
          <v-icon class="back-btn" large color="black" @click="stopClient">arrow_back</v-icon>
        </template>
        <div v-else class="bb-container">
          <v-tabs
            :key="$store.state.datasetUpdates"
            v-model="tab"
            class="bb-tabs px-6"
            background-color="#fff"
            show-arrows
            center-active
            style="flex: 0;"
          >
            <v-tab v-for="(_tab, key) in $store.state.datasets" :key="key" class="bb-tab" >
              <span class="tab-title">
                {{ _tab.name || key+1 }}
              </span>
              <span class="tab-subtitle">
                {{ _tab.file_name }}
              </span>
              <v-hover v-slot:default="{ hover }">
                <v-icon
                  :color="hover ? 'primary darken-1' : ''"
                  small
                  class="close-icon"
                  @click.stop="confirmDelete=key;"
                >
                  close
                </v-icon>
              </v-hover>
            </v-tab>
            <v-tab class="new-tab" color="primary darken-1" @click="$store.commit('newDataset')">
              <v-icon color="primary">
                add
              </v-icon>
            </v-tab>
          </v-tabs>
          <div class="bb-content">
            <div class="controls-container text-xs-center">
              <v-text-field
                autocomplete="off"
                v-model="searchText"
                :color="'grey darken-3'"
                clearable
                dense
                full-width
                solo flat
                class="search-filter mt-2 mr-4 elevation-0"
                prepend-inner-icon="search"
                label="Search column"
                :disabled="!(currentDataset && currentDataset.summary)"
              />
              <div class="filter-container">
                <v-autocomplete
                  autocomplete="off"
                  ref="autocomplete"
                  v-model="typesSelected"
                  :items="typesAvailable"
                  :append-icon="''"
                  :search-input.sync="typesInput"
                  dense
                  full-width
                  solo flat
                  chips
                  deletable-chips
                  color="grey darken-3"
                  class="placeholder-chip primary--chips capitalized--chips"
                  label="Data type"
                  hide-details
                  hide-no-data
                  hide-selected
                  multiple
                  single-line
                  :menu-props="{
                    closeOnContentClick: true
                  }"
                  @change="typesUpdated"
                  :disabled="!(currentDataset && currentDataset.summary)"
                >
                  <template v-slot:item="{ item }">
                    <div class="data-type in-autocomplete">{{ dataType(item) }}</div> <span class="capitalize">{{ item }}</span>
                  </template>
                </v-autocomplete>
              </div>
            </div>
            <TableBar
              ref="tableBar"
              v-if="currentDataset"
              :dataset="currentDataset"
              :total="(currentDataset.summary) ? +currentDataset.summary.rows_count : 1"
              :searchText="searchText"
              :types-selected="typesSelected"
            />
          </div>

          <v-footer fixed="fixed" app>
            <v-layout class="px-4" row justify-space-between>
              <span/>
              <span
                v-if="currentDataset && currentDataset.summary"
                class="caption-2"
              >
                <template v-if="currentDataset.total_count_dtypes">
                  {{ currentDataset.total_count_dtypes | formatNumberInt }} Data types &emsp;
                </template>
                <template v-if="sampleSize">
                  {{ sampleSize | formatNumberInt }} of
                </template>
                <template v-if="currentDataset.summary.rows_count">
                  {{ currentDataset.summary.rows_count | formatNumberInt }} Rows &emsp;
                </template>
                <template v-if="currentDataset.summary.cols_count">
                  {{ currentDataset.summary.cols_count | formatNumberInt }} Columns
                </template>
              </span>
            </v-layout>
          </v-footer>
        </div>
      </template>
    </v-layout>
  </Layout>
</template>

<script>
import Layout from '@/components/Layout'
import TableBar from '@/components/TableBar'
import clientMixin from '@/plugins/mixins/client'
import dataTypesMixin from '@/plugins/mixins/data-types'
import { printError } from '@/utils/functions.js'

import { mapGetters } from 'vuex'

const { version } = require('@/package.json')
const api_url = process.env.API_URL || 'http://localhost:5000'

export default {

	components: {
		Layout,
    TableBar,
	},

	mixins: [clientMixin, dataTypesMixin],

	data () {
		return {
			showPassword: false,
			inputPassword: '',
			inputUsername: '',
			inputEngine: 'dask',
			searchText: '',
			tab: undefined,
			confirmDelete: -1,
			typesSelected: [],
			typesInput: '',
			version: ''
		}
	},

	computed: {

    ...mapGetters(['currentDataset','typesAvailable']),

    sampleSize () {
      return Math.min(this.currentDataset.summary.sample_size, this.currentDataset.summary.rows_count)
    },

		statusError () {
			return (!!this.$store.state.status.message)
		},
		status () {
			return this.$store.state.status
		}
	},

	watch: {

    async status (value) {
      if (this.$route.query.kernel=='1') {
        switch (value) {
          case 'receiving back':
            this.stopClient(true)
            this.$store.commit('setCells', [])
            break;
          case 'receiving':
							this.$store.commit('kernel','loading')
              if (!this.$store.state.datasets.length) {
								this.$store.commit('newDataset')
							}
              var response = await this.socketPost('initialize',
              {
                session: this.$store.state.session,
                engine: this.$store.state.engine
              })

              if (response.data.optimus) {
                console.log('Optimus initialized',response.data)
								this.$store.commit('kernel','done')
							}
							else {
                printError(response)
								this.$store.commit('status','waiting')
								this.$store.commit('status','receiving')
							}
            break;

          default:
            break;
        }
      }

      if (value=='receiving') {
        var dataset_csv = this.$route.query.dataset_csv
        if (dataset_csv) {
          this.$refs.tableBar & this.$refs.tableBar.commandHandle({
            command: 'load file',
            noOperations: true,
            immediate: true,
            payload: {url: dataset_csv}
          })
        }
      }
    },

		tab (value) {
			if (value === undefined) {
				return
      }

      let dataset = this.$store.state.datasets[value]

			if (value !== undefined && !dataset) {
        this.tab = (this.$store.state.datasets[0]) ? 0 : undefined
        this.$store.commit('setTab', { tab: 0 })
				return
      }

      this.$store.commit('setTab',{ tab: value })

    },

    confirmDelete (value) {
      // TODO: Remove confirmation on empty datasets
    }
	},

	mounted () {
		console.log(`Bumblebee v${version}`)

		// this.inputUsername = this.$route.query.username || ''
    // this.inputPassword = this.$route.query.password || ''
    this.inputEngine = this.$route.query.engine || 'dask'

		// if (this.inputUsername && this.inputPassword) {
    //   this.subscribe()
		// }
	},

	methods: {

		typesUpdated () {
      this.typesInput = ''
      this.$refs.autocomplete.loseFocus
		},
		async subscribe () {
      try {
        if (this.$route.query.kernel=='1') {
          var login = await this.$store.dispatch('auth/login',{ username: this.inputUsername, password: this.inputPassword })
			    this.startClient(this.inputUsername, false, this.inputEngine)
        } else {
			    this.startClient(this.inputUsername, this.inputPassword, this.inputEngine)
        }
      } catch (error) {
        console.error(error)
        this.handleError(error)
      }
		},
		resetStatus (closing) {
			if (!closing) { this.$store.commit('status') }
		},
		deleteTab (i) {
			this.$store.commit('delete', { index: i })
			this.confirmDelete = -1
			if (!this.$store.state.datasets.length) {
				this.tab = 0
			} else if (this.tab >= this.$store.state.datasets.length) {
				this.tab = this.$store.state.datasets.length - 1
			}
			this.$forceUpdate()
		}
	}
}
</script>

<style lang="scss">
  .datasets-tabs {
    border-radius: 4px;
    overflow: hidden;
  }
</style>
