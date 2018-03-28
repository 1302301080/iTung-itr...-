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

{ $Id: fund.js,v 1.8 2018/01/19 10:00:25 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    control = require('../../control'),
    dataEntry = require('../../data/entry'),
    Const = require('../../lib/const'),
    Util = require('../../lib/utility'),
    Parser = require('../../lib/parser'),
    OmsUtility = require('../../lib/omsUtility'),
    logger = require('common').Logger.instance().getLogger(),
    router = express.Router()

var fs = require('fs')
var path = require('path')

var productInfoCsvData

router.get('/', control.isApiAuthenticated, function (req, res) {
    var fundList = getFundList(req)
    return res.send(fundList)
})

router.get('/positions', control.isApiAuthenticated, function (req, res) {
    var positions = dataEntry.get({ name: Const.DataAction.position }, req.user.id)
    if (!positions || positions.length <= 0) return res.send([])
    var array = []
    for (var p of positions) {
        var productObj = dataEntry.get({ name: Const.DataAction.product }, p.symbol)
        var postionTagObj = Parser.position(p, { symbol: productObj })
        if (postionTagObj) {
            array.push(postionTagObj)
        }
    }
    return res.send(array)
})

router.get('/disclaimer', control.isApiAuthenticated, function (req, res) {
    if (req.query.type === 'disclosure') {
        return res.send(config._getFundDisclosure())
    } else {
        return res.send(config._getFundDisclaimer())
    }
})

function getFundList(req) {
    if (!req) return
    var count = req.query.count || 0
    var products = dataEntry.get({ name: Const.DataAction.product })
    var array = []
    if (products.length > 0) {
        getProductInfoCsvData(function (extraData) {
            extraData = extraData || {}
            for (var i = 0; i < products.length; i++) {
                if (count > 0 && array.length >= count) return array
                var productObj = products[i]
                var derivativeFlag = 'N'
                if (productObj.prodFlag & 1024) {
                    derivativeFlag = 'Y'
                }
                if (OmsUtility.IsOTCFund(productObj)) {
                    var obj = {
                        0: productObj.symbol,
                        20: productObj.exchange,
                        23: productObj.currency,
                        1504: productObj.displayRatio,
                        30: productObj.ISIN,
                        symbolName: OmsUtility.GetSymbolName(productObj, req.session.userOptions),
                        nav: (productObj.preClose || '') + (productObj.navDate ? ' ({0})'.format(productObj.navDate) : ''),
                        RPQLevel: productObj.RPQLevel,
                        CIESFlag: productObj.CIESFlag == 'Y' ? 'Y' : 'N',
                        PIFlag: productObj.ProInvestorFlag == '1' ? 'Y' : 'N',
                        DerivativeFalg: derivativeFlag,
                        offeringDocLink: extraData[productObj.symbol] ? extraData[productObj.symbol].offeringDocLink : ''
                    }
                    array.push(obj)
                }
            }
        })
    }
    return array
}

function getProductInfoCsvData(callback, reload) {
    var obj = {}
    if (typeof callback === 'function') {
        if (productInfoCsvData && !reload) return callback(productInfoCsvData)
        try {
            var filepath = path.join(process.cwd(), '/config/product-info.csv')
            if (fs.existsSync(filepath)) {
                var data = fs.readFileSync(filepath, { encoding: 'utf8' })
                if (data) {
                    var lines = data.split('\r\n')
                    for (var line of lines) {
                        var fields = line.split(',')
                        var fieldsList = []
                        if (fields.length > 1) {
                            for(var p in fields){
                                if(p == 0) continue
                                fieldsList.push(fields[p])
                            }
                            obj[fields[0]] = { offeringDocLink: fieldsList }
                        }
                    }
                }
            }
        } catch (error) {
            logger.error('process product-info.csv files failed. error: ' + error)
        }
        callback(obj)
    }
}

var filepath = path.join(process.cwd(), '/config')
fs.watch(filepath, function (event, filename) {
    if (filename === 'product-info.csv') {
        getProductInfoCsvData((data) => {
            productInfoCsvData = data
        }, true)
    }
})

module.exports = router