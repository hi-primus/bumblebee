export const state = () => ({
	token: false,
	username: false,
	email: false
})

export const mutations = {}

export const actions = {
	async login (context, payload) {
		const response = await window.$nuxt.$auth.login(payload)

    console.log({response})

    // const sessionToken = `Bearer ${response.data.login.token}`

    // this.$cookies.set('x-access-token', sessionToken, {
    //   // httpOnly: true,
    //   // SameSite: true,
    //   path: '/',
    //   maxAge: 60 * 60 * response.data.login.tokenExpiration
    // })

    // setAuthToken(sessionToken)

    context.state.token = 'bbt'
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
