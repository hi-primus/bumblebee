const WebSocketClient = require('websocket').client;
import { trimCharacters } from 'bumblebee-utils';
const request = require('request-promise');
const uuidv1 = require('uuid/v1');

import kernelRoutines from './kernel-routines.js'

var kernels = []

var kernel_addresses
var kernel_bases
var ws_kernel_bases

const updateKernelBases = function () {
  if (!kernel_addresses) {
    kernel_addresses = (process.env.KERNEL_ADDRESS || `localhost:8888`).split(',')
    kernel_bases  = kernel_addresses.map(e=>'http://'+e)
    ws_kernel_bases  = kernel_addresses.map(e=>'ws://'+e)
  }
}

const kernelBase = function (id) {
  updateKernelBases()
  return kernel_bases[id]
}

const wsKernelBase = function (id) {
  updateKernelBases()
  return ws_kernel_bases[id]
}

export const initializeKernel = async function (sessionId, payload = false) {

  var result = false

  if (+payload.reset) {
    console.log('[INITIALIZATION] Reinitializing')
    kernels[sessionId] = await clearKernel(sessionId)
  } else {
    kernels[sessionId] = kernels[sessionId] || {}
  }
  if (!kernels[sessionId].initialization) {
    kernels[sessionId].initialization = initializeKernelSession(sessionId, payload)
    result = await kernels[sessionId].initialization
  }
  kernels[sessionId].initialization = false
  return { kernel: kernels[sessionId], result }
}

export const initializeKernelSession = async function (sessionId, payload = false) {

  // console.log('initializeKernelSession')

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
    return false
  }

  kernels[sessionId].initialized = result
  kernels[sessionId].initializationPayload = payload

  return result
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
        kernels[sessionId].initialization = initializeKernelSession(sessionId)
      }
      await kernels[sessionId].initialization
      kernels[sessionId].initialization = false
    }

    return kernels[sessionId].connection
  } catch (err) {
    console.error('WebSocket Error')
    console.error(err)
    return undefined
  }
}

export const requestToKernel = async function (type, sessionId, payload) {

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

export const runCode = async function(code = '', sessionId = '') {

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

    var response = await requestToKernel('code', sessionId, code)

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



const createConnection = async function (sessionId) {

  var ka = kernels[sessionId].kernel_address || 0

  if (!kernels[sessionId].connecting) {
    kernels[sessionId].connecting = new Promise((resolve, reject)=>{

      console.log(`Creating connection for ${sessionId} on ${wsKernelBase(ka)}`)

      kernels[sessionId] = kernels[sessionId] || {};

      if (!kernels[sessionId].client) {
        kernels[sessionId].client = new WebSocketClient({closeTimeout: 20 * 60 * 1000})
      }

      kernels[sessionId].client.connect(`${wsKernelBase(ka)}/api/kernels/${kernels[sessionId].id}/channels`)
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
        console.error('Connection to Jupyter Kernel Gateway failed', wsKernelBase(ka), kernels[sessionId].id)
        reject(error)
      });


    })
  }

  return kernels[sessionId].connecting
}

const createKernel = async function (sessionId, ka = 0) {
  try {
    var tries = 10
    while (tries>0) {
      try {
        const kernelResponse = await request({
          uri: `${kernelBase(ka)}/api/kernels`,
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


const checkKernel = function (sessionId) {
  return kernels[sessionId] && kernels[sessionId].id
}

const clearKernel = async function (sessionId) {
  await deleteKernel(sessionId)
  kernels[sessionId] = {}
  return kernels[sessionId]
}

export const getKernel = function (sessionId) {
  return kernels[sessionId]
}

export const setKernel = function (sessionId, kernelObject) {
  kernels[sessionId] = kernelObject || {}
  return kernels[sessionId] || {}
}

const deleteKernel = async function (sessionId) {
  try {
    console.log('deleting kernel', sessionId)
    if (checkKernel(sessionId)) {
      var _id = kernels[sessionId].id
      var ka = kernels[sessionId].kernel_address || 0
      console.log('Deleting Session',sessionId,_id,'on',ka)
      const kernelResponse = await request({
        uri: `${kernelBase(ka)}/api/kernels/${_id}`,
        method: 'DELETE',
        headers: {}
      })
      kernels[sessionId].id = false
      console.log('Session deleted')
    } else {
      console.log('Deleting Session',sessionId,'not found')
    }
  } catch (err) {
    console.error(err)
  }
  return kernels[sessionId]
}

export const deleteEveryKernel = async function () {
  try {

    for (let i = 0; i < kernel_bases.length; i++) {
      try {

        const response = await request({
          uri: `${kernelBase(i)}/api/kernels`,
          method: 'GET',
          headers: {},
        })

        const kernels = JSON.parse(response)

        kernels.forEach(async kernel => {
          console.log(`Deleting kernel ${kernel.id}`)
          await request({
            uri: `${kernelBase(i)}/api/kernels/${kernel.id}`,
            method: 'DELETE',
            headers: {},
          })
        });
      } catch (err) {
        console.error('Error deleting kernels on', kernelBase(i))
      }
    }

  } catch (err) {
    console.error('Error on Kernels deleting')
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

export default { getKernel, setKernel, runCode, initializeKernel, deleteEveryKernel, requestToKernel }
