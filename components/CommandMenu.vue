<template>
  <v-menu offset-y left min-width="200" >
    <template v-slot:activator="{ on: more }">
      <v-icon v-on="more" :class="$attrs['button.class']" v-bind="$attrs" color="black" @click.stop="" :disabled="disabled">more_vert</v-icon>
    </template>
    <v-list dense>
      <v-list-item-group color="black">
        <v-list-item v-if="columnsNumber==1" @click="$emit('command',{command: 'rename', columns: []})">
          <v-list-item-content>
            <v-list-item-title>
              Rename
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="$emit('command',{command: 'keep', columns: []})">
          <v-list-item-content>
            <v-list-item-title>
              Keep
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="$emit('command',{command: 'drop', columns: []})">
          <v-list-item-content>
            <v-list-item-title>
              Drop
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <transition name="fade">
          <v-list-item v-if="columnsNumber==2" @click="$emit('command',{command: 'nest', columns: []})">
            <v-list-item-content>
              <v-list-item-title>
                Nest
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </transition>
        <v-list-item v-if="columnsNumber==1" @click="$emit('command',{command: 'unnest', columns: []})">
          <v-list-item-content>
            <v-list-item-title>
              Unnest
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="columnsNumber==1" @click="$emit('command',{command: 'replace', columns: []})">
          <v-list-item-content>
            <v-list-item-title>
              Replace
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="columnsNumber==1" @click="$emit('command',{command: 'fill', columns: []})">
          <v-list-item-content>
            <v-list-item-title>
              Fill
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  inheritAttrs: false,

  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    columnsNumber: {
      type: Number,
      default: 1
    }
  }
}
</script>
