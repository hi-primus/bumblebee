import axios from 'axios'
import Vue from 'vue'

import { ALL_TYPES, capitalizeString, getPropertyAsync, filterCells, parseResponse, printError, deepCopy } from 'bumblebee-utils'

const properties = [
  {
    name: 'loadPreview',
    setter: false,
    clear: true,
  },
  {
    name: 'datasetUpdates',
    default: ()=>0
  },
  {
    name: 'PreviewColumns',
    clear: true,
    clearOnSelection: true,
    multiple: true,
  },
  {
    name: 'ProfilePreview',
    clear: true,
    clearOnSelection: true,
    default: ()=>({
      rowHighlights: false,
      newColumns: false
    }),
    multiple: true,
  },
  {
    name: 'PreviewInfo',
    clear: true,
    clearOnSelection: true,
    multiple: true,
  },
  {
    name: 'HiddenColumns',
    clear: true,
    clearOnLoad: true,
    multiple: true,
  },
  {
    name: 'Highlights',
    clear: true,
    clearOnSelection: true,
    multiple: true,
  },
  {
    name: 'previewCode',
    clear: true,
    clearOnLoad: true,
    clearOnSelection: true
  },
  {
    name: 'DuplicatedColumns',
    clear: true,
    clearOnLoad: true,
    clearOnSelection: true,
    multiple: true,
  },
  {
    name: 'PreviewNames',
    clear: true,
    clearOnSelection: true,
    multiple: true,
  },
  {
    name: 'FocusedColumns',
    clear: true,
    clearOnSelection: true,
    multiple: true,
  }
]

var pStates = {}

properties.forEach((p)=>{
  if (p.multiple) {
    pStates['every'+p.name] = []
  } else {
    pStates[p.name] = false
  }
})

const defaultState = {
  dashboardLink: '',
  loadingStatus: false,
  coiledAvailable: false,
  tab: 0,
  commands: [],
  cells: [],
  workspace: false,
  datasets: [],
  datasetSelection: [],
  databases: [],
  firstRun: true,
  commandsDisabled: false,
  lastWrongCode: false,
  codeError: '',
  noMatch: false,
  showingColumnsLength: 0,
  codeDone: '',
  configPromise: false,
  optimusPromise: false,
  workspacePromise: false,
  cellsPromise: false,
  profilingsPromises: {},
  buffersPromises: {},
  listViews: [],
  dataSources: [],
  gettingNewResults: ''
}

export const state = () => {

  return {
    ...defaultState,
    workspaceSlug: false,
    localConfig: {},
    properties,
    ...pStates,

    //

    appStatus: {status: 'waiting'},

    allTypes: ALL_TYPES,
    datasetCounter: 1,
    kernel: false,
    nextCommand: false,
    functionsSuggestions: JSON.parse(`[{"type":"function","text":"MOD","params":[{"type":"column","name":"column","description":"The number to be divided to find the remainder."},{"type":"number","name":"divisor","description":"The number to divide by."}],"description":"Returns the result of the modulo operator, the remainder after a division operation.","example":"MOD(10, 4)"},{"type":"function","text":"ABS","params":[{"type":"column","name":"column","description":"The number of which to return the absolute value."}],"description":"Returns the absolute value of a number.","example":"ABS(-2)"},{"type":"function","text":"EXP","params":[{"type":"column","name":"column","description":"The number of which to return the absolute value."}],"description":"Returns Euler's number, e (~2.718) raised to a power.","example":"ABS(-2)"},{"type":"function","text":"LOG","params":[{"type":"column","name":"column","description":"The value for which to calculate the logarithm."}],"description":"Returns the logarithm of a number with respect to a base.","example":"LOG(128, 2)"},{"type":"function","text":"LN","params":[{"type":"column","name":"column","description":"The value for which to calculate the logarithm, base e."}],"description":"Returns the logarithm of a number, base e (Euler's number).","example":"LN(100)"},{"type":"function","text":"POW","params":[{"type":"column","name":"column","description":"The number to raise to the exponent power."},{"type":"number","name":"exponent","description":"The exponent to raise base to."}],"description":"Returns a number raised to a power.","example":"POW(4, 0.5)"},{"type":"function","text":"CEIL","params":[{"type":"column","name":"column","description":"The value to round up to the nearest integer multiple of factor."}],"description":"Rounds a number up to the nearest integer multiple of specified significance factor.","example":"CEILING(23.25)"},{"type":"function","text":"SQRT","params":[{"type":"column","name":"column","description":"The number for which to calculate the positive square root."}],"description":"Returns the positive square root of a positive number.","example":"SQRT(9)"},{"type":"function","text":"FLOOR","params":[{"type":"column","name":"column","description":"The value to round down to the nearest integer multiple of factor."}],"description":"Rounds a number down to the nearest integer multiple of specified significance factor.","example":"FLOOR(23.25)"},{"type":"function","text":"SIN","params":[{"type":"column","name":"column","description":"The angle to find the sine of, in radians."}],"description":"Returns the sin of an angle provided in radians.","example":"SIN(3.14)"},{"type":"function","text":"COS","params":[{"type":"column","name":"column","description":"The angle to find the cosine of, in radians."}],"description":"Returns the cosine of an angle provided in radians.","example":"COS(3.14)"},{"type":"function","text":"TAN","params":[{"type":"column","name":"column","description":"The angle to find the tangent of, in radians."}],"description":"Returns the tangent of an angle provided in radians.","example":"TAN(3.14)"},{"type":"function","text":"ASIN","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse sine. Must be between -1 and 1, inclusive."}],"description":"Returns the inverse sine of a value, in radians.","example":"ASIN(0)"},{"type":"function","text":"ACOS","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse cosine. Must be between -1 and 1, inclusive."}],"description":"Returns the inverse cosine of a value, in radians.","example":"ACOS(0)"},{"type":"function","text":"ATAN","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse tangent."}],"description":"Returns the inverse tangent of a value, in radians.","example":"ATAN(0)"},{"type":"function","text":"SINH","params":[{"type":"column","name":"column","description":"Any real value to calculate the hyperbolic sine of."}],"description":"Returns the hyperbolic sine of any real number.","example":"SINH(2)"},{"type":"function","text":"COSH","params":[{"type":"column","name":"column","description":"Any real value to calculate the hyperbolic cosine of."}],"description":"Returns the hyperbolic cosine of any real number.","example":"COSH(0.48)"},{"type":"function","text":"TANH","params":[{"type":"column","name":"column","description":"Any real value to calculate the hyperbolic tangent of."}],"description":"Returns the hyperbolic tangent of any real number.","example":"TANH(1)"},{"type":"function","text":"ASINH","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse hyperbolic sine."}],"description":"Returns the hyperbolic tangent of any real number.","example":"ASINH(0.9)"},{"type":"function","text":"ACOSH","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse hyperbolic cosine. Must be greater than or equal to 1."}],"description":"Returns the inverse hyperbolic cosine of a number.","example":"ACOSH(2)"},{"type":"function","text":"ATANH","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse hyperbolic tangent. Must be between -1 and 1, exclusive."}],"description":"Returns the inverse hyperbolic tangent of a number.","example":"ATANH(0.9)"},{"type":"function","text":"UPPER","params":[{"type":"column","name":"column","description":"Converts a specified string to uppercase."}],"description":"Returns the inverse hyperbolic tangent of a number.","example":"UPPER('lorem ipsum')"},{"type":"function","text":"LOWER","params":[{"type":"column","name":"column","description":"The string to convert to lowercase."}],"description":"Converts a specified string to lowercase.","example":"LOWER('LOREM IPSUM')"},{"type":"function","text":"PROPER","params":[{"type":"column","name":"column","description":"The text which will be returned with the first letter of each word in uppercase and all other letters in lowercase."}],"description":"Capitalizes each word in a specified string.","example":"PROPER('optimus prime')"},{"type":"function","text":"TRIM","params":[{"type":"column","name":"column","description":"The text or reference to a cell containing text to be trimmed."}],"description":"Removes leading, trailing, and repeated spaces in text.","example":"TRIM('optimus prime')"},{"type":"function","text":"REMOVE","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"REMOVE(column)"},{"type":"function","text":"LEN","params":[{"type":"column","name":"column","description":"The string whose length will be returned."}],"description":"Returns the length of a string.","example":"LEN('optimus prime')"},{"type":"function","text":"FIND","params":[{"type":"column","name":"column","description":"The string to look for."},{"type":"string","name":"text_to_search","description":"The text to search for the first occurrence of search_for."}],"description":"Returns the position at which a string is first found.","example":"LEN('optimus prime')"},{"type":"function","text":"RFIND","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"RFIND(column)"},{"type":"function","text":"LEFT","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"LEFT(column)"},{"type":"function","text":"RIGHT","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"RIGHT(column)"},{"type":"function","text":"STARTS_WITH","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"STARTS_WITH(column)"},{"type":"function","text":"ENDS_WITH","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"ENDS_WITH(column)"},{"type":"function","text":"EXACT","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"EXACT(column)"},{"type":"function","text":"YEAR","params":[{"type":"column","name":"column","description":"The date from which to extract the year."}],"description":"Returns the year specified by a given date.","example":"YEAR()"},{"type":"function","text":"MONTH","params":[{"type":"column","name":"column","description":"The date from which to extract the month."}],"description":"Returns the month of the year a specific date falls in, in numeric format.","example":"MONTH()"},{"type":"function","text":"DAY","params":[{"type":"column","name":"column","description":"The date from which to extract the day."}],"description":"Returns the day of the month that a specific date falls on, in numeric format.","example":"DAY()"},{"type":"function","text":"HOUR","params":[{"type":"column","name":"column","description":"The time from which to calculate the hour value."}],"description":"Returns the hour component of a specific time, in numeric format.","example":"HOUR()"},{"type":"function","text":"MINUTE","params":[{"type":"column","name":"column","description":"The time from which to calculate the minute value."}],"description":"Returns the minute component of a specific time, in numeric format.","example":"MINUTE()"},{"type":"function","text":"SECOND","params":[{"type":"column","name":"column","description":"The time from which to calculate the second value"}],"description":"Returns the second component of a specific time, in numeric format.","example":"SECOND()"}]`)
  }
}

var pSetters = {}

properties.forEach((p)=>{
  if (p.setter!==false) {
    if (p.multiple) {
      pSetters['set'+capitalizeString(p.name)] = function(state, payload) {
        Vue.set( state['every'+p.name], state.tab, payload )
      }
    } else {
      pSetters['set'+capitalizeString(p.name)] = function(state, payload) {
        state[p.name] = payload
      }
    }
  }
})

export const mutations = {

  mutation (state, {mutate, payload}) {
    Vue.set(state, mutate, payload)
  },

  clearSession (state) {
    console.debug('%c[SESSION] Clear','color: yellow;');
    Object.keys(defaultState).forEach(key=>{
      Vue.set(state, key, defaultState[key]);
    });
    state.properties.filter(p=>p.clear).forEach(p=>{
      if (p.multiple) {
        pStates['every'+p.name] = [];
      } else {
        state[p.name] = false;
      }
    });
  },

  setBufferPromise (state, { dfName, promise }) {
    Vue.set(state.buffersPromises, dfName, promise)
  },

  ...pSetters,

  setLoadPreview (state, {sample, profile, meta}) {
    state.loadPreview = state.loadPreview || {}

    // TO-DO: Optimize (only one Vue.set)
    if (sample !== undefined) {
      Vue.set(state.loadPreview, 'sample', sample)
    }
    if (profile !== undefined) {
      Vue.set(state.loadPreview, 'profile', profile)
    }
    if (meta !== undefined) {
      Vue.set(state.loadPreview, 'meta', meta)
    }
  },

  setHighlights (state, { matchColumns, color }) {
    var highlights = { matchColumns: matchColumns || {}, color: color || 'green' }

    Vue.set( state.everyHighlights, state.tab, highlights )
  },

  previewDefault (state, payload) {
    var names = payload ? payload.names : undefined;
    state.properties.filter(p=>p.clear).forEach(p=>{
      if (!names || !names.length || names.includes(p.name)) {
        if (p.multiple) {
          Vue.set(state['every'+p.name], state.tab, false)
        } else {
          state[p.name] = false
        }
      }
    })
  },

  commandHandle(state, command) {
    state.nextCommand = command
  },

  setListView(state, listView) {
    Vue.set(state.listViews,state.tab,listView)
  },

	setDataset (state, { dataset, preview, tab, avoidReload }) {

    console.log("[BUMBLEBLEE] Opening dataset", dataset);

    var fileName = dataset.file_name;

    if (fileName && fileName.includes('/')) {
      fileName = fileName.split('/');
      dataset.file_name = fileName[fileName.length - 1];
    }

    if (!dataset.name) {
      if (dataset.file_name) {
        dataset.name = dataset.file_name.split('.')[0];
      } else {
        dataset.name = `Dataset${state.datasetCounter}`;
        state.datasetCounter = state.datasetCounter + 1;
      }
    }

    if (preview) {
      dataset.preview = preview;
    } else {
      dataset.blank = false;
    }

    if (!Array.isArray(dataset.columns)) {
      dataset.columns = Object.entries(dataset.columns).map(([key, value])=>({...value, name: key}));
    }

    tab = tab || state.tab;

    // var _c
    // try {
    //   _c = state.datasetSelection[tab].columns
    // } catch (err) {
    //   _c = []
    // }

    var previousDataset = state.datasets[tab] || {};

    if (previousDataset.dfName) {
      dataset.dfName = previousDataset.dfName;
    }

    console.debug("[BUMBLEBLEE] Setting dataset", dataset);

    Vue.set(state.datasets, tab, dataset);
    Vue.set(state.buffersPromises, tab, false);

    if (!avoidReload) {
      state.datasetSelection[tab] = {}; // {columns: _c} // TO-DO: Remember selection
      Vue.set(state.datasetSelection, tab, state.datasetSelection[tab] );
      state.properties.filter(p=>p.clearOnLoad).forEach(p=>{
        if (p.multiple) {
          Vue.set(state['every'+p.name], tab, false);
        } else {
          state[p.name] = false;
        }
      });
      state.datasetUpdates = state.datasetUpdates + 1;
    }

    return dataset;

  },

  newDataset (state, { current, dataset, tab, dfName, go }) {
    let found = -1

    if (dfName) {
      found = state.datasets.findIndex(dataset => dataset.dfName===dfName)
      if (found<0 && current) {
        console.warn('[DATASET] trying to overwrite unexistenting',dfName)
        return
      }
    }

    if (current && !dfName) {
      found = tab || state.tab
    }

    if (found<0) {
      found = state.datasets.length
    }


    dataset = {
      name: '(new dataset)',
      blank: true,
      ...(dataset || {})
    }

    state.loadPreview = false
    Vue.set(state.datasets, found, dataset)
    Vue.set(state.datasetSelection, found, {})

    if (go) {
      state.tab = found
    }


    state.datasetUpdates = state.datasetUpdates + 1
  },

  setDfToTab (state, { dfName, go }) {

    // doesn't sets if there's already a dataset with the same dfName
    var foundIndex = state.datasets.findIndex(dataset => dataset.dfName===dfName)

    if (foundIndex>=0) {
      if (go) {
        state.tab = foundIndex
      }
      return
    }

    // sets to a blank tab (starting from current tab)
    foundIndex = state.datasets.findIndex((dataset, index) => index>=state.tab && !dataset.dfName && dataset.blank)

    if (foundIndex>=0) {
      Vue.set(state.datasets[foundIndex], 'dfName', dfName)
      state.tab = foundIndex
      return
    }

    // sets to a new tab otherwise
    console.warn('[COMMANDS] creating tab for', dfName)
    this.commit('newDataset', { dataset: { dfName, go: true } })

  },

	deleteTab (state, index) {
    var dfName = state.datasets[index].dfName;

    if (dfName) {
      Vue.delete(state.profilingsPromises, dfName);
      Vue.delete(state.buffersPromises, dfName);
    }


    Vue.delete(state.datasets, index);
    Vue.delete(state.datasetSelection, index);
    state.properties.forEach(p=>{
      if (p.multiple) {
        Vue.delete(state['every'+p.name], index);
      }
    })
    if (!state.datasets.length) {
      this.commit('newDataset', {});
    }
    return Math.min(index, state.datasets.length);
	},

	setAppStatus (state, payload) {
    state.appStatus = payload || { status: 'waiting' }
  },

  setCellCode (state, {index, code}) {
    try {
      var commands = state.commands || []
      commands[index].code = code
      state.commands = commands
    } catch (error) {
      console.error(error)
    }
  },

  database (state, payload) {
    Vue.set(state.databases,state.tab,payload)
  },

  kernel (state, payload) {
    state.kernel = payload
  },

  setPreviewInfo (state, {rowHighlights, newColumns, replacingColumns, error}) {
    if (!state.everyPreviewInfo[state.tab]) {
      state.everyPreviewInfo[state.tab] = {};
    }
    if (rowHighlights!=undefined) {
      state.everyPreviewInfo[state.tab].rowHighlights = rowHighlights;
    }
    if (newColumns!=undefined) {
      state.everyPreviewInfo[state.tab].newColumns = Math.max(0, newColumns);
    }
    if (replacingColumns!=undefined) {
      state.everyPreviewInfo[state.tab].replacingColumns = Math.max(0, replacingColumns);
    }
    if (error!=undefined) {
      state.everyPreviewInfo[state.tab].error = error;
    }
    Vue.set(state.everyPreviewInfo,state.tab,state.everyPreviewInfo[state.tab]);
  },

  selection (state, {tab, columns, ranged, clear, text} ) {
    if (tab===undefined) {
      tab = state.tab
    }
    if (tab!==undefined) {

      var current = state.datasetSelection[tab]

      if (
        !ranged && !text && !(columns && columns.length)
        &&
        !current.ranged && !current.text && !(current.columns && current.columns.length)
      ) {
        return
      }

      state.properties.filter(p=>p.clearOnSelection).forEach(p=>{
        if (p.multiple) {
          Vue.set(state['every'+p.name], tab, false)
        } else {
          state[p.name] = false
        }
      })

      if (clear) {
        Vue.set(state.datasetSelection,tab,{
          columns: [],
          ranged: undefined,
          text: undefined
        })
        return
      }

      var columnsSelected = []
      var rangedSelected = undefined
      var textSelected = undefined

      if (ranged===undefined && text===undefined) {
        if (columns !== undefined) {
          columnsSelected = columns
        } else if (state.datasetSelection[tab]) {
          columnsSelected = state.datasetSelection[tab].columns || []
        }
      }

      if (!columnsSelected.length && text===undefined) {
        if (ranged!==undefined) {
          rangedSelected = ranged
        } else if (state.datasetSelection[tab]) {
          rangedSelected = state.datasetSelection[tab].ranged || {}
        }
      }

      if (!columnsSelected.length && (!rangedSelected || !Object.keys(rangedSelected).length)) {
        if (text !== undefined) {
          textSelected = text
        } else if (state.datasetSelection[tab]) {
          textSelected = state.datasetSelection[tab].text || {}
        }
      }

      Vue.set(state.datasetSelection,tab,{
        columns: columnsSelected,
        ranged: rangedSelected,
        text: textSelected
      })
    }
  }

}

export const actions = {

  async nuxtServerInit ({ dispatch, commit, app }, context) {
    await dispatch('session/serverInit')
  },

  async evalCode({ state }, {code ,socketPost}) {
    try {

      if (!process.client) {
        throw new Error('SSR not allowed')
      }

      var startTime = new Date().getTime()

      var response = await socketPost('run', {
        code,
        username: state.session.username,
        workspace: state.workspaceSlug || 'default'
      }, {
        timeout: 0
      })

      var endTime = new Date().getTime()

      response._frontTime = {
        start: startTime/1000,
        end: endTime/1000,
        duration: (endTime - startTime)/1000
      }

      console.debug('[DEBUG][RESULT]', response)
      console.debug('[DEBUG][CODE]', response.code)

      try {
        console.debug(//time
          '[DEBUG][TIMES]',
          'front', response._frontTime,
          'server', response._serverTime,
          'gateway', response._gatewayTime,
          'frontToServer', response._serverTime.start-response._frontTime.start,
          'serverToGateway', response._gatewayTime.start-response._serverTime.start,
          'GatewayToServer', response._serverTime.end-response._gatewayTime.end,
          'ServerToFront', response._frontTime.end-response._serverTime.end
        )
      } catch (err) {
        console.debug(//time
          '[DEBUG][TIMES]',
          'front', response._frontTime,
          'server', response._serverTime,
          'gateway', response._gatewayTime
        )
      }

      if (response.data.status === 'error') {
        throw response
      }

      window.pushCode({code: response.code})

      return response

    } catch (err) {

      if (err.code) {
        window.pushCode({code: err.code, error: true})
      }

      console.error(err)

      printError(err)
      return err

    }
  },

  getPromise({ state, dispatch, commit }, { name, action, payload, kernel, forcePromise, index } ) {

    if (kernel && window && !window.socketPromise) {
      dispatch('resetPromises', { from: 'optimus' });
      forcePromise = true;
    }

    var promise;

    if (!forcePromise) {
      if (index !== undefined && typeof state[name] == "object") {
        promise = state[name][index];
      } else if (index !== undefined) {
        promise = {}
      } else {
        promise = state[name];
      }
    }

    if (!promise || promise.rejected) {
      promise = dispatch(action, payload);
      promise
        .then(()=>promise.fulfilled = true)
        .catch(()=>promise.rejected = true);
      if (index !== undefined) {
        var promises = {};
        if (typeof state[name] == "object") {
          promises = {...state[name]};
        }
        promises[index] = promise;
        commit('mutation', { mutate: name, payload: promises });
      } else {
        commit('mutation', { mutate: name, payload: promise });
      }
    }

    return promise;

  },

  async getWorkspace ({ dispatch }, { slug, forcePromise }) {

    var promisePayload = {
      name: 'workspacePromise',
      action: 'loadWorkspace',
      payload: { slug },
      forcePromise
    };

    if (forcePromise) {
      console.warn('Forced workspace loading');
    }

    var workspace = await dispatch('getPromise', promisePayload);

    if ((workspace.slug == slug) || !slug || forcePromise) {
      return workspace;
    }

    console.debug('Forced workspace loading due to slug update', workspace.slug, slug)
    return await dispatch('getPromise', { ...promisePayload, forcePromise: true });

  },

  async loadWorkspace ({commit, dispatch, state}, { slug }) {

    commit('session/mutation', { mutate: 'saveReady', payload: false });

    if (!slug) {
      var workspace = state.workspace
      if (workspace && workspace.slug) {
        slug = workspace.slug;
      } else {
        return false;
      }
    }

    console.log('[WORKSPACE] Loading', slug);

    var response = await dispatch('request',{
      path: `/workspaces/slug/${slug}`
    });

    var tabs = [];
    var cells = [];

    var tab = -1;

    // console.log('[WORKSPACE] Loaded', slug, response);

    if (response.data) {
      tab = response.data.selectedTab!==undefined ? response.data.selectedTab : tab;
      tabs = response.data.tabs.map(e=>{
        var profiling = JSON.parse(e.profiling);
        return {
          name: e.name,
          dataSources: e.dataSources,
          ...profiling
        };
      });
      cells = response.data.commands.map( e=>({ ...JSON.parse(e), done: false }) );
    }

    var commands = cells.filter(e=>!(e && e.payload && e.payload.request && e.payload.request.isLoad));
    var dataSources = cells.filter(e=>e && e.payload && e.payload.request && e.payload.request.isLoad);

    tabs.forEach((dataset, index) => {
      if (dataset.columns) {
        console.debug('[DATASET] Setting', { dataset, to: index });
        commit('setDataset', { dataset, tab: index });
        if (tab<0) {
          tab = index;
        }
      } else {
        console.debug('[DATASET] Creating', { dataset, to: index });
        commit('newDataset', { dataset, current: true, tab: index });
      }
    })

    if (tab<0) {
      tab = 0;
    }
    commit('mutation', { mutate: 'commands', payload: commands });
    commit('mutation', { mutate: 'dataSources', payload: dataSources});
    commit('mutation', { mutate: 'tab', payload: tab});
    commit('mutation', { mutate: 'workspace', payload: response.data });
    commit('session/mutation', { mutate: 'saveReady', payload: true});

    console.debug('[DEBUG] Loading workspace Done', slug);

    return response.data;

  },

  async loadConfig ({ state }, payload) {
    return deepCopy(state.localConfig); // TO-DO: Config
  },

  getConfig ({ dispatch }, payload) {

    var promisePayload = {
      name: 'configPromise',
      action: 'loadConfig',
      payload
    };

    return dispatch('getPromise', promisePayload);
  },

  // cells

  codeText ({ getters }, { newOnly, ignoreFrom }) {
    newOnly = newOnly || false;
    ignoreFrom = ignoreFrom || -1;
    if (!getters.cells.length) {
      return '';
    }
    return filterCells(getters.cells, newOnly, ignoreFrom).map(e=>e.code).join('\n').trim();
  },

  async markCells ({ dispatch, state, commit }, { mark, ignoreFrom, error, splice }) {

    mark = mark===undefined ? true : mark;
    ignoreFrom = ignoreFrom || -1;

    var cells = [...state.commands]
    for (let i = 0; i < state.commands.length; i++) {
      if (ignoreFrom>=0 && i>=ignoreFrom) {
        continue
      }
      if (splice) {
        if (!cells[i].done && cells[i].code) {
          cells.splice(i,1)
        }
      } else {
        cells[i] = { ...cells[i] }
        if (error) {
          if (cells[i].code) {
            cells[i].error = true
          }
          cells[i].done = false
        } else {
          if (cells[i].code) {
            cells[i].done = mark
          }
          cells[i].error = false
        }
      }
    }

    commit('mutation', { mutate: 'commands', payload: cells })

    if (mark && !(error || splice)) {
      var newCodeDone = '';
      if (mark && state.commands) {
        newCodeDone = await dispatch('codeText', { newOnly: false, ignoreFrom });
      }
      commit('mutation', { mutate: 'codeDone', payload: newCodeDone });
    } else if (!mark) {
      commit('mutation', { mutate: 'codeDone', payload: '' });
    }

  },

  deleteErrorCells ({ state, commit }) {

    var cells = [...state.commands]

    for (let i = 0; i < state.commands.length; i++) {
        if (cells[i].error && cells[i].code) {
          cells.splice(i,1)
        }
    }

    commit('mutation', { mutate: 'commands', payload: cells })
  },

  beforeRunCells ( { state, commit }, { newOnly, ignoreFrom } ) {

    newOnly = newOnly || false;
    ignoreFrom = ignoreFrom || -1;

    filterCells(state.commands, newOnly, ignoreFrom).forEach(async (cell) => {
      if (cell.payload.request && cell.payload.request.createsNew) {
        commit('setDfToTab', { dfName: cell.payload.newDfName })
      }
      if (window.getCommandHandler) {
        var commandHandler = window.getCommandHandler(cell)
        if (commandHandler && commandHandler.beforeExecuteCode) {
          cell = {...cell} // avoid vuex mutation
          cell.payload = await commandHandler.beforeExecuteCode(cell.payload)
        } else if (!commandHandler) {
          console.warn('[COMMANDS] commandHandler not found for', cell)
        }
      } else {
        console.warn('[COMMANDS] getCommandHandler not defined');
      }
    })
  },

  async resetPromises ({ commit, dispatch }, { from }) {
    from = from || 'cells';

    console.debug('[RESET] From', from);

    switch (from) {
      case 'optimus':
        commit('mutation', { mutate: 'optimusPromise', payload: false});
        commit('mutation', { mutate: 'dashboardLink', payload: ''});
      case 'cells':
        await dispatch('markCells', { mark: false });
        commit('mutation', { mutate: 'codeDone', payload: '' });
        commit('mutation', { mutate: 'codeError', payload: '' });
        commit('mutation', { mutate: 'lastWrongCode', payload: false });
        commit('mutation', { mutate: 'cellsPromise', payload: false });
      case 'profilings':
        commit('mutation', { mutate: 'profilingsPromises', payload: {} });
      case 'buffers':
        commit('mutation', { mutate: 'buffersPromises', payload: {} });
    }
  },

  afterNewResults ({ commit }, payload) {
    commit('mutation', { mutate: 'gettingNewResults', payload: '' });
    commit('previewDefault');
  },

  afterNewProfiling ({ commit }, payload) {
    commit('previewDefault', { names: ['PreviewNames'] });
  },

  async loadOptimus ({commit, state, dispatch }, { slug, socketPost }) {

    await Vue.nextTick();

    var params = await dispatch('getConfig');

    if (!slug) {
      slug = state.workspaceSlug;
    } else if (slug) {
      commit('mutation', { mutate: 'workspaceSlug', payload: slug })
    }

    console.log('[BUMBLEBEE] Initializing Optimus', state.session.username, slug);

    var response = await socketPost('initialize', {
      username: state.session.username,
      workspace: slug || 'default',
      ...params
    });

    console.debug('[DEBUG][INITIALIZATION] initializeOptimus response', response);

    var functions;

    if (response.data.dashboard_link) {
      console.log('%c[DEBUG] Dashboard: ' + response.data.dashboard_link, 'color: green;');
      commit('mutation', { mutate: 'dashboardLink', payload: response.data.dashboard_link });
    }

    if (response.data.client_install) {
      var installs = Object.values(response.data.client_install);
      if (!installs.length || installs.some(e=>!e)) {
        console.warn('Optimus installation on workers unknown');
      }
    }

    if (response.data.reserved_words) {
      response.data.reserved_words = JSON.parse(response.data.reserved_words); // TO-DO: remove dumps on optimus
      functions = response.data.reserved_words.functions;
    }

    var functionsSuggestions = [];

    if (functions) {
      Object.entries(functions).forEach(([key, value])=>{
        var params = [{
          type: 'column',
          name: 'column',
          description: "A column's name",
          required: true // TO-DO: required on function
        }];
        var description = value;
        var example = `${key}(column)`;
        if (typeof value !== "string")  {
          if ('params' in value) {
            params = value.params.map(param=>{
              if (param.type==='series') {
                param.type = 'column';
              }
              if (param.name==='series') {
                param.name = 'column';
              }
              return param;
            });
          }
          if ('description' in value) {
            description = value.description;
          }
          if ('example' in value) {
            example = value.example;
          }
        }
        functionsSuggestions.push({type: 'function', text: key, params, description, example });
      })
    }

    // console.log('[GLOBAL SUGGESTIONS]',JSON.stringify(functionsSuggestions))

    commit('mutation', {mutate: 'functionsSuggestions', payload: functionsSuggestions});

    if (response.data.coiled_available) {
      commit('mutation', {mutate: 'coiledAvailable', payload: true});
    }

    if (!response.data.optimus) {
      throw response;
    }

    window.pushCode({ code: response.code });

    return response.data;
  },

  getOptimus ({dispatch}, {payload}) {
    var promisePayload = {
      name: 'optimusPromise',
      action: 'loadOptimus',
      kernel: true,
      payload
    };

    return dispatch('getPromise', promisePayload);
  },

  async loadCellsResult ({dispatch, state, getters, commit}, { force, ignoreFrom, socketPost, clearPrevious }) {
    console.debug('[DEBUG] Loading cells result');
    try {
      // await Vue.nextTick();

      var optimus = await dispatch('getOptimus', { payload: {socketPost} } );
      var workspace = await dispatch('getWorkspace', {} );

      var init = [optimus, workspace];

      // console.debug(init)

      if (ignoreFrom>=0) {
        force = true;
      }

      var newOnly = false;
      var code = await dispatch('codeText', { newOnly, ignoreFrom });

      var codeDone = force ? '' : state.codeDone.trim();

      var rerun = false;

      var wrongCode = (state.lastWrongCode ? state.lastWrongCode.code : undefined) || ''

      if (code==='') {
        console.debug('%c[CODE MANAGER] Trying to run an empty string as code', 'color: yellow;');
        return false;
      }

      if (code === codeDone) {
        console.debug('%c[CODE MANAGER] Nothing new to run', 'color: yellow;');
        return false;
      }
      else if (
        ( !state.firstRun && (force || code.indexOf(codeDone)!=0 || codeDone=='' || wrongCode) )
        ||
        !window.socketAvailable
      ) {
        rerun = true;
      }
      else {
        // console.log('[CODE MANAGER] new cells only')
        newOnly = true;
        code = await dispatch('codeText', { newOnly, ignoreFrom }); // new cells only
      }

      if (code===wrongCode ) {
        console.debug('%c[CODE MANAGER] Cells went wrong last time', 'color: yellow;'+state.lastWrongCode.error);
        throw state.lastWrongCode.error;
      }

      if (rerun) {
        // console.log('[CODE MANAGER] every cell is new')
        await dispatch('markCells', { mark: false, ignoreFrom });
      }

      if (state.firstRun) {
        rerun = false;
      }

      commit('mutation', { mutate: 'commandsDisabled', payload: true });

      if (clearPrevious) {
        await dispatch('resetPromises', { from: 'profilings' });
      }

      await dispatch('beforeRunCells', { newOnly, ignoreFrom });

      console.debug('[DEBUG][CODE] Sent', code);

      var response = await socketPost('cells', {
        code,
        username: state.session.username,
        workspace: state.workspaceSlug || 'default',
        key: state.key
      }, {
        timeout: 0
      });

      response.originalCode = code;

      console.debug('[DEBUG][CODE]', response.code);
      window.pushCode({code: response.code})

      commit('mutation', { mutate: 'commandsDisabled', payload: false });

      if (!response.data || !response.data.result) {
        throw response
      }

      console.debug('[DEBUG] Loading cells result Done');
      return response

    } catch (err) {

      if (err.code && window.pushCode) {
        window.pushCode({code, error: true});
      }
      commit('mutation', { mutate: 'codeError', payload: printError(err)});

      var wrongCode = await dispatch('codeText', { newOnly, ignoreFrom });
      commit('mutation', { mutate: 'lastWrongCode', payload: { code: wrongCode, error: deepCopy(err) }});

      if (state.firstRun) {
        await dispatch('markCells', { ignoreFrom, error: true });
      } else {
        console.debug('[CELLS] Deleting every column except', ignoreFrom);
        await dispatch('markCells', { ignoreFrom, splice: true });
      }
      commit('mutation', { mutate: 'commandsDisabled', payload: undefined });

      err.message = '(Error on cells) ' + (err.message || '');
      console.debug('[DEBUG] Loading cells result Error');
      await dispatch('resetPromises', { from: 'profilings' });
      throw err;

    }

  },

  getCellsResult ({dispatch}, { forcePromise, payload }) {

    var promisePayload = {
      name: 'cellsPromise',
      action: 'loadCellsResult',
      payload,
      kernel: true,
      forcePromise
    };

    return dispatch('getPromise', promisePayload);
  },

  async loadProfiling ({ dispatch, state, getters, commit }, { dfName, socketPost, ignoreFrom, avoidReload, clearPrevious }) {
    console.debug('[DEBUG] Loading profiling', dfName);
    try {

      await Vue.nextTick();

      var cellsResult = await dispatch('getCellsResult', { payload: { socketPost, ignoreFrom } } );

      if (!dfName) {
        // return {};
        var workspace = await dispatch('getWorkspace', {} );
        dfName = getters.currentDataset.dfName;
        if (!dfName) {
          console.warn('[DATA LOADING] No workspaces found');
          return {};
        }
      }

      if (clearPrevious) {
        commit('setBufferPromise', { dfName, promise: false });
      }

      var response = await socketPost('profile', {
        dfName,
        username: state.session.username,
        workspace: state.workspaceSlug || 'default',
        key: state.key
      }, {
        timeout: 0
      });

      console.debug('[DEBUG][CODE][PROFILE]',response.code);

      if (!response.data.result) {
        throw response;
      }

      window.pushCode({code: response.code});
      var dataset = parseResponse(response.data.result);
      dataset.dfName = dfName;
      console.debug('[DATASET] Setting', { dataset, to: dfName });
      await dispatch('setDataset', { dataset, avoidReload });

      if (state.gettingNewResults) {
        await dispatch('afterNewProfiling');
      }

      console.debug('[DEBUG] Loading profiling Done', dfName);

      return dataset;

    } catch (err) {
      if (err.code && window.pushCode) {
        window.pushCode({code: err.code, error: true});
      }
      commit('mutation', { mutate: 'codeError', payload: printError(err)});

      var wrongCode = await dispatch('codeText', { newOnly: true, ignoreFrom });
      commit('mutation', { mutate: 'lastWrongCode', payload: { code: wrongCode, error: deepCopy(err) } });

      if (state.firstRun) {
        await dispatch('markCells', { ignoreFrom, error: true });
      } else {
        console.debug('[CELLS] Deleting every column except', ignoreFrom);
        await dispatch('markCells', { ignoreFrom, splice: true });
      }
      commit('mutation', { mutate: 'commandsDisabled', payload: undefined});

      err.message = '(Error on profiling) ' + (err.message || '');
      console.debug('[DEBUG] Loading profiling Error', dfName);
      await dispatch('resetPromises', { from: 'buffers' });
      throw err;
    }
  },

  getProfiling ({dispatch}, { forcePromise, payload }) {
    var promisePayload = {
      name: 'profilingsPromises',
      action: 'loadProfiling',
      payload,
      kernel: true,
      index: payload.dfName,
      forcePromise
    };

    return dispatch('getPromise', promisePayload);
  },

  async loadBuffer ({ dispatch, commit }, {dfName, socketPost}) {

    console.debug('[DEBUG] Loading buffer', dfName);

    if (!dfName) {
      throw new Error('Trying to load buffer for undefined Dataframe name');
    }

    await Vue.nextTick();
    var payload = { dfName, socketPost };
    var profiling = await dispatch('getProfiling', { payload });
    var result = await dispatch('evalCode', {socketPost, code: '_output = '+dfName+'.ext.set_buffer("*")'})
    console.debug('[DEBUG] Loading buffer Done', dfName);
    return result;

  },

  getBuffer ({dispatch}, { dfName, socketPost, forcePromise }) {
    var promisePayload = {
      name: 'buffersPromises',
      action: 'loadBuffer',
      payload: { dfName, socketPost },
      kernel: true,
      index: dfName,
      forcePromise
    };

    return dispatch('getPromise', promisePayload);
  },

  async getBufferWindow ({commit, dispatch, state, getters}, {from, to, slug, dfName, code, socketPost, beforeCodeEval}) {

    slug = slug || state.workspaceSlug || 'default';

    var workspaceLoad = await dispatch('getWorkspace', { slug } );

    var tabs = workspaceLoad.tabs;

    if (!tabs.length) {
      tabs = state.datasets
    }

    if (!tabs.length) {
      console.warn('[DATA LOADING] Requested buffer window for not existing df');
      return false;
    }

    dfName = dfName || tabs[0].dfName;

    from = from || 0;

    to = to || 35; // TO-DO: 35 -> ?

    var previewCode = '';
    var noBufferWindow = false;
    var forceName = false;

    if (state.previewCode) {
      previewCode = state.previewCode.code;
      noBufferWindow = state.previewCode.noBufferWindow;
      forceName = !!state.previewCode.datasetPreview;
    }

    var code = await getPropertyAsync(previewCode, [from, to+1]) || ''

    var referenceCode = await getPropertyAsync(previewCode) || ''

    var currentDataset = getters.currentDataset;

    if (!currentDataset && !dfName) {
      throw new Error('No dataset found')
    }

    var datasetDfName = currentDataset.dfName || dfName;

    await dispatch('getBuffer', { dfName: datasetDfName, socketPost });

    if (beforeCodeEval) {
      beforeCodeEval()
    }

    var response;

    var profilePreview = getters.currentProfilePreview.done;

    if (profilePreview) {
      try {
        response = await dispatch('evalCode',{ socketPost, code: `_output = _df_profile${(noBufferWindow) ? '' : '['+from+':'+(to+1)+']'}.ext.to_json("*")`})
      } catch (err) {
        console.error(err,'Retrying without buffered profiling');
        profilePreview = false;
      }
    }

    if (!profilePreview) {
      try {
        response = await dispatch('evalCode',{ socketPost, code: `_output = ${datasetDfName}.ext.buffer_window("*"${(noBufferWindow) ? '' : ', '+from+', '+(to+1)})${code}.ext.to_json("*")`})
      } catch (err) {
        console.error(err,'Retrying with buffer');
        await dispatch('getBuffer', { dfName: datasetDfName, socketPost, forcePromise: true });
        response = await dispatch('evalCode',{ socketPost, code: `_output = ${datasetDfName}.ext.buffer_window("*"${(noBufferWindow) ? '' : ', '+from+', '+(to+1)})${code}.ext.to_json("*")`})
      }
    }

    if (response.data.status === 'error') {
      commit('setPreviewInfo', {error: response.data.error})
    } else {
      commit('setPreviewInfo', {error: false})
    }

    var parsed = response && response.data && response.data.result ? parseResponse(response.data.result) : undefined

    var pre = forceName ? '__preview__' : ''

    if (parsed && parsed.sample) {
      parsed.sample.columns = parsed.sample.columns.map(e=>({...e, title: pre+e.title}))
      return {
        code: referenceCode,
        update: getters.datasetUpdates,
        from,
        to,
        sample: parsed.sample,
        inTable: false
      }
    } else {
      return false;
    }

  },

  async mutateAndSave ({dispatch, commit}, { mutate, payload }) {
    commit('mutation', { mutate: mutate, payload })
    await dispatch('session/saveWorkspace')
  },

  async newDataset ({ dispatch, commit }, payload) {
    commit('newDataset', payload || {})
    await dispatch('session/saveWorkspace')
  },

  async setDataset ({ dispatch, commit }, payload) {
    commit('setDataset', payload)
    await dispatch('session/saveWorkspace')
  },

  async deleteTab ({ dispatch, commit }, index) {
    commit('deleteTab', index)
    await dispatch('session/saveWorkspace')
    return index
  },

  async request ({state, dispatch}, {request, path, payload, accessToken}) {

    if (!request) request = 'get'
    if (!accessToken) accessToken = state.session.accessToken

    var response

    try {
      if (['post','put'].includes(request)) {
        response = await axios[request](process.env.API_URL + path, payload, { headers: {'Authorization': accessToken} } );
      } else {
        response = await axios[request](process.env.API_URL + path, { headers: {'Authorization': accessToken} } );
      }
    } catch (err) {
      if (err && err.response && err.response.status===401) {
        await dispatch('session/signOut');
      }
      throw err;
    }

    return response;

  },
}

var pGetters = {}

properties.forEach((p)=>{
  if (p.multiple) {
    pGetters['current'+p.name] = function(state) {
      return state['every'+p.name][state.tab]
      || (p.defaultC ? p.defaultC() : (p.defaultV || false))
    }
  } else {
    pGetters[p.name] = function(state) {
      return state[p.name]
      || (p.defaultC ? p.defaultC() : (p.defaultV || false))
    }
  }
})

export const getters = {
  currentDataset (state) {
    return state.datasets[state.tab]
  },
  datasetUpdates (state) {
    return state.datasetUpdates
  },
  commands (state) {
    return state.commands || []
  },
  dataSources (state) {
    return state.dataSources
  },
  loadPreview (state) {
    return state.loadPreview
  },
  workspaceCells (state) {
    return [
      ...(state.dataSources || []),
      ...(state.commands || [])
    ]
  },
  secondaryDatasets (state) {
    var datasetsArray = state.dataSources.map(ds=>{
      return ds && ds.payload && ds.payload.newDfName
    })
    return datasetsArray
  },
  hasSecondaryDatasets (state, getters) {
    return Object.keys(getters.secondaryDatasets || {})
        .filter(e=>!e.startsWith('_')).length>1
  },
  currentSelection (state) {
    return state.datasetSelection[state.tab] || {}
  },
  ...pGetters,
  currentTab (state) {
    return state.tab
  },
  currentListView (state) {
    return state.listViews[state.tab] || false
  },
  currentBuffer (state) {
    try {
      var dfName = state.datasets[state.tab].dfName
      return state.buffersPromises[dfName]
    } catch (error) {
      return false
    }
  },

  cells (state) {
    return [...(state.dataSources || []), ...(state.commands || [])];
  },

  selectionType (state) {
    var _ds = state.datasetSelection[state.tab] || []
    if (_ds && _ds.ranged &&  _ds.ranged.values && _ds.ranged.values.length) {
      return 'values'
    }
    if (_ds && _ds.ranged && _ds.ranged.ranges && _ds.ranged.ranges.length) {
      return 'ranges'
    }
    if (_ds && _ds.text && _ds.text.value) {
      return 'text'
    }
    return 'columns'
  },
  appError (state) {
    return state.appStatus.error ? state.appStatus.error.message : false
  },
  typesAvailable (state) {
    try {
      return [...new Set(state.datasets[state.tab].columns.map(col=>col.profiler_dtype.dtype))] || state.allTypes
      // return state.datasets[state.tab].summary.dtypes_list || state.allTypes
    } catch (error) {
      return state.allTypes
    }
  },

  currentRowHighlights (state) {
    try {
      return state.everyPreviewInfo[state.tab].rowHighlights
    } catch (err) {
      return false
    }
  }
}
