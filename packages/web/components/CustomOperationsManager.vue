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
      <v-textarea filled v-model="jsonContent" class="pt-2 px-4 font-mono">

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

import FormDialog from "@/components/FormDialog"
import { capitalizeString, deepCopy, objectFilter } from "bumblebee-utils";

export default {

  components: {
    FormDialog
  },

  props: {
  },

  data () {
    return {
      jsonContent: ''
    }
  },

  mounted () {
    this.jsonContent = this.$store.getters['customCommands/generatorsJson'];
  },

  methods: {

    fromForm (form) {
      return this.$refs.formDialog.fromForm(form)
    },

    async updateCustomOperations () {
      try {
        this.$store.commit('customCommands/setAllGenerators', {json: this.jsonContent || '{}'})
        this.jsonContent = this.$store.getters['customCommands/generatorsJson'];
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
