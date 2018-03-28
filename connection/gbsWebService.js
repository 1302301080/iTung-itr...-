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

{ $Id: gbsWebService.js,v 1.7 2017/11/06 09:34:02 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

var soap = require(__node_modules + 'strong-soap').soap
var config = require(__config_path)
var logger = require('common').Logger.instance().getLogger()
var OmsUtility = require('../lib/omsUtility')
var ordConst = require('../lib/omsOrdConst')

class GBSWebService {
    constructor(options) {
        this.options = options || {}
        this.client
    }

    query(name, requestArgs, callback) {
        try {
            soap.createClient(this.options.url, {}, function (err, client) {
                if (err) {
                    callback(err)
                    return
                }
                client[name](requestArgs, function (err, result, envelope, soapHeader) {
                    if (err) {
                        logger.error(err)
                    } else if (result && result[name + 'Result']) {
                        result = result[name + 'Result']
                    }
                    callback(err, result)
                })
            })
        } catch (err) {
            logger.error(err)
            callback(err)
        }
    }
}

var GBS
if (config.iTrader.GBSWebService && config.iTrader.GBSWebService.url) {
    var url = config.iTrader.GBSWebService.url
    if (!url.endsWith('?wsdl')) {
        url += '?wsdl'
    }
    config.iTrader.GBSWebService.url = url
    GBS = new GBSWebService(config.iTrader.GBSWebService)
    logger.info('GBS web service configured.')
}

function GetFund(options, callback) {
    if (!GBS || !options) return callback()
    GBS.query('GETFUNDACTIVE', {
        clientCode: options.account, fromOrderDate: '1990-01-01', toOrderDate: '2099-01-01'
    }, function (err, result) {
        var rows
        if (!err && result && result.diffgram && result.diffgram.NewDataSet) {
            var ds = result.diffgram.NewDataSet
            rows = GetFundRecords(ds)
        }
        callback(err, rows)
    })
}

function GetFundHistory(options, callback) {
    if (!GBS || !options) return callback()
    GBS.query('GETFUNDCONFIRM', {
        clientCode: options.account, fromOrderDate: options.fromDate, toOrderDate: options.toDate
    }, function (err, result) {
        var rows
        if (!err && result && result.diffgram && result.diffgram.NewDataSet) {
            var ds = result.diffgram.NewDataSet
            rows = GetFundRecords(ds)
        }
        callback(err, rows)
    })
}

function GetFundRecords(ds) {
    if (!ds || !ds.Subscription || !ds.Subscription_Detail) return
    if (!IsArray(ds.Subscription)) {
        ds.Subscription = [ds.Subscription]
    }
    if (!IsArray(ds.Subscription_Detail)) {
        ds.Subscription_Detail = [ds.Subscription_Detail]
    }
    var rows = []
    for (var item of ds.Subscription_Detail) {
        try {
            var status = OmsUtility.ConvertStatusToNumber(item.status)
            if (status == 1) status = 101
            else if (status == 3) status = 7
            else if (status == 7) status = 3
            else {
                if ((item.status || '').toLowerCase() === 'apply') status = 101
            }
            var obj = {
                orderNo: item.tradeNumber,
                exchange: 'FUND',
                productType: '10',
                ISIN: item,
                account: item.clientCode,
                user: item.runnerCode,
                price: Number(item.amount),               // subscription amount
                investAmount: Number(item.investAmount),  // investment amount
                quantity: Number(item.totalQuantity),
                status: status,
                time: item.InputDateTime
            }
            if (item.switchID) {
                obj.compSystemRef = 'BLKID=' + item.switchID
                obj.instruct2 = ordConst.omsOrder2Switch
            }
            for (var mainItem of ds.Subscription) {
                if (item.orderNo === mainItem.orderNo) {
                    obj.symbol = mainItem.stockCode
                    obj.currency = mainItem.tradingCur
                    obj.ISIN = mainItem.iSINCode
                    obj.side = mainItem.actionType == '1' ? '0' : '1'
                }
            }
            rows.push(obj)
        } catch (err) {
            logger.error('process fund data filed. error: ' + err)
        }
    }
    return rows
}

exports.GetFund = GetFund
exports.GetFundHistory = GetFundHistory