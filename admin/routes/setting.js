var express = require(__node_modules + 'express')
var router = express.Router()
var admin = require('../app')
var path = require('path')
var fs = require('fs')

var multer = require(__node_modules + 'multer')
var tempPath = path.join(__root_path, '/public/images')

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempPath)
    },
    filename: function (req, file, cb) {
        var filename = req.originalUrl
        var index = filename.indexOf('=')
        filename = filename.substr(index + 1)
        cb(null, filename)
    }
})
var upload = multer({ storage: storage })

router.get('/index', admin.isAuthenticated, function (req, res) {
    res.render('../admin/views/system/setting')
})

router.get('/img', admin.isAuthenticated, function (req, res) {
    fs.readdir(path.join(__root_path, 'public/images'), function (err, files) {
        if (err) throw err
        res.send(files)
    })
})

router.post('/img', admin.isAuthenticated, upload.single('file_img'), function (req, res, next) {
    res.send({
        "msg": 'success'
    })
})


module.exports = router
