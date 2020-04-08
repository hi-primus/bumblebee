export const state = () => ({
	token: false,
	username: false,
	email: false
})

export const mutations = {

  tokenlogin(state,token) {
  state.token=token

}

}

export const actions = {
	async login (context, payload) {
    const response = await window.$nuxt.$auth.login(payload)

    if(response.data.token) {
      context.commit('tokenlogin',response.data.token)
    }
    else{
      context.commit('tokenlogin',false)
    }

    // const sessionToken = `Bearer ${response.data.login.token}`

    // this.$cookies.set('x-access-token', sessionToken, {
    //   // httpOnly: true,
    //   // SameSite: true,
    //   path: '/',
    //   maxAge: 60 * 60 * response.data.login.tokenExpiration
    // })

    // setAuthToken(sessionToken)

  },
  async fetch (context, payload) {
    await context.dispatch('login', payload)
  }
}

export const getters = {
  isAuthenticated (state, getters) {
    return window.$nuxt.$auth.isAuthenticated()
  }
}
