<template>
  <div class="tabs-field" :class="{'concat-tabs': concat}">

    <div class="tab static-tab">
      <span class="tab-name grey--text text--darken-1" v-if="staticItem">
        {{staticItem}}
      </span>
    </div>
    <div v-for="item in value" :key="item[itemKey]" class="tab">
      <span class="tab-name primary--text text--darken-1">{{item[itemKey]}}</span>
      <v-icon
        color="primary darken-1"
        small
        @click.stop="deleteItem(item)"
      >close</v-icon>
    </div>
    <SearchSelect
      :items="items"
      @input="itemSelected"
      :disabled="!availableItems.length"
    >
      <span class="primary--text text--darken-1 tabs-add-item">Add {{itemsName}}
        <v-icon
          style="display: inline-flex"
          class="add-tab"
          color="primary darken-1"
          @click
        >add</v-icon>
      </span>

    </SearchSelect>
  </div>
</template>

<script>

import SearchSelect from '@/components/SearchSelect'

export default {

  components: {
    SearchSelect
  },

  props: {
    items: {
      type: Array,
      default: ()=>([])
    },
    concat: {
      type: Boolean,
      default: false
    },
    staticItem: {
      type: String,
      defualt: false
    },
    value: {
      type: Array,
      default: ()=>([])
    },
    itemKey: {
      type: String,
      default: 'name'
    },
    itemsName: {
      type: String,
      default: 'item'
    },
  },

  data () {
    return {
      searchSelect: false
    }
  },

  computed: {
    availableItems () {
      var items = [this.items, this.value];
      return this.items.filter(item=>{
        return (this.value.findIndex(i=>i[this.itemKey]===item[this.itemKey])<0)
      });
    }
  },

  methods: {

    deleteItem (item) {
      this.$emit('input', this.value.filter(t => t[this.itemKey] !== item[this.itemKey]))
    },

    itemSelected (item) {
      if (this.value.findIndex(i=>i[this.itemKey]===item[this.itemKey])<0) {
        this.$emit('input', [...new Set([...this.value, item])]);
      }
    }
  },

}
</script>
