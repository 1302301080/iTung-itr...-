var express = require(__node_modules + 'express')
var router = express.Router()
var admin = require('../app')
var path = require('path')
var fs = require('fs')

router.get('/', admin.isAuthenticated, function (req, res) {
    res.render('../admin/views/system/htmlFile')
})

router.get('/edit', admin.isAuthenticated, function (req, res) {
    var filename = req.query.filename
    res.render('../admin/views/system/htmlEditor', { url: filename })
})

router.get('/data', function (req, res) {
    fs.readdir(path.join(__root_path, 'public/html'), function (err, files) {
        if (err) throw err
        console.log('It\'s saved!')
        res.send(files)
    })
})

router.post('/edit', function (req, res) {
    var file = req.body
    if (file.filename) {
        var filepath = path.join(__root_path, 'public/html/' + file.filename)
        var content = file.content || ''
        fs.writeFile(filepath, content, (err) => {
            if (err) throw err
            res.send('success')
            console.log('It\'s saved!')
        })
    }
})


module.exports = router
