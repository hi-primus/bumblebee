const { io } = require("socket.io-client");

import { deepCopy, getDefaultParams, objectMap } from 'bumblebee-utils'

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
        result = await this.evalCode(code, 'await', 'requirement', isAsync);
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
      window.code.push(code);
      if (window.code.length > 100) {
        window.code = window.code.filter((c, i) => i>20);
      }
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

    this.initializeReceiver();

    window.receive = (command, payload) => {
      return this.receiveCommand(command, payload);
    }
  },

  beforeDestroy () {
    delete window.receivers[this._uid]
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
    },

    receivers () {
      return Object.values(window.receivers);
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

    datasetExecute (dfName) {
      return this.$store.dispatch('getExecute', { dfName, socketPost: this.socketPost, methods: this.commandMethods });
    },

    async datasetColumns (dfName) {

      var dataset = this.$store.state.datasets.find(dataset => dataset.dfName===dfName)

      if (dataset && dataset.columns && dataset.columns.length) {
        return dataset.columns.map(col=>col.name)
      }

      const response = await this.evalCode({command: 'columnsNames', dfName}, 'await', 'requirement');

      return response.data.result;

    },

    async datasetTypes (dfName) {

      var columns = false;

      var dataset = this.$store.state.datasets.find(dataset => dataset.dfName===dfName)

      if (dataset) {
        columns = (dataset.columns && dataset.columns.length) ? Object.fromEntries(dataset.columns.map(col=>[col.name, col.stats.inferred_data_type])) : false;
      }

      if (!columns) {
        const response = await this.evalCode({command: 'dataTypes', dfName}, 'await', 'requirement');
        columns = response.data.result;
      }

      return objectMap(columns, (type) => {
        if (type && typeof type === 'object') {
          return type.data_type || type.stats.inferred_data_type || type;
        }
        return type;
      });
    },

    async datasetSample (dfName) {

      var dataset = this.$store.state.datasets.find(dataset => dataset.dfName===dfName)

      if (dataset && dataset.columns && dataset.columns.length && dataset.columns.every(col=>col && col.stats && col.stats.frequency && col.stats.frequency[0] && col.stats.frequency[0].value)) {
        return Object.fromEntries(dataset.columns.map(col=>[col.name, col.stats.frequency[0].value]))
      }

      const response = await this.evalCode({command: 'frequency', dfName, n: 1}, 'await', 'requirement');
      return objectMap(response.data.result.frequency, f=>f.values[0].value);

    },

    evalCode (_code, reply = 'await', category = 'requirement', isAsync = false) {
      var code = undefined;
      var codePayload = undefined;
      if (typeof _code === 'string') {
        code = _code;
      } else {
        codePayload = _code;
      }
      return this.$store.dispatch('evalCode', {
        socketPost: this.socketPost,
        reply,
        category,
        isAsync,
        code,
        codePayload
      })
    },

    async assureSocket (socket, message, id = undefined) {
      if (!socket) {

        await this.startSocket(id);

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
            id: window.sessionId,
            ...params,
            reset: false
          }

          console.log('[BUMBLEBEE] Reinitializing Optimus');

          let response = await this.socketPost('initialize', reinitializationPayload);

          if (!response.data.optimus) {
            throw response
          }

          window.pushCode({code: response.code})
        }

        socket = await window.socket();
      }

      return socket;
    },

    async socketPost (message, payload = {}, timeout) {

      if (!process.client) {
        throw new Error('Trying to post from a non-client process');
      }

      let timestamp = ++window.timestamps;

      let postPromise = new Promise( async (resolve, reject) => {

        if (!payload.reply || payload.reply == 'await') {
          if (payload.isAsync) {
            window.promises[timestamp] = { resolve, reject, payload, isAsync: true };
          } else {
            window.promises[timestamp] = { resolve, reject, payload };
          }
        }

        let socket = await window.socket();

        try {

          let id;

          if (message == 'initialize' && payload.id) {
            id = payload.id;
          }

          socket = await this.assureSocket(socket, message, id)

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
			this.stopClient(false, true)
    },

    async signOut () {
      await this.$store.dispatch('session/signOut')
    },

		async stopClient (waiting, error) {

      this.socketAvailable = false

			if (waiting) {
				this.$store.commit('setAppStatus', {status: 'waiting'})
      }

      var socket = await window.socket();

      if (!error) {
        window.sessionId = undefined;
      }

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

    startSocket (previousSessionId) {

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

          var socket = io(baseUrl, { transports: ['websocket'] });

          socket.on("connect_error", (err) => {
            console.error('Connect error', err);
            reject(err);
          });

          socket.on("connect_timeout", (err) => {
            console.error('Connect timeout', err);
            reject(err);
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

            let handler;

            if (payload.reply && payload.reply !== 'await') {
              handler = {
                resolve: (p)=>window.receive(p.reply, p),
                reject: (p)=>window.receive(p.reply, p)
              }
            }

            if (payload.data && payload.data.key && window.promises[payload.data.key] && window.promises[payload.data.key]) {
              handler = window.promises[payload.data.key];
              delete window.promises[payload.data.key];
            }
            
            if (!handler && payload.timestamp && window.promises[payload.timestamp]) {
              handler = window.promises[payload.timestamp];
              delete window.promises[payload.timestamp];
            }

            if (!handler) {
              console.warn(`Request with id ${payload.timestamp} already replied`, payload);
              return null;
            }

            if (payload.error || payload.status == "error" || (payload.data && payload.data.status == "error")) {

              handler.reject(payload);

            } else {

              if (handler.isAsync) {

                if (payload.data && payload.data.status == "pending"){
                  if (key !== payload.data.key) {
                    window.promises[payload.data.key] = handler;
                  }
                } else {
                  handler.resolve(payload);
                }

              } else {
                handler.resolve(payload);
              }
            }

          });

          socket.on('connect', () => {
            console.log('Connection success');
            socket.on('confirmation-success', () => {
              console.log('Connection confirmed');
              this.socketAvailable = true;
              window.sessionId = socket.id;
              resolve(socket);
            });
            socket.emit('confirmation', { workspace, username, authorization: accessToken, key, previousSessionId });
          });

          socket.on('confirmation-error', (reason) => {
            console.warn('Confirmation failure', reason);
            this.handleError();
            reject('Confirmation failure');
          });

          socket.on('connection-error', (reason) => {
            console.warn('Connection failure', reason);
            this.handleError();
            reject('Connection failure');
          });

          socket.on('disconnect', async (reason) => {
            console.log('Connection lost', reason);
            if (reason == "transport close") {
              socket = await this.assureSocket(socket, 'features', socket.id);
            }

            if (socket && socket.connected && !socket.disconnected) {
              resolve(socket);
            } else {
              this.handleError();
              reject('Connection lost ' + reason);
            }
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

    // open responses handling

    initializeReceiver () {
      window.receivers = window.receivers || {};
      window.receivers[this._uid] = (command, payload) => this.receiveCommandLocal(command, payload);
    },

    async receiveCommand (command, payload) {
      let receivers = Object.values(window.receivers);
      let resultGroups = [];
      for (let i = 0; i < receivers.length; i++) {
        const receiver = receivers[i];
        let resultGroup;
        try {
          resultGroup = await receiver(command, payload);
        } catch (err) {
          console.error(err);
          resultGroup = err
        }
        resultGroups.push(resultGroup);
      }
      return resultGroups.flat(1);
    },

    async receiveCommandLocal (command, payload) {

      let commandString = (command && typeof command == 'object') ? command.command : command;

      let listeners = Object.entries(this)
        .filter(([k,v])=>typeof v=='function' && k.startsWith('commandListener'))
        .filter(([k,v])=>k.split("__").includes(commandString))
        .map(([k,v])=>v);

      let results = []

      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        let result;
        try {
          result = await listener(payload);
        } catch (err) {
          console.error(err);
          result = err
        }
        results.push(result);
      }

      return results;
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
