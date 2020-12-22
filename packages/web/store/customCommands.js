import { objectMap, objectMapEntries } from 'bumblebee-utils'
import Vue from 'vue'

const _handler = (name, generator) => {
  if (generator.fields) {

      var fields = Object.entries(generator.fields).map(([key, _field])=>{
          var field = {..._field};
          field.key = key;
          field.label = field.name;
          if (field.type === 'array' || (field.items && field.items.length)) {
              field.type = 'select';
          } else if (field.type === 'string') {
              field.type = 'field';
          }

          if (field.items && field.items.length && (!field.items[0].text && !field.items[0].value)) {
              field.items = field.items.map(value=>({text: value, value}));
          }
          return field;
      })

      var validate = (c)=>{
          for (const key in generator.fields) {
              const field = generator.fields[key];
              if (field.empty === false && !c[key]) {
                  return false;
              }
          }
          return true;
      }

      return { custom: true, dialog: {title: generator.name, fields, validate}, payload: (columns)=>{
        var payload = {
          _custom: true,
          columns,
          command: name,
        };
        Object.entries(generator.fields).forEach(([key, field])=>{
          if (!field.noPayload && field.default !== undefined) {
            payload[key] = field.default;
          }
        });
        return payload;
      } };

  }
}

export const state = () => ({
  generators: {
    upperLastName: {
      name: 'upper name',
      fields: {
          name: {
              name: 'Name',
              default: '',
              empty: false,
              type: 'string'
          }
      },
      engine: ['spark', 'pandas', 'dask'],
      declaration: `
def upper_name (df, name):
      df = df.cols.upper("name", name)
      return df
`,
      code: '{{payload.dfName}} = upper_name({{payload.dfName}}, "{{payload.name}}")'
    },
    upperLastNameInline: {
      name: 'upper name (inline)',
      fields: {
          name: {
              name: 'Name',
              default: '',
              empty: false,
              type: 'string'
          }
      },
      engine: 'dask',
      code: '{{payload.dfName}} = {{payload.dfName}}.cols.upper("name", "{{payload.name}}")'
    }
  }
})


export const mutations =  {
  setGenerator (state, { key, generator }) {
    state.generators[key] = generator;
  },
  deleteGenerator (state, { key }) {
    delete state.generators[key];
  },
}

export const actions =  {

}

export const getters =  {
  handlers (state) {
    return objectMapEntries(state.generators, (name,generator)=>_handler(name,generator))
  },
  genericCommandPayload () {
    return (payload)=>{
      var generator = payload._generator;
      var code = generator.code.replace(/{{(payload.?(.+?))}}/g, (_,g1,g2) => payload[g2] || eval(g1))
      return {code, declaration: generator.declaration, _custom: true};
    }
  },
  menuItems (state, getters, rootState) {
    return Object.entries(state.generators)
    .filter(([key, generator])=>{
      if (generator.engine && rootState.localEngineParameters && rootState.localEngineParameters.engine) {
        var currentEngine = rootState.localEngineParameters.engine;
        return ((Array.isArray(generator.engine) && generator.engine.includes(currentEngine)) || generator.engine === currentEngine)
      }
      return true;
    })
    .map(([key, generator])=>{
      return {command: key, text: generator.name, group: 'CUSTOM'};
    })
  },
}
