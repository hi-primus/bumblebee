<template>
	<Layout>
		<v-layout row wrap class="elevation-0 d-flex flex-column align-top justify-start">
      <template v-if="$store.state.datasets.length==0 && !useKernel" data-name="noKernel">
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
        <v-icon class="back-btn" large color="black" @click="stopClient">arrow_back</v-icon>
      </template>
      <div v-else class="bb-container" data-name="workspace">
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
          :class="{'tabs-disabled': $store.state.everyPreviewCode[tab] || isOperating}"
          class="bb-tabs px-6"
          background-color="#fff"
          show-arrows
          center-active
          style="flex: 0;"
        >
          <v-tab v-for="(_tab, key) in $store.state.datasets" :key="key" class="bb-tab">
            <span class="tab-content">
              <span class="tab-title">{{ _tab.name || key+1 }}</span>
              <span class="tab-subtitle">{{ _tab.file_name }}</span>
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
          <v-tab class="new-tab" color="primary darken-1" @click="$store.commit('newDataset')">
            <v-icon color="primary">add</v-icon>
          </v-tab>
        </v-tabs>
        <v-menu offset-y left min-width="200" >
          <template v-slot:activator="{ on: more }">
            <v-icon v-on="more" class="bb-menu" color="black" @click.stop="">more_vert</v-icon>
          </template>
          <v-list flat dense>
            <v-list-item-group color="black">
              <v-list-item
                @click="signOut()"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Sign out
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-menu>
        <div class="bb-content">
          <TableBar
            ref="tableBar"
            v-if="currentDataset"
            :isOperating.sync="isOperating"
            :dataset="currentDataset"
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
		</v-layout>
	</Layout>
</template>


<script>
import Layout from "@/components/Layout";
import TableBar from "@/components/TableBar";
import clientMixin from "@/plugins/mixins/client";
import dataTypesMixin from "@/plugins/mixins/data-types";
import applicationMixin from "@/plugins/mixins/application";
import { printError } from "@/utils/functions.js";
import { RESPONSE_MESSAGES } from "@/utils/constants.js";

import { mapGetters } from "vuex";

const { version } = require("@/package.json");

export default {
	components: {
		Layout,
		TableBar
	},

  mixins: [clientMixin, dataTypesMixin, applicationMixin],

  middleware: 'authenticated',

	data () {
		return {
			isOperating: false,
			tab: undefined,
			confirmDelete: -1,
			typesInput: ""
		};
	},

	computed: {
    ...mapGetters(["currentDataset"]),

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
			if (this.useKernel) {
				switch (value) {
					case "workspace":
            if (this.$store.state.kernel==false) {
              this.initializeWorkspace(0)
            }
						break;

					default:
						break;
				}
			}

			if (value == "workspace") {
				var dataset_csv = this.$route.query.dataset_csv;
				if (dataset_csv && this.$refs.tableBar) {
					this.$refs.tableBar.commandHandle({
						command: "load file",
						noOperations: true,
						immediate: true,
						payload: { url: dataset_csv, file_type: "csv", _moreOptions: true }
					});
				}
			}
		},

		tab(value) {
			if (value === undefined) {
				return;
			}

			let dataset = this.$store.state.datasets[value];

			if (value !== undefined && !dataset) {
				this.tab = this.$store.state.datasets[0] ? 0 : undefined;
				this.$store.commit("setTab", { tab: 0 });
				return;
			}

			this.$store.commit("setTab", { tab: value });
		},

		confirmDelete(value) {
			if (value>=0 && this.$store.state.datasets[value] && this.$store.state.datasets[value].blank) {
        this.deleteTab(value)
      }
		}
  },

  mounted () {
    this.initializeWorkspace()
  },

	methods: {
    async initializeWorkspace () {
      this.$store.commit("kernel", "loading");
      if (!this.$store.state.datasets.length) {
        this.$store.commit("newDataset");
      }

      try {
        var response = await this.socketPost("initialize", {
          session: this.$store.state.session,
          engine: this.$store.state.engine,
          tpw: this.$store.state.tpw,
          workers: this.$store.state.workers,
          reset: this.$route.query.reset
        })

        if (!response.data.optimus) {
          throw response
        }

        window.pushCode({ code: response.code })

        console.log("Optimus initialized", response.data)
        this.$store.commit("setAppStatus", 'workspace');
        this.$store.commit("kernel", "done")
      } catch (error) {
        if (error.code) {
          window.pushCode({ code: error.code, error: true })
        }
        console.error("Error initializing");
        printError(error)
        var appStatus = {
          error: new Error("Initialization error"),
          status: "workspace"
        };
        this.$store.commit("setAppStatus", appStatus)
      }
    },

    signOut () {
      this.stopClient(true)
      this.$store.commit("setCells", [])
      this.$store.dispatch("auth/signOut")
      this.$router.push({path: 'login', params: {}, query: this.$route.query }, ()=>{
      })
    },

		deleteTab(i) {
			this.$store.commit("delete", { index: i });
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
