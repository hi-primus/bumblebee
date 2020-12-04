<template>
  <FormDialog
    focus
    ref="formDialog"
    :disable-back="disableBack"
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
    },
    disableBack: {
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

    var extraButtons = this.disableBack ? [] : [
      {
        checkDisabled: false,
        label: 'Select',
        event: 'select'
      },
    ];

    values = await this.settingsParameters(values, this.existing ? 'Edit engine' : 'Create new engine', this.existing, extraButtons);
    this.$emit('done',values);

  },

  methods: {
  },

  computed: {
  },

}
</script>
