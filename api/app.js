require('dotenv/config')
const express = require('express')
const bodyParser = require('body-parser')

const session = require('express-session')

const app = express()
var server = require('http').createServer(app)

const { version } = require('./package.json')

var app_url
var app_host
var api_url
var base
var ws_kernel_base

var whitelist = []

function updateHost (host = 'localhost') {

	var kernel_host = process.env.KERNEL_HOST || host
	var kernel_port = process.env.KERNEL_PORT || 8888

	base  = 'http://'+kernel_host+':'+kernel_port
	ws_kernel_base = 'ws://'+kernel_host+':'+kernel_port

	app_host = process.env.APP_HOST || host
	var app_port = process.env.APP_PORT || 3000

	app_url = `${app_host}:${app_port}`

	var api_host = process.env.HOST || host
	var api_port = process.env.PORT || 5000

	api_url = `${api_host}:${api_port}`

}

updateHost ()

if (!process.env.DISABLE_CORS) {

	const cors = require('cors')

	whitelist = [
		'http://'+app_url,
		'https://'+app_url,
		'http://'+app_host,
		'https://'+app_host
	]

	var corsOptions = {
		origin: function (origin, callback) {
			if (whitelist.indexOf(origin) !== -1 || !origin) {
				callback(null, true)
			} else {
				callback(new Error('Not allowed by CORS'))
			}
		},
		optionsSuccessStatus: 200
	}

	app.use(cors(corsOptions));

}

app.use(bodyParser.json({
	limit: '100mb',
}))

const app_secret = process.env.APP_SECRET || '6um61e6ee'

app.use(session({
	secret: app_secret,
	resave: true,
	saveUninitialized: false
}))

app.get('/', (req, res) => {
	if (req.userContext && req.userContext.userinfo) {
		res.send(`Bumblebee API v${version}- ${req.userContext.userinfo.name}!`)
	} else {
		res.send(`Bumblebee API v${version}`)
	}
})

var sockets = []

var kernels = []

app.post('/dataset', (req, res) => {

	var socketName = req.body.username || req.body.session

	if (!socketName || !req.body.data) {
		res.send({status: 'error', message: '"session/username" and "data" fields required'})
	}
	else if (!sockets[socketName]){
		res.send({status: 'error', message: 'Socket with client not found'})
	}
	else {
		var datasetData = req.body.data.toString()
		sockets[socketName].emit('dataset',datasetData)
		res.send({message: 'Dataset sent'})
	}

})

const Server = require('socket.io')
const io = new Server(server)

const new_socket = function (socket, session) {
	sockets[session] = socket

	socket.emit('success')

	socket.on('initialize', async (payload) => {
    var user_session = payload.session

    var result

    var tries = 10

    while (tries--) {
      result = await createKernel(user_session)
      if (result.status=='error') {
        console.log(' Kernel error, retrying')
        await deleteKernel(user_session)
      }
      else {
        console.log(result)
        break
      }
    }

		socket.emit('reply',{...result, timestamp: payload.timestamp})
	})

	socket.on('run', async (payload) => {
		var user_session = payload.session
		var result = await run_code(`${payload.code}`,user_session)
	socket.emit('reply',{...result, timestamp: payload.timestamp})
	})

	socket.on('cells', async (payload) => {
		var user_session = payload.session
		var result = await run_code(`${payload.code}
df.send(output="json", infer=False, advanced_stats=False${ payload.name ? (', name="'+payload.name+'"') : '' })`,
	user_session)
	socket.emit('reply',{...result, timestamp: payload.timestamp})
	})

	return socket
}

io.on('connection', async (socket) => {

	const session = socket.handshake.query.session

	if (!session) {
		socket.disconnect()
		return
	}


	if (sockets[session] == undefined || !sockets[session].connected || sockets[session].disconnected) {
		socket = new_socket(socket,session)
		return
	}

	setTimeout(() => {
		if (sockets[session] == undefined || !sockets[session].connected || sockets[session].disconnected) {
			new_socket(socket,session)
			return
		}
		socket.emit('new-error','Session already exists. Change your session name.')
		socket.disconnect()
	}, 2000);

})

const request = require('request-promise')

const uuidv1 = require('uuid/v1');

const run_code = async function(code = '', user_session = '') {

	return new Promise( async function(resolve,reject) {

		if (!user_session)
			resolve({error: 'user_session is empty'})

		try {
			const version_response = await request({
				uri: `${base}/api`,
				method: 'GET',
				headers: {},
			})

			const version = JSON.parse(version_response).version

			if (kernels[user_session]==undefined) {

				console.log('Jupyter Kernel Gateway Version',version)

				let uuid = Buffer.from( uuidv1(), 'utf8' ).toString('hex')

				const response = await request({
					uri: `${base}/api/kernels`,
					method: 'POST',
					headers: {},
				})

				kernels[user_session] = { kernel: JSON.parse(response), uuid }

				console.log('Kernel ID for',user_session,'is',kernels[user_session].kernel['id'])
			}

			var content = { code: code+'\n', silent: false }

			var hdr = {
				'msg_id' : kernels[user_session].uuid,
				'session': kernels[user_session].uuid,
				'date': new Date().toISOString(),
				'msg_type': 'execute_request',
				'version' : version_response.version
			}

			var codeMsg = {
				'header': hdr,
				'parent_header': hdr,
				'metadata': {},
				'content': content
			}

			const WebSocketClient = require('websocket').client

			var client = new WebSocketClient({closeTimeout: 20 * 60 * 1000})

			client.on('connectFailed', async function(error) {
				console.warn('Connection to Jupyter Kernel Gateway failed')
				resolve({status: 'error', content: error, error: 'Connection to Jupyter Kernel Gateway failed'})
			});

			client.on('connect',function(connection){

				connection.on('message', async function(message) {

					var response = JSON.parse(message.utf8Data)

					if (message.type === 'utf8'){
						if (response.msg_type === 'execute_result') {
							connection.close()
							resolve({status: 'ok', content: response.content.data['text/plain']})
						}
						else if (response.msg_type === 'error') {
							connection.close()
							// console.error("Error", response.content);
							resolve({status: 'error', content: response.content, error: 'Error'})
						}
					}
					else {
						connection.close()
						// console.error("Message type error", response.content);
						resolve({status: 'error', content: 'Response from gateway is not utf8 type', error: 'Message type error'})
					}

				});

				connection.on('error', async function(error) {
					console.error("Connection Error", error);
					connection.close()
					resolve({status: 'error', content: error, error: 'Connection error'})
				});

				connection.on('close', function(reason) {
					// console.log('Connection closed before response')
					resolve({status: 'error', retry: true, error: 'Connection to Jupyter Kernel Gateway closed before response', content: reason})
				});

				connection.sendUTF(JSON.stringify(codeMsg))

			})

			client.on('disconnect',async function(reason) {
				// console.log('Client disconnected')
				resolve({status: 'disconnected', retry: true, error: 'Client disconnected', content: reason})
			})

			console.log('Connecting client')
			client.connect(`${ws_kernel_base}/api/kernels/${kernels[user_session].kernel['id']}/channels`)


		} catch (error) {
      if (error.error)
        resolve({status: 'error',...error, content: error.message})
      else
			  resolve({status: 'error', error: 'Internal error', content: error})
		}
	})
}

const deleteKernel = async function(session) {
	try {
		if (kernels[session] != undefined) {
      var _id = kernels[session].kernel['id']
			kernels[session] = undefined
      await request({
        uri: `${base}/api/kernels/${_id}`,
        method: 'DELETE',
        headers: {},
      })
      console.log('Deleting Jupyter Kernel Gateway session for',session,_id)
		}
	} catch (err) {}
}

const createKernel = async function (user_session) {

	if (kernels[user_session]==undefined){
		return await run_code(`
from optimus import Optimus
from optimus.bumblebee import Comm
op = Optimus(master="local[*]", app_name="optimus", comm=True)
'kernel init optimus init'`,user_session)
	}
	else {
		return await run_code(`
_status = 'kernel ok '

try:
	op
	_status += 'optimus ok '
	try:
		df
		_status += 'dataframe ok '
	except NameError:
		_status += ''
except NameError:
	from optimus import Optimus
	from optimus.bumblebee import Comm
	op = Optimus(master="local[*]", app_name="optimus", comm=True)
	_status = 'optimus init '

_status`,user_session)
	}
}

const startServer = async () => {
	const port = process.env.PORT || 5000
	const host = process.env.HOST || '0.0.0.0'
	var _server = server.listen(port, host, () => {
		console.log(`Bumblebee-api v${version} listening on ${host}:${port}`)
	})
	_server.timeout = 10 * 60 * 1000;
}

startServer()
