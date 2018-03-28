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

{ $Id: position.js,v 1.21 2017/08/14 09:44:39 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

/*
  <loginID, <symbol, position>>
*/

var base = require('./base'),
    Product = require('../market/product'),
    schema = require('common').Schema,
    Const = require('../../lib/const'),
    tradeDataCenter = require('./trade'),
    logger = require('common').Logger.instance().getLogger(),
    config = require(__config_path)

class Position extends base {
    constructor(name) {
        super(name)
        this.pendingList = []
        this.event.on('done', function (data) {
            this.event.emit(data.loginID, data.value)
            this.event.emit(this.name, data.value)
            if (this.pendingList.length > 0) {
                var item = this.pendingList[0]
                this.addTrade(item.loginID, item.key, item.value)
            }
        }.bind(this))
        this.avgPriceMode = config.iTrader.oms.avgPriceMode
    }

    set(loginID, key, value, options) {
        if (!loginID || !key || !value || !value.account || !value.account.trim()) return  //fulbright case, dismissed trades which without account
        var account_symbol_key = value.symbol + ':' + value.account
        if (options && options.type === 'bod') {
            this.addBodData(loginID, account_symbol_key, value)
        } else {
            if (this.pendingList.length <= 0) {
                this.addTrade(loginID, account_symbol_key, value)
            } else {
                this.pendingList.push({ loginID: loginID, key: account_symbol_key, value: value })
            }
        }
        return value
    }

    addBodData(loginID, key, value) {
        if (!loginID || !key || !value) return
        try {
            if (!this.maps.has(loginID)) {
                this.maps.set(loginID, new Map())
            }
            Product.getAsny(value.symbol, { isDDS: true }, function (err, symbolObj) {   // only need data from DDS, exclude static file data
                if (err) {
                    logger.error(err)
                }
                var preClose = (symbolObj ? symbolObj.preClose : 0) || 0
                var positionObj = schema.OrderSchema.makeFromObject({})
                UpdatePositionObj(positionObj)
                positionObj.OTCFlag = symbolObj ? symbolObj.OTCFlag : 0
                positionObj.productType = symbolObj ? symbolObj.productType : 1
                var quantity = value.quantity || 0
                var price = value.avgPrice || preClose || 0
                positionObj.bod = value  // link bod obj to position obj
                positionObj.trades = {}
                positionObj.symbol = value.symbol
                positionObj.account = value.account || loginID
                positionObj.quantity = quantity
                positionObj.bodAmount = quantity * price
                positionObj.bodQuantity = quantity
                positionObj.bodShortQuantity = value.shortQuantity || 0
                positionObj.totalQuantity = quantity
                positionObj.totalAmount = price * quantity
                positionObj.avgPrice = value.avgPrice || preClose || 0
                // positionObj.avgCost = value.avgPrice || preClose
                if (this.avgPriceMode == 1) {   // follow the formula, use preClose first for avgPriceMode 1
                    positionObj.costPrice = preClose || value.avgPrice
                } else {
                    positionObj.costPrice = value.avgPrice || preClose
                }
                positionObj.preClose = preClose
                this.maps.get(loginID).set(key, positionObj)
                this.event.emit(loginID, value)
                this.event.emit(this.name, positionObj)
            }.bind(this))
        } catch (err) {
            logger.error(err)
        }
    }

    addTrade(loginID, key, value) {
        if (!key || !value || !value.exchNo || !value.tranNo) return
        if (!this.maps.has(loginID)) {
            this.maps.set(loginID, new Map())
        }
        try {
            Product.getAsny(value.symbol, { isDDS: true }, function (err, symbolObj) {
                if (err) {
                    logger.error(err)
                }
                symbolObj = symbolObj || {}
                var positionObj
                if (this.maps.get(loginID).has(key)) {
                    positionObj = this.maps.get(loginID).get(key)
                } else {
                    positionObj = schema.OrderSchema.makeFromObject({})
                    UpdatePositionObj(positionObj)
                    positionObj.trades = {}
                    this.maps.get(loginID).set(key, positionObj)
                }
                if (positionObj.trades[value.tranNo]) {
                    var oldTrade = positionObj.trades[value.tranNo]
                    if (oldTrade.price != value.price || oldTrade.quantity != value.quantity || oldTrade.status != value.status) {
                        logger.info('[{0}] received trade {1} update.'.format(loginID, value.tranNo))
                        this.recalc(positionObj)
                        return
                    } else {
                        return  // skip duplicate trade
                    }
                }
                positionObj.trades[value.tranNo] = value  // link trade object to position obj
                positionObj.symbol = value.symbol
                positionObj.exchange = symbolObj.exchange || value.exchange
                positionObj.account = value.account || loginID
                value.originalTradePrice = value.price  // apply an original trade price for showing in the trade detail 
                value.price = value.price || symbolObj.preClose || 0 // security settlement, price is 0, set the preclose as the trading price
                positionObj.preClose = symbolObj.preClose || 0
                positionObj.currency = symbolObj.currency || ''
                if (value.voucherType === 'security') {
                    if (value.side == Const.oms.side_sell) {
                        positionObj.depositAmount += value.quantity * positionObj.preClose
                        positionObj.depositQuantity += value.quantity
                        positionObj.quantity -= value.quantity
                    } else if (value.side == Const.oms.side_buy) {
                        positionObj.withdrawAmount += value.quantity * positionObj.preClose
                        positionObj.withdrawQuantity += value.quantity
                        positionObj.quantity += value.quantity
                    }
                } else {
                    if (value.side == Const.oms.side_buy) {
                        positionObj.todayBuyAmount += value.quantity * value.price
                        positionObj.todayBuyQuantity += value.quantity
                        positionObj.quantity += value.quantity
                    } else if (value.side == Const.oms.side_sell) {
                        positionObj.todaySellAmount += value.quantity * value.price
                        positionObj.todaySellQuantity += value.quantity
                        positionObj.quantity -= value.quantity
                    }
                }
                if (this.avgPriceMode == 0) {
                    this.applyAvgPriceMode0(positionObj, value)
                } else if (this.avgPriceMode == 1) {
                    this.applyAvgPriceMode1(positionObj, value)
                } else {
                    this.applyAvgPriceMode2(positionObj, value)
                }
                // value.price = originalPrice  // v1.2.2: for security settlement, use (price = preclose) for position calculation, 
                // but in orderbook trade detail, it should display the original price as trade price
                // v1.2.3 rollback to the version before v1.2.2, change this value may cause unexpected issues.
                // positionObj.quantity = positionObj.totalQuantity
                this.event.emit('done', { loginID: loginID, key: key, value: positionObj })
            }.bind(this))
        } catch (err) {
            logger.error(err)
        }
    }

    // recalc position if received trade update
    recalc(loginID, positionObj) {
        if (!loginID || !positionObj) return
        var symbol = positionObj.symbol
        var trades = tradeDataCenter.get({ name: Const.DataAction.trade }, loginID)
        var tradeList = []
        if (trades && trades.length > 0) {
            for (var t of trades) {
                if (t.symbol === symbol) {
                    tradeList.push(t)
                }
            }
        }
        tradeList.sort(function (a, b) {
            if (a.time === b.time) return 0
            return a.time > b.time ? 1 : -1
        })
        var bodObj = positionObj.bod
        this.maps.get(loginID).delete(symbol)
        if (bodObj) {
            this.set(loginID, symbol, bodObj, { type: 'bod' })
        }
        for (var t of tradeList) {
            this.set(loginID, symbol, t)
        }
    }

    /*
    * (BODAmt + TodayBuyAmt - TodaySellAmt + DepositAmt - WithdrawAmt) / (BODQty + TodayBuyQty - TodaySellQty + DepositQty - WithdrawQty)
    */
    applyAvgPriceMode0(po, trade) {
        if (!po || !trade) return
        po.costPrice = (po.bodAmount + po.todayBuyAmount - po.todaySellAmount + po.depositAmount - po.withdrawAmount) / (po.bodQuantity + po.todayBuyQuantity - po.todaySellQuantity + po.depositQuantity - po.withdrawQuantity)
    }

    /*
    * formula: ((BODLongQty - BODShortQty) * PreClose + TodayBuyAmt) / (BODLongQty - BODShortQty + TodayBuyQty)
    */
    applyAvgPriceMode1(po, trade) {
        if (!po || !trade) return
        po.costPrice = ((po.bodQuantity - po.bodShortQuantity) * po.preClose + po.todayBuyAmount) / (po.bodQuantity - po.bodShortQuantity + po.todayBuyQuantity)

    }

    /*
    * First-In-First-Net
    */
    applyAvgPriceMode2(positionObj, trade) {
        if (typeof (positionObj) !== 'object') return
        var avgCost = positionObj.totalQuantity === 0 ? 0 : (positionObj.totalAmount / positionObj.totalQuantity)
        if (trade.side == Const.oms.side_buy) {
            if (positionObj.totalQuantity >= 0) {
                positionObj.totalQuantity += trade.quantity
                positionObj.totalAmount += (trade.quantity * trade.price)
            } else {
                var netQuantity = Math.min(Math.abs(positionObj.totalQuantity), Math.abs(trade.quantity))
                var leftQuantity = Math.abs(Math.abs(trade.quantity) - netQuantity)
                positionObj.totalQuantity += trade.quantity
                positionObj.totalAmount += (avgCost * netQuantity)
                if (leftQuantity > 0) {
                    positionObj.totalAmount += (leftQuantity * trade.price)
                }
            }
        } else if (trade.side == Const.oms.side_sell) {
            if (positionObj.totalQuantity > 0) {
                var netQuantity = Math.min(Math.abs(positionObj.totalQuantity), Math.abs(trade.quantity))
                var leftQuantity = Math.abs(Math.abs(trade.quantity) - netQuantity)
                positionObj.totalQuantity -= trade.quantity
                positionObj.totalAmount -= (avgCost * netQuantity)
                if (leftQuantity > 0) {
                    positionObj.totalAmount -= leftQuantity * trade.price
                }
            } else {
                positionObj.totalQuantity -= trade.quantity
                positionObj.totalAmount -= trade.quantity * trade.price
            }
        }
        positionObj.costPrice = positionObj.totalQuantity === 0 ? 0 : positionObj.totalAmount / positionObj.totalQuantity
    }
}

function UpdatePositionObj(p) {
    if (p) {
        p.quantity = 0
        p.bodAmount = 0
        p.bodQuantity = 0
        p.bodShortQuantity = 0
        p.realizedPL = 0
        p.unrealizedPL = 0
        p.bodPL = 0
        p.execPL = 0
        p.costPrice = 0
        p.preClose = 0
        p.totalQuantity = 0
        p.totalAmount = 0
        p.todayBuyAmount = 0
        p.todayBuyQuantity = 0
        p.todaySellAmount = 0
        p.todaySellQuantity = 0
        p.depositAmount = 0
        p.depositQuantity = 0
        p.withdrawAmount = 0
        p.withdrawQuantity = 0
    }
}

module.exports = new Position('position')