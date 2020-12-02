<template>
  <FormDialog
    :extraButtons="[
      {
        checkDisabled: false,
        label: 'Select',
        event: 'select'
      },
      ...(existing ? [{
        checkDisabled: true,
        label: 'Save as new',
        event: 'create'
      }] : [])

    ]"
    :accept-label="existing ? 'Save' : 'Create'"
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

    let values = deepCopy(this.$store.state.localConfig);

    values._ws_name = this.$store.state.configurationName || this.$route.params.slug;
    values._id = this.$store.state.configurationId || undefined;

    values = await this.settingsParameters(values, 'Workspace settings', true);
    this.$emit('done',values);

  },

  methods: {
  },

  computed: {
  },

}
</script>
