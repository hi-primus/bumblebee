<template>
  <Layout :wide="view==1">
    <v-dialog max-width="290" v-if="$store.state.datasets[confirmDelete]" :value="confirmDelete>=0" @click:outside="confirmDelete=-1">
      <v-card>
        <v-card-title class="title">Close tab</v-card-title>
        <v-card-text>
          Close <span class="text-uppercase">"{{$store.state.datasets[confirmDelete].name}}"</span>?
        </v-card-text>
        <v-card-actions>
          <div class="flex-grow-1"></div>
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
          class="elevation-0"
          width="100%"
          style="max-width: 700px; margin: auto"
          :loading="(status=='loading') ? 'primary' : false"
        >
          <v-form @submit="subscribe" class="py-8 px-6">
            <v-card-title>
              <h1 class="display-3 mb-4">Bumblebee</h1>
            </v-card-title>
            <v-card-text>
              <v-text-field
                v-model="inputSession"
                label="Session"
                required
                outlined
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
                clearable
              ></v-text-field>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" large rounded depressed @click="subscribe">Subscribe</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
            <v-card-text class="pb-0" v-if="statusError" >
              <v-alert type="error" class="mb-2" dismissible @input="resetStatus($event)">
                {{status.message}}
              </v-alert>
            </v-card-text>
          </v-form>
        </v-card>
      </template>
      <template v-else-if="!statusError">
        <div v-if="$store.state.datasets.length==0" class="center-screen-inside primary--text">
          <v-progress-circular
            indeterminate
            color="primary"
            class="mr-4"
          />
          <span class="title">Waiting for data</span>
          <span class="subtitle text-center pt-6" style="width: 100%;">
            <span class="hoverable" @click="stopClient">
              <v-icon color="primary">arrow_back</v-icon>
              Disconnect
            </span>
          </span>
        </div>
        <template v-else>
            <!-- <v-card class="b-view-card elevation-0 d-flex flex-column align-top justify-start" style="width: 100%;"> -->
                <!-- color="primary darken-2" -->
              <v-tabs
                class="bb-tabs px-6"
                background-color="#fff"
                v-model="tab"
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
                      @click.stop="confirmDelete=key;"
                      small
                      class="close-icon"
                    >
                      close
                    </v-icon>
                  </v-hover>
                </v-tab>
              </v-tabs>
              <v-card-text class="pa-0">
                <div class="controls-section grey--bg">
                  <div class="controls-container text-xs-center" :class="{'inside-bar': view==1}">
                    <v-text-field
                      clearable
                      dense
                      full-width
                      class="search-filter mt-2 mr-4 elevation-0"
                      v-model="searchText"
                      prepend-inner-icon="search"
                      label="Search column"
                      :color="'grey darken-3'"
                    />
                    <div class="filter-container">
                      <v-autocomplete
                        dense
                        full-width
                        v-model="typesSelected"
                        :items="typesAvailable"
                        :append-icon="''"
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
                      >
                        <template v-slot:item="{ item }">
                          <div class="data-type in-autocomplete">{{dataType(item.value)}}</div> {{item.text}}
                        </template>
                      </v-autocomplete>
                    </div>
                  </div>
                </div>
                <TableBar
                  :key="tab"
                  :currentTab="tab"
                  :view.sync="view"
                  :dataset="currentDataset"
                  :total="+currentDataset.summary.rows_count"
                  :searchText="searchText"
                  :typesSelected="typesSelected"
                />
              </v-card-text>
            <!-- </v-card> -->

          <v-footer fixed="fixed" app>
            <v-layout class="px-4" row justify-space-between>
              <span></span>
              <span
                v-if="currentDataset && currentDataset.summary"
                class="caption-2"
              >
                <template v-if="currentDataset.total_count_dtypes">
                  {{currentDataset.total_count_dtypes | formatNumberInt}} Data types &emsp;
                </template>
                {{ currentDataset.summary.rows_count | formatNumberInt }} Rows &emsp; {{ currentDataset.summary.cols_count | formatNumberInt }} Columns &emsp; Size: {{ currentDataset.summary.size }}
              </span>
            </v-layout>
          </v-footer>
        </template>
      </template>
    </v-layout>
  </Layout>
</template>

<script>
import Layout from '@/components/Layout'
import TableBar from '@/components/TableBar'
import clientMixin from '@/plugins/mixins/client'
import dataTypesMixin from "@/plugins/mixins/data-types";

export default {

  mixins: [clientMixin,dataTypesMixin],

  data () {
    return {
      showKey: false,
      inputKey: '',
      inputSession: '',
      searchText: '',
      tab: undefined,
      view: undefined,
      confirmDelete: -1,
      typesAvailable: [
        {text: 'String', value: 'string' },
        {text: 'Integer', value: 'int' },
        {text: 'Decimal', value: 'decimal' },
        {text: 'Date', value: 'date' },
        {text: 'Boolean', value: 'boolean' },
        {text: 'Binary', value: 'binary' },
        {text: 'Array', value: 'array' },
        {text: 'Null', value: 'null' }
      ],
      typesSelected: [],
    }
  },

  created () {
    this.tab = +(this.$route.query.tab || 0)
    this.view = +(this.$route.query.view || 0)
  },

  mounted () {
    this.inputSession = this.$route.query.session || ''
    this.inputKey = this.$route.query.key || ''
    if (this.inputSession && this.inputSession) {
      this.subscribe()
    }
  },

	components: {
    Layout,
		TableBar,
	},


	computed: {
		statusError () {
      return (!!this.$store.state.status.message)
		},
		status () {
      return this.$store.state.status
    },
    currentDataset () {
      if (this.$store.state.datasets[this.tab]===undefined){
        this.tab = 0;
      }
      return this.$store.state.datasets[this.tab];
    }
  },

  watch: {
    tab (value) {
      if (value===undefined)
        return;
      this.$router.replace({path: this.$route.fullPath, query: { tab: value }},()=>{
        history.replaceState("Dashboard","Bumblebee",this.$route.fullPath);
      })
    },
    view (value) {
      if (value===undefined)
        return;
      this.$router.replace({path: this.$route.fullPath, query: { view: value }},()=>{
        history.replaceState("Dashboard","Bumblebee",this.$route.fullPath);
      })
    },
  },

  methods: {
    subscribe() {
      this.startClient(this.inputSession,this.inputKey)
    },
    resetStatus(closing) {
      if (!closing)
        this.$store.commit('status')
    },
    deleteTab(i) {
      const deleted = this.$store.commit('delete',{index: i})
      this.confirmDelete = -1
      if (this.$store.state.datasets.length==0) {
        this.tab = 0;
      }
      else if (this.tab>=this.$store.state.datasets.length) {
        this.tab = this.$store.state.datasets.length - 1
      }
      this.$forceUpdate()
    }
  },
}
</script>

<style lang="scss">
  .datasets-tabs {
    border-radius: 4px;
    overflow: hidden;
  }
</style>
