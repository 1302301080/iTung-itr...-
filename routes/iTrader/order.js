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

{ $Id: order.js,v 1.52 2018/02/28 03:51:00 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    uuid = require(__node_modules + 'node-uuid'),
    moment = require(__node_modules + 'moment'),
    control = require('../../control'),
    ordConst = require('../../lib/omsOrdConst'),
    OmsUtility = require('../../lib/omsUtility'),
    dataEntry = require('../../data/entry'),
    logger = require('common').Logger.instance().getLogger(),
    Const = require('../../lib/const'),
    PriceDDS = require('../../connection/dds'),
    router = express.Router(),
    parser = require('../../lib/parser')
var util = require('../../lib/utility')
var fundSwitchIDGenerator = require('switchID-generator')

router.get('/', control.isApiAuthenticated, function (req, res, next) {
    var orders = dataEntry.get({ name: Const.DataAction.order }, req.session.passport.user)
    var rows = []
    for (var o in orders) {
        var order = orders[o]
        var row = order.makeOmsTag()
        rows.push(row)
    }
    res.send(rows)
})

router.get('/get', control.isApiAuthenticated, function (req, res) {
    var orderNo = req.query.orderNo
    if (!orderNo) {
        res.send({ error: Const.error.parameter })
        return
    }
    var orderObj = dataEntry.get({ name: Const.DataAction.order }, req.user.id, orderNo)
    if (orderObj) {
        if (req._isJsonRequest) {
            var symbolObj = dataEntry.get({ name: Const.DataAction.product }, orderObj.symbol)
            var obj = parser.order(orderObj, { symbol: symbolObj }, req)
            return res.send({ data: obj })
        }
        var orderTagObj = orderObj.makeOmsTag()
        UpdateOrder(req, orderTagObj)
        res.render(__views_path + 'iTrader/order/detail', {
            layout: __views_path + 'layout',
            order: orderTagObj,
            schema: config.iTrader.views.trade.order_book.trade_schema,
            settingformat: config.iTrader.format,
        })
    } else {
        res.send({ error: Const.error.orderNotExist })
    }
})

router.get('/add', control.isAuthenticated, function (req, res, next) {
    var userRef = req.query.ref
    if (!userRef) {
        res.send({ error: Const.error.parameter })
        return
    }
    var orderObj = dataEntry.get({ name: Const.DataAction.calcOrder }, req.user.id, userRef)
    if (orderObj) {
        var requiredDisclosure = false
        var orderTagObj = util.GetOmsTagObj(orderObj)
        UpdateOrder(req, orderTagObj)
        var tempPath = 'iTrader/order/add_confirmation'
        if (OmsUtility.IsOTCFund(orderTagObj)) {
            tempPath = 'iTrader/order/add_fund_confirmation'
            if (config._getFundDisclosure()) {
                requiredDisclosure = true
            }
        } else if (OmsUtility.IsOTCBond(orderTagObj)) {
            tempPath = 'iTrader/order/add_bond_confirmation'
            if (config._getBondDisclosure()) {
                requiredDisclosure = true
            }
        }
        res.render(__views_path + tempPath, {
            layout: __views_path + 'layout',
            user: req.user,
            order: orderTagObj,
            config: config.iTrader,
            commNFees: orderTagObj.commNFees,
            calcMode: orderObj.TXN ? orderObj.TXN.CalcMode : false,
            requiredDisclosure: requiredDisclosure,
            csrfToken: req.csrfToken(),
            settingformat: config.iTrader.format,

        })
    } else {
        res.send({ error: Const.error.parameter })
    }
})

router.get('/change', control.isAuthenticated, function (req, res, next) {
    var orderNo = req.query.orderNo
    if (!orderNo) {
        res.send({ error: Const.error.parameter })
        return
    }
    var orderObj = dataEntry.get({ name: Const.DataAction.order }, req.user.id, orderNo)
    if (orderObj) {
        var orderTagObj = orderObj.makeOmsTag()
        UpdateOrder(req, orderTagObj)
        res.render(__views_path + 'iTrader/order/change_confirmation', {
            layout: __views_path + 'layout',
            user: req.user,
            order: orderTagObj,
            settingformat: config.iTrader.format,
            csrfToken: req.csrfToken()
        })
    } else {
        res.send({ error: Const.error.parameter })
    }
})

router.get('/cancel', control.isAuthenticated, function (req, res, next) {
    var orderNo = req.query.orderNo
    if (!orderNo) {
        res.send({ error: Const.error.parameter })
        return
    }
    var orderObj = dataEntry.get({ name: Const.DataAction.order }, req.user.id, orderNo)
    if (orderObj) {
        var orderTagObj = orderObj.makeOmsTag()
        UpdateOrder(req, orderTagObj)
        orderTagObj.switchID = orderObj.switchID
        res.render(__views_path + 'iTrader/order/cancel_confirmation', {
            layout: __views_path + 'layout',
            user: req.user,
            order: orderTagObj,
            settingformat: config.iTrader.format,
            csrfToken: req.csrfToken()
        })
    } else {
        res.send({ error: Const.error.parameter })
    }
})

router.get('/pricequote/comfirm', control.isAuthenticated, function (req, res, next) {
    var orderNo = req.query.orderNo
    if (!orderNo) {
        res.send({ error: Const.error.parameter })
        return
    }
    var orderObj = dataEntry.get({ name: Const.DataAction.order }, req.user.id, orderNo)
    if (orderObj) {
        var orderTagObj = orderObj.makeOmsTag()
        UpdateOrder(req, orderTagObj)
        orderTagObj.switchID = orderObj.switchID
        res.render(__views_path + 'iTrader/order/pricequote_confirmation', {
            layout: __views_path + 'layout',
            user: req.user,
            order: orderTagObj,
            settingformat: config.iTrader.format,
            csrfToken: req.csrfToken()
        })
    } else {
        res.send({ error: Const.error.parameter })
    }
})

router.post('/calculate', control.csrfProtection, control.isApiAuthenticated, CommonCheck, SuitabilityChecking, TXNChecking, function (req, res) {
    if (req.body.type === 'switch' || req.body.type === 'multi') {
        if (req.isNeedConfirm) {
            return res.send({ data: { isNeedConfirm: req.isNeedConfirm } })
        }
        return res.send({ data: {} })
    }
    var userRef = uuid.v1()
    try {
        var orderData = req._orderDataList[0]   // for single order
        if (!orderData || !orderData.symbol || !orderData.quantity) {
            res.send({ error: Const.error.parameter })
            return
        }
        req.user.its.OnCalcOrder(userRef, function (err, order) {
            if (err) {
                res.send({ error: parser.order(err, null, req) })
            } else {
                if (req.TXN && req.TXN.CalcMode) {
                    order.TXN = { CalcMode: true }
                }
                res.send({ data: Object.assign({}, parser.order(order, { symbol: dataEntry.getSymbol(order[0]) }, req), { isNeedConfirm: req.isNeedConfirm }) })
            }
        })
        orderData.extra.userRef = userRef
        req.user.its.calculateOrder(orderData.symbol, orderData.side, orderData.price, orderData.quantity, orderData.extra)
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

router.post('/submit', control.csrfProtection, control.isApiAuthenticated, CommonCheck, SuitabilityChecking, TXNChecking, AddFundSwitch, AddMultiOrder, function (req, res) {
    try {
        var orderData = req._orderDataList[0]  // for single order
        var cmd = orderData.cmd
        var tradingPwd = orderData.extra.password
        var order = orderData.orderObj

        // check trading password
        if (!req.user.skipTradingPassword && tradingPwd !== req.user.password) {
            if (tradingPwd == '') {
                logger.info('Transaction has blocked as trading password is empty.')
            } else {
                logger.info('Transaction has blocked as trading password is incorrect.')
            }
            return res.send({ error: Const.error.tradingPwd })
        }

        if (cmd === 'add') {
            req.user.its.submitAddOrder(orderData.symbol, orderData.side, orderData.price, orderData.quantity, orderData.extra)
        } else if (cmd === 'change') {
            if (order.userRef) {
                orderData.extra.userRef = order.userRef
            }
            if (order.instruct3 && order.compSystemRef.QState == '3') {
                orderData.extra.instruct = order.instruct ^ 32
                if (orderData.extra.instruct == 0) {
                    orderData.extra.instruct |= ordConst.omsOrderNotNull
                }
                req.user.its.submitChangeOrder(orderData.orderNo, '', '', orderData.extra)
            } else {
                req.user.its.submitChangeOrder(orderData.orderNo, orderData.changePrice, orderData.changeQuantity, orderData.extra)
            }
        } else if (cmd === 'cancel') {
            var orderArr = []
            if (order.FundSwitchOrderList) {
                for (var key in order.FundSwitchOrderList) {
                    if (order.FundSwitchOrderList[key]._isErrorOrder) continue
                    orderArr.push({ orderNo: key, extra: { userRef: order.FundSwitchOrderList[key].userRef || uuid.v1() } })
                }
                req.user.its.cancelMultiOrder(orderArr, function (err, data) {
                    if (err) {
                        var lastErr = parser.order(err[err.length - 1], { symbol: dataEntry.getSymbol(err[0]) }, req)  // just return the last error
                        return res.send({ error: lastErr })
                    } else {
                        return res.send(true)
                    }
                })
                return
            } else {
                if (order.userRef) {
                    orderData.extra.userRef = order.userRef
                }
                req.user.its.submitCancelOrder(order.orderNo, orderData.extra)
            }
        }
        req.user.its.OnSubmitOrder(orderData.extra.userRef, function (err, orderObj) {
            if (err) {
                if (cmd === 'add' && config.iTrader.views.trade.ticket.CBBCAgreement && err.minorCode == -110021) { // CBBC agreement checking
                    req.user.its.customQuery({
                        systemRef: Const.customQuery.getCBBCAgreement, account: req.user.id,
                    }, function (queryErr, data) {
                        var errTagObj = parser.order(err, { symbol: dataEntry.getSymbol(err.symbol) }, req)
                        errTagObj.showCBBCAgreement = true
                        if (IsArray(data) && data.length > 0 && data[0].side == 1) {
                            errTagObj.showCBBCAgreement = false
                        }
                        return res.send({ error: errTagObj })
                    }
                    )
                } else {
                    res.send({ error: parser.order(err, { symbol: dataEntry.getSymbol(err.symbol) }, req) })
                }
            } else {
                res.send({ data: parser.order(orderObj, { symbol: dataEntry.getSymbol(orderObj.symbol) }, req) })
            }
        })
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

router.post('/history', control.isApiAuthenticated, function (req, res) {
    function ProcessOrders(key, historyOrders, callback) {
        var array = []
        var newArray = []
        if (!historyOrders || historyOrders.length <= 0) {
            callback(array)
        }
        var receiveSymbolTimes = 0
        for (var o of historyOrders) {
            dataEntry.getAsny({ name: Const.DataAction.product }, o.symbol, {}, function (err, productObj) {
                if (err) {
                    logger.error(err)
                }
                productObj = productObj || {}
                for (var ho of historyOrders) {
                    if (ho.productObj || ho[0] !== productObj.symbol) continue
                    ho.productObj = productObj
                }
                receiveSymbolTimes++
                if (receiveSymbolTimes === historyOrders.length) {
                    array = dataEntry.set({ name: Const.DataAction.historyOrder }, req.user.id, key, historyOrders)
                    for (var i = 0; i < array.length; i++) {
                        var productObj = array[i].productObj
                        array[i].voucherType = OmsUtility.IsVoucher(array[i])
                        array[i].__getProductSync = function (symbol) {
                            return dataEntry.get({ name: Const.DataAction.product }, symbol)
                        }
                        var newObj = parser.order(array[i], { symbol: productObj }, req)
                        delete (newObj.productObj)
                        newArray.push(newObj)
                    }
                    callback(newArray)
                }
            })
            PriceDDS.SubscribeSymbol(o.symbol, 'image')
        }
    }
    function filterByType(array, type) {
        if (!array || array.length <= 0 || !type) return array
        var returnArray = []
        for (var item of array) {
            if (item._isErrorOrder) continue  // filter the error order image
            if (type == 'cash') {
                if (item.voucherType == 'cash') {
                    returnArray.push(item)
                }
            } else if (type == 'fund') {
                if (OmsUtility.IsOTCFund(item)) {
                    returnArray.push(item)
                }
            } else if (type == 'order') {
                if (item.voucherType != 'cash' && !OmsUtility.IsOTCFund(item)) {
                    returnArray.push(item)
                }
            } else {
                return array  // return all
            }
        }
        return returnArray
    }
    try {
        var startDate = req.body.startDate
        var endDate = req.body.endDate
        var days = req.body.days || config.iTrader.views.trade.history_order.filter.days[0]
        if (!startDate || !endDate) {
            var startDate = moment().subtract(days, 'days').format('YYYYMMDD')
            var endDate = moment().format('YYYYMMDD')
        }
        // var key = 'days=' + days
        var key = 'startDate={0}&endDate={1}'.format(startDate, endDate)
        var type = req.body.type
        if (type) {
            key += '&type=' + type
        }
        req.user._historyOrderCache = req.user._historyOrderCache || {}
        var orderList = req.user._historyOrderCache[key]
        if (orderList) {
            logger.trace('reply the cache data from memory.')
            ProcessOrders(key, orderList, function (array) {
                var resData = filterByType(array, type)
                return res.send({ data: resData })
            })
        } else {
            req.user.its.queryHistoryOrders({ startDate: startDate, endDate: endDate, type: type }, function (historyOrders) {
                if (!historyOrders || historyOrders.length <= 0) {
                    req.user._historyOrderCache[key] = []
                    return res.send({ data: [] })
                }
                req.user._historyOrderCache[key] = historyOrders
                ProcessOrders(key, historyOrders, function (array) {
                    var resData = filterByType(array, type)
                    return res.send({ data: resData })
                })
            })
        }
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

function UpdateOrder(req, orderTagObj) {
    if (!req || !orderTagObj) return
    try {
        orderTagObj.type = OmsUtility.GetOrderTypeAsString(orderTagObj)
        orderTagObj.tif = OmsUtility.GetOrderTIFAsString(orderTagObj)
        orderTagObj[1504] = 1
        if (orderTagObj[487] && typeof orderTagObj[487].TRANSFEE !== 'undefined') {
            orderTagObj.transFee = (orderTagObj[487].TRANSFEE || 0) / 100
        }
        var productObj = dataEntry.get({ name: Const.DataAction.product }, orderTagObj[0])
        if (productObj) {
            var symbolName = OmsUtility.GetSymbolName(productObj, { lang: req.session.userOptions.lang })
            orderTagObj[21] = symbolName
            orderTagObj.symbolName = symbolName
            orderTagObj[1504] = productObj.displayRatio || 1
            if (!orderTagObj[Const.tags.exchange]) {  // case: calculate image without exchange
                orderTagObj[Const.tags.exchange] = productObj.exchange
            }
            orderTagObj[Const.tags.productType] = productObj.productType
            orderTagObj[Const.tags.ISIN] = productObj.ISIN
            orderTagObj[Const.tags.OTCFlag] = productObj.OTCFlag
            if (OmsUtility.IsOTCBond(orderTagObj)) {
                orderTagObj[1504] = productObj.displayRatio || 1
                orderTagObj.accrued_interest = 0
                if (productObj.settlementDate && productObj.preCouponDate && productObj.couponRate) {
                    var days = moment.duration(moment(productObj.settlementDate, 'YYYYMMDD') - moment(productObj.preCouponDate, 'YYYYMMDD')).asDays()
                    orderTagObj.accrued_interest = (orderTagObj[Const.tags.quantity] * productObj.couponRate * days / (productObj.dayCountConvention || 360)) || 0
                }
            }
        }
        CalcTotalAmount(orderTagObj, productObj)
        orderTagObj.commNFees = GetCommNFee(orderTagObj)
    } catch (err) {
        logger.error(err)
    }
}

function CalcTotalAmount(orderTagObj, productObj) {
    if (!orderTagObj) return
    productObj = productObj || {}
    var preClose = productObj[31]
    try {
        CheckFeeModel(orderTagObj)
        orderTagObj.order_amount = 0
        if (orderTagObj[3] && orderTagObj[4]) {
            if (OmsUtility.IsOTCFund(orderTagObj) && orderTagObj[11] == 1) {
                orderTagObj.order_amount = orderTagObj[4] * (preClose || 1)
            } else {
                orderTagObj.order_amount = orderTagObj[3] * orderTagObj[4]
            }
        }
        orderTagObj.transaction_cost = (orderTagObj.useNewTag ? orderTagObj['3418'] : orderTagObj['405']) || 0
        orderTagObj.commission = (orderTagObj.useNewTag ? orderTagObj['3410'] : orderTagObj['402']) || 0
        orderTagObj.total_cost = orderTagObj.transaction_cost + orderTagObj.commission
        calcTransCommission(orderTagObj, productObj)  // fund bond transaction fee
        if (orderTagObj.transaction_commission) {
            orderTagObj.total_cost += orderTagObj.transaction_commission
        }

        var symbol_currency_obj = dataEntry.get({ name: Const.DataAction.currency }, orderTagObj.symbol_currency)
        var total_amount_currency_obj = dataEntry.get({ name: Const.DataAction.currency }, orderTagObj.total_amount_currency)
        var fee_currency_obj = dataEntry.get({ name: Const.DataAction.currency }, orderTagObj.fee_currency)

        var order_amount_in_total_amount_currency = OmsUtility.ConvertCurrency(symbol_currency_obj, total_amount_currency_obj, orderTagObj.order_amount) || 0
        var order_cost_in_total_amount_currency = OmsUtility.ConvertCurrency(fee_currency_obj, total_amount_currency_obj, orderTagObj.total_cost) || 0
        if (orderTagObj[Const.tags.side] == '0') {
            orderTagObj.total_amount = order_amount_in_total_amount_currency + order_cost_in_total_amount_currency
        } else {
            orderTagObj.total_amount = order_amount_in_total_amount_currency - order_cost_in_total_amount_currency
        }
        // calculate total amount for bond order
        if (OmsUtility.IsOTCBond(orderTagObj)) {
            orderTagObj.gross_amount = orderTagObj[Const.tags.price] * orderTagObj[Const.tags.quantity]
            orderTagObj.total_amount = orderTagObj.gross_amount + orderTagObj.accrued_interest
        }
    } catch (err) {
        logger.error(err)
    }
}

function calcTransCommission(orderTagObj, productObj) {
    if (OmsUtility.IsOTCFund(orderTagObj) || OmsUtility.IsOTCBond(orderTagObj)) {
        orderTagObj.transaction_commission = 0
        var side = orderTagObj[11]
        var amount = 0
        if (OmsUtility.IsOTCFund(orderTagObj)) {
            if (side == 1) {
                amount = ((productObj.preClose || 0) * orderTagObj[4])  // use NAV to calc redeem amount for redeem
            } else {
                amount = orderTagObj[3]
            }
        } else {
            amount = orderTagObj[3] * orderTagObj[4]
        }
        var minTransFeeAmount = productObj.minTransFeeAmount || 0
        if (side == 1) {
            if (productObj.sellMinTransFeeAmount) {   //If Sell Min Transaction Fee Amount (omsTag#3607) was defined, this is Buy Min Transaction Fee Amount, but if omsTag#3607 NOT defined, this amount share for both BUY/SELL sides
                minTransFeeAmount = productObj.sellMinTransFeeAmount
            }
        }
        var transFeeAmount = amount * orderTagObj.transFee
        orderTagObj.transaction_commission = transFeeAmount > minTransFeeAmount ? transFeeAmount : minTransFeeAmount
    }
}

//   If IsUseGenericModel=n
//       In single-currency mode, 4xx tags in basic currency, 3xxx tags is 0
//         - fee in base currency: 4xx tags, ratio = 1
//         - fee in symbol currency: 4xx tags, ratio: base -> symbol
//       In multi-currency mode, 4xx tags in symbol currency, 3xxx tags is 0
//         - fee in base currency: 4xx tags, ratio: symbol -> base
//         - fee in symbol currency: 4xx tags, ratio = 1
//    If IsUseGenericModel=y
//       In single-currency mode, 4xx tags in basic currency, 3xxx tags is in symbol currency
//         - fee in base currency: 4xx tags, ratio = 1
//         - fee in symbol currency: 3xx tags, ratio = 1
//       In multi-currency mode, 4xx and 3xxx tags both in symbol currency, for compatibility.
//         - fee in base currency: 4xx tags, ratio: symbol -> base
//         - fee in symbol currency: 4xx tags, ratio = 1
// function CheckFeeModel(orderTagObj) {
//     var confirmationSection = config.iTrader.views.trade.order_confirmation
//     var currencyCustom = dataEntry.custom({ name: Const.DataAction.currency })
//     var isSingleCurrency = currencyCustom && currencyCustom.currencyMode === 'single' ? true : false
//     var feeSetting = confirmationSection.fee
//     var useNewTag = (!feeSetting.isBaseCurrency && feeSetting.genericModel && isSingleCurrency) || false
//     var ratio = 1
//     if (!isSingleCurrency && feeSetting.isBaseCurrency) {
//         ratio = OmsUtility.ConvertCurrency(orderTagObj.symbol_currency, orderTagObj.base_currency, 1)
//     } else if (isSingleCurrency && !feeSetting.genericModel && !feeSetting.isBaseCurrency) {
//         ratio = OmsUtility.ConvertCurrency(orderTagObj.base_currency, orderTagObj.symbol_currency, 1)
//     }
//     return { useNewTag: useNewTag, ratio: ratio }
// }

/*  Simplify charge currency rules and ignore the above one.  v1.2.5
-----------------------------------------------------------------------------------------------------------
Geneirc Mode | Currency Mode | Convertible | Tag# | Charge Currency   | Order Amount    | Total Amount    |
-----------------------------------------------------------------------------------------------------------
NO           | Single        | N/A         | 4xx  | Base Currency     | Symbol Currency | Base Currency   |
NO           | Multiple      | YES         | 4xx  | Symbol Currency   | Symbol Currency | Base Currency   |
NO           | Multiple      | NO          | 4xx  | Symbol Currency   | Symbol Currency | Symbol Currency |
YES          | Single        | N/A         | 341x | Symbol Currency   | Symbol Currency | Base Currency   |
YES          | Multiple      | YES         | 341x | Symbol Currency   | Symbol Currency | Base Currency   |
YES          | Multiple      | NO          | 341x | Symbol Currency   | Symbol Currency | Symbol Currency |
-----------------------------------------------------------------------------------------------------------
*/
function CheckFeeModel(orderTagObj) {
    var productObj = dataEntry.getSymbol(orderTagObj[0]) || {}
    var currencyCustom = dataEntry.custom({ name: Const.DataAction.currency })
    var isSingleCurrency = currencyCustom && currencyCustom.currencyMode === 'single' ? true : false
    var confirmationSection = config.iTrader.views.trade.order_confirmation
    var isGenericModel = confirmationSection.fee.genericModel
    var base_currency = currencyCustom.baseCurrency
    var symbol_currency = orderTagObj[23] || productObj.currency
    var exchange = orderTagObj.exchange || orderTagObj[20]
    orderTagObj.useNewTag = isGenericModel
    orderTagObj.ratio = 1
    orderTagObj.base_currency = base_currency
    orderTagObj.fee_currency = (!isGenericModel && isSingleCurrency) ? base_currency : symbol_currency
    orderTagObj.symbol_currency = symbol_currency
    orderTagObj.total_amount_currency = base_currency
    // if symbol currency is unconvertabled, use symbol currency as total amount currency, instead of base currency
    if (base_currency !== symbol_currency) {
        if (currencyCustom && currencyCustom.currencyMode === 'multi') {
            var currencyObj = dataEntry.get({ name: Const.DataAction.currency }, orderTagObj.symbol_currency)
            if (currencyObj && !currencyObj.isConvertible) {
                orderTagObj.total_amount_currency = orderTagObj.symbol_currency
            }
        }
    }
    // introducted in v1.4.4
    if (confirmationSection.showSymbolCurrencyInTotalAmount && confirmationSection.showSymbolCurrencyInTotalAmount.indexOf(exchange) >= 0) {
        orderTagObj.total_amount_currency = symbol_currency
    }

    var fee_currency_obj = dataEntry.get({ name: Const.DataAction.currency }, orderTagObj.fee_currency)
    var symbol_currency_obj = dataEntry.get({ name: Const.DataAction.currency }, orderTagObj.symbol_currency)
    var total_amount_currency_obj = dataEntry.get({ name: Const.DataAction.currency }, orderTagObj.total_amount_currency)
    orderTagObj.exchange_ratio_list = {
        fee_currency: fee_currency_obj.ratio || 1,
        symbol_currency: symbol_currency_obj.ratio || 1,
        total_amount_currency: total_amount_currency_obj || 1
    }
}

function GetCommNFee(orderTagObj) {
    var confirmationSection = config.iTrader.views.trade.order_confirmation
    var useNewTag = orderTagObj.useNewTag
    var commNFees = []
    if (orderTagObj && confirmationSection.commNFee) {
        for (var i = 0; i < confirmationSection.commNFee.length; i++) {
            var column = confirmationSection.commNFee[i]
            if (column.exchange.indexOf(orderTagObj[Const.tags.exchange]) >= 0) {
                var key = column.key
                if (typeof key === 'string') {
                    switch (key.toLowerCase()) {
                        case 'commision':
                            key = useNewTag ? 3410 : 402; break
                        case 'stamp':
                            key = useNewTag ? 3411 : 403; break
                        case 'levy':
                            key = useNewTag ? 3412 : 404; break
                        case 'ccass':
                            key = useNewTag ? 3413 : 100; break
                        case 'tradefee':
                            key = useNewTag ? 3414 : 421; break
                        case 'tax':
                            key = useNewTag ? 3415 : 422; break
                        case 'charge6':
                            key = useNewTag ? 3416 : 428; break
                        case 'inlevy':
                            key = useNewTag ? 3417 : 423; break
                        case 'totalfee':
                            key = useNewTag ? 3418 : 405; break
                        default: break
                    }
                }
                if (typeof key !== 'undefined') {
                    key = key.toString()
                }
                var commNFee = { i18n: column.i18n }
                if (key) {
                    commNFee.value = orderTagObj[key]
                }
                commNFee.value = commNFee.value || 0
                commNFees.push(commNFee)
            }
        }
    }
    return commNFees
}

// order common check and preprocess order data
function CommonCheck(req, res, next) {
    var body = req.body
    var account = body.account || req.user.id
    if (req.user.accounts.indexOf(account) < 0) {
        return res.send({ error: Const.error.parameter })
    }
    req.body.account = account
    req._orderDataList = []

    // support multi orders
    var symbolList = []
    var sideList = []  // to identify side for fund switch
    var switchFundAmountUnitList = []  // to identify alloc for fund switch-in
    var symbol = req.body.symbol
    if (req.body.type === 'switch') {
        // handle fund switch parameters, support 2 mode: 1: in array, 2: string split by comma
        if (!IsArray(req.body.switchin)) {
            req.body.switchin = req.body.switchin.split(',')
        }
        if (!IsArray(req.body.switchout)) {
            req.body.switchout = req.body.switchout.split(',')
        }
        for (var i = 0; i < req.body.switchin.length; i = i + 2) {
            symbolList.push(req.body.switchin[i])
            switchFundAmountUnitList.push(req.body.switchin[i + 1])
            sideList.push(0)
        }
        for (var i = 0; i < req.body.switchout.length; i = i + 2) {
            symbolList.push(body.switchout[i])
            switchFundAmountUnitList.push(req.body.switchout[i + 1])
            sideList.push(1)
        }
    } else if (symbol) {
        if (IsArray(symbol)) {
            symbolList = symbol
        } else {
            symbolList.push(symbol)
        }
    }

    if (body.cmd === 'change' || body.cmd === 'cancel') {
        var orderObj = dataEntry.get({ name: Const.DataAction.order }, req.user.loginID, body.orderNo)
        if (!orderObj) {
            logger.error('Cannot find order: OrderNo: ' + body.orderNo)
            return res.send({ error: Const.error.orderNotExist })
        }
        symbolList.push(orderObj.symbol)
    }

    for (var i = 0; i < symbolList.length; i++) {
        var productObj = dataEntry.get({ name: Const.DataAction.product }, symbolList[i])
        if (!productObj) {
            return res.send({ error: Const.error.symbolNotExist })
        }
        var displayRatio = productObj.displayRatio || 1
        var orderObj = dataEntry.get({ name: Const.DataAction.order }, req.user.loginID, body.orderNo)
        var order = {
            symbol: symbolList[i],
            orderNo: body.orderNo,
            cmd: body.cmd || 'add',
            extra: {  // extra data will submit to ITS
                userRef: uuid.v1(),
                account: account,
                password: body.password,
                compSystemRef: '',
                instruct: 0
            },
            productObj: productObj,
            orderObj: orderObj
        }
        if (orderObj) {
            order.side = orderObj.side
        }
        if (req.user.BCAN && configuration._isAShareExchange(productObj.exchange)) {
            if (req.user.BCAN.length == 1) {
                order.extra.compSystemRef = util.getKeyValuePairStr(order.extra.compSystemRef, 'BCAN', req.user.BCAN[0])
                // order.extra.compSystemRef = 'BCAN=' + req.user.BCAN[0]
            } else if (req.user.BCAN.length > 1 && body.BCAN) {
                order.extra.compSystemRef = util.getKeyValuePairStr(order.extra.compSystemRef, 'BCAN', body.BCAN)
            }
        }
        try {
            if (isNaN(ToNumber(body.price))
                || isNaN(ToNumber(body.quantity))
                || isNaN(ToNumber(body.changePrice))
                || isNaN(ToNumber(body.changeQuantity))
                || isNaN(ToNumber(body.stopPrice))
                || isNaN(ToNumber(body.changeStopPrice))) {
                return res.send({ error: Const.error.parameter })
            }
            if (body.price) {
                var price = body.price
                if (IsArray(price) && price.length >= i) {
                    order.price = ToNumber(price[i]) / displayRatio
                } else {
                    order.price = ToNumber(price) / displayRatio
                }
            }
            if (body.quantity) {
                var quantity = body.quantity
                if (IsArray(quantity) && quantity.length >= i) {
                    order.quantity = ToNumber(quantity[i])
                } else {
                    order.quantity = ToNumber(quantity)
                }
            }
            if (body.side) {
                order.side = ToNumber(body.side)
            }
            if (body.changePrice) {
                order.changePrice = ToNumber(body.changePrice) / displayRatio
            }
            if (body.changeStopPrice) {
                order.extra.price1 = ToNumber(body.changeStopPrice) / displayRatio
            }
            if (body.changeQuantity) {
                order.changeQuantity = ToNumber(body.changeQuantity)
            }

            // order type
            switch (body.type) {
                case 'market':
                    order.extra.instruct |= ordConst.omsOrderMarket | ordConst.omsOrderManual  // include manual flag for market order
                    break
                case 'auction':
                case 'auctionLimit':
                    order.extra.instruct |= ordConst.omsOrderPreOpen
                    break
                case 'enhancedLimit':
                    order.extra.instruct |= ordConst.omsOrderEnhancedLimit
                    break
                case 'specialLimit':
                    order.extra.instruct |= ordConst.omsOrderFAK
                    break
                case 'stopLimit':
                    order.extra.instruct |= ordConst.omsOrderStopLimit
                    order.extra.price1 = body.stopPrice / displayRatio
                    break
                default:
                    // order.extra.instruct = 0
                    break
            }
            // order tif
            if (body.tif) {
                var tif = body.tif
                if (tif === 'fak') {
                    order.extra.instruct |= ordConst.omsOrderFAK
                } else if (tif === 'fok') {
                    order.extra.instruct |= ordConst.omsOrderFOK
                } else if (tif === 'gtc') {
                    order.extra.instruct |= ordConst.omsOrderGTC
                } else if (tif === 'gtd' && body.date) {   // new design for api
                    order.extra.instruct |= ordConst.omsOrderGTC
                    order.extra.expirationDate = body.date
                    let orderDate = moment().format('YYYY/MM/DD')
                    order.extra.GTCInfo = '{0},{1},{2},{3},{4}'.format(orderDate, order.price, order.quantity, 0, 0)
                } else if (tif.indexOf('gtd:') >= 0) {   // old design for elite
                    var expiryDate = tif.substr(tif.indexOf(':') + 1)
                    order.extra.instruct |= ordConst.omsOrderGTC
                    order.extra.expirationDate = expiryDate
                    let orderDate = moment().format('YYYY/MM/DD')
                    order.extra.GTCInfo = '{0},{1},{2},{3},{4}'.format(orderDate, order.price, order.quantity, 0, 0)
                }
            }

            // for futures & options
            if (body.openClose) {
                order.extra.openClose = body.openClose
            }
            if (body.principal) {
                order.extra.principal = body.principal
            }
            if (body.option) {
                var optionArray = body.split(body.option)
                if (optionArray.indexOf('T+1')) {
                    order.extra.instruct2 |= ordConst.omsOrder2AHFT
                }
            }


            if (orderObj) {
                if (body.changeGTD || body.changeDate) {  // old desing use changeGTD while new design use changeDate
                    order.extra.expirationDate = body.changeGTD || body.changeDate
                }
                let GTCInfoArray = (orderObj.GTCInfo || '').split(',')
                if (GTCInfoArray && GTCInfoArray.length > 2) {
                    order.extra.GTCInfo = '{0},{1},{2},{3},{4}'.format(GTCInfoArray[0], GTCInfoArray[1], order.changeQuantity || GTCInfoArray[2], 0, 0)
                }
            }

            if (OmsUtility.IsOTCFund(productObj)) {
                if (order.side == 0) {
                    order.quantity = 1
                    if (body.fundAmountUnit) {
                        order.price = ToNumber(body.fundAmountUnit)
                    }
                } else {
                    order.price = 1
                    if (body.fundAmountUnit) {
                        order.quantity = ToNumber(body.fundAmountUnit)
                    }
                }
            } else if (OmsUtility.IsOTCBond(productObj)) {
                order.extra.instruct = 0
                if (body.bondPrice) {
                    order.price = ToNumber(body.bondPrice) / displayRatio
                }
                if (body.bondPAR) {
                    order.quantity = ToNumber(body.bondPAR)
                }
            }
            if (body.cmd !== 'change' && body.cmd !== 'cancel') {  // calculate or add
                if (config._isNeedPriceQuote(productObj.exchange)) {
                    order.extra.instruct3 |= ordConst.omsOrder3Quote
                    order.extra.instruct1 |= ordConst.omsOrder1Alert
                    order.extra.instruct |= ordConst.omsOrderManual
                    order.extra.compSystemRef += 'QState=1,'
                    order.price = 0  // set price = 0 when in price quote
                }
            }
            if (req.body.type === 'switch') {
                if (symbolList.length === sideList.length) {
                    order.side = sideList[i]
                }
                if (order.side == 0) {
                    order.alloc = switchFundAmountUnitList[i]
                } else if (order.side == 1) {
                    order.quantity = switchFundAmountUnitList[i]
                }
            }
            req._orderDataList.push(order)
        } catch (err) {
            logger.error(err)
            return res.send({ error: Const.error.internal })
        }
    }
    if (req._orderDataList.length > 0) {
        next()
    } else {
        return res.send({ error: Const.error.parameter })
    }
}

function AddFundSwitch(req, res, next) {
    var type = req.body.type
    if (type === 'switch') {
        var switchin = req.body.switchin
        var switchout = req.body.switchout
        if (switchin.length > 0 && switchin.length % 2 === 0 && switchout.length > 0 && switchout.length % 2 === 0) {
            var inList = []
            var outList = []
            var blkID = (configuration.iTrader.oms.fundSwitchIDPrefix || '') + moment().format('YYMMDD') + String(fundSwitchIDGenerator.getSeq()).zerofill(6)
            for (var i = 0; i < switchin.length; i = i + 2) {
                inList.push({
                    symbol: switchin[i], side: 0, price: 1, quantity: 1, extra: {
                        userRef: uuid.v1(),
                        instruct2: ordConst.omsOrder2Switch | ordConst.omsOrder2IgnoreCredit,
                        compSystemRef: 'BLKID={0},SwitchP={1}'.format(blkID, switchin[i + 1])
                    }
                })
            }
            for (var i = 0; i < switchout.length; i = i + 2) {
                outList.push({
                    symbol: switchout[i], side: 1, price: 1, quantity: switchout[i + 1], extra: {
                        userRef: uuid.v1(),
                        instruct2: ordConst.omsOrder2Switch,
                        compSystemRef: 'BLKID={0}'.format(blkID)
                    }
                })
            }
            req.user.its.calculateMultiOrder(outList, function (err, data) {
                if (err && err.length > 0) {
                    return res.send({ error: err[0].makeOmsTag() })
                } else {
                    req.user.its.submitFundSwitchOrder(blkID, outList.concat(inList), function (err, data) {
                        var errorOrderList = []
                        var successOrderList = []
                        if (data && IsArray(data)) {
                            for (var o of data) {
                                var tagObj = util.GetOmsTagObj(o)
                                if (tagObj) {
                                    successOrderList.push(tagObj)
                                }
                            }
                        }
                        if (err && IsArray(err)) {
                            for (var e of err) {
                                var tagObj = util.GetOmsTagObj(e)
                                if (tagObj) {
                                    errorOrderList.push(tagObj)
                                }
                            }
                            req.user.its.rejectOrder(data)
                            return res.send({ error: errorOrderList, data: successOrderList })
                        } else {
                            return res.send({ data: successOrderList })
                        }
                    })
                }
            })
        } else {
            res.send({ error: Const.error.parameter })
        }
    } else next()
}

function AddMultiOrder(req, res, next) {
    if (req.body.type !== 'multi') return next()
    req.user.its.submitAddMultiOrder(req._orderDataList, function (err, data) {
        if (err) {
            for (var i = 0; i < err.length; i++) {
                err[i] = util.GetOmsTagObj(err[i])
            }
        }
        if (data) {
            for (var i = 0; i < data.length; i++) {
                data[i] = util.GetOmsTagObj(data[i])
            }
        }
        res.send({ error: err, data: data })
    })
}

function SuitabilityChecking(req, res, next) {
    if (req.body.orderNo && (req.body.cmd === 'change' || req.body.cmd === 'cancel')) return next()
    var account = req.body.account || req.user.id
    if (!req.user.accountsInfo || !req.user.accountsInfo[account]) return next()
    var accountCustomInfo = req.user.accountsInfo[account].customInfo
    for (var s of req._orderDataList) {
        if (s.side == 1) continue   // skip redeem/sell order checking
        var productObj = s.productObj
        var prodFlag = productObj.prodFlag
        if (!OmsUtility.IsOTCFund(productObj) && !OmsUtility.IsOTCBond(productObj)) continue
        if (accountCustomInfo) {
            // =========== product properties
            var p_RPQLevel = productObj.RPQLevel ? productObj.RPQLevel : ''
            var p_CIES = productObj.CIESFlag
            var p_NationalityCodes = productObj.nationality ? productObj.nationality.split(',') : []
            var p_PIFlag = productObj.ProInvestorFlag
            var p_DerivativeKnowledge
            if (prodFlag & 1024) {
                p_DerivativeKnowledge = true
            }
            // ============ account properties
            var a_RPQLevel = accountCustomInfo.RPQLevel ? accountCustomInfo.RPQLevel : ''
            var a_CIES = accountCustomInfo.CIES
            var a_NationalityCodes = accountCustomInfo.NationalityCode //NationalityCode
            var a_PIFlag = accountCustomInfo.ProfessionalInvestor
            var a_DerivativeKnowledge = accountCustomInfo.DerivativeKnowledge
            // ============ checking
            if (!p_RPQLevel || !a_RPQLevel || a_RPQLevel < p_RPQLevel) {
                var error = { errorCode: 'DCFUND009', parameters: [p_RPQLevel || 'N/A', a_RPQLevel || 'N/A'] }
                if (prodFlag & 256) {  // PFLAG_CONF_OFF
                    return res.send({ error: error })
                } else {
                    appendConfirmInfo(req, error)  // change to need confirm v1.1.5
                }
            }
            if (a_CIES == 'Y' && p_CIES != 'Y') {
                return res.send({ error: { errorCode: 'DCFUND010' } })
            }
            if (a_NationalityCodes && (p_NationalityCodes).indexOf(a_NationalityCodes) >= 0) {
                return res.send({ error: { errorCode: 'DCFUND011' } })
            }
            if (p_PIFlag == 1 && a_PIFlag != 1) {
                return res.send({ error: { errorCode: 'DCFUND012' } })
            }
            if (a_DerivativeKnowledge !== 'Y' && p_DerivativeKnowledge) {
                var error = { errorCode: 'DCFUND014' }
                if (prodFlag & 256) {  // PFLAG_CONF_OFF
                    return res.send({ error: error })
                } else {
                    appendConfirmInfo(req, error)
                }
            }
        } else {
            return res.send({ error: { errorCode: 'DCFUND010' } })
        }
    }
    return next()
}

function TXNChecking(req, res, next) {
    if (req.body.cmd === 'cancel') return next()
    var currencyCustom = dataEntry.custom({ name: Const.DataAction.currency })
    try {
        var totalSwitchOutAmount = 0
        for (var orderData of req._orderDataList) {
            if (orderData.orderObj) {
                if (orderData.orderObj.instruct3 && orderData.orderObj.compSystemRef.QState == '3') {
                    return next()  // skip checking for agree price quote action
                }
            }
            var productObj = orderData.productObj
            var otcfund = OmsUtility.IsOTCFund(productObj)
            var otcbond = OmsUtility.IsOTCBond(productObj)
            if (!otcfund && !otcbond) continue
            var side = orderData.side

            // product amount checking
            var minPurchaseAmount = productObj.minPurchaseAmount || 0
            var incrementAmount = productObj.incrementAmount || 0
            var amount = 0
            if (otcbond) {
                amount = orderData.quantity  // use nominal value for BOND
            } else if (otcfund) {
                if (side == 1) {
                    amount = ((productObj.preClose || 0) * orderData.quantity)  // use NAV to calc redeem amount for redeem
                    totalSwitchOutAmount += amount
                } else {
                    amount = (orderData.price)
                }
            }
            if (orderData.cmd === 'change') {
                amount = orderData.changePrice
            }

            if (otcfund) {
                if (side == 0) {
                    if (amount < minPurchaseAmount && req.body.type !== 'switch') { // check minimum subscription amount for fund
                        return res.send({ error: { errorCode: 'DCFUND006', parameters: [minPurchaseAmount] } })
                    }
                } else if (side == 1) {
                    // check min hold unit
                    // formual: Minimum Holding Unit = ROUNDUP(Minimum Holding in Amount / 95% NAV / 10, 0) * 10
                    if (productObj.minHoldAmount && productObj.preClose) {
                        var minHoldUnit = Math.ceil(productObj.minHoldAmount / (0.95 * productObj.preClose))
                        var positionRecord = dataEntry.get({ name: Const.DataAction.position }, req.user.loginID, productObj.symbol + ':' + req.user.id)
                        var orders = dataEntry.get({ name: Const.DataAction.order }, req.user.loginID)
                        var availableUnit = OmsUtility.GetQuantity(positionRecord, orders)
                        var lastHoldUnit = availableUnit - orderData.quantity
                        if (minHoldUnit > 0 && lastHoldUnit > 0 && lastHoldUnit < minHoldUnit) {
                            return res.send({ error: { errorCode: 'DCFUND015' } })
                        }
                    }
                }
            } else if (otcbond) {
                if (amount < minPurchaseAmount || ((amount - minPurchaseAmount) / incrementAmount % 1 !== 0)) { // check minimum purchasing amount & incremental amount, both buy and sell
                    return res.send({ error: { errorCode: 'DCBOND003', parameters: [minPurchaseAmount, incrementAmount] } })
                }
            }

            // check transaction fee
            var prodFlag = productObj.prodFlag || 0
            var isCalc = false
            if (prodFlag & ordConst.PFLAG_TXNFEE_CALC) {
                if (side == 0 && (prodFlag & ordConst.PFLAG_TXNFEE_BUY)) isCalc = true
                if (side == 1 && (prodFlag & ordConst.PFLAG_TXNFEE_SELL)) isCalc = true
            } else if (!(prodFlag & ordConst.PFLAG_TXNFEE_FREE)) {
                isCalc = true
            }
            var maxTransFeeRate = productObj.maxTransFeeRate || 0
            var minTransFeeAmount = productObj.minTransFeeAmount || 0
            if (side == 1) {
                if (productObj.sellMaxTransFeeRate) {  //If Sell Max Transaction Fee Rate (omsTag#3606) was defined, this is Buy Max Transaction Fee Rate, but if omsTag#3606 was NOT defined, this rate share for both BUY/SELL sides
                    maxTransFeeRate = productObj.sellMaxTransFeeRate
                }
                if (productObj.sellMinTransFeeAmount) {   //If Sell Min Transaction Fee Amount (omsTag#3607) was defined, this is Buy Min Transaction Fee Amount, but if omsTag#3607 NOT defined, this amount share for both BUY/SELL sides
                    minTransFeeAmount = productObj.sellMinTransFeeAmount
                }
            }
            var symbol_currency_obj = dataEntry.get({ name: Const.DataAction.currency }, productObj.currency)
            var base_currency_obj = dataEntry.get({ name: Const.DataAction.currency }, currencyCustom.baseCurrency)
            var transFeeAmount = OmsUtility.ConvertCurrency(symbol_currency_obj, base_currency_obj, amount * maxTransFeeRate)
            if (isCalc) {
                req.TXN = { CalcMode: isCalc, txnfee: maxTransFeeRate * 100, minTxnFeeAmt: minTransFeeAmount }
                if (req.TXN.txnfee || req.TXN.txnfee == 0) {
                    orderData.extra.compSystemRef += 'TRANSFEE=' + req.TXN.txnfee + ','
                }
                if (req.TXN.minTxnFeeAmt || req.TXN.minTxnFeeAmt == 0) {
                    orderData.extra.compSystemRef += 'MINTRANSFEE=' + req.TXN.minTxnFeeAmt + ','
                }
                if (transFeeAmount < minTransFeeAmount) {
                    appendConfirmInfo(req, { errorCode: 'DCFUND013', parameters: [transFeeAmount, minTransFeeAmount] })
                }
            }
        }

        // fund switch checking
        if (req.body.type === 'switch') {
            var discountTotalAmount = 0.9 * (totalSwitchOutAmount || 0)
            for (var o of req._orderDataList) {
                if (o.side == 0) {
                    if (discountTotalAmount * (o.alloc || 0) / 100 < (o.productObj.minPurchaseAmount || 0)) {
                        return res.send({ error: { errorCode: 'DCFUND006', parameters: [minPurchaseAmount] } })
                    }
                }
            }
        }

    } catch (error) {
        logger.error('check BOND/FUND failed. error: ' + error)
    }
    return next()
}

// append confirmation info, in array
function appendConfirmInfo(req, obj) {
    if (!req || !obj) return
    req.isNeedConfirm = req.isNeedConfirm || []
    req.isNeedConfirm.push(obj)
}

module.exports = router