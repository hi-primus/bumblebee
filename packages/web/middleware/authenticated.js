export default function ({ store, redirect, route }) {
  if (!store.state.auth.accessToken) {
    return redirect('/login', route.query)
  }
}
