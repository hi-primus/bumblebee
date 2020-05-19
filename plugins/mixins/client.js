import io from 'socket.io-client'
import { printError } from '@/utils/functions.js'

// TODO: this should be a VUEX store

let socket
let promises = {}

let timestamps = 0
let socketAvailable = false
let secondaryDatasets = {}

const api_url = process.env.API_URL || 'http://localhost:5000'

export default {

  data () {
    return {
    }
  },

  mounted() {
    window.evalCode = async (code) => {
      var result = await this.evalCode(code)
      console.log('[DEBUG]',result)
    }
  },

  computed: {
    socketAvailable: {
      set (value) {
        socketAvailable = value
      },
      get () {
        return socketAvailable
      }
    }
  },

	methods: {

    async evalCode (code) {
      try {

        var startTime = new Date().getTime()

        var response = await this.socketPost('run', {
          code,
          session: this.$store.state.session
        }, {
          timeout: 0
        })

        var endTime = new Date().getTime()

        response._frontTime = {
          start: startTime/1000,
          end: endTime/1000,
          duration: (endTime - startTime)/1000
        }

        console.log('"""[DEBUG][RESULT]"""', response)
        console.log('"""[DEBUG][CODE]"""', response.code)

        window.code = (window.code || '') + response.code + '\n'

        try {
          console.log(
            '"""[DEBUG][TIMES]',
            'front', response._frontTime,
            'server', response._serverTime,
            'gateway', response._gatewayTime,
            'frontToServer', response._serverTime.start-response._frontTime.start,
            'serverToGateway', response._gatewayTime.start-response._serverTime.start,
            'GatewayToServer', response._serverTime.end-response._gatewayTime.end,
            'ServerToFront', response._frontTime.end-response._serverTime.end,
            '"""'
          )
        } catch (err) {
          console.log(
            '"""[DEBUG][TIMES]',
            'front', response._frontTime,
            'server', response._serverTime,
            'gateway', response._gatewayTime,
            '"""'
          )
        }

        if (response.data.status==='error') {
          throw response
        }

        return response

      } catch (err) {

        console.error(err)

        printError(err)
        return err

      }
    },

    socketPost (message, payload = {}) {

      var timestamp = ++timestamps

      return new Promise( async (resolve, reject) => {

        try {
          if (!socket) {
            await this.startSocket ()
            var response = await this.socketPost('initialize',{
              session: this.$store.state.session,
              engine: this.$store.state.engine,
              tpw: this.$store.state.tpw,
              workers: this.$store.state.workers,
              reset: this.$route.query.reset
            })

            window.code = (window.code || '') + response.code + '\n'

            if (!response.data.optimus) {
              throw response
            }
          }
          socket.emit(message,{...payload, timestamp})
          promises[timestamp] = {resolve, reject}
        } catch (error) {
          reject('Error '+error)
        }

      })
    },

		handleError (reason, status) {
			if (reason) {
        var reason_string = reason.toString()
				if (reason_string.includes('OK') ||
          (
          	reason_string.includes('Socket closed') &&
            (this.$store.state.datasets.length > 0)
          )
				) {
					this.$store.commit('setAppStatus')
				} else {
          var appStatus = {
            error: new Error(reason),
            status: status || this.$store.state.appStatus.status || 'receiving'
          }
					this.$store.commit('setAppStatus', appStatus)
				}
			}
			this.stopClient()
		},

		stopClient (waiting) {

      this.socketAvailable = false

      let query = Object.assign({}, this.$route.query);
      delete query.key;
      delete query.session;
      this.$router.replace({ query });

			if (waiting) {
				this.$store.commit('setAppStatus', {status: 'waiting'})
			}

			if (socket) {
				try {
          socket.disconnect()
				} catch (error) {
          console.error(error)
				}
        socket = undefined;
        console.log('Socket closed')
        return
      }
      else
        console.warn('Socket already closed')
    },

    startSocket (session, key, engine) {

      return new Promise((resolve, reject)=>{

        if (session)
          this.$store.commit('session', session)
        else if (this.$store.state.session)
          session = this.$store.state.session
        else
          throw new Error('Credentials not found')

        if (key)
          this.$store.commit('key', key)
        else if (this.$store.state.key)
          key = this.$store.state.key

        var token = this.$store.state.auth.token || ''

        key = key || ''

        socket = io(api_url, { query: { session, token, key } })

        socket.on('new-error', (reason) => {
          console.error('Socket error', reason)
          reject(reason)
        })

        socket.on('dataset', (dataset) => {
          try {
            this.$store.commit('loadDataset', {
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


      })


    },

		async startClient ({session, key, engine, tpw, workers}) {

      if (['loading','receiving'].includes(this.$store.state.appStatus.status)) {
        return false
      }

      try {
        this.$store.commit('setAppStatus', {status: 'loading'})
        this.$store.commit('session', session)
        this.$store.commit('engine', engine)
        this.$store.commit('tpw', tpw)
        this.$store.commit('workers', workers)
        key && this.$store.commit('key', key)

        var client_status = await this.startSocket(session, key, engine)

        if (client_status=='ok')
          this.$store.commit('setAppStatus', {status: 'receiving'})

      } catch (error) {
        this.handleError(error)
      }
    },

    async updateSecondaryDatasets() {
      try {
        var response = await this.socketPost('datasets',{session: this.$store.state.session})
        window.code = (window.code || '') + response.code + '\n'
        secondaryDatasets = response.data
        this.$store.commit('setHasSecondaryDatasets', (Object.keys(secondaryDatasets).length>1) )
        this.$store.commit('setSecondaryDatasets', secondaryDatasets )

        return response.data
      } catch (error) {
        console.error(error)
        return []
      }
    },
	}
}
