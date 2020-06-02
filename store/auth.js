import axios from 'axios'

export const state = () => ( {
	token:false,
	username:false,
	email:false
})

export const mutations =  {
  tokenlogin(state, token) {
    state.token = token
  }
}

export const actions =  {
  async register(context,  payload) {
    const response = await window.$nuxt.$auth.register( {
      ...payload,
      secret:window.authSecret || '123'
    })
    console.log({response})
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
    const response = await window.$nuxt.$auth.login(payload)

    if (response.data.token) {
      context.commit('tokenlogin', response.data.token)
    }
    else {
      context.commit('tokenlogin', false)
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
