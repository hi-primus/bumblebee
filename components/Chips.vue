<template>
  <v-combobox
    :value="value"
    @input="$emit('input',$event)"
    autocomplete="off"
    ref="chips"
    chips
    deletable-chips
    :items="[]"
    :placeholder="placeholder"
    :label="label"
    :clearable="clearable"
    multiple
    single-line
    solo
  >
  </v-combobox>
</template>

<script>
export default {
  props: {

    placeholder: {
      default: ''
    },
    label: {
      default: ''
    },
    clearable: {
      type: Boolean,
      default: false
    },
    value: {
      default: ()=>([]),
      type: Array
    }
  },
  data () {
    return {
      input: '',
      lastInput: ''
    }
  },
  computed: {
    items() {
      return [ ...this.value, this.input || '']
    }
  },
  watch: {
    input (v) {
      setTimeout(() => {
        this.lastInput = v
      },10)
    }
  },

  methods: {
    remove (item) {
      var value = [...this.value]
      value.splice(value.indexOf(item), 1)
      this.$emit('input',[...value])
    }
  }
}
</script>
