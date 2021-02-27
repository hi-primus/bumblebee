<template>
  <v-select
    :key="field.key"
    :value="value"
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

    connectionsItems () {

      var items = [];
      let connections = this.$store.state.connections;

      if (!connections || !connections.length) {
        var text = !connections ? 'Loading...' : 'No connections found';
        items = [{ text, disabled: true }];
      } else {
        items = connections.map(connection => {
          var configuration = connection.configuration || {};
          var type = configuration.type;
          var url = configuration.url || configuration.endpoint_url || (configuration.host && configuration.port ? `${configuration.host}:${configuration.port}` : false) || configuration.host || 'N/A';
          return {
            value: connection.id,
            text: `${type} - ${url}`
          }
        });

        items = [ { text: 'None', value: false }, ...items ]
      }

      return [...items, { divider: true }];
    },

    _value: {
      get () {
        return this.value;
      },
      set (value) {
        this.$emit('input', value);
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
      return this.$store.dispatch('updateConnectionsItems', { include: this.field.include, forcePromise: true });
    },

    connectionEvent (event) {

      this.$emit('showConnections', async (selected)=>{
        await this.updateConnections();
        if (selected) {
          this._value = selected.id;
        }
      });

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
