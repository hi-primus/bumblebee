import io from 'socket.io-client'
import { printError } from '@/utils/functions.js'

// TODO: this should be a VUEX store

let socket
let promises = {}

let timestamps = 0
let socketAvailable = false
let secondaryDatasets = {}

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
    window.pushCode = async (code) => {
      if (!window.code || !window.code.push) {
        window.code = []
      }
      window.code.push(code)
    }
    window.clearCode = async () => {
      window.code = []
      console.log('[CODE] Cleared')
    }
    window.getCode = async (errors = false, unimportant = false) => {
      if (!window.code || !window.code.length) {
        console.log('[CODE] No code here')
        return false
      }
      var code = window.code
      if (errors===false) {
        code = code.filter(e=>!e.error)
      } else if (typeof errors=='number') {
        code = code.reverse()
        errors = Math.ceil(errors)
        code = code.filter(e=>{
          if (e.error && !errors) {
            errors--
            return false
          }
          return true
        })
        code = code.reverse()
      }
      if (!unimportant) {
        code = code.filter(e=>!e.unimportant)
      }
      console.log('[CODE]', code.map(e=>e.code).join('\n'))
      return true
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
          session: this.$store.state.session.session
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

        window.pushCode({code: response.code})

        return response

      } catch (err) {

        if (err.code) {
          window.pushCode({code: err.code, error: true})
        }

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
              session: this.$store.state.session.session,
              engine: this.$route.query.engine,
              tpw: this.$route.query.tpw,
              workers: this.$route.query.workers,
              reset: this.$route.query.reset
            })

            if (!response.data.optimus) {
              throw response
            }

            window.pushCode({code: response.code})
          }
          socket.emit(message,{...payload, timestamp})
          promises[timestamp] = {resolve, reject}
        } catch (error) {
          if (error.code) {
            window.pushCode({code: error.code, error: true})
          }
          reject(error)
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
            status: status || this.$store.state.appStatus.status || 'workspace'
          }
					this.$store.commit('setAppStatus', appStatus)
				}
			}
			this.stopClient()
		},

		stopClient (waiting) {

      this.socketAvailable = false

      if (this.$route.query.session || this.$route.query.key) {
        let query = Object.assign({}, this.$route.query)
        delete query.key
        delete query.session
        this.$router.replace({ query })
      }


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
          this.$store.commit('session/mutation', {mutate: 'session', payload: session})
        else if (this.$store.state.session.session)
          session = this.$store.state.session.session
        else
          throw new Error('Credentials not found')

        if (key)
          this.$store.commit('key', key)
        else if (this.$store.state.key)
          key = this.$store.state.key

        var accessToken = this.$store.state.session.accessToken || ''

        key = key || ''

        socket = io(process.env.API_URL, { query: { session, authorization: accessToken, key } })

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

      if (['loading','workspace'].includes(this.$store.state.appStatus.status)) {
        return false
      }

      try {
        this.$store.commit('setAppStatus', {status: 'loading'})
        this.$store.commit('session/mutation', {mutate: 'session', payload: session})
        if (key)
          this.$store.commit('key', key)

        var client_status = await this.startSocket(session, key, engine)

        if (client_status === 'ok') {
          this.$router.push({path: 'workspace', query: this.$route.query })
        } else {
          throw client_status
        }

      } catch (error) {
        this.handleError(error)
      }
    },

    async updateSecondaryDatasets() {
      try {
        var response = await this.socketPost('datasets',{session: this.$store.state.session.session})
        window.pushCode({code: response.code, unimportant: true})
        secondaryDatasets = response.data
        this.$store.commit('setHasSecondaryDatasets', (Object.keys(secondaryDatasets).length>1) )
        this.$store.commit('setSecondaryDatasets', secondaryDatasets )

        return response.data
      } catch (error) {
        if (error.code) {
          window.pushCode({code: error.code, error: true, unimportant: true})
        }
        console.error(error)
        return []
      }
    },
	}
}
