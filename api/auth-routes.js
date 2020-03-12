let router = require('express').Router()

router.get('/', function (req, res) {
    res.json({
        status: 'Working',
        message: 'Auth'
    })
})


router.route('/login')
  .post(function (req, res) {
    console.log(req.body)
    res.json({
      status: 'OK',
      message: 'Login'
    })
  })

  router.route('/register')
  .post(function (req, res) {
    console.log(req.body)
    res.json({
      status: 'OK',
      message: 'Login'
    })
  })

module.exports = router
