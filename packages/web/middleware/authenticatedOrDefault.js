
export default function ({ store, redirect, route }) {
  if ((!store.getters['session/isAuthenticated'] || !+process.env.API_FEATURES) && route.params.slug!=='default') {
    return redirect('/login', route.query)
  }
}
