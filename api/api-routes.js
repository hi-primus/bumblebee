let router = require('express').Router()

router.get('/', function (req, res) {
    res.json({
        status: 'API Its Working',
        message: 'Welcome to RESTHub crafted with love!'
    })
})

var datasetController = require('./controllers/dataset')

router.route('/datasets')
    .get(datasetController.index)
    .post(datasetController.new)
router.route('/datasets/:dataset_id')
    .get(datasetController.view)
    .patch(datasetController.update)
    .put(datasetController.update)
    .delete(datasetController.delete)

var sessionController = require('./controllers/session')

router.route('/sessions')
    .get(sessionController.index)
    .post(sessionController.new)
router.route('/sessions/:session_id')
    .get(sessionController.view)
    .patch(sessionController.update)
    .put(sessionController.update)
    .delete(sessionController.delete)

var rowController = require('./controllers/row')

router.route('/rows')
    .post(rowController.get)

module.exports = router
