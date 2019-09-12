<template>
  <v-content app>
    <v-container :class="[wide ? 'lc--wide' : 'lc--narrow', 'layout-container']" fluid class="py-0">
      <slot/>
    </v-container>
  </v-content>
</template>

<script>
export default {
	props: {
		wide: {
			type: Boolean,
			default: false
		}
	}
}
</script>

<style lang="scss">

</style>
