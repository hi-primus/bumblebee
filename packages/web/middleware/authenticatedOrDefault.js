export default function ({ store, redirect, route }) {
  console.log({route})
  if (!store.getters['session/isAuthenticated'] && route.params.slug!=='default') {
    console.log('redirecting')
    return redirect('/login', route.query)
  }
}
