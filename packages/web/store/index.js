import axios from 'axios'
import Vue from 'vue'

const properties = [
  {
    name: 'loadPreview',
    setter: false,
    clear: true,
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
  },
  {
    name: 'DatasetUpdate',
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


/*bu*/ import { ALL_TYPES, capitalizeString } from 'bumblebee-utils' /*bu*/

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
  datasetUpdates: 0,
  ...pStates,

  //

  appStatus: {status: 'waiting'},

  allTypes: ALL_TYPES,
  datasetCounter: 1,
  kernel: false,
  nextCommand: false,
  tab: 0,
  reservedWords: {}
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

	loadDataset (state, { dataset, preview, tab }) {

    console.log("[BUMBLEBLEE] Opening dataset",dataset)

    if (dataset.name===null) {
      if (dataset.file_name) {
        dataset.name = dataset.file_name.split('.')[0]
      }
      else {
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

    var _c

    tab = tab || state.tab

    try {
      _c = state.datasetSelection[tab].columns
    } catch (err) {
      _c = []
    }

    var previousDataset = state.datasets[tab] || {}

    if (previousDataset.dfName) {
      dataset.dfName = previousDataset.dfName
    }


    Vue.set(state.datasets, tab, dataset)

    state.datasetSelection[tab] = {} // {columns: _c} // TO-DO: check selection

    Vue.set(state.datasetSelection, tab, state.datasetSelection[tab] )
    Vue.set(state.buffers, tab, false)

    state.properties.filter(p=>p.clearOnLoad).forEach(p=>{
      if (p.multiple) {
        Vue.set(state['every'+p.name], tab, false)
      } else {
        state[p.name] = false
      }
    })

    Vue.set(state.everyDatasetUpdate, tab, state.everyDatasetUpdate[tab] + 1 )
    state.datasetUpdates = state.datasetUpdates + 1

  },

  newDataset (state, { current, dataset, tab }) {
    let found = -1

    if (current) {
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
    Vue.set(state.everyDatasetUpdate, found, 1 )

    state.datasetUpdates = state.datasetUpdates + 1

    state.tab = found
  },

  setDfToTab (state, { dfName }) {

    // sets to current tab if it doesn't have any dfName on it

    if (!state.datasets[state.tab].dfName || state.datasets[state.tab].blank) {
      // state.datasets[state.tab].dfName = dfName
      // this.commit( 'newDataset', { current: true, dataset: state.datasets[state.tab] })
      Vue.set(state.datasets[state.tab], 'dfName', dfName)
      console.log('df to current')
      return
    }

    // sets to a new tab

    this.commit('newDataset', { dataset: { dfName } })
    console.log('df to new')




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
      var commands = state.everyCells[state.tab] || []
      commands[index].code = code
      Vue.set(state.everyCells, state.tab, commands)
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

  async loadDataset ({ dispatch, commit }, payload) {
    commit('loadDataset', payload)
    dispatch('session/saveWorkspace')
  },

  async deleteTab ({dispatch, commit, state}, index) {
    commit('deleteTab', index)
    dispatch('session/saveWorkspace')
    return index
  },

  async request ({state}, {request, path, payload, accessToken}) {

    if (!request) request = 'get'
    if (!accessToken) accessToken = state.session.accessToken

    var response

    if (['post','put'].includes(request)) {
      response = await axios[request](process.env.DEV_API_URL + path, payload, { headers: {'Authorization': accessToken} } )
    } else {
      response = await axios[request](process.env.DEV_API_URL + path, { headers: {'Authorization': accessToken} } )
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
    return [...(state.commands || []), ...(state.dataSources || [])]
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
