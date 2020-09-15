import io from 'socket.io-client'
import { INIT_PARAMETERS } from 'bumblebee-utils'

export default {

  data () {
    return {
    }
  },

  mounted() {

    window.promises = window.promises || {}

    window.timestamps = window.timestamps || 0

    window.evalCode = async (code, usePyodide) => {
      var result;
      if (usePyodide) {
        await this.assertPyodide
        result = pyodide.runPython(code)
      } else {
        result = await this.evalCode(code);
      }
      console.log('[DEBUG]',result);
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
        window.socketAvailable = value
      },
      get () {
        return window.socketAvailable
      }
    },

    async assertPyodide () {
      if (!window.pyodideScript) {
        await new Promise((resolve, reject) => {
          var script = document.createElement('script');
          script.onload = function () {
            resolve(true);
          };
          script.src = 'https://pyodide-cdn2.iodide.io/v0.15.0/full/pyodide.js';
          document.head.appendChild(script);
        });
        window.pyodideScript = 1;
      }
      return await languagePluginLoader
    }
  },

	methods: {

    async getProfiling (dfName) {
      return this.$store.dispatch('getProfiling', { dfName, socketPost: this.socketPost });
    },

    buffer (dfName) {
      return this.$store.dispatch('getBuffer', { dfName, socketPost: this.socketPost });
    },

    async evalCode (code) {
      return await this.$store.dispatch('evalCode', {
        socketPost: this.socketPost,
        code
      })
    },

    socketPost (message, payload = {}) {

      if (!process.client) {
        throw 'not client'
      }

      var timestamp = ++window.timestamps

      return new Promise( async (resolve, reject) => {

        window.promises[timestamp] = {resolve, reject}

        try {
          if (!window.socket) {

            var query = this.$route.query;

            var parameters = {};

            INIT_PARAMETERS.forEach(parameter => {
              if (query[parameter]) {
                parameters[parameter] = query[parameter]
              }
            });

            var initializationPayload = {
              username: this.$store.state.session.username,
              workspace: (this.$store.state.workspace ? this.$store.state.workspace.slug : undefined) || 'default',
              ...parameters
            }
            await this.startSocket ()

            if (message!=='initialize') {
              console.log('[BUMBLEBEE] Reinitializing Optimus')
              var response = await this.socketPost('initialize', initializationPayload )

              if (!response.data.optimus) {
                throw response
              }

              window.pushCode({code: response.code})
            }
          }

          window.socket.emit('message',{message, ...payload, timestamp})

        } catch (error) {
          if (error.code) {
            window.pushCode({code: error.code, error: true})
          }
          delete window.promises[timestamp]
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

			if (window.socket) {
				try {
          window.socket.disconnect()
				} catch (error) {
          console.error(error)
				}
        window.socket = undefined;
        console.log('Socket closed')
        return
      }
      else {
        console.warn('Socket already closed')
      }
    },

    startSocket () {

      if (!process.client) {
        throw new Error('SSR not allowed');
      }

      return new Promise((resolve, reject)=>{

        let username = this.$store.state.session.username;
        let workspace = (this.$store.state.workspace ? this.$store.state.workspace.slug : undefined) || 'default';
        let key = this.$store.state.session.key;

        if (!workspace) {
          throw new Error('Credentials not found');
        }

        var accessToken = this.$store.state.session.accessToken || '';

        key = key || '';

        var socket_url = process.env.API_URL;

        window.socket = io(socket_url, { transports: ['websocket'] });

        window.socket.on('new-error', (reason) => {
          console.error('Socket error', reason);
          reject(reason);
        });

        window.socket.on('dataset', (dataset) => {
          try {
            this.$store.dispatch('setDataset', {
              dataset
            });
          } catch (error) {
            console.error(error);
            reject(error);
          }
        });

        window.socket.on('reply', (payload) => {
          if (payload.timestamp && window.promises[payload.timestamp]) {
            if (payload.error) {
              window.promises[payload.timestamp].reject(payload);
            }
            else {
              window.promises[payload.timestamp].resolve(payload);
            }
            delete window.promises[payload.timestamp];
          }
          else {
            console.warn('Wrong timestamp reply',payload.timestamp,payload);
          }
        });

        window.socket.on('connect', () => {
          console.log('Connection success');
          window.socket.on('success', () => {
            console.log('Connection confirmed');
            this.socketAvailable = true;
            resolve('ok');
          });
          window.socket.emit('confirmation', { workspace, username, authorization: accessToken, key });
        });

        window.socket.on('connection-error', (reason) => {
          console.warn('Connection failure', reason);
          this.handleError();
          reject('Connection failure');
        });

        window.socket.on('disconnect', (reason) => {
          console.log('Connection lost', reason);
          this.handleError();
          reject('Connection lost');
        });

      });

    },

		async startClient ({workspace, key}) {

      if (['loading','workspace'].includes(this.$store.state.appStatus.status)) {
        return false // TO-DO Check if it's the same workspace
      }

      try {

        var worskpacePromise = this.$store.dispatch('startWorkspace', { slug: workspace } )

        commit('mutation', { mutate: 'workspacePromise', payload: worskpacePromise })

        var response = await workspacePromise

        if (key) {
          this.$store.commit('session/mutation', {mutate: 'key', payload: key})
        }

        var client_status = await this.startSocket()

        if (client_status === 'ok') {
          return true
        } else {
          throw client_status
        }

      } catch (error) {
        this.handleError(error)
      }
    },


    async updateSecondaryDatasets() {
      try {
        var response = await this.socketPost('datasets', {
          username: this.$store.state.session.username,
          workspace: (this.$store.state.workspace ? this.$store.state.workspace.slug : undefined) || 'default'
        })
        window.pushCode({code: response.code, unimportant: true})
        console.log('Updating secondary datasets')
        var datasets = Object.fromEntries( Object.entries(response.data).filter(([key, dataset])=>(key !== 'preview_df' && key[0] !== '_')) )
        this.$store.commit('setSecondaryDatasets', datasets )

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
