<template>
  <v-app class="bb__application" style="display: none">
    <nuxt/>
  </v-app>
</template>

<script>
export default {
	data () {
		return {
		}
	}
}
</script>

<style lang="scss" scoped>
  .bb__application {
    display: flex !important;
  }
</style>
