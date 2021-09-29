<template>
  <v-card>
    <FormDialog focus ref="formDialog"/>
    <v-btn icon large color="black" @click="$emit('back')" class="title-button-left">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
    <v-card-title>
      Custom Operations
    </v-card-title>
    <v-form @submit.prevent="updateCustomOperations">
      <v-textarea filled v-model="content" class="pt-2 px-4 font-mono">

      </v-textarea>
      <v-card-actions>
        <div class="flex-grow-1" />
        <v-btn
          color="primary"
          type="submit"
        >
          Save JSON
        </v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>

import clientMixin from '@/plugins/mixins/client'
import FormDialog from "@/components/FormDialog"
import { capitalizeString, deepCopy, objectFilter } from "bumblebee-utils";

export default {

  components: {
    FormDialog
  },

  mixins: [clientMixin],

  props: {
  },

  data () {
    return {
      content: ''
    }
  },

  mounted () {
    this.content = this.$store.getters['customCommands/generatorsJson'];
  },

  methods: {

    fromForm (form) {
      return this.$refs.formDialog.fromForm(form)
    },

    async updateCustomOperations () {
      try {
        await this.$store.dispatch('customCommands/setAllGenerators', {content: this.content || '{}', socketPost: this.socketPost});
        this.content = this.$store.getters['customCommands/generatorsJson'];
        await this.$store.dispatch('session/saveWorkspace');
      } catch (err) {
        console.error(err);
        return;
      }
      this.$emit('back')
    },

  },

  computed: {
  },

  watch: {
  }
}
</script>
