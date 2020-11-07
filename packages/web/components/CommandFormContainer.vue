<template>
  <v-dialog
    v-if="command.dialog.dialog"
    ref="operation-form"
    persistent
    :value="(currentCommand.command)"
    :max-width="820"
    @click:outside="$emit('cancel-command')"
    @keydown.esc="$emit('cancel-command')"
    :content-class="'command-dialog '+command.dialog.class"
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
  }
}
</script>
