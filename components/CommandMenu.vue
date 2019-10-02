<template>
  <v-menu offset-y>
    <template v-slot:activator="{ on: more }">
      <v-icon v-on="more" :class="activatorClass || ''" color="black" @click.stop="" :disabled="disabled">more_vert</v-icon>
    </template>
    <v-list>
      <v-list-item-group color="black">
        <v-list-item @click="$emit('command',{command: 'delete', columns: []})">
          <v-list-item-content>
            <v-list-item-title>
              Delete
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    activatorClass: {
      type: String,
      default: ''
    }
  }
}
</script>
