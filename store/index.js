import Vuex from 'vuex';

const createStore = () => {

  return new Vuex.Store({

    state: {
      dataset: {}
    },

    mutations: {

      add(state, payload) {
        state.dataset = payload;
      }

    }

  })

}

export default createStore