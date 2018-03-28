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

{ $Id: bond.js,v 1.7 2018/01/19 10:00:25 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    control = require('../../control'),
    dataEntry = require('../../data/entry'),
    Const = require('../../lib/const'),
    OmsUtility = require('../../lib/omsUtility'),
    logger = require('common').Logger.instance().getLogger(),
    router = express.Router()

var fs = require('fs')
var path = require('path')

var DailyBondList

router.get('/', control.isApiAuthenticated, function (req, res) {
    var dailyBondList = req.query.dailyBondList == 1 ? true : false
    getBondList(req, { dailyBondList: dailyBondList }, (data) => {
        return res.send(data || [])
    })
})

router.get('/disclaimer', control.isApiAuthenticated, function (req, res) {
    if (req.query.type === 'disclosure') {
        return res.send(config._getBondDisclosure())
    } else {
        return res.send(config._getBondDisclaimer())
    }
})

router.get('/positions', control.isApiAuthenticated, function (req, res) {
    var positions = dataEntry.get({ name: Const.DataAction.position }, req.user.id)
    var array = []
    var callbackCount = 0
    if (positions) {
        for (var p of positions) {
            if (p && p.bod && OmsUtility.IsOTCBond(p)) {
                var item = p.bod.makeOmsTag()
                array.push(p.bod.makeOmsTag())
            }
        }

        for (var item of array) {
            getProductName(item, req.session.userOptions, function (obj) {
                callbackCount++
                if (array.length === callbackCount) {
                    callbackCount = -1
                }
            })
        }
        res.send(array)
    }
})

router.post('/disclaimer', control.isApiAuthenticated, function (req, res) {
    req.user.skipBondDisclaimer = true
    res.send()
})

function getBondList(req, options, callback) {
    options = options || {}
    callback = callback || function () { }
    var count = req.query.count || 0
    getDailyBondListData((dailyBondList) => {
        var products = dataEntry.get({ name: Const.DataAction.product })
        var array = []
        for (var i = 0; i < products.length; i++) {
            if (count > 0 && array.length >= count) return array
            var productObj = products[i]
            if (OmsUtility.IsOTCBond(productObj)) {
                if (options.dailyBondList && !dailyBondList[productObj.symbol]) continue
                array.push({
                    0: productObj.symbol,
                    23: productObj.currency,
                    20: productObj.exchange,
                    1504: productObj.displayRatio,
                    symbolName: OmsUtility.GetSymbolName(productObj, req.session.userOptions),
                    couponRate: productObj.couponRate || '',
                    RPQLevel: productObj.RPQLevel,
                    CIESFlag: productObj.CIESFlag == 'Y' ? 'Y' : 'N',
                    PIFlag: productObj.ProInvestorFlag == '1' ? 'Y' : 'N',
                    31: productObj.preClose,
                })
            }
        }
        callback(array)
    })
}

function getProductName(obj, options, callback) {
    if (obj) {
        var symbolCode = obj['0']
        dataEntry.getAsny({ name: Const.DataAction.product }, symbolCode, {}, function (err, productObj) {
            if (!err && productObj) {
                obj.symbolName = OmsUtility.GetSymbolName(productObj, options) || ''
                obj["23"] = productObj.currency
            }
            callback(obj)
        })
    } else {
        callback()
    }
}

function getDailyBondListData(callback, reload) {
    var obj = {}
    if (typeof callback === 'function') {
        if (DailyBondList && !reload) return callback(DailyBondList)
        try {
            var filepath = path.join(process.cwd(), '/config/daily-bond-list.csv')
            if (fs.existsSync(filepath)) {
                var data = fs.readFileSync(filepath, { encoding: 'utf8' })
                if (data) {
                    var lines = data.split('\r\n')
                    for (var line of lines) {
                        var fields = line.split(',')
                        if (fields.length > 0) {
                            obj[fields[0]] = { symbol: fields[0] }
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
    if (filename === 'daily-bond-list.csv') {
        getDailyBondListData((data) => {
            DailyBondList = data
        }, true)
    }
})

module.exports = router