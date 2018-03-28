var express = require(__node_modules + 'express')
var router = express.Router()
var admin = require('../app')
var fs = require('fs')
var path = require('path')

var info = getInfo()
/**
 * url: /admin/index
 */
router.get('/', admin.isAuthenticated, function (req, res) {
    res.render('../admin/views/index/index')
})

router.get('/home', admin.isAuthenticated, function (req, res) {
    res.render('../admin/views/index/home', info)
})

function getInfo() {
    var filepath = path.join(process.cwd(), 'package.json')
    if (fs.existsSync(filepath)) {
        var data = fs.readFileSync(filepath, { encoding: 'utf8' })
        if (data) {
            var obj = JSON.parse(data)
        }
    }


    return {
        name: 'iTrader ELite',
        version: obj.version,
        node_version: process.versions.node,
        portocal: configuration.global.site.protocol,
        port: configuration.global.site.port
    }
}

module.exports = router
