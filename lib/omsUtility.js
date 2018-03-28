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

{ $Id: omsUtility.js,v 1.24 2018/01/19 10:00:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var OmsOrdConst = require('./omsOrdConst'),
    Const = require('./const'),
    moment = require(__node_modules + 'moment')

var tags = Const.tags

/**
 * get symbol name or short name
 * @param {Object} productObj 
 * @param {Object} options {lang: '', short: true/false}
 */
function GetSymbolName(productObj, options) {
    var name = ''
    if (productObj && options) {
        if (options.lang === Const.languages.zh_hk) {
            name = productObj.CHTName || productObj[36] || (options.short ? productObj.account : productObj.name)
        } else if (options.lang === Const.languages.zh_cn) {
            name = productObj.CHSName || productObj[505] || (options.short ? productObj.account : productObj.name)
        } else {
            if (options.short) {
                name = productObj.account || productObj.name
            } else {
                name = (productObj.name || productObj.account)
            }
        }
    }
    return name
}


/**
 * get currency by type
 * @param {Object} productObj 
 * @param {Object} currencyCustom 
 * @param {Object} options {type: 'symbol/fee'}
 */
function GetCurrency(productObj, currencyCustom, options) {
    options = options || {}
    options.type = options.type || 'symbol'
    var currency = ''
    if (productObj) {
        if (options.type === 'symbol') {
            return productObj.currency
        } else if (options.type === 'fee') {
            var currencyCustom = dataEntry.custom({ name: Const.DataAction.currency })
            if (currencyCustom) {
                if (options.isBaseCurrency) {
                    return currencyCustom.baseCurrency
                } else {
                    return productObj.currency
                }
            }
        }
    }
    return currency
}

/**
 * convert currency
 * @param {Object} currency_in 
 * @param {Object} currency_out 
 * @param {Number or String} value 
 */
function ConvertCurrency(currency_in, currency_out, value) {
    if (currency_in && currency_out && value) {
        return (currency_in.ratio * Number(value)) / currency_out.ratio
    }
    return 0
}

function IsVoucher(imageObj) {
    if (imageObj) {
        if (imageObj.quantity === 1 && imageObj.exchange === 'MANU' && imageObj.operatorFlag === 'S' && imageObj.price > 0) {
            return 'cash'
        } else if (imageObj.quantity > 0 && imageObj.exchange === 'MANU' && imageObj.operatorFlag === 'S' && imageObj.price === 0) {
            return 'security'
        }
    }
}

function IsVoucherByInstruction(orderObj) {
    if (orderObj) {
        if ((orderObj.instruct2 & OmsOrdConst.omsOrder2SI_CASH) != 0) {
            return OmsOrdConst.omsOrder2SI_CASH
        } else if ((orderObj.instruct2 & OmsOrdConst.omsOrder2SI_SECURITY) != 0) {
            return OmsOrdConst.omsOrder2SI_SECURITY
        }
    }
    return 0
}

function UpdateVoucherType(orderObj) {
    if (!orderObj) return
    var voucherType = IsVoucherByInstruction(orderObj)
    if (voucherType === OmsOrdConst.omsOrder2SI_CASH) {
        orderObj.voucherType = 'cash'
    } else if (voucherType === OmsOrdConst.omsOrder2SI_SECURITY) {
        orderObj.voucherType = 'security'
    } else {
        orderObj.voucherType = ''
    }
}

function GetOrderStatus(orderObj) {
    var status = ''
    if (orderObj) {
        var status = orderObj[5] || orderObj.status
        var status = ConvertStatusToNumber(status)
        var queueQuantity = Number(orderObj.queueQuantity || orderObj[122])
        if (status == 1 && queueQuantity > 0) {
            status = 100  // queue
        }
        if (IsOTCFund(orderObj)) {
            var instruct3 = orderObj.instruct3 || orderObj[491]
            if (instruct3 && (4096 & instruct3) !== 0) {
                status = 101  // submitted fund order
            }
        }
        return status
    }
    return ''
}

function ConvertStatusToNumber(status) {
    if (typeof (status) === 'string') {
        switch (status.toLowerCase()) {
            case 'pend':
            case 'pending':
                return 1
            case 'part':
                return 2
            case 'comp':
            case 'complete':
                return 3
            case 'canc':
            case 'cancel':
                return 4
            case 'inac':
                return 5
            case 'conf':
            case 'confirm':
                return 7
            case 'cpnd':
                return 8
            case 'reje':
            case 'reject':
                return -1
            default:
                return status
        }
    }
    return status
}

function GetOrderTypeAsString(order) {
    var type = orderTypeAlias.LO
    if (order && (order.instruct || order[Const.tags.instruct])) {
        var instruct = order.instruct || order[Const.tags.instruct]
        var exchange = order.exchange || order[20]
        if ((instruct & OmsOrdConst.omsOrderMarket) != 0) {
            type = orderTypeAlias.MO
        } else if ((instruct & OmsOrdConst.omsOrderPreOpen) != 0) {
            if (Number(order['3']) === 0) {
                type = orderTypeAlias.AO
            } else {
                type = orderTypeAlias.ALO
            }
        } else if ((instruct & OmsOrdConst.omsOrderEnhancedLimit) != 0) {
            type = orderTypeAlias.ELO
        } else if ((instruct & OmsOrdConst.omsOrderStopLimit) != 0) {
            type = orderTypeAlias.STPL
        } else if (instruct & OmsOrdConst.omsOrderFAK) {
            if (configuration._isSupportSLOExchange(exchange)) {
                type = orderTypeAlias.SLO
            }
        }
    }
    return type
}

function GetOrderTIFAsString(order) {
    var tif = tifAlias.DAY
    if (order && (order.instruct || order[Const.tags.instruct])) {
        var instruct = order.instruct || order[Const.tags.instruct]
        if ((instruct & OmsOrdConst.omsOrderFAK) != 0) {
            tif = tifAlias.FAK
        } else if ((instruct & OmsOrdConst.omsOrderFOK) != 0) {
            tif = tifAlias.FOK
        } else if ((instruct & OmsOrdConst.omsOrderGTC) != 0) {
            if (order[Const.tags.expirationDate]) {
                tif = tifAlias.GTD
            } else {
                tif = tifAlias.GTC
            }
        }
    }
    return tif
}

var orderTypeAlias = {
    LO: 'limit',
    MO: 'market',
    AO: 'auction',
    ALO: 'auctionLimit',
    SO: 'stop',
    ELO: 'enhancedLimit',
    STPL: 'stopLimit',
    SLO: 'specialLimit'
}
var tifAlias = {
    DAY: 'day',
    FAK: 'fak',
    FOK: 'fok',
    GTC: 'gtc',
    GTD: 'gtd'
}

exports.MapOrderType = function (types) {
    var orderTypeAliasArray = []
    if (typeof types === 'undefined' || types == null) types = 'LO,MO,AO,ALO,SO,ELO,STPL'  // SLO is not default order type
    if (types) {
        for (var t of types.split(',')) {
            if (orderTypeAlias[t]) {
                orderTypeAliasArray.push(orderTypeAlias[t])
            } else {
                __logger.error('nonsupport order type: ' + t)
            }
        }
    }
    return orderTypeAliasArray
}

exports.MapOrderTif = function (tifs) {
    var tifAliasArray = ['day']
    if (typeof tifs === 'undefined' || tifs == null) tifs = 'FAK,FOK,GTC,GTD'
    if (tifs) {
        for (var t of tifs.split(',')) {
            if (tifAlias[t]) {
                tifAliasArray.push(tifAlias[t])
            } else {
                __logger.error('nonsupport tif: ' + t)
            }
        }
    }
    return tifAliasArray
}

function IsOTCFund(obj) {
    if (!obj) return
    var product = obj.productType || obj['22']
    var OTCFlag = obj.OTCFlag || obj['1508']
    if (product == 10 && OTCFlag == 1) return true
}

function IsOTCBond(obj) {
    if (!obj) return
    var product = obj.productType || obj['22']
    var OTCFlag = obj.OTCFlag || obj['1508']
    if (product == 6 && OTCFlag == 1) return true
}

function IsFundSwitchOrder(obj) {
    var blkID = ''
    if (obj && (obj.instruct2 & OmsOrdConst.omsOrder2Switch)) {
        if (obj.compSystemRef && obj.compSystemRef.BLKID) {
            blkID = obj.compSystemRef.BLKID
        }
    }
    return blkID
}

function GetDatetimeFromOrder(order, options) {
    if (typeof (order) !== 'object') return
    if (typeof (moment) === 'undefined') return
    options = options || {}
    var datetime
    try {
        if (order[tags.dataExtended] && order[tags.dataExtended].born && !options.modified) {  // support from ord 1.18.6.5
            datetime = moment(order[tags.dataExtended].born, 'DD/MM/YYYY HH:mm:ss')
        } else if (order[tags.time]) {
            var datetimeStr = order[tags.time]
            if (datetimeStr.length > 10) {
                datetime = moment(datetimeStr, 'YYYY-MM-DD HH:mm:ss')   // history order
                if (!datetime.isValid()) {
                    datetime = moment(datetimeStr)
                }
            } else {
                var orderNo = order[tags.orderNo]
                if (typeof (orderNo) === 'string' && orderNo.length >= 12) {
                    var dateStr = orderNo.substring(orderNo.length - 12, orderNo.length - 6)
                    datetime = moment(dateStr + ' ' + order[tags.time], options.format || 'YYMMDD HH:mm:ss')
                }
            }
        } else {
            var orderNo = order[tags.orderNo]
            if (typeof (orderNo) === 'string' && orderNo.length >= 12) {
                var dateStr = orderNo.substring(orderNo.length - 12, orderNo.length - 6)
                datetime = moment(dateStr + ' ' + order[tags.time], options.format || 'YYMMDD HH:mm:ss')
            }
        }
        if (datetime && datetime.isValid()) {
            return datetime.format(options.format || 'MM-DD HH:mm:ss')
        }
    } catch (e) {
        __logger.error('get order date time failed. exception: ' + e)
    }
}

function IsOutstandingStatus(status) {
    if (status == 1 || status == 2 || status == 100 || status == 8) {
        return true
    }
}

function TrimCNYAccountSuffix(accountID) {
    var suffix = configuration.iTrader.oms.CNYAcctSuffix
    if (accountID && suffix && accountID.indexOf(suffix) > 0) {
        return accountID.substring(0, accountID.indexOf(suffix))
    }
    return accountID
}

/* p&l calculation */
function GetNominal(productObj) {
    // price = 0 will be defined as no price, case "|3|0.000|"
    var price = productObj.price || Number(productObj[3]) || 0
    var preClose = productObj.preClose || Number(productObj[31]) || 0
    var bid = productObj.bid || Number(productObj[1]) || 0
    var ask = productObj.ask || Number(productObj[2]) || 0
    return price || preClose || ((bid + ask) / 2) || 0
}

function GetPrice(productObj) {
    return Number(GetNominal(productObj))
}

function GetContractSize(productObj) {
    var contractSize = productObj[tags.contractSize] || 1
    return Number(contractSize)
}

function GetMarketValue(productObj, positionObj) {
    if (!productObj || !positionObj) return Number.MIN_SAFE_INTEGER
    if (!configuration._isPricingExchange(productObj[20] || positionObj[20])) return Number.MIN_SAFE_INTEGER
    var productType = productObj.productType || productObj[22]
    var quantity = positionObj.quantity || positionObj[4]
    if (productType != 2 && productType != 3) {  // futures & options without market value
        var nominal = GetNominal(productObj)
        return Number(nominal * quantity || 0)
    }
    return Number.MIN_SAFE_INTEGER
}

function GetMarginRatio(positionObj, marginObj) {
    if (!positionObj || !marginObj) return 0
    var marginRatio = 0
    if (marginObj) {
        if (typeof (marginObj.longMR) !== 'undefined' && positionObj[tags.quantity] >= 0) {
            marginRatio = marginObj.longMR
        } else if (typeof (marginObj.shortMR) !== 'undefined' && positionObj[tags.quantity] < 0) {
            marginRatio = marginObj.shortMR
        } else {
            marginRatio = marginObj[tags.dayTradeMarginRatio]
        }
    }
    return Number(marginRatio || 0)
}

function GetAcceptValue(productObj, positionObj, marginObj) {
    var marketValue = GetMarketValue(productObj, positionObj) || 0
    if (marketValue === Number.MIN_SAFE_INTEGER) return Number.MIN_SAFE_INTEGER
    // if (!marginObj) return Number.MIN_SAFE_INTEGER  // cash account
    var marginRatio = positionObj.marginRatio || GetMarginRatio(positionObj, marginObj) || 0
    // return Number((marketValue > 0 ? marketValue : 0) * (marginRatio || 0))
    return Number(marketValue * marginRatio)
}

function GetUnrealizedPLRatio(productObj, positionObj) {
    var ratio = 0
    if (positionObj) {
        var unrealizedPL = positionObj.unrealizedPL || GetUnrealizedPL(productObj, positionObj) || 0
        var amount = positionObj[tags.quantity] * positionObj.costPrice
        if (amount) {
            ratio = unrealizedPL / amount
        }
    }
    return Number(ratio || 0)
}

function GetUnrealizedPL(productObj, positionObj) {
    if (!productObj || !positionObj) return
    var quantity = positionObj.quantity || positionObj[4] || 0
    return Number((GetPrice(productObj) - positionObj.costPrice) * quantity * GetContractSize(productObj) || 0)
}

function GetBodPL(productObj, positionObj) {
    if (!productObj || !positionObj) return
    var bodPL = 0
    if (positionObj.bod) {
        bodPL = positionObj.bod[tags.quantity] * (GetPrice(productObj) - (positionObj[tags.avgPrice] || productObj[tags.preClose] || 0))
    }
    return Number(bodPL || 0)
}

function GetExecPL(productObj, positionObj) {
    if (!productObj || !positionObj) return
    var execPL = 0
    if (positionObj.trades) {
        for (var p in positionObj.trades) {
            var trade = positionObj.trades[p]
            var tradePrice = trade[3]
            if (Number(tradePrice) == 0) {
                tradePrice = productObj[31] || 0  // v1.3.3 security settlement, price is 0, set the preclose as the trading price
            }
            if (trade[tags.side] == 0) {
                execPL += trade[tags.quantity] * (GetPrice(productObj) - tradePrice)
            } else if (trade[tags.side] == 1) {
                execPL -= trade[tags.quantity] * (GetPrice(productObj) - tradePrice)
            }
        }
    }
    return Number(execPL || 0)
}

/**
 * get quantity
 * @param {Object} positionObj position object
 * @param {Array} orders array of orders
 * @param {String} name quantity type, default "availableQuantity", also support "queueQuantity"
 */
function GetQuantity(positionObj, orders, name) {
    if (!positionObj) return 0
    var account = positionObj.account || positionObj[10]
    var symbol = positionObj.symbol || positionObj[0]
    var exchange = positionObj.exchange || positionObj[20]
    var quantity = positionObj.quantity || positionObj[4] || 0
    if (!account || !symbol) return 0
    name = name || "availableQuantity"
    var queueQuantity = 0
    var availableQuantity = 0
    if (orders && orders.length > 0) {
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
            if (!IsOutstandingStatus(order.status)) continue
            if ((order.instruct2 & 262144) > 0) continue
            if (order.account !== account || order.symbol !== symbol) continue

            queueQuantity += (order.quantity - (order.filledQty || 0))
        }
    }
    if (configuration._isDayTradeExchange(exchange)) {
        availableQuantity = quantity - queueQuantity
    } else {
        availableQuantity = quantity - (positionObj.todayBuyQuantity || 0) - queueQuantity
    }
    availableQuantity = availableQuantity < 0 ? 0 : availableQuantity
    queueQuantity = queueQuantity < 0 ? 0 : queueQuantity
    if (name === 'queueQuantity') return queueQuantity
    return availableQuantity
}

exports.GetSymbolName = GetSymbolName
exports.GetCurrency = GetCurrency
exports.ConvertCurrency = ConvertCurrency
exports.IsVoucherByInstruction = IsVoucherByInstruction
exports.IsVoucher = IsVoucher
exports.UpdateVoucherType = UpdateVoucherType
exports.GetOrderStatus = GetOrderStatus
exports.ConvertStatusToNumber = ConvertStatusToNumber
exports.GetOrderTypeAsString = GetOrderTypeAsString
exports.GetOrderTIFAsString = GetOrderTIFAsString
exports.GetDatetimeFromOrder = GetDatetimeFromOrder
exports.IsOutstandingStatus = IsOutstandingStatus
exports.TrimCNYAccountSuffix = TrimCNYAccountSuffix

/* p&l */
exports.GetNominal = GetNominal
exports.GetMarketValue = GetMarketValue
exports.GetMarginRatio = GetMarginRatio
exports.GetUnrealizedPL = GetUnrealizedPL
exports.GetBodPL = GetBodPL
exports.GetExecPL = GetExecPL
exports.GetUnrealizedPLRatio = GetUnrealizedPLRatio
exports.GetAcceptValue = GetAcceptValue
exports.GetQuantity = GetQuantity
exports.IsOTCFund = IsOTCFund
exports.IsOTCBond = IsOTCBond
exports.IsFundSwitchOrder = IsFundSwitchOrder