import axios from 'axios'
import Vue from 'vue'

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


import { ALL_TYPES, capitalizeString } from 'bumblebee-utils'

export const state = () => ({
  datasets: [],
  datasetSelection: [],
  secondaryDatasets: [],
  databases: [],
  buffers: [],
  listViews: [],
  commands: [],
  dataSources: [],
  properties,
  ...pStates,

  //

  appStatus: {status: 'waiting'},

  allTypes: ALL_TYPES,
  datasetCounter: 1,
  kernel: false,
  nextCommand: false,
  tab: 0,
  globalSuggestions: JSON.parse(`[{"type":"function","text":"MOD","params":[{"type":"column","name":"column","description":"The number to be divided to find the remainder."},{"type":"number","name":"divisor","description":"The number to divide by."}],"description":"Returns the result of the modulo operator, the remainder after a division operation.","example":"MOD(10, 4)"},{"type":"function","text":"ABS","params":[{"type":"column","name":"column","description":"The number of which to return the absolute value."}],"description":"Returns the absolute value of a number.","example":"ABS(-2)"},{"type":"function","text":"EXP","params":[{"type":"column","name":"column","description":"The number of which to return the absolute value."}],"description":"Returns Euler's number, e (~2.718) raised to a power.","example":"ABS(-2)"},{"type":"function","text":"LOG","params":[{"type":"column","name":"column","description":"The value for which to calculate the logarithm."}],"description":"Returns the logarithm of a number with respect to a base.","example":"LOG(128, 2)"},{"type":"function","text":"LN","params":[{"type":"column","name":"column","description":"The value for which to calculate the logarithm, base e."}],"description":"Returns the logarithm of a number, base e (Euler's number).","example":"LN(100)"},{"type":"function","text":"POW","params":[{"type":"column","name":"column","description":"The number to raise to the exponent power."},{"type":"number","name":"exponent","description":"The exponent to raise base to."}],"description":"Returns a number raised to a power.","example":"POW(4, 0.5)"},{"type":"function","text":"CEIL","params":[{"type":"column","name":"column","description":"The value to round up to the nearest integer multiple of factor."}],"description":"Rounds a number up to the nearest integer multiple of specified significance factor.","example":"CEILING(23.25)"},{"type":"function","text":"SQRT","params":[{"type":"column","name":"column","description":"The number for which to calculate the positive square root."}],"description":"Returns the positive square root of a positive number.","example":"SQRT(9)"},{"type":"function","text":"FLOOR","params":[{"type":"column","name":"column","description":"The value to round down to the nearest integer multiple of factor."}],"description":"Rounds a number down to the nearest integer multiple of specified significance factor.","example":"FLOOR(23.25)"},{"type":"function","text":"SIN","params":[{"type":"column","name":"column","description":"The angle to find the sine of, in radians."}],"description":"Returns the sin of an angle provided in radians.","example":"SIN(3.14)"},{"type":"function","text":"COS","params":[{"type":"column","name":"column","description":"The angle to find the cosine of, in radians."}],"description":"Returns the cosine of an angle provided in radians.","example":"COS(3.14)"},{"type":"function","text":"TAN","params":[{"type":"column","name":"column","description":"The angle to find the tangent of, in radians."}],"description":"Returns the tangent of an angle provided in radians.","example":"TAN(3.14)"},{"type":"function","text":"ASIN","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse sine. Must be between -1 and 1, inclusive."}],"description":"Returns the inverse sine of a value, in radians.","example":"ASIN(0)"},{"type":"function","text":"ACOS","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse cosine. Must be between -1 and 1, inclusive."}],"description":"Returns the inverse cosine of a value, in radians.","example":"ACOS(0)"},{"type":"function","text":"ATAN","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse tangent."}],"description":"Returns the inverse tangent of a value, in radians.","example":"ATAN(0)"},{"type":"function","text":"SINH","params":[{"type":"column","name":"column","description":"Any real value to calculate the hyperbolic sine of."}],"description":"Returns the hyperbolic sine of any real number.","example":"SINH(2)"},{"type":"function","text":"COSH","params":[{"type":"column","name":"column","description":"Any real value to calculate the hyperbolic cosine of."}],"description":"Returns the hyperbolic cosine of any real number.","example":"COSH(0.48)"},{"type":"function","text":"TANH","params":[{"type":"column","name":"column","description":"Any real value to calculate the hyperbolic tangent of."}],"description":"Returns the hyperbolic tangent of any real number.","example":"TANH(1)"},{"type":"function","text":"ASINH","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse hyperbolic sine."}],"description":"Returns the hyperbolic tangent of any real number.","example":"ASINH(0.9)"},{"type":"function","text":"ACOSH","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse hyperbolic cosine. Must be greater than or equal to 1."}],"description":"Returns the inverse hyperbolic cosine of a number.","example":"ACOSH(2)"},{"type":"function","text":"ATANH","params":[{"type":"column","name":"column","description":"The value for which to calculate the inverse hyperbolic tangent. Must be between -1 and 1, exclusive."}],"description":"Returns the inverse hyperbolic tangent of a number.","example":"ATANH(0.9)"},{"type":"function","text":"UPPER","params":[{"type":"column","name":"column","description":"Converts a specified string to uppercase."}],"description":"Returns the inverse hyperbolic tangent of a number.","example":"UPPER('lorem ipsum')"},{"type":"function","text":"LOWER","params":[{"type":"column","name":"column","description":"The string to convert to lowercase."}],"description":"Converts a specified string to lowercase.","example":"LOWER('LOREM IPSUM')"},{"type":"function","text":"PROPER","params":[{"type":"column","name":"column","description":"The text which will be returned with the first letter of each word in uppercase and all other letters in lowercase."}],"description":"Capitalizes each word in a specified string.","example":"PROPER('optimus prime')"},{"type":"function","text":"TRIM","params":[{"type":"column","name":"column","description":"The text or reference to a cell containing text to be trimmed."}],"description":"Removes leading, trailing, and repeated spaces in text.","example":"TRIM('optimus prime')"},{"type":"function","text":"REMOVE","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"REMOVE(column)"},{"type":"function","text":"LEN","params":[{"type":"column","name":"column","description":"The string whose length will be returned."}],"description":"Returns the length of a string.","example":"LEN('optimus prime')"},{"type":"function","text":"FIND","params":[{"type":"column","name":"column","description":"The string to look for."},{"type":"string","name":"text_to_search","description":"The text to search for the first occurrence of search_for."}],"description":"Returns the position at which a string is first found.","example":"LEN('optimus prime')"},{"type":"function","text":"RFIND","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"RFIND(column)"},{"type":"function","text":"LEFT","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"LEFT(column)"},{"type":"function","text":"RIGHT","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"RIGHT(column)"},{"type":"function","text":"STARTS_WITH","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"STARTS_WITH(column)"},{"type":"function","text":"ENDS_WITH","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"ENDS_WITH(column)"},{"type":"function","text":"EXACT","params":[{"type":"column","name":"column","description":"A column's name","required":true}],"description":"ATANH function description","example":"EXACT(column)"},{"type":"function","text":"YEAR","params":[{"type":"column","name":"column","description":"The date from which to extract the year."}],"description":"Returns the year specified by a given date.","example":"YEAR()"},{"type":"function","text":"MONTH","params":[{"type":"column","name":"column","description":"The date from which to extract the month."}],"description":"Returns the month of the year a specific date falls in, in numeric format.","example":"MONTH()"},{"type":"function","text":"DAY","params":[{"type":"column","name":"column","description":"The date from which to extract the day."}],"description":"Returns the day of the month that a specific date falls on, in numeric format.","example":"DAY()"},{"type":"function","text":"HOUR","params":[{"type":"column","name":"column","description":"The time from which to calculate the hour value."}],"description":"Returns the hour component of a specific time, in numeric format.","example":"HOUR()"},{"type":"function","text":"MINUTE","params":[{"type":"column","name":"column","description":"The time from which to calculate the minute value."}],"description":"Returns the minute component of a specific time, in numeric format.","example":"MINUTE()"},{"type":"function","text":"SECOND","params":[{"type":"column","name":"column","description":"The time from which to calculate the second value"}],"description":"Returns the second component of a specific time, in numeric format.","example":"SECOND()"}]`)
})

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

  clearDatasetProperties (state) {
    state.properties.filter(p=>p.clear).forEach(p=>{
      if (p.multiple) {
        Vue.set(state['every'+p.name], state.tab, false)
      } else {
        state[p.name] = false
      }
    })
  },

  setBuffer (state, { dfName, status }) {
    Vue.set(state.buffers, dfName, status)
  },

  setSecondaryDatasets (state, payload) {
    state.secondaryDatasets = payload
  },

  setSecondaryBuffer (state, {key, value}) {
    var datasets = {...state.secondaryDatasets}
    datasets[key] = datasets[key] || {columns: [], buffer: false}
    datasets[key].buffer = value
    state.secondaryDatasets = datasets
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

  previewDefault (state) {
    state.properties.filter(p=>p.clear).forEach(p=>{
      if (p.multiple) {
        Vue.set(state['every'+p.name], state.tab, false)
      } else {
        state[p.name] = false
      }
    })
  },

  commandHandle(state, command) {
    state.nextCommand = command
  },

  setListView(state, listView) {
    Vue.set(state.listViews,state.tab,listView)
  },

	setDataset (state, { dataset, preview, tab }) {

    console.log("[BUMBLEBLEE] Opening dataset",dataset)

    // if (dataset.name===null) {

    var fileName = dataset.file_name

    if (fileName && fileName.includes('/')) {
      fileName = fileName.split('/')
      dataset.file_name = fileName[fileName.length - 1]
    }

    if (!dataset.name) {
      if (dataset.file_name) {
        dataset.name = dataset.file_name.split('.')[0]
      } else {
        dataset.name = `Dataset${state.datasetCounter}`
        state.datasetCounter = state.datasetCounter + 1
      }

    }

    if (preview) {
      dataset.preview = preview
    } else {
      dataset.blank = false
    }

    if (!Array.isArray(dataset.columns)) {
      dataset.columns = Object.entries(dataset.columns).map(([key, value])=>({...value, name: key}))
    }


    tab = tab || state.tab

    // var _c
    // try {
    //   _c = state.datasetSelection[tab].columns
    // } catch (err) {
    //   _c = []
    // }

    var previousDataset = state.datasets[tab] || {}

    if (previousDataset.dfName) {
      dataset.dfName = previousDataset.dfName
    }


    Vue.set(state.datasets, tab, dataset)

    state.datasetSelection[tab] = {} // {columns: _c} // TO-DO: Remember selection

    Vue.set(state.datasetSelection, tab, state.datasetSelection[tab] )
    Vue.set(state.buffers, tab, false)

    state.properties.filter(p=>p.clearOnLoad).forEach(p=>{
      if (p.multiple) {
        Vue.set(state['every'+p.name], tab, false)
      } else {
        state[p.name] = false
      }
    })

    state.datasetUpdates = state.datasetUpdates + 1

  },

  newDataset (state, { current, dataset, tab, dfName, go }) {
    let found = -1

    if (dfName) {
      found = state.datasets.findIndex(dataset => dataset.dfName===dfName)
      if (found<0 && current) {
        console.warn('trying to overwrite unexistenting',dfName)
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
    this.commit('newDataset', { dataset: { dfName } })

  },

	deleteTab (state, index) {
    Vue.delete(state.datasets, index)
    Vue.delete(state.datasetSelection, index)
    state.properties.forEach(p=>{
      if (p.multiple) {
        Vue.delete(state['every'+p.name], index)
      }
    })
    if (!state.datasets.length) {
      this.commit('newDataset', {})
    }
    return Math.min(index, state.datasets.length)
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

  setPreviewInfo (state, {rowHighlights, newColumns, error}) {
    if (!state.everyPreviewInfo[state.tab]) {
      state.everyPreviewInfo[state.tab] = {}
    }
    if (rowHighlights!=undefined) {
      state.everyPreviewInfo[state.tab].rowHighlights = rowHighlights
    }
    if (newColumns!=undefined) {
      state.everyPreviewInfo[state.tab].newColumns = newColumns
    }
    if (error!=undefined) {
      state.everyPreviewInfo[state.tab].error = error
    }
    Vue.set(state.everyPreviewInfo,state.tab,state.everyPreviewInfo[state.tab])
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

  async mutateAndSave ({dispatch, commit}, { mutate, payload }) {
    commit('mutation', { mutate: mutate, payload })
    dispatch('session/saveWorkspace')
  },

  async newDataset ({ dispatch, commit }, payload) {
    commit('newDataset', payload || {})
    dispatch('session/saveWorkspace')
  },

  async loadDataset ({dispatch, commit}, { dfName }) {
    // TO-DO
  },

  async setDataset ({ dispatch, commit }, payload) {
    commit('setDataset', payload)
    dispatch('session/saveWorkspace')
  },

  async deleteTab ({ dispatch, commit }, index) {
    commit('deleteTab', index)
    dispatch('session/saveWorkspace')
    return index
  },

  async request ({state}, {request, path, payload, accessToken}) {

    if (!request) request = 'get'
    if (!accessToken) accessToken = state.session.accessToken

    var response

    if (['post','put'].includes(request)) {
      response = await axios[request](process.env.API_URL + path, payload, { headers: {'Authorization': accessToken} } )
    } else {
      response = await axios[request](process.env.API_URL + path, { headers: {'Authorization': accessToken} } )
    }
    return response

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
  currentSecondaryDatasets (state) {
    return state.secondaryDatasets
  },
  hasSecondaryDatasets (state) {
    return Object.keys(state.secondaryDatasets || {})
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
      var dfName = state.datsets[state.tab].dfName
      return state.buffer[dfName] // TO-DO: dfName
    } catch (error) {
      return false
    }
  },

  selectionType(state) {
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
      return state.datasets[state.tab].columns.map(col=>col.profiler_dtype) || state.allTypes
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
