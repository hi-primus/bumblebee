var mongoose = require('mongoose')

var sessionSchema = mongoose.Schema({
  queue_name: {
    type: String,
    required: true
  },
  user_session: {
    type: String,
    required: true
  },
  datasets: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'dataset'
  }],
  create_date: {
    type: Date,
    default: Date.now
  }
})

var Session = module.exports = mongoose.model('session', sessionSchema)
module.exports.get = function (callback, limit) {
  Session.find(callback).limit(limit)
}
