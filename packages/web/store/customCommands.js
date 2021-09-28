import { objectMapEntries, deepCopy } from 'bumblebee-utils'

const _parse = (str, payload) => {
  return str.replace(/{{(payload.?(.+?))}}/g, (_,g1,g2) => payload[g2] || eval(g1))
}

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

      var validate = (c) => {
          for (const key in generator.fields) {
              const field = generator.fields[key];
              if (field.empty === false && !c[key]) {
                  return false;
              }
          }
          return true;
      }

      var content = (c) => {
        var generator = c._generator;
        return _parse(generator.content, c);
      }

      return { custom: true, dialog: {title: generator.name, fields, validate}, content, payload: (columns)=>{
        var payload = {
          _custom: true,
          columns,
          command: name,
        };
        Object.entries(generator.fields || {}).forEach(([key, field])=>{
          if (!field.noPayload && field.default !== undefined) {
            payload[key] = field.default;
          }
        });
        Object.entries(generator.payload || {}).forEach(([key, value])=>{
          payload[key] = value;
        });
        return payload;
      } };

  }
}

export const state = () => ({
  generators: {}
})


export const mutations =  {
  setGenerator (state, { key, generator }) {
    state.generators[key] = generator;
  },
  setGenerators (state, { generators }) {
    state.generators = generators
  },
  deleteGenerator (state, { key }) {
    delete state.generators[key];
  },
}

export const actions =  {
  async setAllGenerators ({ commit, dispatch }, { content, socketPost }) {
    
    console.log('[PLUGIN] setting generators')
    
    let generators = JSON.parse(content);

    generators = objectMapEntries(generators, (key, generator) => {
      generator.command = generator.command || key;
      if (generator.command.includes(".") && !generator.accessor) {
        [generator.accessor, generator.command] = generator.command.split('.');
      }
      return generator;
    });

    let generators_keys = Object.keys(generators);
    // request injections
    for (let i = 0; i < generators_keys.length; i++) {
      let generator = generators[generators_keys[i]];

      if (generator.definition) {
        let response = await dispatch('evalCode', {
          socketPost,
          codePayload: {
            command: 'inject',
            definition: generator.definition,
            functionName: generator.functionName
          }
        }, { root: true });
        console.log('[PLUGIN]', generator.functionName, response);
      }

    }
    commit('setGenerators', {generators});
    return true;
  }
}

export const getters =  {
  generatorsJson (state) {
    return JSON.stringify(state.generators);
  },
  handlers (state) {
    return objectMapEntries(state.generators, (name,generator)=>_handler(name,generator))
  },
  genericCommandPayload () {
    return (payload)=>{
      var generator = payload._generator;
      var code = _parse(generator.code, payload);
      return {code, declaration: generator.declaration, _custom: true};
    }
  },
  operations (state) {
    let entries = Object.entries(state.generators)
    .filter(([key, generator]) => {
      if (generator.engine && rootState.localEngineParameters && rootState.localEngineParameters.engine) {
        var currentEngine = rootState.localEngineParameters.engine;
        return ((Array.isArray(generator.engine) && generator.engine.includes(currentEngine)) || generator.engine === currentEngine)
      }
      return true;
    })
    .map(([key, generator]) => {

      generator = deepCopy(generator)

      // set parameters
      if (generator.parameters) {
        generator.payload = generator.payload || {};
        generator.payload.parameters = generator.parameters;
        delete generator.parameters;
      }
      
      // set text
      if (generator.text) {
        generator.payload = generator.payload || {};
        generator.payload.text = generator.text;
      }
      
      // set preview
      if (generator.preview) {
        generator.payload = generator.payload || {};
        generator.payload.preview = generator.preview;
      }
      
      // set accessor
      if (generator.accessor) {
        generator.payload = generator.payload || {};
        generator.payload.accessor = generator.accessor;
        delete generator.accessor;
      }

      if (!generator.columns) {
        generator.payload.columns = false;
        generator.payload.output_cols = false;
      }

      // set path and generator
      if (!generator.path) {
        generator.path = 'TRANSFORMATIONS/CUSTOM';
      }
      if (!generator.generator) {
        generator.generator = 'GENERIC';
      }

      return [key, generator];
    });
    return Object.fromEntries(entries)
  }
}
