import axios from 'axios'
import { setAuthTokenAxios, resetAuthTokenAxios } from '@/utils/auth.js'
import { asyncDebounce } from 'bumblebee-utils'
import Vue from 'vue'

export const state = () => ({
  accessToken: false,
  refreshToken: false,
  username: false,
  email: false,
  workspace: false,
  workspaceStatus: false,
  key: false,
  socket: false,
  saveReady: false
})


export const mutations =  {
  mutation (state, { mutate, payload}) {
    state[mutate] = payload
  },
}

export const actions =  {

  setAccessToken (context, payload) {
    context.commit('mutation', { mutate: 'accessToken', payload })
    if (payload) {
      // context.commit('mutation', { mutate: 'accessToken', payload: 'Bearer ' + payload })
      setAuthTokenAxios('Bearer ' + payload)
    } else {
      context.commit('mutation', { mutate: 'accessToken', payload })
      resetAuthTokenAxios()

    }
  },

  saveWorkspace: asyncDebounce ( async function ({dispatch, commit, state, rootState}) {
    if (!state.saveReady)  {
      return
    }
    commit('mutation', { mutate: 'workspaceStatus', payload: 'uploading' })
    try {

      var commands = rootState.commands.map(e=>{
        var { newDfName, done, error, ...cell} = e
        return JSON.stringify(cell)
      })

      var dataSources = rootState.dataSources.map(e=>{
        var { done, error, ...cell} = e
        return JSON.stringify(cell)
      })

      var configuration = rootState.engineId || null;

      var payload = {
        tabs: rootState.datasets.map(e=>{
          var {dataSources, name, ...profiling} = e
          return {
            name,
            profiling: JSON.stringify(profiling),
          }
        }),
        commands: [...dataSources, ...commands],
        dataSourcesCount: dataSources.length,
        configuration,
        selectedTab: rootState.tab

      }

      var workspaceId = rootState.workspace ? rootState.workspace._id : undefined

      var response = await dispatch('request', {
        request: 'put',
        path: `/workspaces/${workspaceId}`,
        payload
      }, { root: true })

      commit('mutation', { mutate: 'workspaceStatus', payload: 'ok' })

      return response

    } catch (err) {
      commit('mutation', { mutate: 'workspaceStatus', payload: 'error' })
      throw err
    }
  },100),

  async signUp (context,  payload) {
    var response
    response = await axios.post(process.env.API_URL + '/auth/signup', {
      ...payload,
      secret: window.authSecret || '123'
    })
    return response
  },

  cleanSession ({commit}) {
    commit('mutation', { mutate: 'saveReady', payload: false});
    commit('clearSession', {}, { root: true });
  },

  async profile ({commit, state}, payload) {
    var auth = payload ? payload.auth : undefined;
    auth = auth!==undefined ? auth : state.accessToken;
    if (process.env.DOCKER && auth && !state.username) {
      commit('mutation', { mutate: 'username', payload: true });
      return true;
    }
    var username;
    try {
      var response = await axios.get(process.env.API_URL + '/auth/profile', { headers: { 'Authorization': auth } } )
      username = response.data.username;
    } catch (err) {
      if (!err.response || err.response.status!==401) {
        console.log(err);
      }
    }
    commit('mutation', { mutate: 'username', payload: username})
    return username
  },

  async getUsername ({ dispatch, state }, payload) {
    if (state.username && state.username !== true) {
      return state.username;
    }
    if (process.client) {
      return await dispatch('profile');
    } else {
      return state.accessToken ? true : false;
    }
  },

	async signIn ({commit, dispatch}, payload) {

    const response = await axios.post(process.env.API_URL + '/auth/signin', payload)

    var accessToken = response.data.accessToken ? ('Bearer ' + response.data.accessToken) : false
    var refreshToken = response.data.refreshToken ? ('Bearer ' + response.data.refreshToken) : false

    await dispatch('setTokenCookies', {accessToken, refreshToken})

    await dispatch('setAccessToken', accessToken)
    commit('mutation', { mutate: 'refreshToken', payload: refreshToken})

    if (accessToken) {
      await dispatch('profile', { auth: accessToken} )
    } else {
      commit('mutation', { mutate: 'username', payload: false})
    }

  },

	async signOut ({commit, dispatch}, payload) {

    await dispatch('setTokenCookies', {refreshToken: false, accessToken: false})
    await dispatch('setAccessToken', false)
    commit('mutation', { mutate: 'username', payload: false})
    commit('mutation', { mutate: 'refreshToken', payload: false})
  },

  async serverInit ({dispatch, commit, state}, payload) {

    const accessToken = this.$cookies.get('x-access-token')
    if (accessToken) {
      try {
        await dispatch('profile', { auth: accessToken });
        await dispatch('setAccessToken', accessToken)
        return true
      } catch (err) {
        console.error('Provided token is invalid')
        await dispatch('signOut')
        return false
      }
    } else {
      await dispatch('setAccessToken', false)
      return false
    }

  },

  async setTokenCookies (context, { accessToken, refreshToken }) {

    if (accessToken) {
      this.$cookies.set('x-access-token', accessToken)
    } else if (accessToken!==undefined) {
      this.$cookies.remove('x-access-token')
    }
    if (refreshToken) {
      this.$cookies.set('x-refresh-token', refreshToken)
    } else if (refreshToken!==undefined) {
      this.$cookies.remove('x-refresh-token')
    }

  }
}

export const getters =  {
  isAuthenticated (state) {
    return state.accessToken && state.username
  }
}
