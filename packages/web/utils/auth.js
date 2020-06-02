import crypto from 'crypto'
import axios from 'axios'

export function setAuthToken (token) {
  axios.defaults.headers.common.Authorization = token
}

export function resetAuthToken () {
  delete axios.defaults.headers.common.Authorization
}

export function cryp (json) {
  const hmac = crypto.createHmac('sha256', process.env.hmCode)
  hmac.update(JSON.stringify(json))
  return hmac.digest('hex')
}
