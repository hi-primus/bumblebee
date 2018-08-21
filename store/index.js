import Vuex from 'vuex';

const createStore = () => {

  return new Vuex.Store({

    state: {
      dataset: {}
    },

    mutations: {

      add(state, payload) {
        state.dataset = payload;
      },

      add2(state, payload) {
        state.dataset2 = payload;
      },

      error(state, payload){
        state.error = payload;
      }

    }

  })

}

export default createStore