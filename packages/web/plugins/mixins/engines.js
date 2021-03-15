import { capitalizeString, getEngines, deepCopy, nameify, INIT_PARAMS, objectFilter, engineValid } from "bumblebee-utils";
import FormDialog from "@/components/FormDialog";

export default {

  components: {
    FormDialog
  },

  methods: {

    fromForm (form) {
      return this.$refs.formDialog.fromForm(form)
    },

    async enginesParameters (_defaultValues = {}, text = 'Create new engine', editing = false, extraButtons = [] ) {

      let defaultValues = deepCopy(_defaultValues || {});

      if (!defaultValues.name && this.$store.getters['session/getUsername'] && this.$route.params.slug) {
        defaultValues.name =  this.$store.getters['session/getUsername'] + '__' + this.$route.params.slug;
      }

      let unavailableEngines = this.$store.state.unavailableEngines || [];

      let generatedFields = Object.entries(INIT_PARAMS).filter(([key, field])=>field.type !== 'hidden' && !field.noForm).map(([key, field])=>{
        return {
          key,
          value: defaultValues[key] || (field.fill ? field.default : undefined),
          ...(field.items ? {is: 'v-select'} : {}),
          ...(field.type === 'boolean' ? {type: 'checkbox'} : {}),
          props: {
            placeholder: field.default,
            label: field.name || nameify(key),
            ...(field.type === 'int' && !field.items ? {type: 'number'} : {}),
            ...(field.private && !field.items ? {type: 'password'} : {}),
            ...(field.items ? { items: Object.entries(field.items).map(([value, text])=>({ text, value })) } : {})
          },
          ...( field.engines ? { condition: (values) => field.engines.includes(values.engine) } : {} )
        }
      });

      var fields = [
        {
          key: '_ws_name',
          value: _defaultValues._ws_name || '',
          props: {
            label: 'Name'
          }
        },
        {
          key: 'jupyter_address',
          type: 'address',
          value: defaultValues.jupyter_address || { ip: '', port: '' },
          props: {}
        },
        {
          key: 'engine',
          is: 'v-select',
          value: defaultValues.engine  || 'dask',
          props: {
            items: (v)=>{
              let remove = [];
              if (!v.jupyter_address || !v.jupyter_address.ip && !v.jupyter_address.port) {
                remove = unavailableEngines;
              }
              return Object.entries(getEngines(remove)).map(([value, text])=>({text, value}));
            },
            label: 'Engine'
          }
        },
        ...generatedFields
      ];

      let values = await this.fromForm({
        acceptLabel: 'Save',
        extraButtons: editing ? [...extraButtons, {
          checkDisabled: true,
          label: 'Save as',
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

      if (values) {
        return objectFilter(values, ([key, value])=>{
          return engineValid(key, values.engine) && value;
        });
      } else {
        return values;
      }

    },
  }
}
