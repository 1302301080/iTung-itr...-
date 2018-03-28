var express = require(__node_modules + 'express')
var router = express.Router()
var admin = require('../app')

router.get('/login', function (req, res, next) {
    res.render('../admin/views/user/login')
})

router.post('/login', admin.adminLogin, function (req, res) {
    if (req.admin) {
        res.redirect('/admin/index')
    } else {
        res.render('../admin/views/user/login')
    }
})

router.get('/logout', admin.isAuthenticated, admin.adminLogout, function (req, res, next) {
    res.redirect('/admin/user/login')
})

module.exports = router
