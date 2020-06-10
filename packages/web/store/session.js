import axios from 'axios'
import { setAuthTokenAxios, resetAuthTokenAxios } from '@/utils/auth.js'

export const state = () => ( {
  accessToken: '',
  refreshToken: '',
  username: '',
  email: '',
  session: ':' // TODO: -> workspace
})


export const mutations =  {
  mutation (state, {mutate, payload}) {
    console.log('before mutate', state[mutate])
    console.log('mutating', mutate, payload)
    state[mutate] = payload
    console.log('mutated', state[mutate])
  },
}

export const actions =  {
  async signUp(context,  payload) {
    var response
    response = await axios.post(process.env.API_URL + '/auth/signup', {
      ...payload,
      secret: window.authSecret || '123'
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

  async profile ({commit}, { auth }) {
    var response = await axios.get(process.env.API_URL + '/auth/profile', { headers: { 'authorization': auth } } )
    console.log('profile')
    console.log({username: response.data.username})

    commit('mutation', { mutate: 'username', payload: response.data.username})
    commit('mutation', { mutate: 'session', payload: response.data.username})

    return true // TODO: profile action
  },

	async signIn ({commit, dispatch}, payload) {

    var response
    // response = await axios.post(process.env.DEV_API_URL + '/auth/signin', payload)
    response = await axios.post(process.env.API_URL + '/auth/signin', payload)

    dispatch('setTokenCookies', response.data)

    if (response.data.accessToken) {
      commit('mutation', { mutate: 'username', payload: response.data.username})
      commit('mutation', { mutate: 'accessToken', payload: response.data.accessToken})
      dispatch('profile', { auth: response.data.authToken} )
      setAuthTokenAxios(response.data.accessToken)
    } else {
      commit('mutation', { mutate: 'username', payload: false})
      commit('mutation', { mutate: 'accessToken', payload: false})
    }
    if (response.data.refreshToken) {
      commit('mutation', { mutate: 'refreshToken', payload: response.data.refreshToken})
    } else {
      commit('mutation', { mutate: 'refreshToken', payload: false})
    }

  },

	async signOut ({commit, dispatch}, payload) {

    dispatch('setTokenCookies', {})

    resetAuthTokenAxios()
    commit('mutation', { mutate: 'username', payload: false})
    commit('mutation', { mutate: 'accessToken', payload: false})
    commit('mutation', { mutate: 'refreshToken', payload: false})
  },

  async init ({dispatch, commit}, payload) {

    const cookies = this.$cookies.getAll() || {}
    if (cookies.hasOwnProperty('x-access-token')) {
      try {
        const token = cookies['x-access-token']
        setAuthTokenAxios(token)
        commit('mutation', { mutate: 'accessToken', payload: token})
        console.log('calling profile')
        await dispatch('profile', { auth: cookies['x-access-token'] })
        return true
      } catch (err) {
        console.error('Provided token is invalid:', err)
        commit('mutation', { mutate: 'accessToken', payload: false})
        resetAuthTokenAxios()
        return false
      }
    } else {
      commit('mutation', { mutate: 'accessToken', payload: false})
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
  isAuthenticated (state) {
    return state.accessToken && state.username && state.email
  }
}
