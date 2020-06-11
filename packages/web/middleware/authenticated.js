export default function ({ store, redirect, route }) {
  if (!store.getters['session/isAuthenticated']) {
    return redirect('/login', route.query)
  }
}
