<template>
	<Layout>
		<v-layout row wrap class="elevation-0 d-flex flex-column align-top justify-start">
      <v-dialog
        data-name="Workspaces"
        v-show="workspacesDialog === true"
        :value="workspacesDialog"
        @click:outside="workspacesDialog = false"
        max-width="1220"
      >
        <WorkspacesList/>
      </v-dialog>
      <template v-if="$store.state.datasets.length==0 && false" data-name="noKernel (deprecated)">
        <div class="center-screen-inside black--text">
          <v-progress-circular indeterminate color="black" class="mr-4" />
          <span class="title">Waiting for data</span>
          <div class="mb-8" style="width: 100%" />
          <v-card class="elevation-0">
            <v-card-text class="title mb-2">Now send info from your notebook. Try something like:</v-card-text>
            <v-card-text class="subtitle text-code">
              <span class="comment"># Install Optimus</span>
              <br />!pip install optimuspyspark
              <br />
              <br />
              <span class="comment"># Load Optimus</span>
              <br />
              <span class="keyword">from</span> optimus
              <span class="keyword">import</span> Optimus
              <br />
              <br />
              <span class="comment"># Let's Optimus call Bumblebee</span>
              <br />op = Optimus(comm=
              <span class="keyword">True</span>)
              <br />
              <br />
              <span class="comment"># Load some data</span>
              <br />df = op.load.csv(
              <span
                class="string"
              >"https://raw.githubusercontent.com/ironmussa/Optimus/master/examples/data/Meteorite_Landings.csv"</span>)
              <br />
              <br />
              <span class="comment"># Visualize</span>
              <br />df.ext.send(
              <span class="string">"Meteorite"</span>)
            </v-card-text>
          </v-card>
        </div>
        <v-icon class="back-btn" large color="black" @click="signOut(false)">arrow_back</v-icon>
      </template>
      <template v-else>
        <div v-if="workspaceStatus==='loading'">
          <div class="center-screen-inside grey--text">
            <v-progress-circular indeterminate color="grey" class="mr-4" />
            <span class="title">Loading workspace</span>
          </div>
        </div>
        <div
          data-name="workspace"
          v-show="workspaceStatus!=='loading'"
          class="workspace-container"
          id="workspace-container"
          @drop.prevent="addFile"
          @dragend.prevent="dragLeave"
          @dragover.prevent
          @dragenter="dragEnter"
          @dragleave.prevent="dragLeave"
        >
          <transition name="fade">
            <div class="drop-hover" v-if="dragFile">
              <div class="frame vertical-center flex-column">
                <v-icon
                  big
                  color="white"
                  style="font-size: 64px;"
                >
                  mdi-file-upload-outline
                </v-icon>
                <div class="title white--text text-center">
                  Upload from file
                </div>
              </div>
            </div>
          </transition>
          <v-dialog
            data-name="Confirm close"
            v-if="$store.state.datasets[confirmDelete]"
            :value="confirmDelete>=0"
            max-width="290"
            @click:outside="confirmDelete=-1"
          >
            <v-card>
              <v-card-title class="title">Close tab</v-card-title>
              <v-card-text>Close "{{ $store.state.datasets[confirmDelete].name }}"?</v-card-text>
              <v-card-actions>
                <div class="flex-grow-1" />
                <v-btn color="primary" text @click="confirmDelete=-1">Cancel</v-btn>
                <v-btn color="primary" text @click="deleteTab(confirmDelete)">Accept</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-tabs
            :key="$store.state.datasetUpdates"
            v-model="tab"
            :class="{'tabs-disabled': previewCode || isOperating}"
            class="bb-tabs px-6"
            background-color="#fff"
            show-arrows
            center-active
            style="flex: 0;"
          >
            <v-tab
              v-for="(_tab, key) in $store.state.datasets"
              :key="key"
              class="bb-tab"
            >
              <span class="tab-content">
                <span class="tab-title" :title="[_tab.dfName,_tab.name].filter(e=>e).join(' - ')">{{[_tab.dfName,_tab.name].filter(e=>e).join(' - ')}}</span>
                <span class="tab-subtitle" :title="_tab.file_name">{{ _tab.file_name }}</span>
              </span>
              <v-hover v-if="!noClose" v-slot:default="{ hover }">
                <span class="tab-close">
                  <v-icon
                    :color="hover ? 'primary darken-1' : ''"
                    small
                    @click.stop="confirmDelete=key;"
                  >close</v-icon>
                </span>
              </v-hover>
            </v-tab>
            <v-tab class="new-tab" color="primary darken-1" @click="$store.dispatch('newDataset', { go: true })">
              <v-icon color="primary">add</v-icon>
            </v-tab>
          </v-tabs>
          <div class="bb-workspace-status">
            <!-- this.$route.query.ws!=0 -->
            <v-progress-circular
              v-if="workspaceStatus==='uploading' || workspaceStatus==='loading'"
              indeterminate
              color="grey"
              size="20"
              width="3"
            >
            </v-progress-circular>
            <v-progress-circular
              v-else-if="workspaceStatus==='ok'"
              :value="100"
              color="success"
              size="20"
              width="3"
            >
            </v-progress-circular>
            <v-progress-circular
              v-else-if="workspaceStatus==='error'"
              :value="100"
              color="error"
              size="20"
              width="3"
            >
            </v-progress-circular>
            <v-progress-circular
              v-else
              :value="100"
              color="grey"
              size="20"
              width="3"
            >
            </v-progress-circular>
          </div>
          <MoreMenu
            :items="moreMenu"
          ></MoreMenu>
          <div class="bb-content">
            <TableBar
              ref="tableBar"
              v-if="currentDataset"
              :isOperating.sync="isOperating"
              :total="(currentDataset.summary) ? +currentDataset.summary.rows_count : 1"
            />
          </div>

          <v-footer fixed="fixed" app>
            <v-layout class="px-4" row justify-space-between>
              <span />
              <span v-if="currentDataset && currentDataset.summary" class="caption-2">
                <template
                  v-if="currentDataset.summary.total_count_dtypes"
                >{{ currentDataset.summary.total_count_dtypes | formatNumberInt }} Data types &emsp;</template>
                <template v-if="sampleSize">{{ sampleSize | formatNumberInt }} of</template>
                <template
                  v-if="currentDataset.summary.rows_count"
                >{{ currentDataset.summary.rows_count | formatNumberInt }} Rows &emsp;</template>
                <template
                  v-if="currentDataset.summary.cols_count"
                >{{ currentDataset.summary.cols_count | formatNumberInt }} Columns</template>
              </span>
            </v-layout>
          </v-footer>
        </div>
      </template>
		</v-layout>
	</Layout>
</template>


<script>
import Layout from "@/components/Layout"
import TableBar from "@/components/TableBar"
import WorkspacesList from "@/components/WorkspacesList"
import MoreMenu from "@/components/MoreMenu"
import clientMixin from "@/plugins/mixins/client"
import dataTypesMixin from "@/plugins/mixins/data-types"
import applicationMixin from "@/plugins/mixins/application"
import { printError, RESPONSE_MESSAGES } from 'bumblebee-utils'

import { mapGetters, mapState } from "vuex"

const { version } = require("@/package.json")

export default {
	components: {
		Layout,
    TableBar,
    WorkspacesList,
    MoreMenu
	},

  mixins: [
    clientMixin,
    dataTypesMixin,
    applicationMixin,
  ],

  // middleware: 'authenticatedOrDefault',

  // async validate ({ params, store }) {

  //   // var validSlug = /^(-?[a-z|\d])*$/.test(params.slug)
  //   // if (!validSlug) {
  //   //   throw new Error('Invalid Url')
  //   // }

  //   return true

  // },

	data () {
		return {
      workspacesDialog: false,
			isOperating: false,
			confirmDelete: -1,
      typesInput: '',
      dragFile: false
		};
  },

  created () {
    this.$store.commit('session/mutation', { mutate: 'workspaceStatus', payload: 'loading' })
  },

  mounted () {
    this.$store.commit('session/mutation', { mutate: 'workspaceStatus', payload: 'loading' })
    this.initializeWorkspace()
  },

	computed: {
    ...mapGetters(['currentDataset','previewCode']),

    ...mapState('session',['workspace', 'workspaceStatus']),

    tab: {
      get () {
        return this.$store.state.tab
      },
      set (value) {
        if (value === undefined) {
          return
        }

        let dataset = this.$store.state.datasets[value];

        if (value !== undefined && !dataset) {
          this.tab = this.$store.state.datasets[0] ? 0 : undefined
          this.$store.commit('mutation', { mutate: 'tab', payload: 0 })
          return
        }

        this.$store.commit('mutation', { mutate: 'tab', payload: value })
      },
    },

    moreMenu () {
      let menu = []

      menu = [
        { text: 'Workspaces', click: this.showWorkspaces },
        { divider: true },
        { text: 'Sign out', click: this.signOut }
      ]

      return menu
    },

    noClose () {
      return (this.$store.state.datasets.length==1 && this.$store.state.datasets[0].blank)
    },

		sampleSize() {
			return Math.min(
				this.currentDataset.summary.sample_size,
				this.currentDataset.summary.rows_count
			);
		},

		status() {
			return (
				this.$store.state.appStatus.status ||
				this.$store.state.appStatus.toString()
			);
		}
	},

	watch: {
		async status(value) {
			if (value == 'workspace') {
				var dataset = this.$route.query.dataset;
				if (dataset && this.$refs.tableBar) {
					this.$refs.tableBar.commandHandle({
            command: 'load file',
            noOperations: true,
						immediate: true,
						payload: { url: dataset, file_type: 'file', _moreOptions: true }
					});
				}
			}
		},

		confirmDelete(value) {
			if (value>=0 && this.$store.state.datasets[value] && this.$store.state.datasets[value].blank) {
        this.deleteTab(value)
      }
		}
  },

	methods: {

    addFile (event) {
      window.dragCount = 0
      try {
        var files = event.dataTransfer.files
        if (files && files[0] && files[0].name) {
        this.$refs.tableBar.commandHandle({command: 'load file', payload: { _fileInput: files[0] }, execute: ['uploadFile']});
        }

      } catch (err) {}
      this.dragFile = false
    },

    dragLeave (event) {
      window.dragCount--
      if (window.dragCount <= 0) {
        window.dragCount = 0
        this.dragFile = false
      }
    },

    dragEnter (event) {
      if (!window.dragType) {
        window.dragCount = window.dragCount || 0
        window.dragCount++
        this.dragFile = true
      }
    },

    showWorkspaces () {
      this.workspacesDialog = true
    },

    async runCodeNow () {
      return await this.$refs.tableBar.runCodeNow()
    },

    async initializeWorkspace () {

      // console.log('[INITIALIZATION] initializeWorkspace')

      try {

        this.$store.commit('session/mutation', { mutate: 'workspaceStatus', payload: 'loading' })

        var slug = this.$route.params.slug;

        var workspace = await this.$store.dispatch('session/startWorkspace', slug)
        // console.log('[INITIALIZATION] workspace done')

        await this.initializeOptimus(slug)
        // console.log('[INITIALIZATION] post initializeOptimus')


        if (!this.$store.state.datasets.length) {
          this.$store.dispatch('newDataset', { go: true })
        }

        // console.log('[INITIALIZATION] status mutation')
        this.$store.commit('session/mutation', { mutate: 'workspaceStatus', payload: true })
        // console.log('[INITIALIZATION] status mutated')

        this.$nextTick(async ()=>{

          try {
            // console.log('[INITIALIZATION] runCodeNow')
            await this.runCodeNow()

            this.updateSecondaryDatasets()

            this.$store.commit('kernel', 'loading')

            this.$store.commit('setAppStatus', 'workspace')

            this.$store.commit('kernel', 'done')
          } catch (err) {
            console.error('Error on post-initialization',err)
            throw err
          }

        })

      } catch (err) {

        if (err.code) {
          window.pushCode({ code: err.code, error: true })
        }
        console.error('Error initializing', err);
        printError(err)
        var appStatus = {
          error: new Error('Initialization error'),
          status: 'workspace'
        };
        this.$store.commit('setAppStatus', appStatus)

      }
    },

    async initializeOptimus (slug) {

      // TO-DO: store action

      console.log('[INITIALIZATION] initializeOptimus')

      var query = this.$route.query

      var parameters = {
        engine: query.engine,
        address: query.address,
        n_workers: query.n_workers || query.workers,
        threads_per_worker: query.threads_per_worker || query.tpw,
        reset: query.reset,
        kernel_address: query.kernel_address,
        process: query.process,
        processes: query.processes
      }

      var response = await this.socketPost('initialize', {
        username: this.$store.state.session.username,
        workspace: slug || 'default',
        ...parameters
      })

      console.log('[DEBUG][INITIALIZATION] initializeOptimus response', response)

      var functions

      if (response.data.reserved_words) {
        response.data.reserved_words = JSON.parse(response.data.reserved_words) // TO-DO: remove dumps on optimus
        functions = response.data.reserved_words.functions
      }

      var functionsSuggestions = []

      if (functions) {
        Object.entries(functions).forEach(([key, value])=>{
          var params = [{
            type: 'column',
            name: 'column',
            description: "A column's name",
            required: true // TO-DO: required on function
          }]
          var description = value
          var example = `${key}(column)`
          if (typeof value !== "string")  {
            if ('parameters' in value) {
              params = value.parameters.map(param=>{
                if (param.type==='series') {
                  param.type = 'column'
                }
                if (param.name==='series') {
                  param.name = 'column'
                }
                return param
              })
            }
            if ('description' in value) {
              description = value.description
            }
            if ('example' in value) {
              example = value.example
            }
          }
          functionsSuggestions.push({type: 'function', text: key, params, description, example })
        })
      }

      // console.log('[GLOBAL SUGGESTIONS]',JSON.stringify(functionsSuggestions))

      this.$store.commit('mutation', {mutate: 'functionsSuggestions', payload: functionsSuggestions})


      if (!response.data.optimus) {
        throw response
      }

      window.pushCode({ code: response.code })
    },

    signOut (waiting = true) {
      this.stopClient(waiting)
      this.$store.dispatch('mutateAndSave', {mutate: 'commands', payload: []} )
      this.$store.dispatch('session/signOut')
      this.$router.push({path: '/login', query: this.$route.query })
    },

		deleteTab(i) {
			this.$store.dispatch('deleteTab', i);
			this.confirmDelete = -1;
			if (!this.$store.state.datasets.length) {
				this.tab = 0;
			} else if (this.tab >= this.$store.state.datasets.length) {
				this.tab = this.$store.state.datasets.length - 1;
			}
			this.$forceUpdate();
		}
	}
};
</script>

<style lang="scss">
.datasets-tabs {
	border-radius: 4px;
	overflow: hidden;
}
</style>
