import crypto from 'crypto'
import axios from 'axios'

export function setAuthTokenAxios (token) {
  axios.defaults.headers.common.Authorization = token
}

export function resetAuthTokenAxios () {
  delete axios.defaults.headers.common.Authorization
}

export function cryp (json) {
  const hmac = crypto.createHmac('sha256', process.env.hmCode)
  hmac.update(JSON.stringify(json))
  return hmac.digest('hex')
}
