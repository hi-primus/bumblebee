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
    class="vdf--hide-select mb-4 columns-filter"
    show-select
    :hide-default-footer="hideFooter"
    dense
    required
    outlined
  >
    <template v-slot:item.source="{ item }">
      <span dark class="capitalize text--darken-3" :class="[ item.source==='right' ? 'right-join--text' : 'left-join--text' ]">
        {{ item.source }}
      </span>
    </template>
    <template v-slot:item.key="{ item }">
      <span
        @click.stop="$emit('click:item',item)"
        :class="{'key-selected': (rightOn===item.name && item.source==='right')||(leftOn===item.name && item.source==='left')}"
        class="key-select"
      >
        <v-icon>
          vpn_key
        </v-icon>
      </span>
    </template>
  </v-data-table>
</template>

<script>
export default {
  props: ['value','disabled','headers','items','itemKey','rightOn','leftOn'],
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
