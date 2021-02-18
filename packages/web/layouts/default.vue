<template>
  <v-app class="bb__application">
    <nuxt/>
    <div data-name="preloader" style="position: absolute; z-index: -1000; pointer-events: none; opacity: 0; left: -1000px">
      <v-icon>add</v-icon>
      <v-icon>mdi-table</v-icon>
      <v-icon class="material-icons-outlined">timeline</v-icon>
      <div class="font-mono">mono</div>
      <div class="font-table">mono-table</div>
    </div>
  </v-app>
</template>

<script>
export default {
  name: "default",
	data () {
		return {
		}
	}
}
</script>
