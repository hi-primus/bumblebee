export const state = () => ({
	dataset: false,
	status: 'waiting'
})

export const mutations = {

	add (state, payload) {
		state.dataset = payload
		state.status = 'received'
	},

	status (state, payload) {
		state.status = payload
	}

}
