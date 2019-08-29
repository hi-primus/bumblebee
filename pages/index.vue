<template>
  <Layout :wide="view==1">
    <v-layout row wrap>
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
            <v-card-text class="pb-0" v-if="statusError" >
              <v-alert type="error" class="mb-2" dismissible @input="resetStatus($event)">
                {{status.message}}
              </v-alert>
            </v-card-text>
          </v-form>
        </v-card>
      </template>
      <template v-else-if="!statusError">
        <div v-if="allDatasets.length==0" class="center-screen-inside primary--text">
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
            <v-card class="elevation-0 d-flex flex-column align-top justify-start" style="width: 100%;">
                <!-- color="primary darken-2" -->
              <v-tabs
                background-color="#fff"
                v-model="tab"
                show-arrows
                center-active
                style="flex: 0;"
              >
                <v-tab v-for="(_tab, key) in allDatasets" :key="key" >
                  <span class="pr-8">{{ _tab.name || key+1 }}</span>
                  <v-hover v-slot:default="{ hover }">
                    <v-icon
                      :color="hover ? 'primary darken-1' : ''"
                      @click.stop="deleteTab(key)"
                      small
                      class="pr-4"
                      style="position: absolute; right: 0"
                    >
                      close
                    </v-icon>
                  </v-hover>
                </v-tab>
              </v-tabs>
              <v-card-text class="pa-0">
                <div class="controls-section px-4 grey-bg">
                  <div class="controls-container text-xs-center mb-1" :class="{'inside-bar': view==1}">
                    <v-btn-toggle
                      color="primary"
                      mandatory v-model="view"
                      class=""
                    >
                      <v-btn text>
                        <v-icon :color="(view==0) ? 'primary' : undefined">view_headline</v-icon>
                      </v-btn>
                      <v-btn text>
                        <v-icon :color="(view==1) ? 'primary' : undefined">view_module</v-icon>
                      </v-btn>
                    </v-btn-toggle>
                    <v-spacer></v-spacer>
                    <v-text-field
                      clearable
                      solo
                      class="search-filter absolute-centered mt-2 elevation-0"
                      v-model="searchText"
                      prepend-inner-icon="search"
                      label="Search column"
                      :color="'grey darken-3'"
                    />
                    <!-- <div class="pseudo-select mr-4" style="z-index: 2">
                      <v-btn depressed :dark="view!=1" :color="view==0 ? 'primary' : 'grey'" fab :text="view!=0" small @click="view=0">
                        <v-icon>
                          view_headline
                        </v-icon>
                      </v-btn>
                      <v-btn depressed :dark="view!=0" :color="view==1 ? 'primary' : 'grey'" fab :text="view!=1" small @click="view=1">
                        <v-icon>
                          view_module
                        </v-icon>
                      </v-btn>
                    </div> -->
                  </div>
                </div>
                <TableBar
                  :key="tab"
                  :currentTab="tab"
                  :view="view"
                  :dataset="currentDataset"
                  :total="+currentDataset.rows_count"
                  :searchText="searchText"
                />
              </v-card-text>
            </v-card>

          <v-footer fixed="fixed" app>
            <v-layout class="px-4" row justify-space-between>
              <span></span>
              <span
                v-if="currentDataset && currentDataset.summary"
              >
                {{ currentDataset.rows_count }} Rows &emsp; {{ currentDataset.summary.cols_count }} Columns &emsp; Size: {{ currentDataset.summary.size }}
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

export default {

  data () {
    return {
      showKey: false,
      inputKey: '',
      inputSession: '',
      searchText: '',
      tab: undefined,
      view: undefined
    }
  },

  created () {
    this.tab = +(this.$route.query.tab || 0)
    this.view = +(this.$route.query.view || 0)
  },

	components: {
    Layout,
		TableBar,
	},

	mixins: [clientMixin],

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
    },
    allDatasets () {
      return this.$store.state.datasets;
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
      if (this.allDatasets.length==0) {
        this.tab = 0;
      }
      else if (this.tab>=this.allDatasets.length) {
        this.tab = this.allDatasets.length - 1
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
