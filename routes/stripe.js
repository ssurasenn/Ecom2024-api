// import ...
const express = require('express')
const { authCheck } = require('../middlewares/authcheck')
const router = express.Router()
// import controller
const {payment} = require('../controller/stripe')

router.post('/user/create-payment-intent', authCheck, payment)



module.exports = router;