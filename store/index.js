import Vue from 'vue'

const properties = [
  {
    name: 'PreviewColumns',
    clear: true,
  },
  {
    name: 'DatasetPreview',
    clear: true,
    // default: ()=>([]),
    // defaultValue: true,
  },
  {
    name: 'ProfilePreview',
    clear: true,
  },
  {
    name: 'HighlightRows',
    clear: true,
  },
  {
    name: 'Highlights',
    clear: true,
  },
  {
    name: 'PreviewCode',
    clear: true,
  },
  {
    name: 'LoadedPreviewCode',
    clear: true,
  },
  {
    name: 'DuplicatedColumns',
    clear: true,
  },
  {
    name: 'PreviewNames',
    clear: true,
  },
  {
    name: 'FocusedColumns',
    clear: true,
  },
  {
    name: 'Cells'
  }
]

var pStates = {}

properties.forEach((p)=>{
  pStates['every'+p.name] = []
})

export const state = () => {
  return {
    datasets: [],
    datasetSelection: [],
    hasSecondaryDatasets: false,
    secondaryDatasets: [], // TODO: not tab-separated
    databases: [],
    buffers: [],
    listViews: [],
    cells: [],
    properties,
    ...pStates,
    datasetUpdates: 0,
    appStatus: 'waiting',
    session: '',
    engine: 'dask',
    tpw: 8,
    workers: 1,
    allTypes: [
      'int',
      'decimal',
      'string',
      'boolean',
      'date',
      'array',
      'object',
      'gender',
      'ip',
      'url',
      'email',
      'credit_card_number',
      'zip_code'
    ],
    datasetCounter: 1,
    key: '',
    kernel: false,
    nextCommand: false,
    tab: 0
  }
}

var pSetters = {}

properties.forEach((p)=>{
  pSetters['set'+p.name] = function(state, payload) {
    Vue.set( state['every'+p.name], state.tab, payload )
  }
})

export const mutations = {

  setTab (state, { tab }) {
    state.tab = tab
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

  setDatasetPreview (state, {sample, profile}) {
    state.everyDatasetPreview[state.tab] = state.everyDatasetPreview[state.tab] || {}
    if (sample!==undefined) {
      state.everyDatasetPreview[state.tab].sample = sample
    }
    if (profile!==undefined) {
      state.everyDatasetPreview[state.tab].profile = profile
    }
    Vue.set( state.everyDatasetPreview, state.tab, state.everyDatasetPreview[state.tab])
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

		state.appStatus = 'received'

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

    state.appStatus = 'received'

    Vue.set(state.datasets, found, dataset)
    Vue.set(state.datasetSelection, found, {})

		state.datasetUpdates = state.datasetUpdates + 1
  },

	delete (state, { index }) {
    Vue.delete(state.datasets, index)
    Vue.delete(state.datasetSelection, index)
		if (!state.datasets.length) {
			state.appStatus = 'receiving back'
		}
		return index
	},

	setAppStatus (state, payload) {
    state.appStatus = payload || 'waiting'
  },

	session (state, payload) {
    state.session = payload
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

  setCellContent (state, {index, content}) {
    try {
      var currentCells = state.everyCells[state.tab] || []
      currentCells[index].content = content
      Vue.set(state.everyCells, state.tab, currentCells)
    } catch (error) {
      console.error(error)
    }
  },

  database (state, payload) {
    Vue.set(state.databases,state.tab,payload)
  },

	// setBuffer (state, payload) {
  //   Vue.set(state.buffers,state.tab,payload)
  // },

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

      state.properties.filter(p=>p.clear).forEach(p=>{
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

  async updatePreviewCode ({state, commit}, previewCode) {
    commit('setPreviewCode', previewCode)
    try {
      if (state.everyLoadedPreviewCode[state.tab]!==previewCode.code) {
        commit('setLoadedPreviewCode', previewCode.code)

        if (previewCode.load) {
          var varname = 'preview_df'
          var code = `${varname} = ${previewCode.code} \n`
          if (previewCode.currentCommand._infer) {
            code += `_output = {**${varname}.ext.to_json("*"), **${varname}.meta.get() } \n`
          } else {
            code += `_output = {**${varname}.ext.to_json("*")} \n`
          }

          var response = await this.evalCode(code)

          console.log({response})

          this.$store.commit('setDatasetPreview', {sample: response.data.result.sample} )

          var pCode = `_output = ${varname}.ext.profile(columns="*", output="json")`

          var pResponse = await this.evalCode(pCode)

          var profile = parseResponse(pResponse.data.result)

          this.$store.commit('setDatasetPreview', { profile } )


        }
      }
    } catch (error) {
      console.error(error)
    }
  }
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
      return state.buffers[state.tab] // TODO: varname
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
    return state.appStatus.message
  },
  typesAvailable (state) {
    try {
      return state.datasets[state.tab].summary.dtypes_list || state.allTypes
    } catch (error) {
      return state.allTypes
    }
  }
}
