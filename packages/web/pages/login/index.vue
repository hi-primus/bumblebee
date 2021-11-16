<template>
	<Layout v-show="showLogin">
		<v-layout wrap class="elevation-0 pa-0 d-flex flex-column align-top justify-start">
      <v-card
        :loading="isLoading ? 'primary' : false"
        class="elevation-0"
        width="100%"
        style="max-width: 700px; margin: auto"
      >
        <template v-if="firstTime!==undefined">


          <v-form @submit.prevent="register" v-if="typeForm==1">
            <v-card-text class="register-form">
              <img src="~/static/logo.svg" style="max-height: 52px" alt="Bumblebee">
              <v-card-title>
                <v-layout align-center justify-center>
                  <h1 class="display-1 mb-1">{{ (firstTime) ? 'Set up your administrator account' : 'Create your account' }}</h1>
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
                    v-show="!firstTime"
                    class="primary--text text--darken-1 text-button"
                    @click="typeForm=0"
                  >
                    <v-icon color="primary" small class="mb-1">arrow_back</v-icon>
                    Back to sign in
                  </span>
                </center>
              </div>
            </v-card-text>
          </v-form>
          <v-form class="py-8 px-6" @submit.prevent="signin()" v-if="typeForm==0">
            <v-card-title>
              <img src="~/static/logo.svg" class="display-3" alt="Bumblebee">
              <!-- <h1 class="display-3 mb-4">Bumblebee</h1> -->
            </v-card-title>
            <v-card-text>
              <v-text-field
                v-model="inputUsername"
                id="login-field-username"
                autocomplete="username"
                spellcheck="false"
                label="Username"
                required
                outlined
                clearable
              />
              <v-text-field
                v-model="inputPassword"
                id="login-field-password"
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
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="primary darken-1"
                id="login-btn-signin"
                large
                depressed
                type="submit"
              >Sign in</v-btn>
              <v-spacer />
            </v-card-actions>
            <v-layout
              align-center
              justify-center
            >
              <div
                class="primary--text text--darken-1 text-button"
                id="login-btn-change-to-signup"
                @click="typeForm=1"
              >Sign up to bumblebee</div>
            </v-layout>
          </v-form>
        </template>
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
import { printError, RESPONSE_MESSAGES } from 'bumblebee-utils'

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
      // errorMessage: "",
      isLoading: false,
      firstTime: undefined,
      showLogin: !process.env.QUICK_USER_AUTH
		};
	},

	computed: {
    ...mapGetters(["appError"]),

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
    this.checkDummyLogin()
    this.checkFirstTime()
    setTimeout(() => {
      window.intercomSettings["vertical_padding"] = 20;
      window.Intercom("update");
    }, 200);
    setTimeout(() => {
      this.showLogin = true;
    }, 3000);
	},

	methods: {

    async checkFirstTime () {
      // TO-DO: Check for users
      this.firstTime = false;

      if (this.firstTime) {
        this.typeForm = 1;
      }
    },

    async checkDummyLogin () {      
      let isAuthenticated = await this.$store.dispatch('session/isAuthenticated');

      if (!isAuthenticated && this.$route.query.username) {
        await this.$store.dispatch('session/dummyLogin', { username: this.$route.query.username });
        isAuthenticated = await this.$store.dispatch('session/isAuthenticated');
      }
      if (isAuthenticated) {
        this.$router.push({ path: '/workspaces', query: this.$route.query });
      }
    },

		async register () {
			try {
        if (this.confirmPassword!==this.createPassword && !this.showCreatePassword) {
          throw "Passwords doesn't match"
        }

        this.successMessage = false
        this.resetStatus()
        this.isLoading = true

				var response = await this.$store.dispatch("session/signUp", {
					username: this.createUsername,
          password: this.createPassword,
          firstName: this.createFirstName,
          lastName: this.createLastName,
					email: this.email
				});
        if (response.status === 201) {
          this.typeForm = 0
          this.successMessage = RESPONSE_MESSAGES.user[201]
          this.$store.commit("status")
          this.isLoading = false
          return
        }
				if (response.status >= 300) {
					throw response
				}
        throw response
			} catch (error) {
        this.successMessage = ""
        var status = (error && error.response) ? error.response.status : false
        if (status) {
          error.message = RESPONSE_MESSAGES.user[status]
        }
				this.handleError(error, "waiting")
      }
      this.isLoading = false
		},
		async signin() {
			try {
        this.successMessage = false
        this.resetStatus()
        this.isLoading = true
        var login = await this.$store.dispatch("session/signIn", {
          username: this.inputUsername,
          password: this.inputPassword
        })
        this.$router.push({path: '/workspaces', query: this.$route.query })

        this.successMessage = "";
			} catch (error) {
        var status = (error && error.response) ? error.response.status : false
        if (status) {
          error.message = RESPONSE_MESSAGES.user[status]
        }
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
