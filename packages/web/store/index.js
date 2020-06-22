import axios from 'axios'
import Vue from 'vue'

const properties = [
  {
    name: 'PreviewColumns',
    clear: true,
    clearOnSelection: true,
  },
  {
    name: 'LoadPreview',
    setter: false,
    clear: true,
    // clearOnLoad: true,
    // default: ()=>([]),
    // defaultValue: true,
  },
  {
    name: 'ProfilePreview',
    clear: true,
    clearOnSelection: true,
    default: ()=>({
      rowHighlights: false,
      newColumns: false
    })
  },
  {
    name: 'PreviewInfo',
    clear: true,
    clearOnSelection: true,
  },
  {
    name: 'Highlights',
    clear: true,
    clearOnSelection: true,
  },
  {
    name: 'PreviewCode',
    clear: true,
    clearOnLoad: true,
    clearOnSelection: true,
  },
  {
    name: 'DuplicatedColumns',
    clear: true,
    clearOnSelection: true,
  },
  {
    name: 'PreviewNames',
    clear: true,
    clearOnSelection: true,
  },
  {
    name: 'FocusedColumns',
    clear: true,
    clearOnSelection: true,
  },
  {
    name: 'Buffer'
  },
  {
    name: 'Cells'
  },
  {
    name: 'DatasetUpdate'
  }
]

var pStates = {}

properties.forEach((p)=>{
  pStates['every'+p.name] = []
})

/*bu*/ import { ALL_TYPES } from 'bumblebee-utils' /*bu*/

export const state = () => ({
  datasets: [],
  datasetSelection: [],
  hasSecondaryDatasets: false,
  secondaryDatasets: [], // TODO: not tab-separated
  databases: [],
  buffers: [],
  listViews: [],
  cells: [],
  properties,
  // previewColumns: [],
  ...pStates,
  datasetUpdates: 0,

  //

  appStatus: {status: 'waiting'},

  allTypes: ALL_TYPES,
  datasetCounter: 1,
  key: '',
  kernel: false,
  nextCommand: false,
  tab: 0,
  reservedWords: {}
})

var pSetters = {}

properties.forEach((p)=>{
  if (p.setter!==false)
    pSetters['set'+p.name] = function(state, payload) {
      Vue.set( state['every'+p.name], state.tab, payload )
    }
})

export const mutations = {

  mutation (state, {mutate, payload}) {
    state[mutate] = payload
  },

  clearDatasetProperties (state) {
    state.properties.filter(p=>p.clear).forEach(p=>{
      Vue.set(state['every'+p.name], state.tab, false)
    })
  },

  setSecondaryDatasets (state, payload) {
    Vue.set( state.secondaryDatasets, state.tab, payload)
  },

  setSecondaryBuffer (state, {key, value}) {
    var datasets = {...state.secondaryDatasets[state.tab]}
    datasets[key] = datasets[key] || {columns: [], buffer: false}
    datasets[key].buffer = value
    Vue.set( state.secondaryDatasets, state.tab, datasets)
  },

  setHasSecondaryDatasets (state, payload) {
    state.hasSecondaryDatasets = payload
  },

  ...pSetters,

  setLoadPreview (state, {sample, profile, meta}) {
    state.everyLoadPreview[state.tab] = state.everyLoadPreview[state.tab] || {}
    if (sample!==undefined) {
      state.everyLoadPreview[state.tab].sample = sample
    }
    if (profile!==undefined) {
      state.everyLoadPreview[state.tab].profile = profile
    }
    if (meta!==undefined) {
      state.everyLoadPreview[state.tab].meta = meta
    }
    Vue.set( state.everyLoadPreview, state.tab, state.everyLoadPreview[state.tab])
  },

  setHighlights (state, { matchColumns, color }) {
    var highlights = { matchColumns: matchColumns || {}, color: color || 'green' }

    Vue.set( state.everyHighlights, state.tab, highlights )
  },

  previewDefault (state) {
    state.properties.filter(p=>p.clear).forEach(p=>{
      Vue.set(state['every'+p.name], state.tab, false)
    })
  },

  commandHandle(state, command) {
    state.nextCommand = command
  },

  setListView(state, listView) {
    Vue.set(state.listViews,state.tab,listView)
  },

	loadDataset (state, { dataset, preview }) {

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

    if (state.tab>=1)
      dataset.varname = `df${state.tab}`
    else
      dataset.varname = 'df'

    if (dataset.columns instanceof Object) {
      dataset.columns = Object.entries(dataset.columns).map(([key, value])=>({...value, name: key}))
    }

    var _c

    try {
      _c = state.datasetSelection[state.tab].columns
    } catch (err) {
      _c = []
    }

    Vue.set(state.datasets, state.tab, dataset)

    state.datasetSelection[state.tab] = {} // {columns: _c} // TODO: check selection

    Vue.set(state.datasetSelection, state.tab, state.datasetSelection[state.tab] )
    Vue.set(state.buffers, state.tab, false)

    state.properties.filter(p=>p.clearOnLoad).forEach(p=>{
      Vue.set(state['every'+p.name], state.tab, false)
    })

    Vue.set(state.everyDatasetUpdate, state.tab, state.everyDatasetUpdate[state.tab] + 1 )
    state.datasetUpdates = state.datasetUpdates + 1

  },

  newDataset (state, current) {

    let found = current ? state.tab : state.datasets.length

    let varname = 'df'

    if (found) {
      varname = varname + found
    }

    let dataset = {
      name: '(new dataset)',
      varname,
      blank: true
    }

    Vue.set(state.datasets, found, dataset)
    Vue.set(state.datasetSelection, found, {})
    Vue.set(state.everyLoadPreview, found, false)
    Vue.set(state.everyDatasetUpdate, found, 1 )

		state.datasetUpdates = state.datasetUpdates + 1
  },

	delete (state, { index }) {
    Vue.delete(state.datasets, index)
    Vue.delete(state.datasetSelection, index)
    state.properties.forEach(p=>{
      Vue.delete(state['every'+p.name], index)
    })
		if (!state.datasets.length) {
      this.commit('newDataset')
		}
		return index
	},

	setAppStatus (state, payload) {
    state.appStatus = payload || { status: 'waiting' }
  },

  engine (state, payload) {
    state.engine = payload
  },
  tpw (state, payload) {
    state.tpw = payload
  },
  workers (state, payload) {
    state.workers = payload
  },

  setCellCode (state, {index, code}) {
    try {
      var currentCells = state.everyCells[state.tab] || []
      currentCells[index].code = code
      Vue.set(state.everyCells, state.tab, currentCells)
    } catch (error) {
      console.error(error)
    }
  },

  database (state, payload) {
    Vue.set(state.databases,state.tab,payload)
  },

  key (state, payload) {
    state.key = payload
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
        Vue.set(state['every'+p.name], tab, false)
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

  async request ({state}, {request, path, payload, accessToken}) {

    if (!request) request = 'get'
    if (!accessToken) accessToken = state.session.accessToken

    var response
    if (request === 'post') {
      response = await axios[request](process.env.DEV_API_URL + path, payload, { headers: {'Authorization': accessToken} } )
    } else {
      response = await axios[request](process.env.DEV_API_URL + path, { headers: {'Authorization': accessToken} } )
    }
    return response

  },
}

var pGetters = {}

properties.forEach((p)=>{
  pGetters['current'+p.name] = function(state) {
    return state['every'+p.name][state.tab]
    || (p.defaultC ? p.defaultC() : (p.defaultV || false))
  }
})

export const getters = {
  currentDataset (state) {
    return state.datasets[state.tab]
  },
  currentSecondaryDatasets (state) {
    return state.secondaryDatasets[state.tab]
  },
  hasSecondaryDatasets (state) {
    return state.hasSecondaryDatasets
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
      return state.everyBuffer[state.tab] // TODO: varname
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
