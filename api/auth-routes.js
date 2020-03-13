let router = require('express').Router()

router.get('/', function (req, res) {
    res.json({
        status: 'Working',
        message: 'Auth'
    })
})


router.route('/login')
  .post(function (req, res) {

    

    if (req.body.username!==undefined && req.body.password!==undefined) {
      //
      res.json({
        status: 'OK',
        message: 'Login',
        token:'bbt'
      
      })
    } 
    else{

      res.json({
        styatus: 'NOT OK',
        message: 'Login'
      
      })

    }
     
    



    



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
