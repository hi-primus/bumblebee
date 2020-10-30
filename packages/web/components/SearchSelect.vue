<template>
  <div>
      <div class="pt-4 pb-2 px-4">
        <v-text-field
          autocomplete="off"
          v-model="searchText"
          :color="'grey darken-3'"
          spellcheck="false"
          dense
          solo flat
          outlined
          class="search-filter elevation-0"
          hide-details
          append-icon="search"
        />
      </div>
      <v-list dense class="pt-0" style="max-height: 330px; overflow-y: auto;">
        <v-list-item-group
          color="primary"
        >
          <v-list-item
            v-for="(item, i) in filteredItems"
            @click="$emit('input', item)"
            :key="i"
          >
            <v-list-item-content>
              <v-list-item-title v-text="item[items_key]"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
  </div>
</template>

<script>

import { debounce } from 'bumblebee-utils';

export default {
  data () {
    return {
      searchText: '',
      filteredItems: []
    }
  },
  props: {
    items: {
      type: Array,
      default: []
    },
    items_key: {
      type: String,
      default: 'name'
    }
  },
  mounted () {
    this.updateItems();
  },
  methods: {

    debouncedUpdateItems: debounce( function () {
      this.updateItems();
    }, 100),

    async updateItems() {

      if (this.searchText) {
        this.filteredItems = await this.$search(this.searchText, this.items, {
          shouldSort: true,
          threshold: 0.1,
          keys: [this.items_key]
        })
      } else {
        this.filteredItems = this.items
      }
    },
  },
  watch: {
    searchText: {
      immediate: true,
      handler: 'debouncedUpdateItems'
    }

  },
}
</script>
