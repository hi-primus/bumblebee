import Vue from 'vue'
import io from 'socket.io-client'
import { printError, decapitalizeString } from '@/utils/functions.js'

const properties = [
  'Session',
  'Key',
  'Socket'
]

var pStateProperties = {}

properties.forEach((p)=>{
  pStateProperties[decapitalizeString(p)] = undefined
})

export const state = () => ({
  timestamps: 0,
  ...pStateProperties
})

var pMutations = {}

properties.forEach((p)=>{
  pMutations['set'+p] = function (state, value) {
    state[decapitalizeString(p)] = value
  }
})

export const mutations = {
  ...pMutations
}

export const actions = {
  startSocket ({state, commit}, {session, key, engine}) {
  // StartSocket (session, key, engine) {

    return new Promise((resolve, reject)=>{

      if (session)
        commit('setSession', session)
      else if (state.session)
        session = state.session
      else
        throw new Error('Credentials not found')

      if (key)
        commit('setKey', key)
      else if (state.key)
        key = state.key

      var token = state.auth.token || ''

      key = key || ''

      var socket = io(api_url, { query: { session, token, key } })

      socket.on('new-error', (reason) => {
        console.error('Socket error', reason)
        reject(reason)
      })

      socket.on('dataset', (dataset) => {
        try {
          commit('loadDataset', {
            dataset
          })
        } catch (error) {
          console.error(error)
          reject(error)
        }
      })

      socket.on('reply', (payload) => {
        if (payload.timestamp && promises[payload.timestamp]) {
          if (payload.error) {
            promises[payload.timestamp].reject(payload)
          }
          else {
            promises[payload.timestamp].resolve(payload)
          }
          delete promises[payload.timestamp]
        }
        else {
          console.warn('Wrong timestamp reply',payload.timestamp,payload)
        }
      })

      socket.on('connect', () => {
        console.log('Connection success')
        socket.on('success', () => {
          console.log('Connection confirmed')
          this.socketAvailable = true
          resolve('ok')
        })
      })

      socket.on('connection-error', (reason) => {
        console.warn('Connection failure', reason)
        this.handleError()
        reject('Connection failure')
      })

      socket.on('disconnect', (reason) => {
        console.log('Connection lost', reason)
        this.handleError()
        reject('Connection lost')
      })

      commit('setSocket',socket)

    })


  },
}
