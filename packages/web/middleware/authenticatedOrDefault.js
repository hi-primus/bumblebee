export default function ({ store, redirect, route }) {
  if ((!store.getters['session/isAuthenticated'] || true) && route.params.slug!=='default') { // TO-DO: API adjustments
    return redirect('/login', route.query)
  }
}
