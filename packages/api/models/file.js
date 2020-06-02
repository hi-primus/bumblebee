var mongoose = require('mongoose')

var fileSchema = mongoose.Schema({
  originalname: {
    type: String
  },
  encoding: {
    type: String
  },
  mimetype: {
    type: String
  },
  destination: {
    type: String
  },
  filename: {
    type: String,
    required: 'File must have a name'
  },
  path: {
    type: String,
    required: 'File must have a path'
  },
  size: {
    type: Number
  },
  create_date: {
    type: Date,
    default: Date.now
  },
  user: {
    //required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }
})

var File = module.exports = mongoose.model('file', fileSchema)

module.exports.get = function (callback, limit) {
  File.find(callback).limit(limit)
}
