<template>
  <v-menu offset-y left min-width="200" >
    <template v-slot:activator="{ on: more }">
      <v-icon v-on="more" :class="$attrs['button.class']" v-bind="$attrs" color="black" @click.stop="" :disabled="disabled">more_vert</v-icon>
    </template>
    <v-list flat dense style="max-height: 400px; min-width: 160px;" class="scroll-y">
      <v-list-item-group color="black">
        <v-list-item
          v-for="command in commands"
          :key="command.command"
          @click="$emit('command',{command: command.command, columns: [], type: command.type})"
          :disabled="!(columnsNumber>=(command.min || 0) && columnsNumber<=(command.max || Infinity))"
        >
          <v-list-item-content>
            <v-list-item-title>
              {{command.name}}
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
  },

  data () {
    return {
      commands: [
        {command: 'rename',       name: 'Rename'},
        {command: 'duplicate',    name: 'Duplicate'},
        {command: 'keep',         name: 'Keep', type: 'KEEP_DROP'},
        {command: 'drop',         name: 'Drop', type: 'KEEP_DROP'},
        {command: 'nest',         name: 'Nest', min: 2},
        {command: 'unnest',       name: 'Unnest'},
        {command: 'replace',      name: 'Replace'},
        {command: 'fill_na',         name: 'Fill'},
        {command: 'lower',        name: 'To lower case', type: 'STRING'},
        {command: 'upper',        name: 'To upper case', type: 'STRING'},
        {command: 'remove_accents', name: 'Remove accents', type: 'STRING'},
        {command: 'remove_special_chars', name: 'Remove special chars', type: 'STRING'},
        {command: 'trim',             name: 'Trim white space', type: 'STRING'},
        {command: 'bucketizer',       name: 'Create Bins', max: 1}, // TODO: remove limit
        {command: 'values_to_cols',   name: 'Values to Columns', max: 1},
        {command: 'string_to_index',  name: 'Strings to Index', max: 1}, // TODO: remove limit
        {command: 'impute',           name: 'Impute rows'},
        {command: 'z_score',          name: 'Calculate Z-score'}

      ]
    }
  },

  computed: {
    filteredCommands () {
      return this.commands.filter(c=>(this.columnsNumber>=(c.min || 0) && this.columnsNumber<=(c.max || Infinity)))
    }
  }
}
</script>
