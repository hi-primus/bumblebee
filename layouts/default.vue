<template>
  <v-app>

    <v-content>
      <v-container>
        <nuxt />
      </v-container>
    </v-content>
    <v-navigation-drawer
      temporary
      :right="right"
      v-model="rightDrawer"
      fixed
    >
      <v-list>
        <v-list-tile @click.native="right = !right">
          <v-list-tile-action>
            <v-icon light>compare_arrows</v-icon>
          </v-list-tile-action>
          <v-list-tile-title>Switch drawer (click me)</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>

    <v-footer :fixed="fixed" app>
      <span>&copy; 2018</span>
      <span></span>
    </v-footer>

  </v-app>
</template>

<script>
  export default {
    data() {
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
