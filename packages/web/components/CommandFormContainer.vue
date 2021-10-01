<template>
  <v-dialog
    v-if="command.dialog.dialog"
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
    commandContentClass(command) {
      let small = command.dialog.dialog == 'small' ? 'smaller-dialog' : ''
      return [small, (command.dialog.dynamicClass ? command.dialog.dynamicClass(currentCommand) : ''), (command.dialog.class || ''), 'command-dialog'].join(' ')
    }
  }
}
</script>
