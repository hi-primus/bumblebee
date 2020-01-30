var mongoose = require('mongoose')

var rowSchema = mongoose.Schema({
  value: {
    type: Map,
    required: true
  },
  dataset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'dataset',
    required: true
  }
})

var Row = module.exports = mongoose.model('row', rowSchema)
module.exports.get = function (callback, limit) {
  Row.find(callback).limit(limit)
}
