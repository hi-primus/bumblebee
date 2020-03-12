var mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const saltRounds = 10

var userSchema = mongoose.Schema({
  username: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: 'Username is required'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: 'Email address is required',
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: 'Password is required'
  },
  create_date: {
    type: Date,
    default: Date.now
  },
  currentSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'session'
  }
})

userSchema.pre('save', function (next) {
  var user = this

  if (!user.isModified('password')) {
    return next()
  }

  try {
    var hash = await bcrypt.hash(user.password, saltRounds)
    user.password = hash
    next()
  } catch (err) {
    console.error(err)
    return next(err)
  }
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

var User = module.exports = mongoose.model('user', userSchema)

module.exports.get = function (callback, limit) {
  User.find(callback).limit(limit)
}
