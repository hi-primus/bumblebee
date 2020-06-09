<template>
	<Layout>
		<v-dialog
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
		<v-layout row wrap class="elevation-0 d-flex flex-column align-top justify-start">
			<template v-if="status=='waiting' || status=='loading'">
				<v-card
					:loading="(status=='loading') ? 'primary' : false"
					class="elevation-0"
					width="100%"
					style="max-width: 700px; margin: auto"
				>
					<v-form @submit.prevent="submit" v-if="typeForm==1">
            <v-card-text class="register-form">
              <v-card-title>
                <v-layout align-center justify-center>
                  <h1 class="display-1 mb-1">Create your account</h1>
                </v-layout>
              </v-card-title>
              <div class="register-form-fields">
								<v-text-field
                  label="First name"
                  v-model="createFirstName"
                  required
                  outlined
                  clearable
                  dense
                ></v-text-field>
								<v-text-field
                  label="Last name"
                  v-model="createLastName"
                  required
                  outlined
                  clearable
                  dense
                ></v-text-field>
								<v-text-field
									label="E-mail"
									v-model="email"
									:rules="emailRules"
									required
									outlined
									clearable
									dense
								></v-text-field>
								<v-text-field
                  label="Username"
                  v-model="createUsername"
                  required
                  outlined
                  clearable
                  dense
                ></v-text-field>
								<v-text-field
									label="Password"
									v-model="createPassword"
									:append-icon="showCreatePassword ? 'mdi-eye' : 'mdi-eye-off'"
									:type="showCreatePassword ? 'text' : 'password'"
									required
									outlined
									clearable
									counter
									dense
									@click:append="showCreatePassword = !showCreatePassword"
								></v-text-field>
								<v-text-field
									v-if="showCreatePassword==false"
                  type="password"
									label="Confirm password"
									v-model="confirmPassword"
									required
									outlined
									clearable
									dense
								></v-text-field>
								<v-card-actions>
									<v-spacer />
									<v-btn color="primary darken-1" large depressed @click="register">Sign up</v-btn>
									<v-spacer />
								</v-card-actions>
								<v-spacer></v-spacer>
								<center>
									<span
										class="primary--text text--darken-1 text-button"
										@click="typeForm=0"
									>Sign in</span>
								</center>
              </div>
            </v-card-text>
					</v-form>
					<v-form class="py-8 px-6" @submit="subscribe" v-if="typeForm==0">
						<v-card-title>
							<h1 class="display-3 mb-4">Bumblebee</h1>
						</v-card-title>
						<v-card-text>
							<v-text-field v-model="inputUsername" label="Username" required outlined clearable />
							<v-text-field
								v-if="useKernel"
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
							<v-spacer />
							<v-btn
								color="primary darken-1"
								large
								depressed
								@click="subscribe"
							>{{(useKernel) ? 'Sign in' : 'Subscribe'}}</v-btn>
							<v-spacer />
						</v-card-actions>
						<v-layout align-center justify-center>
							<div
								v-if="useRegister"
								class="primary--text text--darken-1 text-button"
								@click="typeForm=1"
							>{{(useRegister) ? 'Sign up' : ''}}</div>
						</v-layout>
					</v-form>
					<v-card-text v-if="successMessage || appError" class="pb-0">
						<v-alert
							v-if="appError"
							type="error"
							class="mb-2"
							dismissible
							@input="resetStatus($event)"
						>{{ appError }}</v-alert>
						<v-alert
							v-if="successMessage"
							type="success"
							class="mb-2"
							dismissible
							@input="successMessage = ''"
						>{{ successMessage }}</v-alert>
					</v-card-text>
				</v-card>
			</template>
			<template v-else>
				<template v-if="$store.state.datasets.length==0">
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
				<div v-else class="bb-container">
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
							<span class="tab-title">{{ _tab.name || key+1 }}</span>
							<span class="tab-subtitle">{{ _tab.file_name }}</span>
							<v-hover v-slot:default="{ hover }">
								<v-icon
									:color="hover ? 'primary darken-1' : ''"
									small
									class="close-icon"
									@click.stop="confirmDelete=key;"
								>close</v-icon>
							</v-hover>
						</v-tab>
						<v-tab class="new-tab" color="primary darken-1" @click="$store.commit('newDataset')">
							<v-icon color="primary">add</v-icon>
						</v-tab>
					</v-tabs>
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
			</template>
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

	data() {
		return {
			showPassword: false,
			inputPassword: "",
			inputUsername: "",
			inputEngine: false,
			isOperating: false,
			tab: undefined,
			confirmDelete: -1,
			typesSelected: [],
			typesInput: "",
			version: "",
			createFirstName: "",
			createLastName: "",
			createUsername: "",
			createPassword: "",
			confirmPassword: "",
			email: "",
			emailRules: [
				v =>
					!v ||
					/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) ||
					"E-mail must be valid"
			],
			showCreatePassword: false,
			typeForm: 0,
			successMessage: "",
			errorMessage: ""
		};
	},

	computed: {
		...mapGetters(["currentDataset", "appError"]),

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
		},

		appStatus() {
			return this.$store.state.appStatus;
		}
	},

	watch: {
		async status(value) {
			if (this.useKernel) {
				switch (value) {
					case 'receiving back':
						this.stopClient(true);
						this.$store.commit('setCells', []);
						break;
					case 'receiving':
						this.$store.commit('kernel', 'loading');
						if (!this.$store.state.datasets.length) {
							this.$store.commit('newDataset');
						}

						try {
							var response = await this.socketPost('initialize', {
								session: this.$store.state.session,
								engine: this.$store.state.engine,
								tpw: this.$store.state.tpw,
								workers: this.$store.state.workers,
								reset: this.$route.query.reset
              })

              var reserved_words

              if (response.data.reserved_words) {
                reserved_words = response.data.reserved_words
                reserved_words.unary_operators = reserved_words.operators.unary
                reserved_words.binary_operators = reserved_words.operators.binary
                delete reserved_words.operators
              } else {
                reserved_words = {
                  functions: [ 'MOD', 'ABS', 'EXP', 'LOG',
                    'POW', 'CEILING', 'SQRT', 'FLOOR', 'TRUNC',
                    'RANDIANS', 'DEGREES', 'SIN', 'COS', 'TAN',
                    'ASIN', 'ACOS', 'ATAN', 'SINH', 'ASINH', 'COSH',
                    'TANH', 'ACOSH', 'ATANH'
                  ],
                  unary_operators: ['|', '&', '+', '-'],
                  binary_operators: ['+', '-', '*', '/']
                }
              }

              var reservedWords = []

              Object.entries(reserved_words).forEach(([key, words])=>{
                Object.entries(words).forEach(([word, description])=>{
                  reservedWords.push({type: key, text: word, description})
                })
              })
              this.$store.commit('mutation', {mutate: 'reservedWords', payload: reservedWords})

							if (!response.data.optimus) {
								throw response;
							}

							window.pushCode({ code: response.code });

							console.log('Optimus initialized', response.data);
							this.$store.commit('kernel', 'done');
						} catch (error) {
							if (error.code) {
								window.pushCode({ code: error.code, error: true });
							}
							console.error('Error initializing');
							printError(error);
							var appStatus = {
								error: new Error('Initialization error'),
								status: 'receiving'
							};
							this.$store.commit('setAppStatus', appStatus);
						}
						break;

					default:
						break;
				}
			}

			if (value == 'receiving') {
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

		tab(value) {
			if (value === undefined) {
				return;
			}

			let dataset = this.$store.state.datasets[value];

			if (value !== undefined && !dataset) {
				this.tab = this.$store.state.datasets[0] ? 0 : undefined;
				this.$store.commit('mutation', { mutate: 'tab', payload: 0 });
				return;
			}

			this.$store.commit('mutation', { mutate: 'tab', payload: value });
		},

		confirmDelete(value) {
			// TODO: Remove confirmation on empty datasets
		}
	},

	mounted() {
		console.log(`Bumblebee v${version}`);
		window.document.body.click();

		// this.inputUsername = this.$route.query.username || ''
		// this.inputPassword = this.$route.query.password || ''
		this.inputEngine = this.$route.query.engine;

		// if (this.inputUsername && this.inputPassword) {
		//   this.subscribe()
		// }
	},

	methods: {
		typesUpdated () {
			this.typesInput = ""
			this.$refs.autocomplete.loseFocus
		},
		async register () {
			try {
        if (this.confirmPassword!==this.createPassword && !this.showCreatePassword) {
          throw "Passwords doesn't match"
        }
				var response = await this.$store.dispatch("auth/register", {
					username: this.createUsername,
          password: this.createPassword,
          firstName: this.createFirstName,
          lastName: this.createLastName,
					email: this.email
				});
        if (response.status === 201) {
          console.log(response)
          this.typeForm = 0
          this.successMessage = RESPONSE_MESSAGES['user'][201]
          this.$store.commit("status")
        }
				if (response.status >= 300) {
					throw response
				}
			} catch (error) {
        this.successMessage = ""
        var errorMessage = RESPONSE_MESSAGES['user'][error.response.status]
				console.log(error)
				this.handleError(error, "waiting")
			}
		},
		async subscribe() {
			try {
				var tpw = this.$route.query.tpw;
				var workers = this.$route.query.workers;
				if (this.useKernel) {
					var login = await this.$store.dispatch("auth/login", {
						username: this.inputUsername,
						password: this.inputPassword
					});
					this.startClient({
						session: this.inputUsername,
						engine: this.inputEngine,
						tpw,
						workers
					});
					this.successMessage = "";
				} else {
					this.startClient({
						session: this.inputUsername,
						key: this.inputPassword,
						engine: this.inputEngine,
						tpw,
						workers
					});
				}
			} catch (error) {
				console.error(error);
				this.handleError(error, "waiting");
			}
		},
		resetStatus(closing) {
			if (!closing) {
				this.$store.commit("setAppStatus");
			}
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
