<template>
	<Layout>
		<v-layout wrap class="elevation-0 pa-0 d-flex flex-column align-top justify-start">
      <SettingsPanel
        v-if="windowDialog  === 'configEngine'"
        :existing="$store.state.engineId"
        :disable-back="!!engineFormPromise"
        @done="doneConfig($event)"/>
      <v-dialog
        data-name="Workspaces"
        v-else-if="windowDialog"
        :value="windowDialog"
        @click:outside="backDialogClicked"
        max-width="1220"
      >
        <MacrosList
          is-dialog
          @click:macro="runMacro"
          @back="backDialogClicked"
          v-if="windowDialog  === 'macros'"/>
        <WorkspacesList
          is-dialog
          @back="backDialogClicked"
          v-if="windowDialog  === 'workspaces'"/>
        <SettingsList
          is-dialog
          selecting
          :back-edit-highlight="!$store.state.engineId"
          :highlight="$store.state.engineId"
          :disable-back="!!engineFormPromise"
          @back="!$store.state.engineId ? showWindowDialog('configEngine') : backDialogClicked"
          v-else-if="windowDialog  === 'configs'"
          @click:engine="doneConfig($event, true)"
          />
        <ConnectionsList is-dialog v-else-if="windowDialog  === 'connections'"/>
        <ConnectionsList is-dialog selecting @click:connection="connectionClicked" @back="backDialogClicked" v-else-if="windowDialog  === 'connections-select'"/>
        <CustomOperationsManager @back="backDialogClicked" is-dialog v-else-if="windowDialog  === 'customOperations'"/>
      </v-dialog>
      <template>
        <div v-if="workspaceStatus==='loading'">
          <div
            v-if="appError"
            class="center-screen-inside error--text"
            >
            <div class="d-flex flex-column">
              <div class="d-flex justify-center">
                <v-progress-circular :value="100" color="error" class="mr-4" />
                <span class="title">{{appError}}</span>
              </div>
              <div class="d-flex justify-center mt-2">
                <v-btn color="primary" class="mr-2" @click="initializeWorkspace(false)" depressed>Retry</v-btn>
                <v-btn color="primary" @click="initializeWorkspace(true)" depressed>Adjust engine settings and retry</v-btn>
              </div>
              <div class="d-flex justify-center mt-2">
                <v-alert
                  v-if="appStatusDetail"
                  type="error"
                  class="mb-2"
                  dismissible
                >{{ appStatusDetail }}</v-alert>
              </div>
            </div>
          </div>
          <div v-else class="center-screen-inside grey--text">
            <v-progress-circular indeterminate color="grey" class="mr-4" />
            <span class="title">{{ loadingMessage }}</span>
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
                <v-btn :id="`btn-confirm-delete-cancel`" color="primary" text @click="confirmDelete=-1">Cancel</v-btn>
                <v-btn :id="`btn-confirm-delete-accept`" color="primary" text @click="deleteTab(confirmDelete)">Accept</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-tabs
            :key="currentDatasetUpdate"
            :value="tab"
            @change="clickTab"
            :class="{'tabs-disabled': $store.state.kernel=='loading' || previewCode || isOperating}"
            class="bb-tabs px-6"
            background-color="#fff"
            show-arrows
            center-active
            style="flex: 0;"
          >
            <v-tab
              v-for="(_tab, key) in $store.state.datasets.filter(e => e)"
              :key="+key"
              class="bb-tab"
              :id="`bb-tab-${_tab.dfName}`"
            >
              <span class="tab-content">
                <span class="tab-title" :title="[_tab.dfName,_tab.name].filter(e=>e).join(' - ')">{{[_tab.dfName,_tab.name].filter(e=>e).join(' - ')}}</span>
                <!-- <span class="tab-subtitle" :title="_tab.file_name">{{ _tab.file_name }}</span> -->
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
            <div class="v-tab new-tab" color="primary darken-1" @click="newTab">
              <v-icon color="primary">add</v-icon>
            </div>
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
              @showConnections="showConnections"
              :isOperating.sync="isOperating"
              :total="(currentDataset.summary) ? +currentDataset.summary.rows_count : 1"
            />
          </div>

          <v-footer v-if="footerVisible" fixed="fixed" app>
            <v-layout class="px-4 caption-2" justify-space-between>
              <span
                v-if="loadingStatus"
                id="footer-loading-status"
              >
                <v-progress-circular indeterminate color="grey" style="margin-top: -3px; margin-right: 14px;" size="16" width="2" />
                {{loadingStatus!==true ? loadingStatus : 'Updating'}}
              </span>
              <span />
              <span v-if="currentDataset && currentDataset.summary" class="caption-2">
                <template
                  v-if="typesAvailable && typesAvailable.length"
                >{{ typesAvailable.length | formatNumberInt }} Data types &emsp;</template>
                <template
                  v-else-if="currentDataset.summary.total_count_data_types"
                >{{ currentDataset.summary.total_count_data_types | formatNumberInt }} Data types &emsp;</template>
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
import MacrosList from "@/components/MacrosList"
import WorkspacesList from "@/components/WorkspacesList"
import SettingsPanel from "@/components/SettingsPanel"
import SettingsList from "@/components/SettingsList"
import ConnectionsList from "@/components/ConnectionsList"
import CustomOperationsManager from "@/components/CustomOperationsManager"
import MoreMenu from "@/components/MoreMenu"
import clientMixin from "@/plugins/mixins/client"
import dataTypesMixin from "@/plugins/mixins/data-types"
import applicationMixin from "@/plugins/mixins/application"
import { printError, getDefaultParams, objectFilter, INIT_PARAMS, RESPONSE_MESSAGES, HELP_LINK } from 'bumblebee-utils'

import { mapGetters, mapState } from "vuex"

const { version } = require("@/package.json")

export default {
	components: {
		Layout,
    TableBar,
    MacrosList,
    WorkspacesList,
    SettingsPanel,
    SettingsList,
    ConnectionsList,
    CustomOperationsManager,
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
      selectCallback: false,
      windowDialog: false,
			isOperating: false,
			confirmDelete: -1,
      typesInput: '',
      dragFile: false,
      engineFormPromise: false,
      tabSelected: 0
		};
  },

  created () {
    this.$store.commit('session/mutation', { mutate: 'workspaceStatus', payload: 'loading' })
  },

  mounted () {
    window.setDialog = (dialog) => {
      this.windowDialog = dialog
    }
    try {
      this.$store.commit('session/mutation', { mutate: 'workspaceStatus', payload: 'loading' })
      this.initializeWorkspace()
    } catch (err) {
      console.error(err);
    }
    window.intercomSettings["vertical_padding"] = 48;
    window.Intercom("update");
  },

	computed: {
    ...mapGetters(['currentDataset','currentDatasetUpdate','previewCode','typesAvailable', 'loadingStatus']),

    ...mapState('session', ['workspace', 'workspaceStatus']),

    footerVisible () {
      return this.loadingStatus || (this.currentDataset && this.currentDataset.summary);
    },

    loadingMessage() {

      var str = "Loading";

      if (!this.$store.state.workspacePromise.fulfilled || !this.$store.state.enginePromise.fulfilled) {
        str = 'Loading workspace';
      } else if (!this.$store.state.optimusPromise.fulfilled) {
        str = 'Loading engine';
      }

      if (
        this.$store.state.localEngineParameters &&
        this.$store.state.localEngineParameters.engine &&
        this.$store.state.localEngineParameters.engine.includes("coiled")
      ) {
        str += "... This may take a while";
      }

      return str;
    },

    tab: {
      get () {
        return this.$store.state.tab
      },
      set (value) {
        let dataset = this.$store.state.datasets[value];

        if (!dataset && this.$store.state.datasets[0]) {
          value = 0;
        }

        this.$store.commit('mutation', { mutate: 'tab', payload: value });
      },
    },

    moreMenu () {
      let menu = []

      menu = [];

      if (!process.env.QUICK_WORKSPACE_CREATION) {
        menu.push({ text: 'Workspaces', click: ()=>this.showWindowDialog('workspaces') })
      }        

      if (this.$store.state.engineId) {
        menu.push({ text: 'Set engine', click: ()=>this.showWindowDialog('configs') });
      } else {
        menu.push({ text: 'Configure engine', click: ()=>this.showWindowDialog('configEngine') });
      }

      // if (process.client && window && window.runMacro) {
      //   menu = [
      //     ...menu,
      //     { text: 'Manage macros', click: ()=>this.showWindowDialog('macros') },
      //   ];
      // }
      
      menu = [
        ...menu,
        { text: 'Manage data connections', click: ()=>this.showWindowDialog('connections') },
        { divider: true },
        { text: 'Manage custom operations', click: ()=>this.showWindowDialog('customOperations') }
      ];

      var dashboardLink = this.$store.state.dashboardLink;

      if (dashboardLink) {
        menu = [
          ...menu,
          { divider: true },
          { text: 'Open Dask Dashboard', link: dashboardLink }
        ];
      }

      if (HELP_LINK) {
        menu = [
          ...menu,
          { divider: true },
          { text: 'Help', link: HELP_LINK }
        ];
      }


      if (!process.env.QUICK_USER_AUTH) {
        menu.push({ divider: true });
        menu.push({ text: 'Sign out', click: this.signOut });
      }

      return menu
    },

    noClose () {
      return (this.$store.state.datasets.length==1 && this.$store.state.datasets[0].blank)
    },

		sampleSize () {
			return Math.min(
				this.currentDataset.summary.sample_size,
				this.currentDataset.summary.rows_count
			);
		},

    appError () {
      if (this.$store.state.appStatus.status == 'error') {
        return "Unknown error"
      } else if (this.$store.state.appStatus.error) {
        return this.$store.state.appStatus.error.message
      }
      return false;
    },

    appStatusDetail () {
      if (this.$store.state.appStatus) {
        return this.$store.state.appStatus.detail
      }
      return false;
    },

		status () {
			return (
				this.$store.state.appStatus.status ||
				this.$store.state.appStatus.toString()
			);
		}
	},

	watch: {

		confirmDelete (value) {
			if (value>=0 && this.$store.state.datasets[value] && this.$store.state.datasets[value].blank) {
        return this.deleteTab(value)
      }
		},

    workspaceStatus (value, prevValue) {
      if (value !== 'loading' && prevValue === 'loading') {

        let tabSelected = this.tabSelected;

        // tabs showing
        setTimeout(() => {
          this.tabSelected = tabSelected+1;
          setTimeout(() => {
            this.tabSelected = tabSelected;
          }, 10);
        }, 10);
      }
    },

    footerVisible (value) {

      if (!window.intercomSettings) {
        window.intercomSettings = {
          app_id: INTERCOM_APP_ID,
        };
      }

      if (value && (!window.intercomSettings.vertical_padding || window.intercomSettings.vertical_padding == 20)) {
        window.intercomSettings.vertical_padding = 48;
        window.Intercom("update");
      } else if (!value) {
        window.intercomSettings.vertical_padding = 20;
        window.Intercom("update");
      }

    },

    tab: {
      immediate: true,
      handler (value) {
        if (this.tabSelected != value) {
          this.tabSelected = value;
        }
      }
    },

    tabSelected: {
      immediate: true,
      handler (value) {
        if (this.tab != value && value !== undefined) {
          this.tab = value;
        }
      }
    }

  },

	methods: {

    clickTab (index) {
      this.tabSelected = index;
    },

    runMacro (macro) {
      if (window.runMacro) {
        window.runMacro(macro);
      }
      this.windowDialog = false
    },

    backDialogClicked () {
      if (this.windowDialog == 'connections-select') {
        this.connectionClicked(false)
      }
      this.windowDialog = false
    },

    async newTab () {
      await this.$store.dispatch('newDataset', { go: true });
    },

    engineForm () {
      return new Promise((resolve, reject)=>{
        this.engineFormPromise = {resolve, reject};
        this.showWindowDialog('configs');
      })
    },

    addFile (event) {
      window.dragCount = 0
      try {
        var files = event.dataTransfer.files
        if (files && files[0] && files[0].name) {
        this.$refs.tableBar.commandHandle({command: 'loadFile', payload: { __fileInput: files[0] }, execute: ['uploadFile']});
        }

      } catch (err) {}
      this.dragFile = false
    },

    showConnections (event) {
      this.showWindowDialog('connections-select');
      this.selectCallback = event; // event.selectCallback
    },

    connectionClicked (selected) {
      if (this.selectCallback) {
        this.selectCallback(selected)
      }
      this.selectCallback = false;
      this.windowDialog = false;
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

    runCodeNow (forceAll = false, ignoreFrom = -1, newDfName, runCodeAgain) {
      try {
        return this.$refs.tableBar.runCodeNow(forceAll, ignoreFrom, newDfName, runCodeAgain);
      } catch (err) {
        console.error(err);
      }
    },

    async doneConfig (values, select=false) {
      if (values && values._event === 'select') {
        this.showWindowDialog('configs')
      } else {
        this.windowDialog = false;
        if (values) {
          let response = {};
          let request;
          let path;

          if (values._event === 'create' || !values._id) {
            request = 'post';
            path = '/engineconfigurations'
          } else {
            request = 'put';
            path = `/engineconfigurations/${values._id}`
          }

          let name = values._ws_name;

          let engineId = values._id;
          let engineConfigName = values.name;

          delete values._ws_name;
          delete values._id;

          values = objectFilter(values, ([key,value])=>value)

          let payload = {
            configuration: values,
            name
          }

          if (!select){
            try {
              response = await this.$store.dispatch('request',{
                request,
                path,
                payload
              });
            } catch (err) {
              console.error(err);
            }
            engineId = response.data._id;
            engineConfigName = response.data.name;
          }

          await this.$store.dispatch('mutateAndSave', {mutate: 'engineId', payload: engineId});
          await this.$store.dispatch('session/cleanSession');
          this.$store.commit('mutation', { mutate: 'localEngineParameters', payload: values });
          this.$store.commit('mutation', { mutate: 'enginePromise', payload: false });
          this.$store.commit('mutation', { mutate: 'engineConfigName', payload: engineConfigName });
          this.$store.commit('mutation', { mutate: 'engineId', payload: engineId });
          await this.initializeWorkspace();
        }
      }
      if (this.engineFormPromise && this.engineFormPromise.resolve) {
        this.engineFormPromise.resolve( (response ? response.data : false) || {} );
        this.engineFormPromise = false;
      }
    },

    async initializeWorkspace (error = false) {

      this.$store.commit('setAppStatus');

      this.$store.commit('session/mutation', { mutate: 'workspaceStatus', payload: 'loading' });

      try {

        await this.$store.dispatch('resetPromises', { from: 'workspace' });

        let slug = this.$route.params.slug;

        if (slug) {
          this.$store.commit('mutation', { mutate: 'workspaceSlug', payload: slug });
        }

        let config = false;

        if (!error) {
          config = await this.$store.dispatch('getEngine', { workspaceSlug: slug });
        } else {
          await this.$store.dispatch('resetEngine', { workspaceSlug: slug });
        }

        let jupyter_address = config ? config.jupyter_address : undefined;

        let features = await this.$store.dispatch('getFeatures', { slug, socketPost: this.socketPost, jupyter_address });

        if (!config) {
          await this.engineForm();
          return;
        }


        if (!features) {
          console.warn('[INITIALIZATION] Cannot check supported features')
        }

        if (features && config && features.unavailableEngines.includes(config.engine)) {
          console.warn('[INITIALIZATION] Unsupported engine');
          await this.engineForm();
          return;
        }

        let optimus = await this.initializeOptimus(slug);
        console.debug('[INITIALIZATION] Optimus initialized');

        if (!this.$store.state.datasets.length) {
          await this.$store.dispatch('newDataset', { go: true });
        }

        this.$store.commit('session/mutation', { mutate: 'workspaceStatus', payload: true });

        await this.$nextTick()

        try {

          this.$store.commit('kernel', 'loading');
          this.$store.commit('setAppStatus', 'workspace');

          let result = await this.runCodeNow(false, -1, undefined, false);
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
        let _error = printError(err)
        let appStatus = {
          error: new Error('Initialization error'),
          detail: _error,
          status: 'workspace'
        };
        this.$store.commit('setAppStatus', appStatus)

      }
    },

    initializeOptimus (slug) {
      let payload = { slug, socketPost: this.socketPost };
      return this.$store.dispatch('getOptimus', payload );
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
.intercom-lightweight-app-launcher, .intercom-launcher-frame {
  transition: all 0.21s ease-in-out;
}
.intercom-lightweight-app-launcher-badge, .intercom-launcher-badge-frame {
  transition: all 0.21s ease-in-out;
  width: 22.1px;
  height: 22.1px;
}
</style>
