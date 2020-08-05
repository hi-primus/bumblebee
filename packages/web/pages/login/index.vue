<template>
	<Layout>
		<v-layout row wrap class="elevation-0 d-flex flex-column align-top justify-start">
      <v-card
        :loading="isLoading ? 'primary' : false"
        class="elevation-0"
        width="100%"
        style="max-width: 700px; margin: auto"
      >
        <v-form @submit.prevent="register" v-if="typeForm==1">
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
                autocomplete="given-name"
                spellcheck="false"
                required
                outlined
                dense
              ></v-text-field>
              <v-text-field
                label="Last name"
                v-model="createLastName"
                autocomplete="family-name"
                spellcheck="false"
                required
                outlined
                dense
              ></v-text-field>
              <v-text-field
                label="E-mail"
                v-model="email"
                autocomplete="email"
                spellcheck="false"
                :rules="emailRules"
                required
                outlined
                dense
              ></v-text-field>
              <v-text-field
                label="Username"
                v-model="createUsername"
                autocomplete="username"
                spellcheck="false"
                required
                outlined
                dense
              ></v-text-field>
              <v-text-field
                label="Password"
                v-model="createPassword"
                autocomplete="new-password"
                spellcheck="false"
                :append-icon="showCreatePassword ? 'mdi-eye' : 'mdi-eye-off'"
                :type="showCreatePassword ? 'text' : 'password'"
                required
                outlined
                counter
                dense
                @click:append="showCreatePassword = !showCreatePassword"
              ></v-text-field>
              <v-text-field
                v-if="showCreatePassword==false"
                type="password"
                label="Confirm password"
                v-model="confirmPassword"
                autocomplete="new-password"
                spellcheck="false"
                required
                outlined
                dense
              ></v-text-field>
              <v-card-actions>
                <v-spacer />
                <v-btn color="primary darken-1" large depressed type="submit">Sign up</v-btn>
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
        <v-form class="py-8 px-6" @submit.prevent="subscribe()" v-if="typeForm==0">
          <v-card-title>
            <h1 class="display-3 mb-4">Bumblebee</h1>
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="inputUsername"
              autocomplete="username"
              spellcheck="false"
              label="Username"
              required
              outlined
              clearable
            />
            <v-text-field
              v-if="useKernel"
              v-model="inputPassword"
              autocomplete="current-password"
              spellcheck="false"
              :append-icon="showPassword ? 'visibility' : 'visibility_off'"
              :type="(showPassword) ? 'text' : 'password'"
              label="Password"
              required
              outlined
              clearable
              @click:append="showPassword = !showPassword"
            />
            <v-text-field
              v-else
              v-model="inputPassword"
              autocomplete="new-password"
              spellcheck="false"
              :append-icon="showPassword ? 'visibility' : 'visibility_off'"
              :type="(showPassword) ? 'text' : 'password'"
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
              type="submit"
            >{{(useKernel) ? 'Sign in' : 'Subscribe'}}</v-btn>
            <v-spacer />
          </v-card-actions>
          <v-layout
            v-if="useKernel && useApiFeatures"
            align-center
            justify-center
          >
            <div
              class="primary--text text--darken-1 text-button"
              @click="typeForm=1"
            >Sign up</div>
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
		</v-layout>
	</Layout>
</template>


<script>
import Layout from "@/components/Layout"
import clientMixin from "@/plugins/mixins/client"
import dataTypesMixin from "@/plugins/mixins/data-types"
import applicationMixin from "@/plugins/mixins/application"
/*bu*/ import { printError, RESPONSE_MESSAGES } from 'bumblebee-utils' /*bu*/

import { mapGetters } from "vuex";

const { version } = require("@/package.json");

export default {
	components: {
		Layout
	},

	mixins: [clientMixin, dataTypesMixin, applicationMixin],

	data () {
		return {
			showPassword: false,
			inputPassword: "",
			inputUsername: "",
			confirmDelete: -1,
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
      errorMessage: "",
      isLoading: false
		};
	},

	computed: {
    ...mapGetters(["appError"]),

    useApiFeatures () {
      return +process.env.API_FEATURES
    },

		status () {
			return (
				this.$store.state.appStatus.status ||
				this.$store.state.appStatus.toString()
			);
		}
	},

	mounted() {
		console.log(`Bumblebee v${version}`)
		window.document.body.click()
	},

	methods: {
		async register () {
			try {
        if (this.confirmPassword!==this.createPassword && !this.showCreatePassword) {
          throw "Passwords doesn't match"
        }
				var response = await this.$store.dispatch("session/signUp", {
					username: this.createUsername,
          password: this.createPassword,
          firstName: this.createFirstName,
          lastName: this.createLastName,
					email: this.email
				});
        if (response.status === 201) {
          this.typeForm = 0
          this.successMessage = RESPONSE_MESSAGES['user'][201]
          this.$store.commit("status")
          return
        }
				if (response.status >= 300) {
					throw response
				}
        throw response
			} catch (error) {
        this.successMessage = ""
        var errorMessage = RESPONSE_MESSAGES['user'][error.response.status]
				this.handleError(error, "waiting")
			}
		},
		async subscribe() {
			try {
        this.isLoading = true
				if (this.useKernel) {
					var login = await this.$store.dispatch("session/signIn", {
						username: this.inputUsername,
						password: this.inputPassword
          })
          if (this.$route.query.ws!=0 && +process.env.API_FEATURES) {
            this.$router.push({path: '/workspaces', query: this.$route.query })
          } else {
            this.$router.push({path: '/workspaces/default', query: this.$route.query })
          }

					this.successMessage = "";
				} else {
          console.log('[BUMBLEBEE] Visualization mode')
          this.$store.commit('session/mutation', {mutate: 'username', payload: this.inputUsername})
          this.$nextTick(()=>{
            this.$router.push({path: '/workspaces/default', query: this.$route.query })
          })
				}
			} catch (error) {
				console.error(error);
				this.handleError(error, "waiting");
      }
      this.isLoading = false
		},
		resetStatus(closing) {
			if (!closing) {
				this.$store.commit("setAppStatus");
			}
		},
	}
};
</script>
