import axios from 'axios'
import { setAuthTokenAxios, resetAuthTokenAxios } from '@/utils/auth.js'

const propertiesNames = ['accessToken', 'refreshToken', 'username', 'email']

var properties = {}
propertiesNames.forEach(name => {
  properties[name] = false
})

export const state = () => ( {
	...properties
})

var setters = {}
propertiesNames.forEach(name => {
  setters[name] = function (state, payload) {
    state[name] = payload
  }
})

export const mutations =  {
  ...setters
}

export const actions =  {
  async register(context,  payload) {
    var response
    // response = await axios.post(process.env.DEV_API_URL + '/auth/signup', payload)
    response = await window.$nuxt.$auth.register( {
      ...payload,
      secret:window.authSecret || '123'
    })
    return response
  },

  async test (context, {request, path, payload, auth}) {

    var response
    if (request === 'post') {
      response = await axios[request](process.env.DEV_API_URL + path, payload, { headers: {'Authorization': auth} } )
    } else {
      response = await axios[request](process.env.DEV_API_URL + path, { headers: {'Authorization': auth} } )
    }
    return response

  },

  async profile ({context}) {
    return true // TODO: profile action
  },

	async login ({commit, dispatch}, payload) {

    var response
    // response = await axios.post(process.env.DEV_API_URL + '/auth/signin', payload)
    response = await window.$nuxt.$auth.login(payload)

    dispatch('setTokenCookies', response.data)

    if (response.data.accessToken) {
      setAuthTokenAxios(response.data.accessToken)
      commit('accessToken', response.data.accessToken)
    } else {
      commit('accessToken', false)
    }
    if (response.data.refreshToken) {
      commit('refreshToken', response.data.refreshToken)
    } else {
      commit('refreshToken', false)
    }
  },

  async init ({dispatch, commit}, payload) {

    const cookies = this.$cookies.getAll() || {}
    if (cookies.hasOwnProperty('x-access-token')) {
      try {
        setAuthTokenAxios(cookies['x-access-token'])
        commit('accessToken', cookies['x-access-token'])
        await dispatch('profile')
        return true
      } catch (err) {
        console.error('Provided token is invalid:', err)
        commit('accessToken', false)
        resetAuthTokenAxios()
        return false
      }
    } else {
      commit('accessToken', false)
      resetAuthTokenAxios()
      return false
    }

  },

  async setTokenCookies (context, { accessToken, refreshToken }) {

    if (accessToken) {
      this.$cookies.set('x-access-token', accessToken)
    } else {
      this.$cookies.remove('x-access-token')
    }
    if (refreshToken) {
      this.$cookies.set('x-refresh-token', refreshToken)
    } else {
      this.$cookies.remove('x-refresh-token')
    }

  }
}

export const getters =  {
  isAuthenticated (state, getters) {
    return window.$nuxt.$auth.isAuthenticated()
  }
}
