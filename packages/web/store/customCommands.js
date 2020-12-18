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



      return { dialog: {title: generator.name, fields, validate}, payload: (columns)=>{
        var payload = {
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

const _code = (generator, payload = {}) => {
  var code = generator.code;
  code = code.replace(/{{(payload.?(.+?))}}/g, (_,g1,g2) => payload[g2] || eval(g1))
  return code;
}


export const state = () => ({
  generators: {
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
  codeGenerators (state) {
    return objectMap(state.generators, (generator)=>_code(generator))
  },
  menuItems (state) {
    return Object.entries(state.generators).map(([key, generator])=>{
      return {command: key, text: generator.name, group: 'CUSTOM'};
    })
  },
}
