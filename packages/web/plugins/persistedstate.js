import createPersistedState from 'vuex-persistedstate'

export default ({store, app}) => {

  if (process.client) {
    createPersistedState({
      paths: [
        'session.username', 'session.email', 'session.accessToken', 'session.refreshToken', 'session.session',
        'username', 'email', 'accessToken', 'refreshToken', 'session',
      ],
      // storage: {
      //   getItem: (key) => {
      //     return app.$cookies.get(key)
      //   },
      //   setItem: (key, value) => {
      //     if (process.client) {
      //       return app.$cookies.set(key, value, { path: '/', maxAge: 60*60*24*7 })
      //     }
      //   },
      //   removeItem: (key) => {
      //     if (process.client)
      //       app.$cookies.remove(key)
      //   }
      // }
    })(store)
  }

}
