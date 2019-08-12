export const state = () => ({
	datasets: [],
	status: 'waiting'
})

export const mutations = {

	add (state, newDataset) {
    state.datasets[0] = {...(state.datasets[0] || {}), ...newDataset}

    state.datasets[0].sample.parsedValue = JSON.parse(state.datasets[0].sample.value)

		state.status = 'received'
	},

	status (state, payload) {
		state.status = payload
	}

}
