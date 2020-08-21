
export default function ({ store, redirect, route }) {
  if (!store.getters['session/isAuthenticated'] && route.params.slug!=='default') {
    return redirect('/login', route.query)
  }
}
