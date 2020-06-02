import Vue from 'vue'
import VueAxios from 'vue-axios'
import VueAuthenticate from 'vue-authenticate'
import axios from 'axios';

Vue.use(VueAxios, axios)
Vue.use(VueAuthenticate, {
  baseUrl: process.env.API_URL,

  providers: {
    github: {
      clientId: '',
      redirectUri: `http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || 3000}/auth/callback` // Your client app URL
    }
  }
})
