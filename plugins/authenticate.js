import Vue from 'vue'
import VueAxios from 'vue-axios'
import VueAuthenticate from 'vue-authenticate'
import axios from 'axios';

Vue.use(VueAxios, axios)
Vue.use(VueAuthenticate, {
  baseUrl: process.env.API_URL || 'http://localhost:5000', // Your API domain

  providers: {
    github: {
      clientId: '',
      redirectUri: 'http://localhost:3000/auth/callback' // Your client app URL
    }
  }
})
