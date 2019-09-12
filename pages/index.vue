<template>
  <Layout :wide="view==1">
    <v-dialog v-if="$store.state.datasets[confirmDelete]" :value="confirmDelete>=0" max-width="290" @click:outside="confirmDelete=-1">
      <v-card>
        <v-card-title class="title">Close tab</v-card-title>
        <v-card-text>
          Close <span class="text-uppercase">"{{ $store.state.datasets[confirmDelete].name }}"</span>?
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
                label="Session"
                required
                outlined
                clearable
              />

              <v-text-field
                v-model="inputKey"
                :append-icon="showKey ? 'visibility' : 'visibility_off'"
                :type="(showKey) ? 'text' : 'password'"
                label="Key"
                required
                outlined
                clearable
                @click:append="showKey = !showKey"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer/>
              <v-btn color="primary" large depressed @click="subscribe">Subscribe</v-btn>
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
                df.send(<span class="string">"Meteorite"</span>)
              </v-card-text>
            </v-card>

          </div>
          <v-icon class="back-btn" large color="black" @click="stopClient">arrow_back</v-icon>
        </template>
        <div v-else class="bb-container">
          <v-tabs
            v-model="tab"
            class="bb-tabs px-6"
            background-color="#fff"
            show-arrows
            center-active
            style="flex: 0;"
          >
            <v-tab v-for="(_tab, key) in $store.state.datasets" :key="key" >
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
          </v-tabs>
          <v-card-text class="pa-0">
            <div class="controls-section grey--bg">
              <div :class="{'inside-bar': view==1}" class="controls-container text-xs-center">
                <v-text-field
                  v-model="searchText"
                  :color="'grey darken-3'"
                  clearable
                  dense
                  full-width
                  class="search-filter mt-2 mr-4 elevation-0"
                  prepend-inner-icon="search"
                  label="Search column"
                />
                <div class="filter-container">
                  <v-autocomplete
                    v-model="typesSelected"
                    :items="typesAvailable"
                    :append-icon="''"
                    :search-input.sync="typesInput"
                    dense
                    full-width
                    chips
                    deletable-chips
                    color="grey darken-3"
                    class="placeholder-chip"
                    label="Data type"
                    hide-details
                    hide-no-data
                    hide-selected
                    multiple
                    single-line
                    @change="typesUpdated"
                  >
                    <template v-slot:item="{ item }">
                      <div class="data-type in-autocomplete">{{ dataType(item.value) }}</div> {{ item.text }}
                    </template>
                  </v-autocomplete>
                </div>
              </div>
            </div>
            <TableBar
              :key="tableKey"
              :current-tab="tab"
              :view.sync="view"
              :dataset="$store.state.datasets[tab]"
              :total="+$store.state.datasets[tab].summary.rows_count"
              :search-text="searchText"
              :types-selected="typesSelected"
            />
          </v-card-text>

          <v-footer fixed="fixed" app>
            <v-layout class="px-4" row justify-space-between>
              <span/>
              <span
                v-if="$store.state.datasets[tab] && $store.state.datasets[tab].summary"
                class="caption-2"
              >
                <template v-if="$store.state.datasets[tab].total_count_dtypes">
                  {{ $store.state.datasets[tab].total_count_dtypes | formatNumberInt }} Data types &emsp;
                </template>
                {{ $store.state.datasets[tab].summary.rows_count | formatNumberInt }} Rows &emsp; {{ $store.state.datasets[tab].summary.cols_count | formatNumberInt }} Columns &emsp; Size: {{ $store.state.datasets[tab].summary.size }}
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

const { version } = require('@/package.json')

export default {

	components: {
		Layout,
		TableBar
	},

	mixins: [clientMixin, dataTypesMixin],

	data () {
		return {
			showKey: false,
			inputKey: '',
			inputUsername: '',
			searchText: '',
			tab: undefined,
			view: undefined,
			confirmDelete: -1,
			typesAvailable: [
				{ text: 'String', value: 'string' },
				{ text: 'Integer', value: 'int' },
				{ text: 'Decimal', value: 'decimal' },
				{ text: 'Date', value: 'date' },
				{ text: 'Boolean', value: 'boolean' },
				{ text: 'Binary', value: 'binary' },
				{ text: 'Array', value: 'array' },
				{ text: 'Null', value: 'null' }
			],
			typesSelected: [],
			typesInput: '',
			version: ''
		}
	},

	computed: {
		tableKey () {
			return this.$store.state.datasetUpdates * 100 + this.tab
		},
		statusError () {
			return (!!this.$store.state.status.message)
		},
		status () {
			return this.$store.state.status
		}
	},

	watch: {
		tab (value) {
			if (value === undefined) {
				return
			}

			if (value !== 0 && !this.$store.state.datasets[value]) {
				this.tab = 0
				return
			}

			this.$router.replace({ path: this.$route.fullPath, query: { tab: value } }, () => {
				history.replaceState('Dashboard', 'Bumblebee', this.$route.fullPath)
			})
		},
		view (value) {
			if (value === undefined) { return }
			this.$router.replace({ path: this.$route.fullPath, query: { view: value } }, () => {
				history.replaceState('Dashboard', 'Bumblebee', this.$route.fullPath)
			})
		}
	},

	created () {
		this.tab = +(this.$route.query.tab || 0)
		this.view = +(this.$route.query.view || 0)
	},

	async mounted () {
		console.log(`bumblebee v${version}`)

		this.inputUsername = this.$route.query.session || ''
		this.inputKey = this.$route.query.key || ''
		if (this.inputUsername && this.inputUsername) {
			this.subscribe()
		}
	},

	methods: {
		typesUpdated () {
			this.typesInput = ''
		},
		subscribe () {
			this.startClient(this.inputUsername, this.inputKey)
		},
		resetStatus (closing) {
			if (!closing) { this.$store.commit('status') }
		},
		deleteTab (i) {
			const deleted = this.$store.commit('delete', { index: i })
			this.confirmDelete = -1
			if (this.$store.state.datasets.length == 0) {
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
