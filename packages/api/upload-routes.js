let router = require('express').Router()

const File = require('./models/file')

const multer = require('multer');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads')
  },
  filename: function (req, file, cb) {
    var extension = file.originalname.split('.')
    extension = extension[extension.length-1]
    if (extension===file.originalname) {
      extension = ''
    } else {
      extension = `.${extension}`
    }
    cb(null, `${file.fieldname}-${Date.now()}${extension}`)
  }
})

var upload = multer({ storage: storage })

router.post('/', upload.single('datasetFile'), async (req, res, next) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
  // await File.create(file)
  res.send(file)
})

router.get('/', function (req, res) {
  res.json({
    status: 'Working',
    message: 'API'
  })
})

module.exports = router
