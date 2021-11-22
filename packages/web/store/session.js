import { asyncDebounce } from 'bumblebee-utils'
import Vue from 'vue'

export const state = () => ({
  accessToken: false,
  validToken: false,
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
    Vue.set(state, mutate, payload)
  },
}

export const actions =  {

  setAccessToken (context, payload) {
    context.commit('mutation', { mutate: 'accessToken', payload })
    if (payload) {
      // context.commit('mutation', { mutate: 'accessToken', payload: 'Bearer ' + payload })
      this.$axios.defaults.headers.common.Authorization = 'Bearer ' + payload;
    } else {
      context.commit('mutation', { mutate: 'accessToken', payload })
      delete this.$axios.defaults.headers.common.Authorization;

    }
  },

  saveWorkspace: asyncDebounce ( async function ({dispatch, commit, state, rootState, rootGetters}) {
    if (!state.saveReady)  {
      return
    }
    commit('mutation', { mutate: 'workspaceStatus', payload: 'uploading' })
    try {

      var transformations = rootGetters.transformations.map(e=>{
        var { newDfName, done, error, ...cell} = e
        return JSON.stringify(cell)
      })

      var dataSources = rootGetters.dataSources.map(e=>{
        var { done, error, ...cell} = e
        return JSON.stringify(cell)
      })

      var configuration = rootState.engineId || null;

      let customCommands = rootGetters["customCommands/generatorsJson"];

      let tabs = [];
      
      for (let i = 0; i < rootState.datasets.length; i++) {
        const tab = rootState.datasets[i];
        if (tab) {
          let {dataSources, name, ...profiling} = tab;
          tabs.push({
            name,
            profiling: JSON.stringify(profiling),
          });
        } else {
          tabs.push({
            name: '(new dataset)',
            profiling: JSON.stringify({blank: true})
          });
        }
        
      }

      var payload = {
        tabs,
        commands: [...dataSources, ...transformations],
        dataSourcesCount: dataSources.length,
        customCommands,
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
    return await this.$axios.post('/auth/signup', payload);
  },

  cleanSession ({commit}) {
    commit('mutation', { mutate: 'saveReady', payload: false});
    commit('clearSession', {}, { root: true });
  },

  async profile ({commit, state}, payload) {
    var auth = (payload ? payload.auth : undefined) || state.accessToken;
    var username;
    try {
      var response = await this.$axios.get('/auth/profile', { headers: { 'Authorization': auth } } )
      username = response.data.username;
    } catch (err) {
      if (!err.response || err.response.status!==401) {
        console.log(err);
      }
    }
    commit('mutation', { mutate: 'username', payload: username});
    commit('mutation', { mutate: 'validToken', payload: true});
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

    const response = await this.$axios.post('/auth/signin', payload)

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

  },

  async isAuthenticated ({ state, dispatch }) {
    let valid = process.client ? true : state.validToken;
    if (process.client) {
      valid = true;
    }
    if (!valid) {
      await dispatch('profile');
      valid = true;
    }
    return (state.accessToken && state.username && valid);
  },

  async dummyLogin ({ state, dispatch }, { username, email }) {
    if (process.env.QUICK_USER_AUTH) {
      await dispatch('signOut');
      try {
        if (!username && email) {
          username = email.replace(/[^a-zA-Z0-9]/g, '_');
        }
        await dispatch('signUp', { 
          username,
          password: username + process.env.QUICK_USER_AUTH,
          firstName: username,
          lastName: username,
          email: email || username + '@dummy.com'
        });
      } catch (err) {}
      return await dispatch('signIn', { username, password: username + process.env.QUICK_USER_AUTH });
    }
    return false;
  }
}

export const getters =  {
  isAuthenticated (state) {
    return (state.accessToken && state.username);
  }
}
