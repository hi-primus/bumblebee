<template>
  <v-dialog
    v-if="getProperty(command.dialog.dialog, [currentCommand])"
    ref="operation-form"
    class="operation-form-dialog"
    persistent
    :value="(currentCommand.command)"
    :max-width="'90vw'"
    @click:outside="$emit('cancel-command')"
    @keydown.esc="$emit('cancel-command')"
    :content-class="commandContentClass(command)"
  >
    <div class="title px-6">
      {{ {value: command.dialog.title, args: [currentCommand]} | property }}
    </div>
    <slot></slot>
  </v-dialog>
  <div
    v-else
    class="operation-form-container"
    ref="operation-form"
    @keydown.esc="$emit('cancel-command')"
  >
    <slot></slot>
  </div>
</template>

<script>

import { getProperty } from 'bumblebee-utils'

export default {
  props: {
    currentCommand: {
      type: Object,
      required: true
    },
    command: {
      type: Object,
      required: true
    }
  },

  methods: {

    getProperty,

    commandContentClass(command) {
      let dialog = getProperty(command.dialog.dialog, [this.currentCommand]);
      let small = dialog == 'small' ? 'smaller-dialog' : ''
      return [small, (command.dialog.dynamicClass ? command.dialog.dynamicClass(this.currentCommand) : ''), (command.dialog.class || ''), 'command-dialog'].join(' ')
    }
  }
}
</script>
