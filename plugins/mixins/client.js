export default {

	methods: {

		startClient (uuid,key) {
      this.$store.commit('status', 'loading')
			let wsbroker = process.env.WS_BROKER
			let wsport = process.env.WS_PORT

      // TODO: unique id //
			let client = new Paho.MQTT.Client(
        wsbroker,
        wsport,
        '/ws',
        'myclientid_' + parseInt(Math.random() * 100, 10)
      )

      client.onConnectionLost = (responseObject) => {
				// TODO: warn //
				console.log('CONNECTION LOST - ' + responseObject.errorMessage)
			}
			client.onMessageArrived = (message) => {

        console.log('RECEIVE ON ' + message.destinationName + ' PAYLOAD ' + message.payloadString)

        const fernet = require('fernet');

        let secret = new fernet.Secret(key)

        var token = new fernet.Token({
          secret: secret,
          token: message.payloadString,
          ttl: 0
        })

        const pako = require('pako');

        var originalInput = pako.inflate(atob(token.decode()),{ to: 'string' });

        console.log("Uncompressed string - " + originalInput);

				try {
					this.$store.commit('add', require('@/static/datasource/data.json'))
				} catch (error) {
					console.error(error)
					this.$store.commit('status', error)
        }

				// TODO: fill json //
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

          this.$store.commit('status', 'success')

          return;

					/* TEST */
					// TODO: testing is not neccessary //
					let message = new Paho.MQTT.Message('gAAAAABdStHv2atN3nctH50p_IJZkBmkcWwj5WVqVaSvUc6hzYgNCc2VvD6Ne2EqU5GiY9yVT1z7OaLVuh1wOo0onQE06R0CDu0SLP_f9Sq1LG0XXiWwe1A=')
					message.destinationName = `${uuid}`
					client.send(message)
					/* ---- */
				},
				onFailure: (message) => {
					console.log('CONNECTION FAILURE - ' + message.errorMessage)
					// TODO: warn //
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
