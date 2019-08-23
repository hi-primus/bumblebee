<template>
  <v-content app>
      <v-container fluid :class="[wide ? 'lc--wide' : 'lc--narrow', 'layout-container']">
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
