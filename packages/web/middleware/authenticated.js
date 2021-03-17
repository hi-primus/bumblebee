export default async function ({ store, redirect, route }) {
  let isAuthenticated = await store.dispatch('session/isAuthenticated');
  if (!isAuthenticated) {
    return redirect('/login', route.query)
  }
}
