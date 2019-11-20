<template>
  <div>
  <v-autocomplete
    autocomplete="off"
    ref="chips"
    :value="value"
    @input="$emit('input',$event)"
    :items="items"
    :search-input.sync="input"
    dense
    required
    outlined
    chips
    small-chips
    deletable-chips
    class="primary--chips chips-input"
    :placeholder="placeholder"
    :label="label"
    :clearable="clearable"
    hide-details
    hide-no-data
    hide-selected
    multiple
    single-line
    :menu-props="{ contentClass: 'hidden-menu' }"
    @change="onChange"
    @blur="onBlur"
  />
  {{value}}
  </div>
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
    onChange () {
      this.input = ""
		},
    onBlur () {
      const lastInput = this.lastInput || ''
      if (lastInput.length && !this.value.includes(lastInput)) {
        this.$nextTick(()=>{
          this.$emit('input',[...this.value, lastInput])
        })
      }
		},
  }
}
</script>

<style lang="scss">
  .chips-input .v-input__append-inner {
    display: none !important;
  }
</style>
