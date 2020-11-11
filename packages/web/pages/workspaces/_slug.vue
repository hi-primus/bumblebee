<template>
	<Layout>
		<v-layout row wrap class="elevation-0 d-flex flex-column align-top justify-start">
      <ConfigPanel
        v-if="windowDialog  === 'configWorkspace'"
        @done="doneConfig"
      />
      <v-dialog
        data-name="Workspaces"
        v-else-if="windowDialog"
        :value="windowDialog"
        @click:outside="windowDialog = false"
        max-width="1220"
      >
        <WorkspacesList v-if="windowDialog  === 'workspaces'"/>
        <ConfigsList v-else-if="windowDialog  === 'configs'"/>
        <ClustersList v-else-if="windowDialog  === 'clusters'"/>
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
        <v-icon class="back-btn" large color="black" @click="signOut()">arrow_back</v-icon>
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
          class="bb-container"
          id="bb-container"
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
            :class="{'tabs-disabled': $store.state.kernel=='loading' || previewCode || isOperating}"
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
            <v-layout class="px-4 caption-2" row justify-space-between>
              <span
                v-if="loadingStatus"
              >
                {{loadingStatus!==true ? loadingStatus : 'Updating'}}
              </span>
              <span />
              <span v-if="currentDataset && currentDataset.summary" class="caption-2">
                <template
                  v-if="typesAvailable && typesAvailable.length"
                >{{ typesAvailable.length | formatNumberInt }} Data types &emsp;</template>
                <template
                  v-else-if="currentDataset.summary.total_count_dtypes"
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
import ConfigPanel from "@/components/ConfigPanel"
import ConfigsList from "@/components/ConfigsList"
import ClustersList from "@/components/ClustersList"
import MoreMenu from "@/components/MoreMenu"
import clientMixin from "@/plugins/mixins/client"
import dataTypesMixin from "@/plugins/mixins/data-types"
import applicationMixin from "@/plugins/mixins/application"
import { printError, getDefaultParams, INIT_PARAMS, RESPONSE_MESSAGES } from 'bumblebee-utils'

import { mapGetters, mapState } from "vuex"

const { version } = require("@/package.json")

export default {
	components: {
		Layout,
    TableBar,
    WorkspacesList,
    ConfigPanel,
    ConfigsList,
    ClustersList,
    MoreMenu
	},

  mixins: [
    clientMixin,
    dataTypesMixin,
    applicationMixin,
  ],

  middleware: 'authenticated',

  // async validate ({ params, store }) {

  //   // var validSlug = /^(-?[a-z|\d])*$/.test(params.slug)
  //   // if (!validSlug) {
  //   //   throw new Error('Invalid Url')
  //   // }

  //   return true

  // },

	data () {
		return {
      windowDialog: false,
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
    try {
      this.$store.commit('session/mutation', { mutate: 'workspaceStatus', payload: 'loading' })
      this.initializeWorkspace()
    } catch (err) {
      console.error(err);
    }
  },

	computed: {
    ...mapGetters(['currentDataset','previewCode','typesAvailable']),

    ...mapState('session', ['workspace', 'workspaceStatus']),
    ...mapState(['loadingStatus']),

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
        { text: 'Workspaces', click: ()=>this.showWindowDialog('workspaces') },
        { text: 'Workspace settings', click: ()=>this.showWindowDialog('configWorkspace') }
        // { text: 'Configs', click: ()=>this.showWindowDialog('configs') },
        // { text: 'Clusters', click: ()=>this.showWindowDialog('clusters') },
      ];

      var dashboardLink = this.$store.state.dashboardLink;

      if (dashboardLink) {
        menu = [
          ...menu,
          { divider: true },
          { text: 'Open Dask Dashboard', link: dashboardLink }
        ];
      }

      menu = [
        ...menu,
        { divider: true },
        { text: 'Sign out', click: this.signOut }
      ];

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
        return this.deleteTab(value)
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

    showWindowDialog (type) {
      this.windowDialog = type;
    },

    runCodeNow (force = false, ignoreFrom = -1, newDfName, noCheck) {
      return this.$refs.tableBar.runCodeNow(force, ignoreFrom, newDfName, noCheck);
    },

    async doneConfig (values) {
      this.windowDialog = false;
      if (values) {
        await this.$store.dispatch('session/cleanSession');
        await this.initializeWorkspace();
      }
    },

    async initializeWorkspace () {

      // console.log('[INITIALIZATION] initializeWorkspace')

      try {

        this.$store.commit('session/mutation', { mutate: 'workspaceStatus', payload: 'loading' })

        var slug = this.$route.params.slug;

        if (slug) {
          this.$store.commit('mutation', { mutate: 'workspaceSlug', payload: slug });
        }

        var optimus = await this.initializeOptimus(slug);
        console.debug('[INITIALIZATION] Optimus initialized');

        var workspace = await this.$store.dispatch('getWorkspace', { slug });
        console.debug('[INITIALIZATION] Workspace started');

        if (!this.$store.state.datasets.length) {
          await this.$store.dispatch('newDataset', { go: true });
        }

        this.$store.commit('session/mutation', { mutate: 'workspaceStatus', payload: true });

        await this.$nextTick()

        try {

          this.$store.commit('kernel', 'loading');
          this.$store.commit('setAppStatus', 'workspace');

          var result = await this.runCodeNow(false, -1, undefined, true);
          console.debug('[INITIALIZATION] Cells code and profiling done', result);

            this.$store.commit('kernel', 'done');

          if (!result && result !== false) {
            throw new Error('Cells code or profiling error')
          }
        } catch (err) {

          console.error('(Error on post-initialization)');
          throw err;

        }

      } catch (err) {

        if (err.code) {
          window.pushCode({ code: err.code, error: true })
        }

        // if (err.toString().includes('server disconnect')) {
        //   this.signOut();
        // }

        console.error('(Error on initialization)');
        printError(err)
        var appStatus = {
          error: new Error('Initialization error'),
          status: 'workspace'
        };
        this.$store.commit('setAppStatus', appStatus)

      }
    },

    initializeOptimus (slug) {

      if (!Object.keys(this.$store.state.localConfig).length) {

        var query = this.$route.query;

        if (Object.keys(query).length) {
          console.warn('Getting config from query parameters');
        }

        var params = {};

        Object.keys(INIT_PARAMS).forEach(parameter => {
          if (query[parameter]) {
            params[parameter] = query[parameter]
          }
        });

        params = getDefaultParams(params);

        params.name = params.name || this.$store.state.session.username + '_' + this.$route.params.slug;

        this.$store.commit('mutation', { mutate: 'localConfig', payload: params });
        this.$store.commit('mutation', { mutate: 'configPromise', payload: false });

      }

      var payload = { slug, socketPost: this.socketPost };

      return this.$store.dispatch('getOptimus', { payload } )
    },

		async deleteTab(i) {
      var newLength = this.$store.state.datasets.length - 1;
      this.confirmDelete = -1;
			if (newLength<=0) {
				this.tab = 0;
			} else if (this.tab >= newLength) {
        this.tab = newLength - 1;
			} else if (this.tab>0 && i<=this.tab) {
        this.tab = this.tab - 1;
      }
			await this.$store.dispatch('deleteTab', i);
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
