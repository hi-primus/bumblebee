import axios from 'axios'

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
    response = await axios.post(process.env.DEV_API_URL + '/auth/signup', payload)
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
    console.log({response})
    return response
  },

	async login (context, payload) {

    var response

    response = await axios.post(process.env.DEV_API_URL + '/auth/signin', payload)

    response = await window.$nuxt.$auth.login(payload)

    console.log({response})

    if (response.data.accessToken) {
      context.commit('accessToken', response.data.accessToken)
    } else {
      context.commit('accessToken', false)
    }
    if (response.data.refreshToken) {
      context.commit('refreshToken', response.data.refreshToken)
    } else {
      context.commit('refreshToken', false)
    }
  },

  async fetch (context, payload) {
    await context.dispatch('login', payload)
  }
}

export const getters =  {
  isAuthenticated (state, getters) {
    return window.$nuxt.$auth.isAuthenticated()
  }
}
