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

import { trimCharacters } from 'bumblebee-utils'

const app_secret = (process.env.APP_SECRET || '6um61e6ee')
var app_url
var app_host
var api_url
var kernel_bases = []
var ws_kernel_bases = []
var whitelist = []
var sockets = []
var kernels = []

function updateHost (host = 'localhost') {

  var kernel_host = (process.env.KERNEL_HOST || host)
  var kernel_port = (process.env.KERNEL_PORT || 8888)

  var kernel_addresses = (process.env.KERNEL_ADDRESS || `${host}:8888`).split(',')

  kernel_bases  = kernel_addresses.map(e=>'http://'+e)
  ws_kernel_bases  = kernel_addresses.map(e=>'ws://'+e)

  app_host = (process.env.APP_HOST || host)
  var app_port = (process.env.APP_PORT || 3000)

  app_url = `${app_host}:${app_port}`

  var api_host = (process.env.HOST || host)
  var api_port = (process.env.PORT || 5000)

  api_url = `${api_host}:${api_port}`

}

updateHost()

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

mongoose.connect('mongodb://localhost/bumblebee', { useNewUrlParser: true, useUnifiedTopology: true }).catch((err)=>{
  console.error(err)
})

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

    socket.on('message', async (payload) => {
      if (payload.message=='datasets') {

        var sessionId = payload.username + '_' + payload.workspace
        var result = {}
        try {
          result = await requestToKernel('datasets',sessionId)
        } catch (err) {
          result = { status: 'error', error: 'Datasets info error', error: err.toString() }
        }
        var code = kernelRoutines.datasetsMin(payload)
        socket.emit('reply',{data: result, code, timestamp: payload.timestamp})

      } else if (payload.message=='initialize') {

        var sessionId = payload.username + '_' + payload.workspace
        var result = {}

        try {
          if (payload.reset) {
            await deleteKernel(sessionId)
            kernels[sessionId] = {}
          } else {
            kernels[sessionId] = kernels[sessionId] || {}
          }
          if (!kernels[sessionId].initialization) {
            kernels[sessionId].initialization = initializeSession(sessionId, payload)
          }
          result = await kernels[sessionId].initialization
        } catch (err) {
          result = err
          console.error('[INITIALIZATION ERROR]',err)
          result.status = 'error'
        }
        var code = kernelRoutines.initMin(payload)
        socket.emit('reply',{data: result, code, timestamp: payload.timestamp})

      } else if (payload.message=='run') {

        var sessionId = payload.username + '_' + payload.workspace
        var result = await runCode(`${payload.code}`,sessionId)
        socket.emit('reply',{data: result, code: payload.code, timestamp: payload.timestamp})

      } else if (payload.message=='cells') {

        // console.log('socket on cells')
        var sessionId = payload.username + '_' + payload.workspace
        var code = payload.code
        code += '\n' + `_output = 'ok'`
        var result = await runCode(code, sessionId)
        socket.emit('reply',{data: result, code, timestamp: payload.timestamp})

      } else if (payload.message=='profile') {

        var sessionId = payload.username + '_' + payload.workspace
        var code = `_output = ${payload.dfName}.ext.profile(columns="*", output="json")`
        var result = await runCode(code, sessionId)
        socket.emit('reply',{data: result, code, timestamp: payload.timestamp})

      }
    })

  }
  else {
    console.log('Unsecure socket connection:', session)
  }

  return socket
}

io.use(function (socket, next) {
  if (socket.handshake.query && socket.handshake.query.authorization) {
    var token = socket.handshake.query.authorization

    /* test TO-DO: Remove */
    // console.log({query: socket.handshake.query})
    socket.decoded = { username: socket.handshake.query.session }
    next()
    return

    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
      console.log({decoded, token, secret: process.env.JWT_SECRET, err})
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

  const { username, workspace } = socket.handshake.query

  var session = username + '_' + workspace

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

    if (!checkKernel(sessionId)) {
      await createKernel(sessionId)
    }

    var response = await requestToKernel('code',sessionId,code)

    if (response.status === 'error') {
      throw response
    }
    return response

  } catch (err) {
    // console.error(err)
    if (err.ename || err.traceback) {
      return { status: 'error', errorName: err.ename, error: err.evalue, traceback: err.traceback }
    } else {
      return { status: 'error', error: 'Internal error', content: err.toString() }
    }
  }
}

const checkKernel = function (sessionId) {
  return kernels[sessionId] && kernels[sessionId].id
}

const deleteKernel = async function(sessionId) {
  try {
    if (!checkKernel(sessionId)) {
      var _id = kernels[sessionId].id
      var ka = kernels[sessionId].kernel_address || 0
      const kernelResponse = await request({
        uri: `${kernel_bases[ka]}/api/kernels/${_id}`,
        method: 'DELETE',
        headers: {}
      })
      kernels[sessionId].id = false
      console.log('Deleting Session',sessionId,_id)
    }
  } catch (err) {}
}

const deleteEveryKernel = async function () {
  try {

    for (let i = 0; i < kernel_bases.length; i++) {
      try {

        const response = await request({
          uri: `${kernel_bases[i]}/api/kernels`,
          method: 'GET',
          headers: {},
        })

        const kernels = JSON.parse(response)

        kernels.forEach(async kernel => {
          console.log(`Deleting kernel ${kernel.id}`)
          await request({
            uri: `${kernel_bases[i]}/api/kernels/${kernel.id}`,
            method: 'DELETE',
            headers: {},
          })
        });
      } catch (err) {
        console.error('Error deleting kernels on', kernel_bases[i])
      }
    }

  } catch (err) {
    console.error('Error on Kernels deleting')
  }
}

const initializeSession = async function (sessionId, payload = false) {

  // console.log('initializeSession')

  var result = false

  if (!payload && kernels[sessionId] && kernels[sessionId].initializationPayload) {
    payload = kernels[sessionId].initializationPayload
  } else if (!payload) {
    payload = {}
  }

  var tries = 10 // 10
  while (tries>0) {
    try {
      result = await requestToKernel('init', sessionId, payload)
    } catch (err) {
      tries--
      if (err.toString().includes('Error on createKernel')) {
        tries = 0
      }
      if (tries<=0) {
        console.error(err)
        return {error: 'Internal Error', content: err.toString(), status: 'error'}
      }
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

  kernels[sessionId].initialization = false
  kernels[sessionId].initialized = result
  kernels[sessionId].initializationPayload = payload
  return result
}

const createKernel = async function (sessionId, ka = 0) {
  try {
    var tries = 10
    while (tries>0) {
      try {
        const kernelResponse = await request({
          uri: `${kernel_bases[ka]}/api/kernels`,
          method: 'POST',
          headers: {},
          json: true,
          body: {
            // name: 'workspace-'+sessionId
          }
        })
        const uuid = Buffer.from( uuidv1(), 'utf8' ).toString('hex')
        if (!kernels[sessionId]) {
          kernels[sessionId] = {}
        }
        kernels[sessionId] = {
          ...kernels[sessionId],
          kernel_address: ka,
          id: kernelResponse.id,
          uuid
        }
        break
      } catch (err) {
        console.error('Kernel creating error, retrying', 10-tries)
        tries--
        if (tries>0) {
          continue
        }
        console.error(err)
        throw 'Error on createKernel'
      }
    }
    console.log('Kernel created', sessionId, ka)
    return sessionId
  } catch (err) {
    // console.error(err)
    throw 'Error on createKernel'
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
    response = response.replace(/\\+\'/g,"'")
    response = response.replace(/\\\\"/g,'\\"')
    return JSON.parse( response )

  } catch (error) {
    console.error(error.toString())
    return JSON.parse( {response} )
  }
}

const WebSocketClient = require('websocket').client

const createConnection = async function (sessionId) {

  var ka = kernels[sessionId].kernel_address || 0

  if (!kernels[sessionId].connecting) {
    kernels[sessionId].connecting = new Promise((resolve, reject)=>{

      console.log(`Creating connection for ${sessionId} on ${ws_kernel_bases[ka]}`)

      kernels[sessionId] = kernels[sessionId] || {}
      if (!kernels[sessionId].client) {
        kernels[sessionId].client = new WebSocketClient({closeTimeout: 20 * 60 * 1000})
      }

      kernels[sessionId].client.connect(`${ws_kernel_bases[ka]}/api/kernels/${kernels[sessionId].id}/channels`)
      kernels[sessionId].client.on('connect',function (connection) {

        // kernels[sessionId] = kernels[sessionId] || {}
        kernels[sessionId].connection = connection
        kernels[sessionId].connection.on('message', function (message) {

          try {
            if (!kernels[sessionId]) {
              console.error(kernels[sessionId])
              throw 'Kernel error'
            }
            if (message.type === 'utf8'){
              var response = JSON.parse(message.utf8Data)
              var msg_id = response.parent_header.msg_id
              if (response.msg_type === 'execute_result') {
                kernels[sessionId].promises[msg_id].resolve(response.content.data['text/plain'])
              }
              else if (response.msg_type === 'error') {
                console.error('msg_type error')
                kernels[sessionId].promises[msg_id].resolve({...response.content, status: 'error', _response: response})
              }
            }
            else {
              console.warn({status: 'error', content: 'Response from gateway is not utf8 type', error: 'Message type error', message: message}) // TO-DO: Resolve
            }
          } catch (err) {
            console.error(err)
          }

        })
        console.log('Connection created', sessionId)
        resolve(kernels[sessionId].connection)
      })
      kernels[sessionId].client.on('connectFailed', function (error) {
        kernels[sessionId].connection = false
        console.error('Connection to Jupyter Kernel Gateway failed', ws_kernel_bases[ka], kernels[sessionId].id)
        reject(error)
      });


    })
  }

  return kernels[sessionId].connecting
}

const assertSession = async function (sessionId, isInit = false, kernel_address = 0) {

  try {

    if (!kernels[sessionId] || !kernels[sessionId].id) {
      await createKernel(sessionId, kernel_address)
    }

    if (!kernels[sessionId] || !kernels[sessionId].id) {
      throw 'Error on createKernel'
    }

    await createConnection(sessionId)

    if (!isInit && !kernels[sessionId].initialized) {
      if (!kernels[sessionId].initialization) {
        kernels[sessionId].initialization = initializeSession(sessionId)
      }
      await kernels[sessionId].initialization
    }

    return kernels[sessionId].connection
  } catch (err) {
    console.error('WebSocket Error')
    console.error(err)
    return undefined
  }
}

import kernelRoutines from './kernel-routines.js'

const requestToKernel = async function (type, sessionId, payload) {

  var connection = await assertSession(sessionId, type=='init', payload ? payload.kernel_address : undefined)

  if (!connection) {
    throw 'Socket error'
  }

  var startTime = new Date().getTime()

  var code = payload

  switch (type) {
    case 'code':
      code = kernelRoutines.code(payload)
      break;
    case 'datasets':
      code = kernelRoutines.datasets(payload)
      break;
    case 'init':
      payload.engine = payload.engine || (process.env.ENGINE || 'dask')
      code = kernelRoutines.init(payload)
    break;
  }

  var msg_id = kernels[sessionId].uuid + Math.random()

  var hdr = {
    'msg_id' : msg_id,
    'session': kernels[sessionId].uuid,
    'date': new Date().toISOString(),
    'msg_type': 'execute_request',
    'version' : '5.3' // TO-DO: check
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

  if (response.traceback && response.traceback.map) {
    response.traceback = response.traceback.map(l=>
      l.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    )
  }

  var endTime = new Date().getTime()

  response._serverTime = {
    start: startTime/1000,
    end: endTime/1000,
    duration: (endTime - startTime)/1000
  }

  return response
}

const startServer = async () => {
  const port = (process.env.PORT || 5000)
  const host = (process.env.HOST || '0.0.0.0')
  var _server = server.listen(port, host, async () => {

    if (process.env.NODE_ENV === 'production') {
      await deleteEveryKernel()
    }
    console.log(`# Bumblebee-api v${version} listening on ${host}:${port}`)


  })
  _server.timeout = 10 * 60 * 1000
}

startServer()
