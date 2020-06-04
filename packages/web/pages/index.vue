<template>
  <div>Loading...</div>
</template>


<script>
const { version } = require("@/package.json");

export default {

  middleware: ({ store, redirect, route }) => {
    if (!store.state.auth.accessToken) {
      return redirect('/login', route.query)
    } else {
      return redirect('/workspace', route.query)
    }
  },

	data () {
		return {
		}
	},

	computed: {
	},


	mounted() {
		console.log(`Bumblebee v${version}`);
	},


};
</script>

