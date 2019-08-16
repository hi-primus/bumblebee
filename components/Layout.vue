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
.layout-container {
  // transition: all ease-in-out .1s;
  padding-top: 24px;
  padding-bottom: 24px;
  min-height: calc(100vh - 36px);
  &>.layout {
    min-height: calc(100vh - 84px);
  }
  &.lc--wide {
    padding-left: 2rem;
    padding-right: 2rem;
  }
  &.lc--narrow {
    @include fluid-prop(width, (300px: 268px, 980px: 948px, 1920px: 1333px, 3840px: 2880px ));
  }
}
</style>
