
const Row = require('../models/row')

const Dataset = require('../models/dataset')

const PAGE_SIZE = 100

import { findById } from '../utils/controllers'

exports.get = async function (req, res) {

  var last_id = req.body.last_id ? req.body.last_id : undefined
  var page = req.body.page ? req.body.page : undefined
  var page_size = req.body.page_size ? req.body.page_size : PAGE_SIZE

  if (last_id===undefined && page===undefined) {
    page = 0
  }

  var results

  if (page!==undefined) {
    results = await Row.find({ dataset: req.body.dataset }).skip(page_size*page).limit(page_size)
  }
  else {
    results = await Row.find({_id: {$gt: last_id}, dataset: req.body.dataset}).limit(page_size)
  }

  res.json({
    status: "success",
    message: "Rows retrieved successfully",
    data: results
  })
}

exports.new = async function (req, res) { // this is not neccessary
  var row = new Row()

  row.value = req.body.value ? req.body.value : row.value

  const dataset = await findById( req.body.dataset )
  row.dataset = dataset || row.dataset

  row.save(function (err) {
    if (err) {
      res.json(err)
    }
    res.json({
      message: 'New row created!',
      data: row
    })
  })
}

exports.view = function (req, res) {
  Row.findById(req.params.row_id, function (err, row) {
    if (err) {
      res.send(err)
    }
    else {
      res.json({
        message: 'Row details loading..',
        data: row
      })
    }
  })
}

exports.update = function (req, res) {
  Row.findById(req.params.row_id, function (err, row) {
    if (err) {
      res.send(err)
    }
    row.name = req.body.name ? req.body.name : row.name

    row.save(function (err) {
      if (err) {
        res.json(err)
      }
      res.json({
        message: 'Row Info updated',
        data: row
      })
    })
  })
}

exports.delete = async function (req, res) {
  const payload = await Row.remove({
    _id: req.params.row_id
  })
  if (payload.err) {
    res.send(payload.err)
  }
  else {
    res.json({
      status: "success",
      message: 'Row deleted'
    })
  }
}
