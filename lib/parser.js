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

{ $Id: parser.js,v 1.12 2018/02/02 07:57:37 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var OmsUtility = require('../lib/omsUtility')
var util = require('../lib/utility')
var tags = require('../lib/const').tags
var ordConst = require('../lib/omsOrdConst')
var logger = require('common').Logger.instance().getLogger()
var moment = require(__node_modules + 'moment')

function getOptions(options, req) {
    options = Object.assign({}, options)
    if (req) {
        if (req.session) {
            if (req.session.userOptions && req.session.userOptions.lang) {
                options.lang = req.session.userOptions.lang
            }
            if (req._apiInfo && req._apiInfo.channel) {
                options.channel = req._apiInfo.channel
            }
        }
    }
    return options
}

/**
 * get a order object which will be sent to front-end
 * @param {object} order 
 * @param {object} options {method:'', symbol: '', keys: '', lang: '' }
 */
function parseOrder(order, options, req) {
    if (!order) return
    options = getOptions(options, req)
    if (options.channel === 'api-v2') {
        return parseOrder4ApiV2(order, options)
    }
    var symbolObj = options.symbol || {}
    var obj = util.GetOmsTagObj(order, options.keys)
    if (OmsUtility.IsOTCFund(symbolObj)) {
        if (obj[tags.instruct3] && (4096 & obj[tags.instruct3]) !== 0) {
            obj[5] = 101  // submitted fund order
        }
    } else {
        if (OmsUtility.IsOTCBond(symbolObj)) {
            var displayRatio = symbolObj['1504'] || 1
            obj[3] = (obj[3] || 0) * displayRatio
            obj[42] = (obj[42] || 0) * displayRatio
            obj[115] = (obj[115] || 0) * displayRatio
        }
    }
    obj._id = obj[6]
    obj.datetime = OmsUtility.GetDatetimeFromOrder(obj) || order[33] || order[501]
    obj.modifiedDatetime = OmsUtility.GetDatetimeFromOrder(obj, { modified: true }) || obj.datetime

    obj[5] = OmsUtility.GetOrderStatus(obj)
    obj[20] = order.exchange || symbolObj.exchange
    obj[22] = order.productType || symbolObj.productType
    obj[23] = order.currency || symbolObj.currency
    obj[24] = symbolObj.lotSize || ''
    obj[73] = symbolObj.spread
    obj.shortName = OmsUtility.GetSymbolName(symbolObj, { short: true, lang: options.lang })
    obj.symbolName = OmsUtility.GetSymbolName(symbolObj, { lang: options.lang })
    obj[21] = symbolObj.name
    obj[36] = symbolObj.CHTName
    obj[505] = symbolObj.CHSName
    obj[1508] = symbolObj.OTCFlag
    obj[1504] = symbolObj.displayRatio
    obj[1508] = symbolObj.OTCFlag
    obj[73] = symbolObj.spread
    obj.trades = {}
    if (order.subOrders) {
        for (var s in order.subOrders) {
            var subOrder = order.subOrders[s]
            for (var t in subOrder.trades) {
                obj.trades[t] = util.GetOmsTagObj(subOrder.trades[t])
            }
        }
    }
    if (order.FundSwitchOrderList) {
        obj.FundSwitchOrderList = {}
        for (var p in order.FundSwitchOrderList) {
            var fo = order.FundSwitchOrderList[p]
            try {
                if (!fo.currency && typeof order.__getProductSync === 'function') {
                    var fundProductObj = order.__getProductSync(fo.symbol)
                    fo.setValue('currency', fundProductObj ? fundProductObj.currency : '')
                }
                obj.FundSwitchOrderList[p] = util.GetOmsTagObj(fo)
                if (typeof order.__getProductSync === 'function') {
                    var fundProductObj = order.__getProductSync(fo.symbol)
                    obj.FundSwitchOrderList[p].shortName = OmsUtility.GetSymbolName(fundProductObj, { short: true, lang: options.lang })
                    obj.FundSwitchOrderList[p].symbolName = OmsUtility.GetSymbolName(fundProductObj, { lang: options.lang })
                }
            } catch (error) {
                logger.error('failed in parse fund switch order. error: ' + error)
            }
        }
    }
    delete (obj.subOrders)   // no need subOrders
    return obj
}

function parsePosition(position, options, req) {
    if (!position) return
    options = getOptions(options, req)
    if (options.channel === 'api-v2') {
        return parsePosition4ApiV2(position, options)
    }
    var obj = util.GetOmsTagObj(position)
    var symbolObj = options.symbol || {}
    var marginObj = options.margin
    var currencyObj = options.currency
    var orders = options.orders
    obj._id = obj[10] + '_' + obj[0]
    obj[20] = obj[20] || symbolObj.exchange
    obj[22] = symbolObj.productType
    obj[23] = symbolObj.currency
    obj[73] = symbolObj.spread
    obj.shortName = OmsUtility.GetSymbolName(symbolObj, { short: true, lang: options.lang })
    obj.symbolName = OmsUtility.GetSymbolName(symbolObj, { lang: options.lang })
    obj[21] = symbolObj.name
    obj[36] = symbolObj.CHTName
    obj[505] = symbolObj.CHSName
    obj[1504] = symbolObj.displayRatio
    obj[1508] = symbolObj.OTCFlag
    obj[3] = OmsUtility.GetNominal(symbolObj)
    obj.marketValue = OmsUtility.GetMarketValue(symbolObj, obj) || 0
    var exchangeRatio = 1
    if (currencyObj && currencyObj.ratio) {
        exchangeRatio = currencyObj.ratio
    }
    obj.globalMarketValue = obj.marketValue * exchangeRatio
    obj.marginRatio = OmsUtility.GetMarginRatio(obj, marginObj) || 0
    obj.acceptValue = OmsUtility.GetAcceptValue(symbolObj, obj, marginObj) || 0
    obj.unrealizedPL = OmsUtility.GetUnrealizedPL(symbolObj, obj) || 0
    obj.bodPL = OmsUtility.GetBodPL(symbolObj, obj) || 0
    obj.execPL = OmsUtility.GetExecPL(symbolObj, obj) || 0
    obj.realizedPL = (obj.bodPL + obj.execPL - obj.unrealizedPL) || 0
    obj.unrealizedPLRatio = OmsUtility.GetUnrealizedPLRatio(symbolObj, obj) || 0
    obj.queueQuantity = OmsUtility.GetQuantity(position, orders, 'queueQuantity')
    obj.availableQuantity = OmsUtility.GetQuantity(position, orders)
    obj.unavailableQuantity = position.quantity - obj.availableQuantity

    if (typeof obj.bod === 'object') {
        obj.bod = util.GetOmsTagObj(obj.bod)
    }

    if (typeof obj.trades === 'object') {
        for (var p in obj.trades) {
            obj.trades[p] = util.GetOmsTagObj(obj.trades[p])
        }
    }
    return obj
}

function parseOrder4ApiV2(order, options) {
    if (!order) return order
    if (!configuration.__apiFields || !configuration.__apiFields.v2) return order
    options = options || {}
    var symbolObj = options.symbol || {}
    var obj = {}

    for (var item of configuration.__apiFields.v2.order) {
        var key = item.key
        if (!key) continue
        var displayRatio = symbolObj['1504'] || 1
        switch (key) {
            case 'symbolName':
                obj[key] = OmsUtility.GetSymbolName(symbolObj, { lang: options.lang })
                break
            case 'shortName':
                obj[key] = OmsUtility.GetSymbolName(symbolObj, { short: true, lang: options.lang })
                break
            case 'shortNameEx':
                obj[key] = symbolObj.account || symbolObj[10]
                break
            case 'status':
                obj[key] = OmsUtility.GetOrderStatus(order)
                break
            case 'datetime':
                obj[key] = OmsUtility.GetDatetimeFromOrder(order) || order[33] || order[501]
                break
            case 'type':
                obj[key] = OmsUtility.GetOrderTypeAsString(order)
                break
            case 'tif':
                obj.tif = OmsUtility.GetOrderTIFAsString(order)
                break
            case 'price':
            case 'price2':
            case 'avgPrice':
                obj[key] = (order[key] || 0) * displayRatio
                break
            case 'exchange':
            case 'productType':
            case 'currency':
                obj[key] = order[key] || symbolObj[key] || ''
                break
            case 'lotSize':
            case 'spread':
            case 'OTCFlag':
            case 'displayRatio':
            case 'name':
            case 'CHSName':
            case 'CHTName':
                obj[key] = symbolObj[key] || ''
                break
            case 'AHFT':
                if (order.instruct2 & ordConst.omsOrder2AHFT) {
                    obj[key] = true
                } else {
                    obj[key] = false
                }
                break
            default:
                obj[key] = order[key] || ''
                break
        }
    }
    obj.trades = {}
    if (order.subOrders) {
        for (var s in order.subOrders) {
            var subOrder = order.subOrders[s]
            for (var t in subOrder.trades) {
                obj.trades[t] = parseTrade4ApiV2(subOrder.trades[t])
            }
        }
    }

    // fun switch
    if (order.FundSwitchOrderList) {
        obj.FundSwitchOrderList = {}
        for (var p in order.FundSwitchOrderList) {
            var fo = order.FundSwitchOrderList[p]
            try {
                var symbolObj
                if (typeof order.__getProductSync === 'function') {
                    symbolObj = order.__getProductSync(fo.symbol)
                }

                obj.FundSwitchOrderList[p] = parseOrder4ApiV2(fo, { symbol: symbolObj })
            } catch (error) {
                logger.error('failed in parse fund switch order. error: ' + error)
            }
        }
    }
    return obj
}

function parseTrade4ApiV2(trade, options) {
    if (!trade) return trade
    if (!configuration.__apiFields || !configuration.__apiFields.v2) return trade
    options = options || {}
    var obj = {}
    for (var item of configuration.__apiFields.v2.trade) {
        var key = item.key
        if (!key) continue
        obj[key] = trade[key]
    }
    return obj
}

function parsePosition4ApiV2(position, options) {
    if (!position) return position
    if (!configuration.__apiFields || !configuration.__apiFields.v2) return position
    options = options || {}
    var symbolObj = options.symbol || {}
    var marginObj = options.margin
    var currencyObj = options.currency
    var orders = options.orders
    var exchangeRatio = 1
    if (currencyObj && currencyObj.ratio) {
        exchangeRatio = currencyObj.ratio
    }
    var queueQuantity = 0
    var availableQuantity = 0
    if (orders) {
        var orderListForCalcQueueQty = []
        for (var order of orders) {
            var fundSwitchOrderList = order.FundSwitchOrderList
            if (fundSwitchOrderList) {
                for (var orderNo in fundSwitchOrderList) {
                    orderListForCalcQueueQty.push(fundSwitchOrderList[orderNo])
                }
            }
            if (!order.switchID) {
                orderListForCalcQueueQty.push(order)
            }
        }
        for (var order of orderListForCalcQueueQty) {
            if (order.side == 0) continue
            if (!OmsUtility.IsOutstandingStatus(order.status)) continue
            if ((order.instruct2 & 262144) > 0) continue
            if (order.account !== position.account || order.symbol !== position.symbol) continue

            queueQuantity += (order.quantity - (order.filledQty || 0))
        }
    }
    if (configuration._isDayTradeExchange(position.exchange)) {
        availableQuantity = position.quantity - queueQuantity
    } else {
        availableQuantity = position.quantity - (position.todayBuyQuantity || 0) - queueQuantity
    }
    availableQuantity = availableQuantity < 0 ? 0 : availableQuantity
    var obj = {}
    for (var item of configuration.__apiFields.v2.position) {
        var key = item.key
        if (!key) continue
        switch (key) {
            case 'symbolName':
                obj[key] = OmsUtility.GetSymbolName(symbolObj, { lang: options.lang })
                break
            case 'shortName':
                obj[key] = OmsUtility.GetSymbolName(symbolObj, { short: true, lang: options.lang })
                break
            case 'shortNameEx':
                obj[key] = symbolObj.account || symbolObj[10]
                break
            case 'exchange':
            case 'productType':
            case 'currency':
            case 'spread':
            case 'OTCFlag':
            case 'displayRatio':
            case 'name':
            case 'CHSName':
            case 'CHTName':
                obj[key] = symbolObj[key]
                break
            case 'price':
                obj[key] = OmsUtility.GetNominal(symbolObj)
                break
            case 'marketValue':
                obj[key] = OmsUtility.GetMarketValue(symbolObj, position) || 0
                break
            case 'globalMarketValue':
                obj[key] = (OmsUtility.GetMarketValue(symbolObj, position) || 0) * exchangeRatio
                break
            case 'marginRatio':
                obj[key] = OmsUtility.GetMarginRatio(position, marginObj) || 0
                break
            case 'acceptValue':
                obj[key] = OmsUtility.GetAcceptValue(symbolObj, position, marginObj) || 0
                break
            case 'unrealizedPL':
                obj[key] = OmsUtility.GetUnrealizedPL(symbolObj, position) || 0
                break
            case 'bodPL':
                obj[key] = OmsUtility.GetBodPL(symbolObj, position) || 0
                break
            case 'execPL':
                obj[key] = OmsUtility.GetExecPL(symbolObj, position) || 0
                break
            case 'realizedPL':
                obj[key] = (position.bodPL + position.execPL - position.unrealizedPL) || 0
                break
            case 'unrealizedPLRatio':
                obj[key] = OmsUtility.GetUnrealizedPLRatio(symbolObj, position) || 0
                break
            case 'queueQuantity':
                obj[key] = queueQuantity
                break
            case 'availableQuantity':
                obj[key] = availableQuantity
                break
            case 'unavailableQuantity':
                obj[key] = (position.quantity - availableQuantity) || 0
                break
            default:
                obj[key] = position[key]
                break
        }
    }

    obj.trades = {}
    if (typeof position.trades === 'object') {
        for (var p in obj.trades) {
            obj.trades[p] = parseTrade4ApiV2(position.trades[p])
        }
    }
    return obj
}

function parseAccount(account, options, req) {
    if (!account) return account
    options = getOptions(options, req)
    if (options.channel === 'api-v2') {
        if (!configuration.__apiFields || !configuration.__apiFields.v2) return account
        options = options || {}
        var obj = {}

        for (var item of configuration.__apiFields.v2.account) {
            var key = item.key
            if (!key) continue
            obj[key] = account[key] || ''
        }
        return obj
    } else {
        return util.GetOmsTagObj(account)
    }
}

function parseSession(session, options, req) {
    if (!session) return
    options = getOptions(options, req)
    if (options.channel === 'api-v2') {
        var obj = {}
        if (session === true) return { data: true }
        if (session === false) return { error: true }
        for (var item of configuration.__apiFields.v2.session) {
            var key = item.key
            if (!key) continue
            obj[key] = session[key] || ''
        }
        return obj
    } else {
        return util.GetOmsTagObj(session)
    }
}

function parseError(error, options, req) {
    if (typeof error !== 'object') return
    options = getOptions(options, req)
    if (options.channel === 'api-v2') {
        var errorCode
        var minorCode
        var freeText
        if (typeof error.error === 'object') {
            errorCode = error.error.errorCode || error.error[39]
            minorCode = error.error.minorCode || error.error[464]
            freeText = error.error.freeText || error.error[25]
        }
        return {
            errorCode: errorCode || error.error || error[39] || error.errorCode,
            minorCode: minorCode || error.minorCode || error[464],
            freeText: freeText || error.freeText || error[25]
        }
    } else {
        return error
    }
}

function parseProduct(product, options, req) {
    if (typeof product !== 'object') return
    options = getOptions(options, req)
    var time = ''  // apply date time, format "YYYY-MM-DD HH:mm:ss"
    if (product.time && product.time.length == 8) {
        time = moment().format('YYYY-MM-DD') + ' ' + product.time
    } else {
        time = product.time
    }
    var obj = {
        symbolName: OmsUtility.GetSymbolName(product, { lang: options.lang }),
        shortName: OmsUtility.GetSymbolName(product, { short: true, lang: options.lang }),
        shortNameEx: product.account || product[10],
        time: time
    }
    if (options.channel === 'api-v2') {
        for (var item of configuration.__apiFields.v2.product) {
            var key = item.key
            if (!key || key === 'symbolName' || key === 'shortName' || key === 'shortNameEx' || key === 'time') continue
            obj[key] = product[key] || ''
        }
        return obj
    } else {
        return Object.assign({}, util.GetOmsTagObj(product), obj)
    }
}

function parseExchange(exchange, options, req) {
    if (typeof exchange !== 'object') return
    options = getOptions(options, req)
    if (options.channel === 'api-v2') {
        var obj = {}
        for (var item of configuration.__apiFields.v2.exchange) {
            var key = item.key
            if (!key) continue
            obj[key] = exchange[key] || ''
        }
        return obj
    } else {
        return util.GetOmsTagObj(exchange)
    }
}

function parseSpread(spread, options, req) {
    if (typeof spread !== 'object') return
    options = getOptions(options, req)
    if (options.channel === 'api-v2') {
        var obj = {}
        for (var item of configuration.__apiFields.v2.spread) {
            var key = item.key
            if (!key) continue
            obj[key] = spread[key] || ''
        }
        return obj
    } else {
        return util.GetOmsTagObj(spread)
    }
}

function parseCurrency(currency, options, req) {
    if (typeof currency !== 'object') return
    options = getOptions(options, req)
    if (options.channel === 'api-v2') {
        var obj = {}
        for (var item of configuration.__apiFields.v2.currency) {
            var key = item.key
            if (!key) continue
            obj[key] = currency[key] || ''
        }
        return obj
    } else {
        if (typeof currency.currency_list !== 'undefined') {
            return currency
        } else {
            return { currency_list: [currency] }
        }
    }
}

module.exports = {
    session: parseSession,
    order: parseOrder,
    position: parsePosition,
    account: parseAccount,
    product: parseProduct,
    exchange: parseExchange,
    spread: parseSpread,
    currency: parseCurrency,
    error: parseError
}