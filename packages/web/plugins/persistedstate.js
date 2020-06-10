import createPersistedState from 'vuex-persistedstate'

export default ({store, isHMR}) => {
  if (isHMR) return

  window.onNuxtReady((nuxt) => {
    createPersistedState()(store) // vuex plugins can be connected to store, even after creation
  })
}
