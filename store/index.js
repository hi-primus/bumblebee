export const state = () => ({
	datasets: [],
	status: 'waiting'
})

export const mutations = {

	add (state, {dataset}) {
    let found = state.datasets.findIndex((e)=>{
      return (e.name == dataset.name)
    })

    if (found==-1) {
      found = state.datasets.length
    }

    state.datasets[found] = {...(state.datasets[found] || {}), ...dataset}

    state.status = 'received'

    console.log("DEBUG: state.datasets[found]",state.datasets[found])
  },

  delete (state, {index}) {
    state.datasets.splice(index,1)
    if (state.datasets.length==0) {
      state.status = 'receiving'
    }
    return index;
  },

	status (state, payload) {
		state.status = payload || 'waiting'
	}

}
