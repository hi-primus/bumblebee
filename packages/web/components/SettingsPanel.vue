<template>
  <FormDialog focus ref="formDialog"/>
</template>

<script>

import settingsMixin from "@/plugins/mixins/workspace-settings";

export default {

  mixins: [ settingsMixin ],

  data () {
    return {
      form: {
        promise: false,
        fields: []
      }
    }
  },

  async mounted () {
    let values = this.$store.state.localConfig;
    values = await this.settingsParameters(values, 'Workspace settings');
    if (values) {
      this.$store.commit('mutation', { mutate: 'localConfig', payload: values });
      this.$store.commit('mutation', { mutate: 'configPromise', payload: false });
    }
    this.$emit('done',values);
  },

  methods: {
  },

  computed: {
  },

}
</script>
