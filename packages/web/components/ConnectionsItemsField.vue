<template>
  <v-select
    :key="field.key"
    v-model="_value"
    :label="field.label || 'Connection'"
    :placeholder="field.placeholder"
    :items="connectionsItems"
    @input="$emit('input',$event)"
    :menu-props="{
      closeOnContentClick: true
    }"
    :disabled="getPropertyField(field.disabled)"
    dense
    required
    outlined
  >
    <template slot="append-item">
      <v-list-item @click="connectionEvent">
        <v-list-item-title>
          Manage connections
        </v-list-item-title>
      </v-list-item>
    </template>
  </v-select>

</template>

<script>

import { getProperty, debounce } from 'bumblebee-utils'

import { mapGetters } from 'vuex'

export default {

  props: {
    field: {
      required: true
    },
    value: {
      required: true
    },
  },

  computed: {

    ...mapGetters([
      'connectionsItems'
    ]),

    _value: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('update:value',value)
      }
    }
  },

  watch: {
    connectionsItems: {
      immediate: true,
      handler: 'debouncedCheckItems'
    }
  },

  mounted () {
    this.updateConnections();
  },

  methods: {

    updateConnections () {
      return this.$store.dispatch('getConnectionsItems', { include: this.field.include, forcePromise: true });
    },

    async connectionEvent (event) {
      this.$emit('showConnections', async (selected)=>{
        await this.updateConnections();
        if (selected) {
          this._value = selected.id
        }
      })
    },

    debouncedCheckItems: debounce( function (value) {
      if (!value) {
        this.updateConnections();
      }
    }, 1000),

    getProperty,

    getPropertyField(pof) {
      return getProperty(pof, [this.currentCommand, this.index])
    },
  }


}
</script>
