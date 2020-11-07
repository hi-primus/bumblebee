<template>
  <v-data-table
    :value="value"
    :headers="headers"
    :item-key="itemKey"
    :items="items"
    :items-per-page="itemsPerPage"
    :disabled="disabled"
    @input="$emit('input',$event)"
    @click:row="$emit('click:row',$event)"
    class="vdf--hide-select mb-4 items-selector"
    show-select
    :hide-default-footer="hideFooter"
    dense
    required
    outlined
  >
    <slot></slot>
  </v-data-table>
</template>

<script>
export default {
  props: ['value','disabled','headers','items','itemKey'],
  computed: {

    itemsPerPage () {
      return (this.items.length>10) ? 10 : -1
    },

    hideFooter () {
      return this.items.length<=10;
    }
  }
}
</script>
