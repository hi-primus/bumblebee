<template>
  <div
    v-if="(!command.dialog.dialog)"
    ref="command-form"
    @keydown.esc="$emit('cancelCommand')"
  >
    <slot></slot>
  </div>
  <v-dialog
    v-else
    ref="command-form"
    persistent
    :value="(currentCommand.command)"
    :max-width="820"
    @click:outside="$emit('cancelCommand')"
    @keydown.esc="$emit('cancelCommand')"
    content-class="command-dialog"
  >
    <div class="title px-6">
      {{ {value: command.dialog.title, args: [currentCommand]} | property }}
    </div>
    <slot></slot>
  </v-dialog>
</template>

<script>
export default {
  props: {
    currentCommand: {
      type: Object,
      default: ()=>({})
    },
    command: {
      type: Object,
      default: ()=>({dialog: {dialog: false}})
    }
  }
}
</script>
