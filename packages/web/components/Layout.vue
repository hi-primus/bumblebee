<template>
  <v-main app>
    <v-container fluid class="py-0 layout-container">
      <slot/>
    </v-container>
  </v-main>
</template>

<script>

export default {
  mounted () {
    this.$intercom.boot();
    this.$intercom.update({vertical_padding: 48})
    this.$intercom.show();
  }
}
</script>
