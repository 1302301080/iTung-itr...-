var express = require(__node_modules + 'express')
var router = express.Router()
var fundSwitchIDGenerator = require('switchID-generator')

router.get('/seq', function (req, res) {
    return res.send(String(fundSwitchIDGenerator.getSeq()))
})

module.exports = router