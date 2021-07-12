import io from 'socket.io-client'
import { mapGetters } from 'vuex'
import { deepCopy, getDefaultParams, objectMap, INIT_PARAMS } from 'bumblebee-utils'

const baseUrl = process.env.API_URL || 'http://localhost:4000'

export default {

  data () {
    return {
      loadedUsername: false
    }
  },

  mounted () {

    this.$store.dispatch('session/getUsername').then(u=>{
      this.loadedUsername = u;
    });

    window.socket = () => window.socketPromise;

    window.promises = window.promises || {};

    window.timestamps = window.timestamps || 0;

    window.evalCode = async (code, isAsync = false, usePyodide = false) => {
      var result;
      if (usePyodide) {
        console.debug('[PYODIDE] Requesting')
        await this.assertPyodide()
        result = pyodide.runPython(code)
      } else {
        result = await this.evalCode(code, isAsync);
      }
      console.debug('[DEBUG]',result);
      return result
    }
    window.pushCode = async (cd) => {
      var code = deepCopy(cd);
      if (!window.code || !window.code.push) {
        window.code = [];
      }
      window.code = deepCopy(window.code);
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
      var code2;
      if (errors===false) {
        code2 = code.filter(e=>!e.error)
      } else if (typeof errors=='number') {
        code = code.reverse()
        errors = Math.ceil(errors)
        code2 = code.filter(e=>{
          if (e.error && !errors) {
            errors--
            return false
          }
          return true
        });
        code = code.reverse()
        code2 = code2.reverse()
      }
      if (!unimportant) {
        code2 = code2.filter(e=>!e.unimportant)
      }
      console.log('[CODE]', code2.map(e=>e.code).join('\n'))
      return true
    }
  },

  computed: {

    commandMethods () {
      return {
        evalCode: this.evalCode,
        vueSet: this.$set,
        vueDelete: this.$delete,
        datasetColumns: this.datasetColumns,
        datasetTypes: this.datasetTypes,
        datasetSample: this.datasetSample,
        datasetExecute: this.datasetExecute,
        datasetColumns: this.datasetColumns,
        storeDispatch: this.$store.dispatch,
        storeCommit: this.$store.commit,
      }
    },

    storedUsername () {
      return this.$store.state.session.username;
    },

    currentUsername () {
      return this.loadedUsername || this.storedUsername;
    },

    socketAvailable: {
      set (value) {
        window.socketAvailable = value
      },
      get () {
        return window.socketAvailable
      }
    }
  },

	methods: {

    async assertPyodide () {
      if (!window.pyodideScript) {
        console.debug('[PYODIDE] Loading')
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
    },

    async getProfiling (dfName, ignoreFrom = -1, forcePromise = false, partial = true) {
      console.debug('[PROFILING]',dfName);
      var payload = { dfName, socketPost: this.socketPost, clearPrevious: true };
      return this.$store.dispatch('getProfiling', { payload, forcePromise, ignoreFrom, partial, methods: this.commandMethods });
    },

    datasetExecute (dfName) {
      return this.$store.dispatch('getExecute', { dfName, socketPost: this.socketPost, methods: this.commandMethods });
    },

    async datasetColumns (dfName) {

      var dataset = this.$store.state.datasets.find(dataset => dataset.dfName===dfName)

      if (dataset && dataset.columns && dataset.columns.length) {
        return dataset.columns.map(col=>col.name)
      }

      const response = await this.evalCode({command: 'columnsNames', dfName});

      return response.data.result;

    },

    async datasetTypes (dfName) {

      var columns = false;

      var dataset = this.$store.state.datasets.find(dataset => dataset.dfName===dfName)

      if (dataset) {
        columns = (dataset.columns && dataset.columns.length) ? Object.fromEntries(dataset.columns.map(col=>[col.name, col.stats.profiler_dtype])) : false;
      }

      if (!columns) {
        const response = await this.evalCode({command: 'dataTypes', dfName});
        columns = response.data.result;
      }

      return objectMap(columns, (type) => {
        if (type && typeof type === 'object') {
          return type.dtype || type.stats.profiler_dtype || type;
        }
        return type;
      });
    },

    async datasetSample (dfName) {

      var dataset = this.$store.state.datasets.find(dataset => dataset.dfName===dfName)

      if (dataset && dataset.columns && dataset.columns.length && dataset.columns.every(col=>col && col.stats && col.stats.frequency && col.stats.frequency[0] && col.stats.frequency[0].value)) {
        return Object.fromEntries(dataset.columns.map(col=>[col.name, col.stats.frequency[0].value]))
      }

      const response = await this.evalCode({command: 'frequency', dfName, n: 1});
      return objectMap(response.data.result.frequency, f=>f.values[0].value);


    },

    evalCode (_code, isAsync = false) {
      var code = undefined;
      var codePayload = undefined;
      if (typeof _code === 'string') {
        code = _code;
      } else {
        codePayload = _code;
      }
      return this.$store.dispatch('evalCode', {
        socketPost: this.socketPost,
        isAsync,
        code,
        codePayload
      })
    },

    async socketPost (message, payload = {}, timeout) {

      if (!process.client) {
        throw new Error('Trying to post from a non-client process');
      }

      let timestamp = ++window.timestamps;

      let postPromise = new Promise( async (resolve, reject) => {

        if (payload.isAsync) {
          window.promises[timestamp] = {resolve, reject, isAsync: true}
        } else {
          window.promises[timestamp] = {resolve, reject}
        }

        let socket = await window.socket();

        try {
          if (!socket) {

            await this.startSocket();

            if (!['initialize','features'].includes(message)) {

              let params = {};

              params = getDefaultParams(params);

              let slug = this.$route.params.slug;

              if (!params.name) {
                if (this.currentUsername && slug) {
                  params.name = this.currentUsername + '_' + slug;
                } else {
                  params.name = 'default';
                }
              }

              if (params.jupyter_address) {
                params.jupyter_ip = params.jupyter_address.ip;
                params.jupyter_port = params.jupyter_address.port;
              }

              let reinitializationPayload = {
                username: this.currentUsername,
                workspace: slug,
                ...params
              }

              console.log('[BUMBLEBEE] Reinitializing Optimus');

              let response = await this.socketPost('initialize', reinitializationPayload );

              if (!response.data.optimus) {
                throw response
              }

              window.pushCode({code: response.code})
            }

            socket = await window.socket();
          }

          if (!socket) {
            reject(new Error("Error connecting to back-end"));
          }

          socket.emit(message, { ...payload, timestamp });

          if (timeout) {
            await new Promise((res, rej) => {
              setTimeout(() => {
                res(true)
              }, timeout);
            });
            reject(new Error("Timeout error"))
          }

        } catch (err) {
          if (err.code) {
            window.pushCode({code: err.code, error: true});
          }
          reject(err);
        }

      });

      try {
        return await postPromise
      } catch (err) {
        delete window.promises[timestamp];
        throw err;
      }

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

    async signOut () {
      await this.$store.dispatch('session/signOut')
    },

		async stopClient (waiting) {

      this.socketAvailable = false

			if (waiting) {
				this.$store.commit('setAppStatus', {status: 'waiting'})
      }

      var socket = await window.socket();

			if (socket) {
				try {
          socket.disconnect()
				} catch (error) {
          console.error(error)
				}
        window.socketPromise = undefined;
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

      window.socketPromise = new Promise((resolve, reject)=>{
        try {
          let username = this.currentUsername;
          let workspace = this.$route.params.slug;
          let key = this.$store.state.session.key;

          if (!workspace) {
            throw new Error('Credentials not found');
          }

          var accessToken = this.$store.state.session.accessToken || '';

          key = key || '';

          var socket = io.connect(baseUrl, {
            transports: ['websocket'],
            transportOptions: {
              polling: {
                extraHeaders: {
                  authorization: this.$store.state.session.accessToken,
                }
              }
            }
          });

          socket.on('new-error', (reason) => {
            console.error('Socket error', reason);
            reject(reason);
          });

          socket.on('dataset', async (dataset) => {
            try {
              await this.$store.dispatch('setDataset', {
                dataset
              });
            } catch (error) {
              console.error(error);
              reject(error);
            }
          });

          socket.on('reply', (payload) => {

            let key;

            if (payload.data && payload.data.key && window.promises[payload.data.key] && window.promises[payload.data.key]) {
              key = payload.data.key;
            }

            if (!key && payload.timestamp && window.promises[payload.timestamp]) {
              key = payload.timestamp
            }

            if (!key) {
              console.warn(`Request with id ${payload.timestamp} already replied`, payload);
              return null;
            }

            if (payload.error || payload.status == "error" || (payload.data && payload.data.status == "error")) {

              window.promises[key].reject(payload);
              delete window.promises[key];

            } else {

              if (window.promises[key].isAsync) {

                if (payload.data && payload.data.status == "pending"){
                  if (key !== payload.data.key) {
                    window.promises[payload.data.key] = window.promises[key]
                    delete window.promises[key]
                  }
                } else {
                  window.promises[key].resolve(payload);
                  delete window.promises[key];
                }

              } else {
                window.promises[payload.timestamp].resolve(payload);
                delete window.promises[payload.timestamp];
              }
            }

          });

          socket.on('connect', () => {
            console.log('Connection success');
            socket.on('success', () => {
              console.log('Connection confirmed');
              this.socketAvailable = true;
              resolve(socket);
            });
            socket.emit('confirmation', { workspace, username, authorization: accessToken, key });
          });

          socket.on('connection-error', (reason) => {
            console.warn('Connection failure', reason);
            this.handleError();
            reject('Connection failure');
          });

          socket.on('disconnect', (reason) => {
            console.log('Connection lost', reason);
            this.handleError();
            reject('Connection lost ' + reason);
          });
        } catch (err) {
          reject(err)
        }
      });

      window.socketPromise.catch((err)=>{
        console.error(err);
        delete window.socketPromise;
      });

      window.stopClient = this.stopClient;

      return window.socketPromise;

    },

		async startClient ({workspace, key}) {

      if (['loading','workspace'].includes(this.$store.state.appStatus.status)) {
        return false // TO-DO Check if it's the same workspace
      }

      try {

        var response = this.$store.dispatch('getWorkspace', { slug: workspace } );

        if (key) {
          this.$store.commit('session/mutation', {mutate: 'key', payload: key});
        }

        var client_status = await this.startSocket();

        if (client_status === 'ok') {
          return true;
        } else {
          throw client_status;
        }

      } catch (error) {
        this.handleError(error);
      }
    }
  },

  watch: {
    storedUsername (value) {
      this.loadedUsername = value
      if (!value) {
        this.stopClient(true)
        this.$router.push({path: '/login', query: this.$route.query })
      }
    }
  }
}
