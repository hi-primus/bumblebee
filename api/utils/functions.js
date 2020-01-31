const fernet = require('fernet')
const pako = require('pako')

export const trimCharacters = (s, c) => {
  if (c === "]") c = "\\]";
  if (c === "\\") c = "\\\\";
  return s.replace(new RegExp(
    "^[" + c + "]+|[" + c + "]+$", "g"
  ), "");
}

export const pakoFernet = (secret, content) => {
  let token = new fernet.Token({
    secret: new fernet.Secret(secret),
    token: content,
    ttl: 0
  })

  let data = pako.inflate(
    Buffer.from(token.decode(),'base64').toString('binary'),
    { to: 'string' }
  )

  return JSON.parse(data)
}
