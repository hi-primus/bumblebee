// import axios from 'axios'

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
  async register(context,  {username, password, email, name, lastname}) {
    const response = await window.$nuxt.$auth.register( {
      username,
      password,
      email,
      name,
      lastname,
      secret:window.authSecret || '123'
    })
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
