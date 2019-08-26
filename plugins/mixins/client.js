var client;

export default {

	methods: {

    stopClient (waiting) {
      if (waiting)
        this.$store.commit('status', 'waiting')

      if (client)
        try {
          client.disconnect()
        } catch (error) {
          console.error(error)
        }
    },

		startClient (uuid,key) {
      this.$store.commit('status', 'loading')
			let wsbroker = process.env.WS_BROKER
			let wsport = process.env.WS_PORT

      // TODO: unique id //
			client = new Paho.MQTT.Client(
        wsbroker,
        wsport,
        '/ws',
        'myclientid_' + parseInt(Math.random() * 100, 10)
      )

      client.onConnectionLost = (responseObject) => {
				// TODO: warn //
        console.log('CONNECTION LOST - ' + responseObject.errorMessage)
        if (responseObject.errorMessage.includes('OK')){
          this.$store.commit('status')
        }
        else {
          this.$store.commit('status', new Error(responseObject.errorMessage) )
        }
        this.stopClient()
			}
			client.onMessageArrived = (message) => {

        console.log('RECEIVE ON ' + message.destinationName)

        const fernet = require('fernet');

        let secret = new fernet.Secret(key)

        var token = new fernet.Token({
          secret: secret,
          token: message.payloadString,
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
			}

			let options = {
				timeout: 3,
				userName: 'mqtt-test',
				password: 'mqtt-test',
				keepAliveInterval: 30,
				onSuccess: () => {
					console.log('CONNECTION SUCCESS')
					client.subscribe(`${uuid}`, {
						qos: 1
					})

          this.$store.commit('status', 'receiving')

					/* ---- */
				},
				onFailure: (message) => {
					console.log('CONNECTION FAILURE - ' + message.errorMessage)
					if (message.errorMessage.includes('OK'))
            this.$store.commit('status')
          else
            this.$store.commit('status', new Error(message.errorMessage) )
          this.stopClient()
				}
			}

			// TODO: check //
			options.useSSL = false
			// if (location.protocol == "https:") {
			//   options.useSSL = false;
			// }

			client.connect(options)
		}
	}
}
