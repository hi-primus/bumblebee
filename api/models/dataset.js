var mongoose = require('mongoose')

var datasetSchema = mongoose.Schema({
  meta: {
    type: Map,
    required: true
  },
  create_date: {
    type: Date,
    default: Date.now
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'session'
  }
})

var Dataset = module.exports = mongoose.model('dataset', datasetSchema)
module.exports.get = function (callback, limit) {
  Dataset.find(callback).limit(limit)
}
