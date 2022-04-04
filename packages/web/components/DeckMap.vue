<template>
  <div class="deck-map plot" v-if="!deckMapLoading && deckMap && deckMap!=='error'">
    <h3>Map</h3>
    <div
      style="min-height: 128px"
      v-html="deckMap"
    ></div>
  </div>
  <v-progress-circular
    class="my-2"
    v-else 
    indeterminate
    color="grey"
  />
</template>

<script>

import clientMixin from '@/plugins/mixins/client';

import { ErrorWithResponse, debounce } from 'bumblebee-utils';

export default {
  
  mixins: [clientMixin],

  props: {
    columns: {
      type: Array
    },
    currentDataset: {
      type: Object
    },
  },

  data () {
    return {
      requestedColumns: false,
      deckMap: false,
      deckMapError: false,
      deckMapLoading: false
    }
  },

  methods: {

    async commandListener__deck_map (response) {
      try {

        if (response.reply.columns.join() !== this.columns.map(col => col.name).join() || response.reply.dfName !== this.currentDataset.dfName) {
          return;
        }

        if (!response || !response.data || !response.data.result || response.data.status == "error") {
          throw new ErrorWithResponse('Bad response', response);
        }

        let html = response.data.result;

        html = html.replace(/\\n/g,'\n').replace(/\\t/g,'\t');

        this.deckMap = html;
        this.$emit('error', false);
      } catch (err) {
        this.$emit('error', err);
        this.deckMapError = err.response;
        this.deckMap = 'error';
        this.deckMapLoading = false;
      }
    },

    async getDeckMap () {
      try {

        let payload = {
          socketPost: this.socketPost,
          dfName: this.currentDataset.dfName,
          methods: this.commandMethods
        };

        let executeResult = await this.$store.dispatch('getExecute', payload );
        
        this.deckMapLoading = true;
        this.requestDeckMap();

      } catch (err) {
        this.$emit('error', err);
        this.deckMapError = err.response;
        this.deckMap = 'error';
        this.deckMapLoading = false;
      }
    },

    async requestDeckMap () {
      let dfName = this.currentDataset.dfName;

      let columns = this.columns.map(col => col.name);
      let position_columns = columns.slice(0,2);
      let alpha_column = columns[2];

      let codePayload = {
        command: 'deck_map',
        dfName,
        columns: position_columns,
        alpha: alpha_column,
        request: {
          isAsync: true,
          async_priority: -30
        }
      };
      let replyPayload = {
        command: 'deck_map',
        dfName,
        columns,
      };

      await this.interrupt({handler: 'deck_map'});

      this.evalCode(codePayload, replyPayload, 'info');
    },

  },

  watch: {
    columns: {
      handler: debounce(function() {
        let columns = this.columns.map(col => col.name).join(", ");
        if (this.requestedColumns != columns) {
          this.requestedColumns = columns;
          this.getDeckMap();
        }
      }, 200),
      immediate: true
    }
  }
}
</script>
