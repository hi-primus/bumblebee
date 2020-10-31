<template>
  <v-menu
    :value="true"
    @input="$emit('menu-input', $event)"
    :close-on-content-click="false"
    :attach="attach"
    min-width="250"
    allow-overflow
    @keydown.enter.stop.prevent="enterStop"
    @submit.stop.prevent
    >
    <div class="pt-2" @keydown.enter="onEnter">
      <v-text-field
        autocomplete="off"
        v-model="searchText"
        ref="searchField"
        :color="'grey darken-3'"
        spellcheck="false"
        dense
        solo flat
        outlined
        class="search-filter px-2 elevation-0"
        hide-details
        append-icon="search"
      />
      <v-list
        dense
        class="pt-1 denser-list"

        style="max-height: 330px; overflow-y: auto;"
        >
        <v-list-item
          v-for="(item, i) in filteredItems"
          @click="itemClick(item)"
          :key="i"
        >
          <v-list-item-content>
            <v-list-item-title v-text="item[items_key]"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </div>
  </v-menu>
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
    attach: {
      required: true
    },
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
    this.focusField();
  },

  methods: {

    itemClick (item) {
      this.$emit('input', item);
    },

    async onEnter (e) {
      if (this.filteredItems[0]) {
        await new Promise (res => setTimeout(res, 100))
        this.$emit('input', this.filteredItems[0]);
      }
    },

    enterStop (e) {
      e.stopPropagation();
      e.preventDefault();
    },

    async focusField () {
      try {
        await new Promise (res => setTimeout(res, 100))
        var el = this.$refs.searchField.$el.getElementsByTagName('input')[0];
        if (el) {
          el.focus();
        }
      } catch (err) {
        console.error(err);
      }
    },

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
