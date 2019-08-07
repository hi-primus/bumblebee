<template>
  <v-app>
    <v-content app>
      <v-container fluid class="layout-container pt-6">
        <nuxt />
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
export default {
	data () {
		return {
			clipped: true,
			drawer: false,
			fixed: false,
			miniVariant: false,
			right: true,
			rightDrawer: false,
			title: 'Bumblebee'
		}
	}
}
</script>

<style lang="scss" scoped>
.layout-container {
  @include fluid-prop(width, (300px: 268px, 980px: 948px, 1920px: 1333px, 3840px: 2880px ));
}
</style>
