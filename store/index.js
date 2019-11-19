export const state = () => ({
	datasets: [],
	datasetUpdates: 0,
  status: 'waiting',
  session: '',
  database: false,
  key: '',
  datasetCounter: 1,
  kernel: false,
  cells: []
})

export const mutations = {

	add (state, { dataset }) {

    if (dataset.name===null){
      if (dataset.file_name){
        dataset.name = dataset.file_name.split('.')[0]
      }
      else {
        dataset.name = `Dataset-${state.datasetCounter}`
        state.datasetCounter = state.datasetCounter + 1
      }

    }

		let found = state.datasets.findIndex((e) => {
			return (e.name === dataset.name)
    })

    if (found === -1) {
      found = state.datasets.findIndex((e) => {
        return (!e.summary)
      })
    }

		if (found === -1) {
			found = state.datasets.length
    }

    dataset.varname = 'df' // TODO: multiple dfs

    /*

    if (found>=1)
      dataset.varname = `df${found}`
    else
      dataset.varname = 'df'

    */

    state.datasets[found] = dataset

		if (state.datasets[found].columns instanceof Object) { state.datasets[found].columns = Object.values(state.datasets[found].columns) }

		state.status = 'received'

		state.datasetUpdates = state.datasetUpdates + 1

		console.log('DEBUG: dataset', state.datasets[found])
  },

  addNew (state) {

    let found = state.datasets.length

    let dataset = {
      name: '(new dataset)',
      blank: true
    }

    state.status = 'received'

		state.datasets[found] = dataset

		state.datasetUpdates = state.datasetUpdates + 1

  },

	delete (state, { index }) {
		state.datasets.splice(index, 1)
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

  cells (state, payload) {
    state.cells = payload
  },

  cellContent (state, {index, content}) {
    try {
      state.cells[index].content = content
    } catch (error) {
      console.error(error)
    }
  },

  database (state, payload) {
    state.database = payload
  },

	key (state, payload) {
    state.key = payload
  },

  kernel (state, payload) {
    state.kernel = (payload==undefined) ? true : payload
  }

}
