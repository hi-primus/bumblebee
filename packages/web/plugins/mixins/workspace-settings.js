import { capitalizeString, getEngines, deepCopy, INIT_PARAMS } from "bumblebee-utils";
import FormDialog from "@/components/FormDialog";

export default {

  components: {
    FormDialog
  },

  methods: {

    fromForm (form) {
      return this.$refs.formDialog.fromForm(form)
    },

    async settingsParameters (_defaultValues = {}, text = 'Create new settings', editing = false, extraButtons = [] ) {

      var defaultValues = deepCopy(_defaultValues);

      defaultValues.name = this.$store.getters['session/getUsername'] + '__' + this.$route.params.slug;

      let valuesFromParameters = Object.entries(INIT_PARAMS).filter(([key, field])=>field.type !== 'hidden' && !field.noForm).map(([key, field])=>{
        return {
          key,
          value: defaultValues[key] || undefined,
          ...(field.items ? {is: 'v-select'} : {}),
          ...(field.type === 'boolean' ? {type: 'checkbox'} : {}),
          props: {
            placeholder: field.default,
            label: field.name || capitalizeString(key).replace(/_/g,' '),
            ...(field.type === 'int' && !field.items ? {type: 'number'} : {}),
            ...(field.items ? { items: Object.entries(field.items).map(([value, text])=>({ text, value })) } : {})
          },
          ...( field.engines ? { condition: (values) => field.engines.includes(values.engine) } : {} )
        }
      });

      valuesFromParameters

      var fields = [
        {
          key: '_ws_name',
          value: _defaultValues._ws_name || '',
          props: {
            label: 'Name'
          }
        },
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
      ];

      let values = await this.fromForm({
        acceptLabel: editing ? 'Save' : 'Create',
        extraButtons: editing ? [...extraButtons, {
          checkDisabled: true,
          label: 'Create new',
          event: 'create'
        }] : extraButtons,
        text,
        fields,
        disabled: (values)=>{
          if (values.engine.includes('_coiled')) {
            return !values.coiled_token;
          }
          return false;
        }
      });

      return values;
    },
  }
}
