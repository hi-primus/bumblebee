<template>
  <div>Loading...</div>
</template>


<script>

const { version } = require("@/package.json");

export default {

  middleware: async ({ store, redirect, route, app }) => {

    if (process.env.QUICK_USER_AUTH && (route.query.username || route.query.email)) {
      await store.dispatch('session/signOut');
    }
    
    let isAuthenticated = await store.dispatch('session/isAuthenticated');
    
    if (!isAuthenticated) {
      return redirect('/login', route.query);
    } else {
      return redirect('/workspaces', route.query);
    }
  },

	data () {
		return {
		}
	},

	mounted() {
		console.log(`Bumblebee v${version}-c002`);
	},

};
</script>

