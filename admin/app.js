var fs = require('fs')
var path = require('path')
var cookie = require(__node_modules + 'cookie-signature')
var uuid = require(__node_modules + 'node-uuid')
var COOKIESECRET = configuration.global.session.secret || '369-*/789a'
var adminList = {}
var adminConfigJson = {}

fs.readFile(path.join(__root_path, '/admin/config/admin.config.json'), { encoding: 'utf8' }, function (err, data) {
    try {
        adminConfigJson = JSON.parse(data)
    } catch (error) {
        __logger.error('parser admin.config.json failed.')
    }
})

exports.isAuthenticated = function (req, res, next) {
    var cookies = {}
    req.headers.cookie && req.headers.cookie.split(';').forEach(function (Cookie) {
        var parts = Cookie.split('=')
        cookies[parts[0].trim()] = (parts[1] || '').trim()
    })
    var sid = cookie.unsign(decodeURIComponent(cookies['sid-admin']), COOKIESECRET)
    if (adminList[sid]) {
        req.admin = adminList[sid]
        next()
    } else {
        res.redirect('/admin/user/login')
    }
}

exports.adminLogin = function (req, res, next) {
    for (var item of adminConfigJson.admin) {
        if (req.body.username === item.username && req.body.password === item.password) {
            req.admin = {
                sid: uuid.v1(),
                username: req.body.username,
                password: req.body.password
            }
            adminList[req.admin.sid] = req.admin
            var signedSid = cookie.sign(req.admin.sid, COOKIESECRET)
            res.cookie('sid-admin', signedSid, { path: '/', httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 4 })
            break
        }
    }
    next()
}

exports.adminLogout = function (req, res, next) {
    if (req.admin) {
        delete adminList[req.admin.sid]
        delete req.admin
    }
    next()
}