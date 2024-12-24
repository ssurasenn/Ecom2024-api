// import ...
const express = require('express')
const router = express.Router()
// import controller
const { register, login, currentUser } = require('../controller/auth')
const { authCheck, adminCheck } = require('../middlewares/authcheck')

router.post('/register', register)
router.post('/login', login)
router.post('/current-user', authCheck, currentUser)
router.post('/current-admin', authCheck, adminCheck, currentUser)

module.exports = router;