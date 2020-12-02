<template>
  <FormDialog
    focus
    ref="formDialog"
    />
</template>

<script>

import settingsMixin from "@/plugins/mixins/workspace-settings";
import { deepCopy } from "bumblebee-utils"

export default {

  mixins: [ settingsMixin ],

  props: {
    existing: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      form: {
        promise: false,
        fields: []
      }
    }
  },

  async mounted () {

    let values = deepCopy(this.$store.state.localConfig) || {};

    values._ws_name = this.$store.state.configurationName || this.$route.params.slug;
    values._id = this.$store.state.configurationId || undefined;

    values = await this.settingsParameters(values, 'Engines', this.existing, [
      {
        checkDisabled: false,
        label: 'Select',
        event: 'select'
      },
    ]);
    this.$emit('done',values);

  },

  methods: {
  },

  computed: {
  },

}
</script>
