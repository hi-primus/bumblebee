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
      } catch (error) {
        console.error(error)
        result = error
      }
      socket.emit('reply',{...result, timestamp: payload.timestamp})
    })

    socket.on('initialize', async (payload) => {
      var sessionId = payload.session

      var result = {}

      var tries = 10
      while (tries-->0) {
        result = await createKernel(sessionId, payload)
        if (!result || result.status==='error') {
          console.log('"""',result,'"""')
          console.log('# Kernel error, retrying')
          await deleteKernel(sessionId)
        }
        else {
          break
        }
      }

      socket.emit('reply',{...result, timestamp: payload.timestamp})
    })

    socket.on('run', async (payload) => {
      var sessionId = payload.session
      var result = await runCode(`${payload.code}`,sessionId)
      socket.emit('reply',{...result, code: payload.code, timestamp: payload.timestamp})
    })

    socket.on('cells', async (payload) => {
      var sessionId = payload.session
      var varname = payload.varname || 'df'
      var result = await runCode(payload.code + '\n'
        + `_output = ${varname}.ext.profile(columns="*", infer=True, output="json")`,
        sessionId
      )
      socket.emit('reply',{...result, code: payload.code, timestamp: payload.timestamp})
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
      const response = await requestToKernel('session',sessionId)
      kernels[sessionId] = sessionId
    }

    var response = await requestToKernel('code',sessionId,code)

    if (response.status==='error') {
      throw response
    }
    return response

  } catch (err) {
    console.error(err)
    if (err.error && (err.error.result || err.error.output)) {
      return { status: 'error', error: err.error.result, traceback: err.error.output }
    } else {
      return { status: 'error', error: 'Internal error', content: err }
    }
  }
}

const deleteKernel = async function(session) {
  try {
    if (kernels[session] != undefined) {
      var _id = kernels[session].kernel['id']
      kernels[session] = undefined
      console.log('# Deleting Session',session,_id)
    }
  } catch (err) {}
}

const createKernel = async function (sessionId, payload) {

  try {
    return await requestToKernel('init',sessionId, payload)
  } catch (error) {
    console.error(error)
    return error
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
  }
}

const requestToKernel = async function (type, session_id, payload) {
  var response = {}
  var startTime = new Date().getTime()

  switch (type) {
    case 'code':
      response = await request({
        uri: `${base}/bumblebee`,
        method: 'POST',
        headers: {},
        json: true,
        body: {
          code: payload,
          session_id
        }
      })
      break;
    case 'session':
      response = await request({
        uri: `${base}/bumblebee-session`,
        method: 'POST',
        headers: {},
        json: true,
        body: {
          secret: process.env.KERNEL_SECRET,
          session_id
        }
      })
      break;
    case 'datasets':
      response = await request({
        uri: `${base}/bumblebee-datasets`,
        method: 'POST',
        json: true,
        body: {
          session_id,
        }
      })
      break;
    case 'init':
      response = await request({
        uri: `${base}/bumblebee-init`,
        method: 'POST',
        json: true,
        body: {
          session_id,
          secret: process.env.KERNEL_SECRET,
          ...payload
        }
      })
  }

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
    console.log(`# Bumblebee-api v${version} listening on ${host}:${port}`)
  })
  _server.timeout = 10 * 60 * 1000
}

startServer()
