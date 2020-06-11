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
      return redirect('/workspace', route.query)
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

