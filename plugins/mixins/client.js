import io from 'socket.io-client'

var socket

export default {

	methods: {

    handleError (reason) {
      if (reason)
        if ( reason.includes('OK')
          || (
            reason.includes('Socket closed')
            && (this.$store.state.datasets.length>0)
          )
        ){
          this.$store.commit('status')
        }
        else {
          this.$store.commit('status', new Error(reason) )
        }
      this.stopClient()
    },

    stopClient (waiting) {
      if (waiting)
        this.$store.commit('status', 'waiting')

      if (socket)
        try {
          socket.disconnect()
        } catch (error) {
          console.error(error)
        }
    },

		startClient (queue,key) {

      socket = io(process.env.API_URL, {query: `queue=${queue}`})

      this.$store.commit('status', 'loading')

      socket.on('new-error', (reason) => {
        console.log('ERROR - ' + reason)
        this.handleError(reason)
      })

      socket.on('message', (message) => {

        const fernet = require('fernet');

        let secret = new fernet.Secret(key)

        var token = new fernet.Token({
          secret: secret,
          token: message,
          ttl: 0
        })

        const pako = require('pako');

        var originalInput = pako.inflate(atob(token.decode()),{ to: 'string' });

				try {
					this.$store.commit('add', {dataset: JSON.parse(originalInput)} )
					this.$forceUpdate()
				} catch (error) {
					console.error(error)
					this.$store.commit('status', error)
        }
      })

      socket.on('connect', () => {
        console.log('CONNECTION SUCCESS')
        this.$store.commit('status', 'receiving')
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
