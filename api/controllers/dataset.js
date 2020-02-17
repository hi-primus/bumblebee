
const Session = require('../models/session')

const Dataset = require('../models/dataset')
const Row = require('../models/row')

exports.index = function (req, res) {
  Session.get(function (err, sessions) {
    if (err) {
      res.json({
        status: "error",
        message: err,
      })
    }
    res.json({
      status: "success",
      message: "Sessions retrieved successfully",
      data: sessions
    })
  })
}

exports.new = function (req, res) {
  var session = new Session()

  session.name = req.body.name ? req.body.name : session.name
  session.datasets = []

  session.save(function (err) {
    // if (err)
    //     res.json(err)
    res.json({
      message: 'New session created!',
      data: session
    })
  })
}

exports.view = function (req, res) {
  Session.findById(req.params.session_id, function (err, session) {
    if (err) {
      res.send(err)
    }
    else {
      res.json({
        message: 'Session details loading..',
        data: session
      })
    }
  })
}

exports.update = function (req, res) {
  Session.findById(req.params.session_id, function (err, session) {
    if (err)
      res.send(err)
    session.name = req.body.name ? req.body.name : session.name

    session.save(function (err) {
      if (err)
        res.json(err)
      res.json({
        message: 'Session Info updated',
        data: session
      })
    })
  })
}

exports.delete = async function (req, res) {
  const payload = await Session.remove({
    _id: req.params.session_id
  })
  if (payload.err) {
    res.send(payload.err)
  }
  else {
    res.json({
      status: "success",
      message: 'Session deleted'
    })
  }
}
