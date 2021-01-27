import createPersistedState from 'vuex-persistedstate'

export default ({store, app}) => {

  if (process.client) {
    createPersistedState({
      paths: [
        'session.username', 'session.email', 'session.accessToken', 'session.refreshToken',
        'username', 'email', 'accessToken', 'refreshToken',
      ]
    })(store)
  }

}
