require('dotenv/config')
const express = require('express')
const bodyParser = require('body-parser')
let mongoose = require('mongoose')
const session = require('express-session')
const jwt = require('jsonwebtoken')
const { version } = require('./package.json')
const Server = require('socket.io')

const app = express()
var server = require('http').createServer(app)
const io = new Server(server)

const app_secret = (process.env.APP_SECRET || '6um61e6ee')

var sockets = []

import { runCode, initializeKernel, deleteEveryKernel } from './kernel.js'
import kernelRoutines from './kernel-routines.js'

var app_host = (process.env.APP_HOST || 'localhost')
var app_port = (process.env.APP_PORT || 3000)
var app_url = `${app_host}:${app_port}`
var api_host = (process.env.HOST || 'localhost')
var api_port = (process.env.PORT || 5000)
var api_url = `${api_host}:${api_port}`

var whitelist = []

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

  var socket = getSocket(socketName)

  if (!socketName || !req.body.data) {
    res.send({status: 'error', message: '"session/username" and "data" fields required'})
  }
  else if (!socket) {
    res.send({status: 'error', message: 'Socket with client not found'})
  }
  else {
    var datasetData = req.body.data.toString()
    socket.emit('dataset',datasetData)
    res.send({message: 'Dataset sent'})
  }

})

const getSocket = function (session) {
  return sockets[session]
}

const setSocket = function (session, socket) {
  sockets[session] = socket || {}
  return sockets[session] || {}
}


const newSocket = function (socket, session) {

  setSocket(socket)

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
          var initPayload = await initializeKernel(sessionId, payload);
          // var kernel = payload.kernel;
          result = initPayload.result;
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

  var foundSocket = getSocket(session)

  if (foundSocket == undefined || !foundSocket.connected || foundSocket.disconnected ) {
    socket = newSocket(socket,session)
    return
  }

  setTimeout(() => {
    if (foundSocket == undefined || !foundSocket.connected || foundSocket.disconnected ) {
      newSocket(socket,session)
      return
    }
    socket.emit('new-error','Session already exists. Change your session name.')
    socket.disconnect()
  }, 2000)

})

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
