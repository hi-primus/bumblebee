export default function ({ store, redirect, route }) {
  if (!store.state.session.accessToken) {
    return redirect('/login', route.query)
  }
}
