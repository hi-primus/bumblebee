<template>
  <FormDialog
    focus
    ref="formDialog"
    :disable-back="disableBack"
    />
</template>

<script>

import enginesMixin from "@/plugins/mixins/engines";
import { deepCopy } from "bumblebee-utils"

export default {

  mixins: [ enginesMixin ],

  props: {
    existing: {
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

    let values = deepCopy(this.$store.state.localEngineParameters) || {};

    values._ws_name = this.$store.state.engineConfigName || this.$route.params.slug;
    values._id = this.$store.state.engineId || undefined;

    var extraButtons = this.disableBack ? [] : [
      {
        checkDisabled: false,
        label: 'Select',
        event: 'select'
      },
    ];

    values = await this.enginesParameters(values, this.existing ? 'Edit engine' : 'Create new engine', this.existing, extraButtons);
    this.$emit('done',values);

  },

  methods: {
  },

  computed: {
  },

}
</script>
