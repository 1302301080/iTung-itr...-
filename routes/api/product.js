/*!
{*******************************************************************}
{                                                                   }
{       eBroker Systems Javascript Component Library                }
{                                                                   }
{                                                                   }
{       Copyright(c) 2000-2017 eBroker Systems Ltd.                 }
{       ALL RIGHTS RESERVED                                         }
{                                                                   }
{   RESTRICTIONS                                                    }
{                                                                   }
{   THIS SOURCE CODE AND ALL RESULTING INTERMEDIATE FILES           }
{   ARE CONFIDENTIAL AND PROPRIETARY TRADE                          }
{   SECRETS OF EBROKER SYSTEMS LTD.THE REGISTERED DEVELOPER IS      }
{   LICENSED TO DISTRIBUTE THE PRODUCT AND ALL ACCOMPANYING         }
{   JAVASCRIPT FUNCTIONS AS PART OF AN EXECUTABLE PROGRAM ONLY.     }
{                                                                   }
{   THE SOURCE CODE CONTAINED WITHIN THIS FILE AND ALL RELATED      }
{   FILES OR ANY PORTION OF ITS CONTENTS SHALL AT NO TIME BE        }
{   COPIED, TRANSFERRED, SOLD, DISTRIBUTED, OR OTHERWISE MADE       }
{   AVAILABLE TO OTHER INDIVIDUALS WITHOUT EXPRESS WRITTEN CONSENT  }
{   AND PERMISSION FROM EBROKER SYSTEMS LTD.                        }
{                                                                   }
{   CONSULT THE END USER LICENSE AGREEMENT FOR INFORMATION ON       }
{   ADDITIONAL RESTRICTIONS.                                        }
{                                                                   }
{*******************************************************************}

{ $Id: product.js,v 1.3 2018/01/19 10:00:25 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

var express = require(__node_modules + 'express'),
    control = require('../../control'),
    dataEntry = require('../../data/entry'),
    Const = require('../../lib/const'),
    OmsUtility = require('../../lib/OmsUtility'),
    parse = require('../../lib/parser'),
    schema = require('common').Schema,
    router = express.Router()

var quote = require('quote-interface')

router.get('/', function (req, res, next) {
    var symbolCode = req.query.symbol
    if (!symbolCode) {
        return res.send({ error: parse.error(Const.error.parameter, null, req) })
    }
    var productObj = dataEntry.get({ name: Const.DataAction.product }, symbolCode)
    req._productObj = productObj
    if (productObj && productObj.exchange) {  // quote interface need exchange to get the symbol suffix code
        req.query.exchange = productObj.exchange
    }
    next()
}, quote.getQuote, function (req, res) {
    var cols = req.query.cols ? req.query.cols.split(',') : []

    // handle quote result from quote interface
    if (req._quoteResult) {
        if (req._quoteResult.err) {
            return res.send({ error: parse.error(Const.error.internal, null, req) })
        }
        if (req._quoteResult.data) {
            var productObj = schema.OrderSchema.makeFromObject(req._quoteResult.data)
            var megerObj = Object.assign((req._productObj || {}), productObj)
            megerObj.quoteUsage = req._quoteResult.data.quoteUsage ? Number(req._quoteResult.data.quoteUsage) : ''
            megerObj.quoteBalance = req._quoteResult.data.quoteBalance ? Number(req._quoteResult.data.quoteBalance) : ''
            var obj = getByColumns(req, megerObj, cols)
            return res.send({ data: obj })
        } else {
            return res.send({ error: parse.error(Const.error.symbolNotExist, null, req) })
        }
    }


    dataEntry.getAsny({ name: Const.DataAction.product }, req.query.symbol, { mode: 'image' }, function (err, productObj) {
        if (!err && productObj) {
            var obj = getByColumns(req, productObj, cols)
            res.send({ data: obj })
        } else {
            res.send({ error: parse.error(Const.error.symbolNotExist, null, req) })
        }
    })
})

router.get('/spread', function (req, res) {
    var spreadCode = req.query.spread
    if (!spreadCode) {
        return res.send({ error: parse.error(Const.error.parameter, null, req) })
    }
    var spreadCodeList = spreadCode.split(',')
    var subscribeList = []
    for (var s of spreadCodeList) {
        if (subscribeList.indexOf(s) < 0) {
            subscribeList.push(s)
        }
    }
    var callbackTimes = 0
    var result = []
    for (var code of subscribeList) {
        dataEntry.getAsny({ name: Const.DataAction.spread }, code, null, (err, spreadObj) => {
            callbackTimes++
            if (!err && spreadObj) {
                result.push(parse.spread(spreadObj, null, req))
            } else if (spreadObj) {
                result.push(parse.spread({ symbol: spreadObj.symbol }, null, req))
            }
            if (callbackTimes === subscribeList.length) {
                callbackTimes = -1
                return res.send({ data: result })
            }
        })
    }
})

router.get('/list', function (req, res) {
    var temp = req.query.symbols ? req.query.symbols.split(',') : []
    var symbols = []
    for (var item of temp) {    // filter out the duplicate symbol
        if (symbols.indexOf(item) < 0) {
            symbols.push(item)
        }
    }
    var cols = req.query.cols ? req.query.cols.split(',') : ['symbol', 'symbolName', 'exchange', 'price', 'preClose']
    if (symbols.length <= 0) {
        return res.send({ error: Const.error.parameter })
    }
    var resultList = []
    for (var symbol of symbols) {
        dataEntry.getAsny({ name: Const.DataAction.product }, symbol, { mode: 'image' }, function (err, productObj) {
            if (err) {
                resultList.push(getByColumns(req, err, cols))
            } else {
                resultList.push(getByColumns(req, productObj, cols))
            }
            if (resultList.length == symbols.length) {
                return res.send({ data: resultList })
            }
        })
    }
})

router.get('/search', function (req, res) {
    var query = (req.query.query || '').toLowerCase().trim()
    var count = Number(req.query.count || 10)
    var cols = req.query.cols ? req.query.cols.split(',') : ['symbol', 'symbolName', 'exchange']
    var symbols = req.query.symbols ? req.query.symbols.split(',') : null
    var exchange = req.query.exchange
    var product_type = req.query.product_type

    var products = []
    var rawProducts = dataEntry.get({ name: Const.DataAction.product })
    rawProducts = rawProducts.sort(function (a, b) {
        if (a.symbol > b.symbol) return 1
        return -1
    })
    for (var i = 0; i < rawProducts.length; i++) {
        var productObj = rawProducts[i]
        if (symbols && symbols.indexOf(productObj.symbol) < 0) continue
        if (exchange && productObj.exchange !== exchange) continue
        if (product_type && productObj.productType !== product_type) continue
        if (configuration.iTrader.oms.products.indexOf(productObj.productType) < 0) continue
        var symbol = productObj.symbol || ''
        var symbolName = OmsUtility.GetSymbolName(rawProducts[i], { lang: req.session.userOptions.lang, NoISIN: true }) || ''
        productObj.symbolName = symbolName
        if (query && symbol.toLowerCase().indexOf(query) < 0 && symbolName.toLowerCase().indexOf(query) < 0) continue

        var obj = getByColumns(req, productObj, cols)
        if (obj) {
            products.push(obj)
        }
        if (count > 0 && products.length >= count) break
    }
    res.send({ data: products })
})

function getByColumns(req, productObj, cols) {
    if (!productObj) return productObj
    productObj = parse.product(productObj, null, req) || {}
    if (!cols || cols.length <= 0) {
        return productObj
    }

    var obj = {}
    for (var col of cols) {
        obj[col] = productObj[col] || ''
    }
    return obj
}

module.exports = router