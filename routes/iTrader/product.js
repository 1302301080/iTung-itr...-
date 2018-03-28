/*!
{*******************************************************************}
{                                                                   }
{       eBroker Systems Javascript Component Library                }
{                                                                   }
{                                                                   }
{       Copyright(c) 2000-2016 eBroker Systems Ltd.                 }
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

{ $Id: product.js,v 1.27 2018/02/02 07:57:38 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    control = require('../../control'),
    dataEntry = require('../../data/entry'),
    Const = require('../../lib/const'),
    OmsUtility = require('../../lib/OmsUtility'),
    dllWrap = require('../../lib/dllWrap'),
    priceDDS = require('../../connection/dds'),
    logger = require('common').Logger.instance().getLogger(),
    parse = require('../../lib/parser'),
    router = express.Router()

router.get('/', control.isApiAuthenticated, function (req, res, next) {
    var symbolCode = req.query.symbol
    var ISINCode = req.query.ISINCode == 1 ? true : false
    if (symbolCode) {
        dataEntry.getAsny({ name: Const.DataAction.product }, symbolCode, { ISINCode: ISINCode, isDDS: true }, function (err, productObj) {
            if (!err && productObj) {
                res.send({ data: parse.product(productObj, null, req) })
            } else {
                res.send({ error: parse.error(Const.error.symbolNotExist, null, req) })
            }
        })
        priceDDS.SubscribeSymbol(symbolCode)
    } else {
        res.send({ error: parse.error(Const.error.parameter, null, req) })
    }
})

router.get('/search', control.isAuthenticated, searchSymbol, function (req, res, next) {
    if (req.query.action === 'popup') {
        var productType = req.query.productType
        var exchange = req.query.exchanges
        var productTypes = []
        var type = req.query.type
        var exchanges = []
        var defaultExchanges = dataEntry.global.exchanges
        if (productType) {
            productTypes = productType.split(',')
        } else {
            productTypes = config.iTrader.oms.products
            if (productTypes.indexOf('0') < 0) {
                productTypes.splice(0, 0, '0')
            }
        }
        if (exchange) {
            exchanges = exchange.split(',')
            if (type) {
                exchanges.push(0)
                for (var i = 0; i < defaultExchanges.length; i++) {
                    if (defaultExchanges[i] == exchanges[0]) continue
                    exchanges.push(defaultExchanges[i])
                }
            }

        } else {
            exchanges = defaultExchanges
            exchanges.splice(0, 0, '0')
        }
        res.render(__views_path + 'iTrader/product/search_product', {
            layout: __views_path + 'layout',
            productTypes: productTypes,
            exchanges: exchanges,
            csrfToken: req.csrfToken()
        })
    } else {
        res.render(__views_path + 'iTrader/product/search_product_page', {
            layout: __views_path + 'layout',
            userOptions: req.session.userOptions,
            config: config.iTrader,
            user: req.user,
            productTypes: config.iTrader.oms.products,
            exchanges: dataEntry.global.exchanges,
            csrfToken: req.csrfToken()
        })
    }
})

router.post('/search', control.isApiAuthenticated, function (req, res) {
    try {
        var searchProductSchema = config.iTrader.views.search_product.schema
        var query = req.body.query.toLowerCase().trim()
        var exchange = req.body.exchange
        var product_type = req.body.product_type
        var products = []
        var rawProducts = dataEntry.get({ name: Const.DataAction.product })
        for (var i = 0; i < rawProducts.length; i++) {
            var productObj = rawProducts[i]
            if (exchange && productObj.exchange !== exchange) continue
            if (product_type && productObj.productType !== product_type) continue
            if (dataEntry.global.exchanges.indexOf(productObj.exchange) < 0) continue
            if (config.iTrader.oms.products.indexOf(productObj.productType) < 0) continue
            var symbol = productObj.symbol || ''
            var lowerCaseSymbol = symbol.toLowerCase()
            var searchIndex = rawProducts[i]._searchingIndex || ''  // name include ENG/CHS/CHT
            if (query) {
                var matchSymbolCode = lowerCaseSymbol.indexOf(query) >= 0
                var matchSymbolName = searchIndex.toLowerCase().indexOf(query) >= 0
                if (!matchSymbolCode && !matchSymbolName) continue
            }
            var productTabObj = rawProducts[i].makeOmsTag()
            productTabObj.symbolName = OmsUtility.GetSymbolName(rawProducts[i], req.session.userOptions) || ''
            var dataArrayObj = { '_lowerCaseSymbol': lowerCaseSymbol, '_matchSymbolCode': matchSymbolCode }
            for (var item of searchProductSchema) {
                dataArrayObj[item.key] = productTabObj[item.key]
            }
            products.push(dataArrayObj)
        }
    } catch (err) {
        logger.error(err)
    }
    var sortColumnIndex = Number(req.body["order[0][column]"]) || 0
    var sortColumnKey
    if (searchProductSchema.length > sortColumnIndex) {
        sortColumnKey = searchProductSchema[sortColumnIndex].key
    } else {
        sortColumnKey = searchProductSchema[0].key
    }
    var dir = req.body["order[0][dir]"]
    var isDesc = dir == 'desc' ? true : false
    var start = Number(req.body.start)
    var end = start + Number(req.body.length)
    products.sort((a, b) => {
        if (!dir && query) {
            if (a._matchSymbolCode) {
                return -1
            }
            if (b._matchSymbolCode) {
                return 1
            }
            return a[0] < b[0] ? -1 : 1
        }
        if (a[sortColumnKey] == b[sortColumnKey]) return 0
        if (isDesc) {
            return a[sortColumnKey] < b[sortColumnKey] ? 1 : -1
        } else {
            return a[sortColumnKey] < b[sortColumnKey] ? -1 : 1
        }
    })
    var data = {
        draw: req.body.draw,
        recordsTotal: products.length,
        recordsFiltered: products.length,
        data: products.slice(start, end)
    }
    res.send(data)
})

router.get('/market', control.isAuthenticated, function (req, res, next) {
    var name = req.query.name
    if (name) {
        for (var obj of config.iTrader.market_data.items) {
            var objName = obj.name.toLowerCase()
            if (objName === name.toLowerCase()) {
                var account = obj.useLogonName ? req.user.username : req.user.id
                if (objName === 'tsci') {
                    obj.height = obj.height || '350'
                    obj.parameters = '?Action={0}&UID={1}'.format(obj.broker, account)
                } else {
                    var password = dllWrap.EncryptPassword('{0}@{1}'.format(account, obj.broker), 10)
                    var language = objName == 'megahub' ? 'en' : 'eng'
                    if (req.session.userOptions.lang === Const.languages.zh_hk) {
                        language = objName == 'megahub' ? 'tc' : 'chi'
                    } else if (req.session.userOptions.lang === Const.languages.zh_cn) {
                        language = objName == 'megahub' ? 'sc' : 'chn'
                    }
                    obj.username = account
                    obj.password = password
                    obj.language = language
                    obj.parameters = '?userBroker={0}&userLogin={1}&userPasswd={2}&userLang={3}&b={0}&u={1}&p={2}&language={3}'.format(obj.broker, account, password, language)
                    if (objName === 'etnet') {  // etent not allow carry extract parameters
                        obj.parameters = '?userBroker={0}&userLogin={1}&userPasswd={2}&userLang={3}'.format(obj.broker, account, password, language)
                    }
                }
                var page = req.query.page ? 'iTrader/product/market_price' : 'iTrader/product/market_price_frame'
                res.render(__views_path + page, {
                    layout: __views_path + 'layout',
                    item: obj
                })
                break
            }
        }
    } else {
        res.send()
    }
})

function searchSymbol(req, res, next) {
    if (req.query.action !== 'search') return next()
    var query = (req.query.query || '').toLowerCase().trim()
    var count = Number(req.query.count || 10)
    var cols = req.query.cols ? req.query.cols.split(',') : ['0', 'symbolName', '20']
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
    return res.send({ data: products })
}

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