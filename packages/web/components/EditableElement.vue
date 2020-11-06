<template>
  <component
    class="editable-element"
    :is="element"
    contenteditable
    v-text="value"
    @blur="update">
  </component>
</template>

<script>
export default {

  props: {
    element: {
      type: String,
      default: 'div'
    },
    value: {
      type: String,
      default: ''
    }
  },

  methods: {
    update (e) {
      this.$emit('input', e.target.innerText);
    }
  }
}
</script>
