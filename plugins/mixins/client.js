export default {

  methods: {

    startClient(uuid) {

      let wsbroker = process.env.WS_BROKER;
      let wsport = process.env.WS_PORT;
      let client = new Paho.MQTT.Client(wsbroker, wsport, "/ws",
        "myclientid_" + parseInt(Math.random() * 100, 10)); // TODO: unique id //
      client.onConnectionLost = function (responseObject) {
        console.log("CONNECTION LOST - " + responseObject.errorMessage);
        // TODO: warn //
      };
      client.onMessageArrived = function (message) {
        console.log("RECEIVE ON " + message.destinationName + " PAYLOAD " + message.payloadString);
        // TODO: fill json //
      };

      let options = {
        timeout: 3,
        userName: "mqtt-test",
        password: "mqtt-test",
        keepAliveInterval: 30,
        onSuccess: function () {
          console.log("CONNECTION SUCCESS");
          client.subscribe(`/${uuid}`, {
            qos: 1
          });

          /* TEST */
          // TODO: testing is not neccessary //
          let message = new Paho.MQTT.Message("Testing");
          message.destinationName = `/${uuid}`;
          client.send(message);
          /* ---- */
        },
        onFailure: function (message) {
          console.log("CONNECTION FAILURE - " + message.errorMessage);
          // TODO: warn //
        }
      };

      // TODO: check //
      options.useSSL = false;
      // if (location.protocol == "https:") {
      //   options.useSSL = false;
      // }

      client.connect(options);
    }
  }
}
