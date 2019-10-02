export const state = () => ({
	datasets: [],
	datasetUpdates: 0,
	status: 'waiting'
})

export const mutations = {

	add (state, { dataset }) {
		let found = state.datasets.findIndex((e) => {
			return (e.name === dataset.name)
		})

		if (found === -1 || dataset.name === null) {
			found = state.datasets.length
		}

		state.datasets[found] = dataset

		if (state.datasets[found].columns instanceof Object) { state.datasets[found].columns = Object.values(state.datasets[found].columns) }

		state.status = 'received'

		state.datasetUpdates = state.datasetUpdates + 1

		console.log('DEBUG: state.datasets[found]', state.datasets[found])
  },

  deleteColumn(state,{dataset, column}) {
    state.datasets[dataset].columns.splice(column, 1)
    state.datasetUpdates = state.datasetUpdates + 1
  },

	delete (state, { index }) {
		state.datasets.splice(index, 1)
		if (!state.datasets.length) {
			state.status = 'receiving'
		}
		return index
	},

	status (state, payload) {
		state.status = payload || 'waiting'
	}

}
