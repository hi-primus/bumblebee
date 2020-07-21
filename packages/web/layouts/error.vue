<template>
  <v-app>
    Error
    <!-- <span style="display: none"> -->
      {{ error }}
    <!-- </span> -->
  </v-app>
</template>

<script>
export default {
  props: ['error'],
  mounted () {
    console.error('[DEBUG][ERROR]', this.error)
  }
}
</script>
