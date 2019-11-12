import io from 'socket.io-client'
// import axios from 'axios'

let socket

const api_url = process.env.API_URL || 'http://localhost:5000'

export default {

	methods: {

    handleDatasetResponse (content, key = undefined) {

      if (key===undefined)
        key = this.$store.state.key

      const fernet = require('fernet')

      let secret = new fernet.Secret(key)

      let token = new fernet.Token({
        secret,
        token: content,
        ttl: 0
      })

      const pako = require('pako')

      let originalInput = pako.inflate(atob(token.decode()), {
        to: 'string'
      })

      this.$store.commit('add', {
        dataset: JSON.parse(originalInput)
      })

    },

		handleError (reason) {
			if (reason) {
				if (reason.includes('OK') ||
          (
          	reason.includes('Socket closed') &&
            (this.$store.state.datasets.length > 0)
          )
				) {
					this.$store.commit('status')
				} else {
					this.$store.commit('status', new Error(reason))
				}
			}
			this.stopClient()
		},

		stopClient (waiting) {
			if (waiting) {
				this.$store.commit('status', 'waiting')
			}

			if (socket) {
				try {
					socket.disconnect()
				} catch (error) {
					console.error(error)
				}
			}
		},

		startClient (session, key) {
      this.$store.commit('status', 'loading')

      this.$store.commit('session', session)

      this.$store.commit('key', key)

			socket = io(api_url, {
				query: `session=${session}`
			})

			socket.on('new-error', (reason) => {
				console.log('ERROR - ' + reason)
				this.handleError(reason)
      })

			socket.on('dataset', (dataset) => {
				try {
          this.handleDatasetResponse(dataset,key)
				} catch (error) {
					console.error(error)
					this.$store.commit('status', error)
				}
			})

			socket.on('connect', () => {
        console.log('CONNECTION SUCCESS')
        socket.on('success', () => {
          console.log('CONNECTION CONFIRMED')
          this.$store.commit('status', 'receiving')
        })
			})

			socket.on('connection-error', (reason) => {
				console.log('CONNECTION FAILURE - ' + reason)
				this.handleError()
			})

			socket.on('disconnect', (reason) => {
				console.log('CONNECTION LOST - ' + reason)
				this.handleError()
			})
		}
	}
}
