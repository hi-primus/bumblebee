import { capitalizeString, getEngines, INIT_PARAMS } from "bumblebee-utils";
import FormDialog from "@/components/FormDialog";

export default {

  components: {
    FormDialog
  },

  methods: {

    fromForm (form) {
      return this.$refs.formDialog.fromForm(form)
    },

    async configParameters (defaultValues = {}, text = 'Create new configuration' ) {

      defaultValues.name = this.$store.state.session.username + '_' + this.$route.params.slug;

      let valuesFromParameters = Object.entries(INIT_PARAMS).filter(([key, field])=>field.type !== 'private').map(([key, field])=>{
        return {
          key,
          value: defaultValues[key] || field.default || undefined,
          ...(field.items ? {is: 'v-select'} : {}),
          ...(field.type === 'boolean' ? {type: 'checkbox'} : {}),
          props: {
            label: field.name || capitalizeString(key).replace(/_/g,' '),
            ...(field.type === 'int' && !field.items ? {type: 'number'} : {}),
            ...(field.items ? { items: Object.entries(field.items).map(([value, text])=>({ text, value })) } : {})
          },
          ...( field.engines ? { condition: (values) => field.engines.includes(values.engine) } : {} )
        }
      });

      valuesFromParameters

      let values = await this.fromForm({
        text,
        fields: [
          {
            key: 'engine',
            is: 'v-select',
            value: defaultValues.engine  || 'dask',
            props: {
              items: Object.entries(getEngines(true)).map(([value, text])=>({text, value})),
              label: 'Engine'
            }
          },
          {
            key: 'jupyter_address',
            type: 'address',
            value: defaultValues.jupyter_address || { ip: '', port: '' },
            props: {}
          },
          ...valuesFromParameters

        ]
      });

      return values;
    },
  }
}
