import VueIntercom from 'vue-intercom'
import Vue from 'vue'
import { INTERCOM_APP_ID } from 'bumblebee-utils'

Vue.use(VueIntercom, { appId: INTERCOM_APP_ID })
