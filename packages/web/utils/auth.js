import axios from 'axios'

export function setAuthTokenAxios (token) {
  axios.defaults.headers.common.Authorization = token
}

export function resetAuthTokenAxios () {
  delete axios.defaults.headers.common.Authorization
}
