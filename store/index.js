export const state = () => ({
	dataset: {},
	dataset2: {},
	error: {}
})

export const mutations = {

	add (state, payload) {
		state.dataset = payload
	},

	add2 (state, payload) {
		state.dataset2 = payload
	},

	error (state, payload) {
		state.error = payload
	}

}
