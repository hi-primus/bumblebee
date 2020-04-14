import Vue from 'vue'

import { setAuthToken, resetAuthToken } from '@/utils/auth'

export const state = () => ({
	datasets: [],
  datasetConfig: [], // TODO
  datasetSelection: [],
  hasSecondaryDatasets: false,
  // currentSecondaryDatasets: []
	databases: [],
  buffers: [],
  tableViews: [],
  cells: [],
  columnsPreviews: [],
  profilePreviews: [],
  previewCodes: [],
  duplicatedColumns: [],
  previewNames: [],
  highlightRows: [],
  highlights: [],
  focusedColumns: [],
	datasetUpdates: 0,
  status: 'waiting',
  session: '',
  engine: 'dask',
	allTypes: [
		'string',
		'int',
		'decimal',
		'date',
		'boolean',
		'binary',
		'array',
		'null'
	],
  datasetCounter: 1,
  key: '',
  kernel: false,
  nextCommand: false,
  tab: 0
})

export const mutations = {

  setTab (state, { tab }) {
    state.tab = tab
  },

  // setSecondaryDataset (state, {name, columns, position}) {
  //   var dataset = {name, columns: columns || []}
  //   if (!state.secondaryDatasets[state.tab]) {
  //     Vue.set( state.secondaryDatasets, state.tab, [])
  //   }
  //   position = position!==undefined ? position : state.secondaryDatasets[state.tab].length
  //   Vue.set( state.secondaryDatasets[state.tab], position, dataset )
  // },

  // deleteSecondaryDataset (state, position) {
  //   if (!state.secondaryDatasets[state.tab]) {
  //     return
  //   }
  //   Vue.delete(state.secondaryDatasets[state.tab], position)
  // },

  setHasSecondaryDatasets (state, payload) {
    state.hasSecondaryDatasets = payload
  },

  setColumnsPreview (state, payload) {
    Vue.set( state.columnsPreviews, state.tab, payload )
  },

  setPreviewNames (state, payload) {
    Vue.set(state.previewNames,state.tab, payload )
  },

  setDuplicatedColumns (state, payload) {
    Vue.set(state.duplicatedColumns,state.tab, payload )
  },

  setPreviewCode (state, payload) {
    Vue.set(state.previewCodes,state.tab, payload )
  },

  setProfilePreview (state, dataset) {
    Vue.set( state.profilePreviews, state.tab, dataset )
  },

  setHighlightRows (state, payload ) {
    var highlightRows = payload

    Vue.set( state.highlightRows, state.tab, highlightRows )
  },

  setHighlights (state, { matchColumns, color }) {
    var highlights = { matchColumns: matchColumns || {}, color: color || 'green' }

    Vue.set( state.highlights, state.tab, highlights )
  },

  setFocusedColumns (state, column) {
    Vue.set( state.focusedColumns, state.tab, column )
  },

  previewDefault (state) {
    Vue.set(state.columnsPreviews,state.tab,false)
    Vue.set(state.profilePreviews,state.tab,false)
    Vue.set(state.highlights,state.tab,false)
    Vue.set(state.highlightRows,state.tab,false)
    Vue.set(state.focusedColumns,state.tab,false)
    Vue.set(state.buffers,state.tab,false)
    Vue.set(state.previewCodes,state.tab,undefined)
    Vue.set(state.previewNames,state.tab,undefined)
  },

  commandHandle(state, command) {
    state.nextCommand = command
  },

  setTableView(state, tableView) {
    Vue.set(state.tableViews,state.tab,tableView)
  },

	loadDataset (state, { dataset }) {

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

    dataset.blank = false

    if (state.tab>=1)
      dataset.varname = `df${state.tab}`
    else
      dataset.varname = 'df'

    if (dataset.columns instanceof Object) { dataset.columns = Object.values(dataset.columns) }

    var _c
    try {
      _c = state.datasetSelection[state.tab].columns
    } catch (err) {
      _c = []
    }

    if (dataset && dataset.dtypes_list) {
      state.typesAvailable = dataset.dtypes_list
    }

    Vue.set(state.datasets, state.tab, dataset)

    state.datasetSelection[state.tab] = {} // {columns: _c} // TODO: check selection

    Vue.set(state.datasetSelection, state.tab, state.datasetSelection[state.tab] )
    Vue.set(state.buffers, state.tab, false)

		state.status = 'received'

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

    state.status = 'received'

    Vue.set(state.datasets, found, dataset)
    Vue.set(state.datasetSelection, found, {})

		state.datasetUpdates = state.datasetUpdates + 1
  },

	delete (state, { index }) {
    Vue.delete(state.datasets, index)
    Vue.delete(state.datasetSelection, index)
		if (!state.datasets.length) {
			state.status = 'receiving back'
		}
		return index
	},

	status (state, payload) {
    state.status = payload || 'waiting'
  },

	session (state, payload) {
    state.session = payload
  },

  engine (state, payload) {
    state.engine = payload
  },

  setCells (state, payload) {
    Vue.set(state.cells, state.tab, payload)
  },

  setCellContent (state, {index, content}) {
    try {
      var currentCells = state.cells[state.tab] || []
      currentCells[index].content = content
      Vue.set(state.cells, state.tab, currentCells)
    } catch (error) {
      console.error(error)
    }
  },

  database (state, payload) {
    Vue.set(state.databases,state.tab,payload)
  },

	setBuffer (state, payload) {
    Vue.set(state.buffers,state.tab,payload)
  },

  key (state, payload) {
    state.key = payload
  },

  kernel (state, payload) {
    state.kernel = payload
  },

  selection (state, {tab, columns, ranged, clear, text} ) {
    if (tab===undefined) {
      tab = state.tab
    }
    if (tab!==undefined) {

      Vue.set(state.columnsPreviews,tab,false)
      Vue.set(state.profilePreviews,tab,false)
      Vue.set(state.highlights,tab,false)
      Vue.set(state.highlightRows,tab,false)
      Vue.set(state.focusedColumns,tab,false)
      Vue.set(state.previewCodes,tab,undefined)
      Vue.set(state.previewNames,tab,undefined)

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
  // async nuxtServerInit ({ dispatch }, context) {
  //   console.log('[DEBUG] nuxtServerInit')
  //   const cookies = this.$cookies.getAll() || {} // cookie.parse(context.req.headers.cookie || '')
  //   if (cookies.hasOwnProperty('x-access-token')) {
  //     try {
  //       setAuthToken(cookies['x-access-token'])
  //       await dispatch('auth/fetch')
  //       return true
  //     } catch (err) {
  //       console.error('Provided token is invalid:', err)
  //       resetAuthToken()
  //       return false
  //     }
  //   } else {
  //     resetAuthToken()
  //     return false
  //   }
  // },
}

export const getters = {
  currentDataset (state) {
    return state.datasets[state.tab]
  },
  currentCells (state) {
    return state.cells[state.tab]
  },
  // currentSecondaryDatasets (state) {
  //   return state.secondaryDatasets[state.tab]
  // },
  hasSecondaryDatasets (state) {
    return state.hasSecondaryDatasets
  },
  currentSelection (state) {
    return state.datasetSelection[state.tab] || {}
  },
  currentColumnsPreview (state) {
    return state.columnsPreviews[state.tab] || false
  },
  currentProfilePreview (state) {
    return state.profilePreviews[state.tab] || false
  },
  currentHighlightRows (state) {
    return state.highlightRows[state.tab] || false
  },
  currentHighlights (state) {
    return state.highlights[state.tab] || false
  },
  currentPreviewCode (state) {
    return state.previewCodes[state.tab] || false
  },
  currentDuplicatedColumns (state) {
    return state.duplicatedColumns[state.tab] || false
  },
  currentPreviewNames (state) {
    return state.previewNames[state.tab] || false
  },
  currentFocusedColumns (state) {
    return state.focusedColumns[state.tab] || undefined
  },
  currentTab (state) {
    return state.tab
  },
  currentTableView (state) {
    return state.tableViews[state.tab] || false
  },
  currentBuffer (state) {
    try {
      return state.buffers[state.tab]
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
  typesAvailable (state) {
    try {
      return state.datasets[state.tab].dtypes_list || state.allTypes
    } catch (error) {
      return state.allTypes
    }
  }
}
