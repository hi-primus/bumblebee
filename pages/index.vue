<template>
  <Layout :wide="view==1">
    <v-layout row wrap>
      <template v-if="status=='waiting' || status=='loading' || statusError">
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
            <v-card-text class="pb-0" v-if="statusError" >
              <v-alert type="error" class="mb-2" dismissible @input="resetStatus($event)">
                {{status.message}}
              </v-alert>
            </v-card-text>
          </v-form>
        </v-card>
      </template>
      <template v-else-if="!statusError">
        <div v-if="cDatasets.length==0" class="center-screen-inside success--text">
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
            <v-card class="d-flex flex-column align-top justify-start" style="width: 100%;">
              <v-tabs
                background-color="#def1ef"
                color="success darken-2"
                v-model="tab"
                show-arrows
                center-active
                style="flex: 0;"
              >
                <v-tab v-for="(_tab, key) in cDatasets" :key="key" >
                  <span class="pr-8">{{ _tab.name || key+1 }}</span>
                  <v-hover v-slot:default="{ hover }">
                    <v-icon
                      :color="hover ? 'success darken-1' : ''"
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
              <v-card-text>
                <v-flex xs12 class="controls-container text-xs-center d-flex">
                  <v-btn-toggle mandatory v-model="view">
                    <v-btn text>
                      <v-icon>view_headline</v-icon>
                    </v-btn>
                    <v-btn text>
                      <v-icon>view_module</v-icon>
                    </v-btn>
                  </v-btn-toggle>
                  <v-spacer></v-spacer>
                  <v-text-field
                    style="max-width: 500px"
                    v-model="searchText"
                    append-icon="search"
                    label="Search column"
                    :color="'info darken-1'"
                    clearable
                  />
                </v-flex>
                <TableBar
                  :key="tab"
                  :currentTab="tab"
                  :view="view"
                  :dataset="cDatasets[tab]"
                  :total="+cDatasets[tab].rows_count"
                  :searchText="searchText"
                />
              </v-card-text>
            </v-card>

          <v-footer fixed="fixed" app>
            <v-layout class="px-4" row justify-space-between>
              <span>Iron &copy; 2019</span>
              <span
                v-if="cDatasets[tab] && cDatasets[tab].summary"
              >Rows: {{ cDatasets[tab].rows_count }}, Columns: {{ cDatasets[tab].summary.cols_count }}, Size: {{ cDatasets[tab].summary.size }}</span>
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

  data() {
    return {
      showKey: false,
      inputKey: '',
      inputSession: '',
      searchText: '',
      tab: 0,
      view: 0
    }
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
    cDatasets () {
      return this.$store.state.datasets;
    }
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
      if (this.cDatasets.length==0) {
        this.tab = 0;
      }
      else if (this.tab>=this.cDatasets.length) {
        this.tab = this.cDatasets.length - 1
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
