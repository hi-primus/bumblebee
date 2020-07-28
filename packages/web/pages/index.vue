<template>
  <div>Loading...</div>
</template>


<script>

const { version } = require("@/package.json");

export default {

  middleware: ({ store, redirect, route, app }) => {
    if (!store.getters['session/isAuthenticated']) {
      return redirect('/login', route.query)
    } else {
      if (route.query.ws!=0 && +process.env.API_FEATURES) {
        return redirect('/workspaces', route.query)
      } else {
        return redirect('/workspaces/default', route.query)
      }
    }
  },

	data () {
		return {
		}
	},

	mounted() {
		console.log(`Bumblebee v${version}`);
	},


};
</script>

