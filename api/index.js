require('dotenv/config')
const express = require('express')
const bodyParser = require('body-parser')
let mongoose = require('mongoose')
const session = require('express-session')
const jwt = require('jsonwebtoken')
const { version } = require('./package.json')
const Server = require('socket.io')
const request = require('request-promise')

const app = express()
var server = require('http').createServer(app)
const io = new Server(server)

const uuidv1 = require('uuid/v1');

import { trimCharacters } from './utils/functions.js'

const app_secret = process.env.APP_SECRET || '6um61e6ee'
var app_url
var app_host
var api_url
var base
var ws_kernel_base
var whitelist = []
var sockets = []
var kernels = []

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

  whitelist = [ 'http://'+app_url, 'https://'+app_url, 'http://'+app_host, 'https://'+app_host ]

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

  app.use(cors(corsOptions))

}

app.use(bodyParser.urlencoded({
  extended: true
}))

app.use(bodyParser.json({
  limit: '100mb',
}))

mongoose.connect('mongodb://localhost/bumblebee', { useNewUrlParser: true, useUnifiedTopology: true })

app.use(session({
  secret: app_secret,
  resave: true,
  saveUninitialized: false
}))

app.use(express.static('public'));

let apiRoutes = require("./api-routes")
app.use('/api', apiRoutes)

let authRoutes = require("./auth-routes")
app.use('/auth', authRoutes)

let uploadRoutes = require("./upload-routes")
app.use('/upload', uploadRoutes)

app.get('/', (req, res) => {
  if (req.userContext && req.userContext.userinfo) {
    res.send(`Bumblebee API v${version} - ${req.userContext.userinfo.name}!`)
  } else {
    res.send(`Bumblebee API v${version}`)
  }
})

app.post('/dataset', (req, res) => {

  var socketName = req.body.queue_name || req.body.session

  if (!socketName || !req.body.data) {
    res.send({status: 'error', message: '"session/username" and "data" fields required'})
  }
  else if (!sockets[socketName]) {
    res.send({status: 'error', message: 'Socket with client not found'})
  }
  else {
    var datasetData = req.body.data.toString()
    sockets[socketName].emit('dataset',datasetData)
    res.send({message: 'Dataset sent'})
  }

})

const newSocket = function (socket, session) {
  sockets[session] = socket

  socket.emit('success')

  if (!socket.unsecure) {

    socket.on('datasets', async (payload) => {
      var sessionId = payload.session
      var result = {}
      try {
        result = await requestToKernel('datasets',sessionId)
      } catch (err) {
        result = err
      }
      socket.emit('reply',{data: result, timestamp: payload.timestamp})
    })

    socket.on('initialize', async (payload) => {
      var sessionId = payload.session
      var result = {}
      try {
        result = await initializeSession(sessionId, payload)
      } catch (err) {
        result = err
        result.status = 'error'
      }
      socket.emit('reply',{data: result, timestamp: payload.timestamp})
    })

    socket.on('run', async (payload) => {
      var sessionId = payload.session
      var result = await runCode(`${payload.code}`,sessionId)
      socket.emit('reply',{data: result, code: payload.code, timestamp: payload.timestamp})
    })

    socket.on('cells', async (payload) => {
      var sessionId = payload.session
      var varname = payload.varname || 'df'
      var result = await runCode(payload.code + '\n'
        + `${varname} = ${varname}.ext.optimize()\n`
        + `_output = ${varname}.ext.profile(columns="*", infer=True, output="json")`,
        sessionId
      )
      socket.emit('reply',{data: result, code: payload.code, timestamp: payload.timestamp})
    })
  }
  else {
    console.log('"""Unsecure socket connection for', session,'"""')
  }

  return socket
}

io.use(function (socket, next) {
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(socket.handshake.query.token, process.env.TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return next(new Error('Authentication error'))
      }
      socket.decoded = decoded
      next()
    })
  } else {
    socket.unsecure = true
    next()
  }
})

io.on('connection', async (socket) => {

  const { session } = socket.handshake.query

  if (!session) {
    socket.disconnect()
    return
  }

  if (sockets[session] == undefined || !sockets[session].connected || sockets[session].disconnected ) {
    socket = newSocket(socket,session)
    return
  }

  setTimeout(() => {
    if (sockets[session] == undefined || !sockets[session].connected || sockets[session].disconnected ) {
      newSocket(socket,session)
      return
    }
    socket.emit('new-error','Session already exists. Change your session name.')
    socket.disconnect()
  }, 2000)

})



const runCode = async function(code = '', sessionId = '') {

  if (!sessionId) {
    return {
      error: {
        message: 'sessionId is empty',
        code: "400"
      },
      status: "error",
      code: "400"
    }
  }

  try {
    if (kernels[sessionId]==undefined) {
      await createKernel(sessionId)
    }

    var response = await requestToKernel('code',sessionId,code)

    if (response.status==='error') {
      throw response
    }
    return response

  } catch (err) {
    // console.error(err)
    if (err.ename || err.traceback) {
      var traceback = err.traceback.map(l=>
        l.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
      )
      return { status: 'error', errorName: err.ename, error: err.evalue, traceback }
    } else {
      return { status: 'error', error: 'Internal error', content: err }
    }
  }
}

const deleteKernel = async function(sessionId) {
  try {
    if (kernels[sessionId] != undefined) {
      var _id = kernels[sessionId].id
      kernels[sessionId] = undefined
      const kernelResponse = await request({
        uri: `${base}/api/kernels/${_id}`,
        method: 'DELETE',
        headers: {}
      })
      console.log('Deleting Session',sessionId,_id)
    }
  } catch (err) {}
}

const deleteEveryKernel = async function () {
  try {

    const response = await request({
      uri: `${base}/api/kernels`,
      method: 'GET',
      headers: {},
    })

    const kernels = JSON.parse(response)

    kernels.forEach(async kernel => {
      console.log(`Deleting kernel ${kernel.id}`)
      await request({
        uri: `${base}/api/kernels/${kernel.id}`,
        method: 'DELETE',
        headers: {},
      })
    });

  } catch (err) {
    console.error('Error on Kernels deleting')
  }
}

const initializeSession = async function (sessionId, payload = false) {
  var result = false

  if (!payload && kernels[sessionId] && kernels[sessionId].initializationPayload) {
    payload = kernels[sessionId].initializationPayload
  } else if (!payload) {
    payload = {}
  }

  var tries = 10
  while (tries-->0) {
    try {
      result = await requestToKernel('init', sessionId, payload)
    } catch (err) {
      console.error(err)
      break;
      result = false
    }
    if (!result) {
      console.log('Kernel error, retrying')
      await deleteKernel(sessionId)
    }
    else {
      break
    }
  }

  if (!kernels[sessionId] || !kernels[sessionId].connection) {
    return {}
  }

  kernels[sessionId].initialized = result
  kernels[sessionId].initializationPayload = payload
  return result
}

const createKernel = async function (sessionId) {
  try {
    var tries = 10
    while (tries-->0) {
      try {
        const kernelResponse = await request({
          uri: `${base}/api/kernels`,
          method: 'POST',
          headers: {},
          json: true,
          body: {}
        })
        const uuid = Buffer.from( uuidv1(), 'utf8' ).toString('hex')
        kernels[sessionId] = { id: kernelResponse.id, uuid }
        break
      } catch (err) {
        console.error('Kernel creating error, retrying', tries-10)
        continue
      }
    }
    console.log('Kernel created', sessionId)
    return sessionId
  } catch (err) {
    // console.error(err)
    return undefined
  }
}

const handleResponse = function (response) {
  try {

    if (typeof response === 'object' && !response['text/plain'] && response['status']) {
      return response
    } else if (typeof response === 'object' && response['text/plain']) {
      response = response['text/plain']
    }

    if (typeof response !== 'string') {
      throw response
    }

    var bracketIndex = response.indexOf('{')

    if (bracketIndex<0) {
      throw {message: 'Invalid response format', response}
    }

    response = response.substr(bracketIndex)
    response = trimCharacters(response,"'")
    response = response.replace(/\bNaN\b/g,null)
    response = response.replace(/\b\\'\b/g,"'")
    response = response.replace(/\\\\"/g,'\\"')
    return JSON.parse( response )

  } catch (error) {
    console.error(error)
    return JSON.parse( {response} )
  }
}

const WebSocketClient = require('websocket').client

const createConnection = async function (sessionId) {
  return new Promise((resolve, reject)=>{
    kernels[sessionId] = kernels[sessionId] || {}
    if (!kernels[sessionId].client) {
      kernels[sessionId].client = new WebSocketClient({closeTimeout: 20 * 60 * 1000})
    }
    kernels[sessionId].client.connect(`${ws_kernel_base}/api/kernels/${kernels[sessionId].id}/channels`)
    kernels[sessionId].client.on('connect',function (connection){
      kernels[sessionId] = kernels[sessionId] || {}
      kernels[sessionId].connection = connection
      kernels[sessionId].connection.on('message', function (message) {

        if (message.type === 'utf8'){
          var response = JSON.parse(message.utf8Data)
          var msg_id = response.parent_header.msg_id
          if (response.msg_type === 'execute_result') {
            kernels[sessionId].promises[msg_id].resolve(response.content.data['text/plain'])
          }
          else if (response.msg_type === 'error') {
            console.error(response.content)
            kernels[sessionId].promises[msg_id].reject(response.content)
          }
        }
        else {
          console.warn({status: 'error', content: 'Response from gateway is not utf8 type', error: 'Message type error', message: message}) // TODO: Resolve
        }
      })
      console.log('Connection created', sessionId)
      resolve(kernels[sessionId].connection)
    })
    kernels[sessionId].client.on('connectFailed', function (error) {
      kernels[sessionId].connection = false
      console.warn('Connection to Jupyter Kernel Gateway failed')
      reject(error)
    });


  })
}

const assertSession = async function (sessionId, isInit = false) {
  try {

    if (!kernels[sessionId]) {
      await createKernel(sessionId)
    }

    if (!kernels[sessionId]) {
      throw 'Error on createKernel'
    }

    if (!kernels[sessionId].client || !kernels[sessionId].connection) {
      await createConnection(sessionId)
    }

    if (!isInit && !kernels[sessionId].initialized) {
      await initializeSession(sessionId)
    }

    return kernels[sessionId].connection
  } catch (err) {
    console.error('WebSocket Error')
    return undefined
  }
}

import kernelRoutines from './kernel-routines.js'

const requestToKernel = async function (type, sessionId, payload) {

  var connection = await assertSession(sessionId, type=='init')

  if (!connection) {
    throw 'Socket error'
  }

  var startTime = new Date().getTime()

  var code = payload

  switch (type) {
    case 'code':
      code = kernelRoutines.code(payload)
      break;
    case 'session':
      code = kernelRoutines.init(payload)
      break;
    case 'datasets':
      code = kernelRoutines.datasets(payload)
      break;
    case 'init':
      code = kernelRoutines.init(payload)
    break;
  }

  var msg_id = kernels[sessionId].uuid + Math.random()

  var hdr = {
    'msg_id' : msg_id,
    'session': kernels[sessionId].uuid,
    'date': new Date().toISOString(),
    'msg_type': 'execute_request',
    'version' : '5.3' // TODO: check
  }

  var codeMsg = {
    'header': hdr,
    'parent_header': hdr,
    'metadata': {},
    'content': { code: code+'\n', silent: false }
  }

  if (!kernels[sessionId].promises) {
    kernels[sessionId].promises = {}
  }

  var response = await new Promise((resolve, reject)=>{
    kernels[sessionId].promises[msg_id] = {resolve, reject}
    kernels[sessionId].connection.sendUTF(JSON.stringify(codeMsg))
  })

  response = handleResponse(response)

  var endTime = new Date().getTime()

  response._serverTime = {
    start: startTime/1000,
    end: endTime/1000,
    duration: (endTime - startTime)/1000
  }

  return response
}

const startServer = async () => {
  const port = process.env.PORT || 5000
  const host = process.env.HOST || '0.0.0.0'
  var _server = server.listen(port, host, async () => {

    if (process.env.NODE_ENV === 'production') {
      await deleteEveryKernel()
    }
    console.log(`# Bumblebee-api v${version} listening on ${host}:${port}`)


  })
  _server.timeout = 10 * 60 * 1000
}

startServer()
