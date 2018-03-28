var express = require(__node_modules + 'express')
var router = express.Router()
var express = require('express')
var fs = require('fs')
var path = require('path')
var logger = require('common').Logger.instance().getLogger()
var admin = require('../app')

var router = express.Router()

var productInfoCsvData
var dailyBondListCsvData

router.get('/fund', admin.isAuthenticated, function (req, res) {
    res.render('../admin/views/product/fund', {})
})

router.get('/fund/data', admin.isAuthenticated, function (req, res) {
    getProductInfoCsvData(function (data) {
        productInfoCsvData = data || {}
        res.send(productInfoCsvData)
    })
})

router.post('/fund/data', function (req, res) {
    var filepath = path.join(process.cwd(), '/config/product-info.csv')
    var content = req.body.content || ''
    fs.writeFile(filepath, content, (err) => {
        if (err) throw err
        res.send('success')
        getProductInfoCsvData(function (data) {
            productInfoCsvData = data || {}
        }, true)
    })
})

router.get('/bond', admin.isAuthenticated, function (req, res) {
    res.render('../admin/views/product/bond', {})
})

router.get('/bond/data', admin.isAuthenticated, function (req, res) {
    getDailyBondListCsvData(function (data) {
        dailyBondListCsvData = data || {}
        res.send(dailyBondListCsvData)
    })
})

router.post('/bond/data', function (req, res) {
    var filepath = path.join(process.cwd(), '/config/daily-bond-list.csv')
    var content = req.body.content || ''
    fs.writeFile(filepath, content, (err) => {
        if (err) throw err
        res.send('success')
        getDailyBondListCsvData(function (data) {
            dailyBondListCsvData = data || {}
        }, true)
    })
})

function getProductInfoCsvData(callback, reload) {
    var objCsvData = {}
    var objfundData = []
    if (typeof callback === 'function') {
        if (productInfoCsvData && !reload) return callback(productInfoCsvData)
        try {
            var filepath = path.join(process.cwd(), '/config/product-info.csv')
            if (fs.existsSync(filepath)) {
                var obj = {}
                var data = fs.readFileSync(filepath, { encoding: 'utf8' })
                if (data) {
                    var lines = data.split('\r\n')
                    for (var line of lines) {
                        var fields = line.split(',')
                        var fieldsList = []
                        var fund_list = []
                        if (fields.length > 1) {
                            for (var p in fields) {
                                fund_list.push(fields[p])
                                if (p == 0) continue
                                fieldsList.push(fields[p])
                            }
                            obj[fields[0]] = { offeringDocLink: fieldsList }
                            objfundData.push(obj)
                        }
                    }
                }
                objCsvData = obj
            }
        } catch (error) {
            logger.error('process product-info.csv files failed. error: ' + error)
        }
        callback(objCsvData)
    }
}


function getDailyBondListCsvData(callback, reload) {
    var objCsvData = {}
    if (typeof callback === 'function') {
        if (dailyBondListCsvData && !reload) return callback(dailyBondListCsvData)
        try {
            var filepath = path.join(process.cwd(), '/config/daily-bond-list.csv')
            if (fs.existsSync(filepath)) {
                var data = fs.readFileSync(filepath, { encoding: 'utf8' })
                if (data) {
                    objCsvData = data
                }
            }
        } catch (error) {
            logger.error('process daily-bond-list.csv files failed. error: ' + error)
        }
        callback(objCsvData)
    }
}

module.exports = router
