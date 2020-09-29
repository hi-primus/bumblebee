<template>
  <FormDialog focus ref="formDialog"/>
</template>

<script>

import configMixin from "@/plugins/mixins/configs";

export default {

  mixins: [ configMixin ],

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
    values = await this.configParameters(values, 'Workspace settings');
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
