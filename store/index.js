export const state = () => ({
	dataset: false,
	error: false
})

export const mutations = {

	add (state, payload) {
		state.dataset = payload
		state.error = false
	},

	error (state, payload) {
		state.error = payload
	}

}
