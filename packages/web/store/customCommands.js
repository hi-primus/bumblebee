import { objectMapEntries, deepCopy } from 'bumblebee-utils'

const _getGithubBaseFileUrl = (url) => {
  let userRepo = url.split('github.com/')[1] || url;
  let [user, repo, branch] = userRepo.split('/');  
  return `https://raw.githubusercontent.com/${user}/${repo}/${branch || 'main'}/`;
}

const _parseJSONFromUrl = async (url) => {
  let content = await (await fetch(url)).text()
  return JSON.parse(content);
}

const _getTextFromUrl = async (url) => {
  return await (await fetch(url)).text()
}

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
  globalGenerators: {},
  generators: {},
  updated: false
})


export const mutations =  {
  setUpdated (state, { updated }) {
    state.updated = updated
  },
  setGenerator (state, { key, generator }) {
    state.generators[key] = generator;
  },
  setGenerators (state, { generators }) {
    state.generators = generators
  },
  deleteGenerator (state, { key }) {
    delete state.generators[key];
  },
  setGlobalGenerator (state, { key, generator }) {
    state.globalGenerators[key] = generator;
  },
  setGlobalGenerators (state, { generators }) {
    state.globalGenerators = generators
  },
  deleteGlobalGenerator (state, { key }) {
    delete state.globalGenerators[key];
  }
}

export const actions =  {

  async setGlobalGeneratorsAndInject ({ commit }, {}) {

    let generators = {};

    if (process.env.ADD_ONS && typeof process.env.ADD_ONS == "string") {
      let addOnsUrls = process.env.ADD_ONS.split(',');
      if (addOnsUrls.length) {
        for (let i = 0; i < addOnsUrls.length; i++) {
          const url = addOnsUrls[i];
          let base = _getGithubBaseFileUrl(url);
          let newGenerators = {}

          try {
            console.log(base+'index.json')
            newGenerators = await _parseJSONFromUrl(base+'index.json')
          } catch (err) {
            console.error(err);
          }

          for (const key in newGenerators) {
            if (Object.hasOwnProperty.call(newGenerators, key)) {
              const generator = newGenerators[key];
              try {
                let definition = generator.definition; 
                if (!definition) {
                  definition = await _getTextFromUrl(base+key+'.py')
                }
                if (definition) {
                  newGenerators[key].definition = definition
                }
              } catch (err) {
                console.error(err)
              }
              
            }
          }            

          generators = {...generators, ...newGenerators}          
        }
      }
    }
  
    commit('setGlobalGenerators', { generators });
  },

  async setWorkspaceGenerators ({ commit }, { content }) {
    let generators = JSON.parse(content);
  
    generators = objectMapEntries(generators, (key, generator) => {
      generator.command = generator.command || key;
      if (generator.command.includes(".") && !generator.accessor) {
        [generator.accessor, generator.command] = generator.command.split('.');
      }
      return generator;
    });

    commit('setGenerators', {generators});
  },

  async injectOperationsCode ({ state, dispatch }, { socketPost }) {
    let generators = {...state.generators, ...state.globalGenerators};
    let generators_keys = Object.keys(generators);
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
        console.log('[ADD-ON] Injected:', generators_keys[i]);
      }

    }
  },

  async setAllGenerators ({ state, commit, dispatch }, { content, socketPost }) {

    console.log({socketPost})

    console.log("setAllGenerators");

    await dispatch('setGlobalGeneratorsAndInject', { socketPost });

    if (content) {      
      await dispatch('setWorkspaceGenerators', { content })
    }
    
    // request injections
    if (socketPost && !state.updated) {
      await dispatch('injectOperationsCode', { socketPost });
      commit('setUpdated', { updated: true });
    }

    
    return content || socketPost;
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
    let entries = Object.entries({...state.generators, ...state.globalGenerators})
    .filter(([key, generator]) => {
      if (generator.engine && rootState.localEngineParameters && rootState.localEngineParameters.engine) {
        var currentEngine = rootState.localEngineParameters.engine;
        return ((Array.isArray(generator.engine) && generator.engine.includes(currentEngine)) || generator.engine === currentEngine)
      }
      return true;
    })
    .map(([key, generator]) => {

      try {
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
        if (generator.preview !== undefined) {
          if (typeof generator.preview == 'string') {
            switch (generator.preview) {
              case 'late':
                generator.preview = {
                  latePreview: true
                };
                break;
              case 'dataset':
                generator.preview = {
                  datasetPreview: true
                };
                break;
              case 'multiple columns':
                generator.preview = {
                  expectedColumns: -1
                };
                break;
              default:
                generator.preview = {};
                break;
            }
          }

          if (generator.preview === true) {
            generator.preview = {};
          }

          if (generator.preview && !generator.preview.type) {
            generator.preview.type = generator.command;
          }

          generator.payload = generator.payload || {};
          generator.payload.preview = generator.preview;
        }
        
        // set accessor
        if (generator.accessor !== undefined) {
          generator.payload = generator.payload || {};
          generator.payload.accessor = generator.accessor;
          delete generator.accessor;
        }
  
        if (!generator.columns) {
          generator.payload = generator.payload || {};
          generator.payload.columns = false;
          generator.payload.output_cols = false;
        } else if (typeof generator.columns == "string") {
          generator.payload = generator.payload || {};
          generator.payload.columns = false;
          generator.payload.output_cols = false;
          generator.payload._columnsKey = generator.columns;
          generator.columns = false;
        }
  
        delete generator.columns;
  
        // set path and generator
        if (!generator.path) {
          generator.path = 'TRANSFORMATIONS/CUSTOM';
        }
        if (!generator.generator) {
          generator.generator = 'GENERIC';
        }
        if (generator.dialog) {
          generator.payload = generator.payload || {};
          generator.payload.dialog = generator.dialog
        }
  
        return [key, generator];
      } catch (err) {

        console.error(err);
        return false;
      }

    });
    return Object.fromEntries(entries.filter(e => e))
  }
}
