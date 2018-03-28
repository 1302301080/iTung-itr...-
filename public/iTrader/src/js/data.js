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

{ $Id: data.js,v 1.43 2018/02/02 07:57:38 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var OrderMgr = {
    orders: {},
    callbackList: [],
    get: function (orderNo) {
        for (var o in this.orders) {
            var orderObj = this.orders[o]
            if (orderObj[6] == orderNo) return orderObj
        }
    },
    set: function (orderList) {
        if (!orderList) return
        var callbackData = []
        for (var i = 0; i < orderList.length; i++) {
            var oo = orderList[i]
            if (!oo || !oo._id) continue
            if (oo.switchID) oo._id = oo.switchID   // swithc id is the key of fund switch order
            var orderObj = this.orders[oo._id] || {}
            this.orders[oo._id] = this.orders[oo._id] || {}
            for (var o in oo) {
                orderObj[o] = oo[o]
            }
            this.parse(oo, orderObj)
            this.orders[oo._id] = orderObj
            callbackData.push(this.orders[oo._id])
        }
        for (var i = 0; i < this.callbackList.length; i++) {
            var cb = this.callbackList[i]
            cb(callbackData)
        }
        return orderList
    },
    on: function (cb) {
        if (typeof cb !== 'function') return
        var callbackData = []
        for (var o in this.orders) {
            callbackData.push(this.orders[o])
        }
        cb(callbackData)
        this.callbackList = this.callbackList || []
        this.callbackList.push(cb)
    },
    parse: function (srcObj, destObj) {
        if (!srcObj) return
        if (!destObj) {
            destObj = srcObj  // if no dest obj specified, use the original one(src order)
        }
        var rawData = {
            "11": srcObj[11]
        }
        var side = srcObj[11]
        if (srcObj.voucherType === 'cash') {
            side = rawData[11] == '1' ? 2 : 3
        } else if (srcObj.voucherType === 'security') {
            side = rawData[11] == '1' ? 3 : 2
        }
        // use the last order's value
        destObj[25] = srcObj[25]
        destObj[11] = $._map.side(side)
        destObj[5] = $._map.status(srcObj[5])
        destObj[400] = $._map.source(srcObj[400])
        destObj.symbolName = GetSymbolName(srcObj)
        destObj.shortName = GetShortSymbolName(srcObj)
        destObj.options = GetOptions(destObj)
        if (destObj.voucherType !== 'cash') {
            destObj[3] = getDisplayPrice(destObj[3], 'order', srcObj)
        } else {
            destObj[3] = $._format.amount(srcObj[3])
        }
        destObj[42] = getDisplayPrice(destObj[42], 'avg', srcObj)
        if (srcObj.voucherType === 'cash') {
            destObj[3] = srcObj[3]
        } else if (IsOTCFund(srcObj)) {
            if (rawData[11] == 0) {
                destObj[3] = $._format.amount(srcObj[3])
                destObj[4] = Number.NaN
                destObj[11] = $._map.side(4)
            } else {
                destObj[3] = Number.NaN
                destObj[11] = $._map.side(5)
            }
            if (!destObj.investAmount || destObj.investAmount != 0) {
                destObj.investAmount = Number.NaN
            }
            if (srcObj.switchID) {
                destObj[6] = srcObj.switchID
                destObj[11] = $._map.side(6)
                destObj[4] = Number.NaN
                destObj[3] = Number.NaN
                destObj.investAmount = Number.NaN
                destObj[0] = messages.NotApplicableValue.text
                destObj[23] = messages.NotApplicableValue.text
                destObj.FundSwitchOrderList = destObj.FundSwitchOrderList
            }
        } else if (IsOTCBond(srcObj)) {
            destObj[3] = $._format.price(srcObj[3], '#,##0.00######')
        }
        return destObj
    }
}

var ErrorOrderMgr = {
    errorList: [],
    callbackList: [],
    set: function (data) {
        if (!data || data.length <= 0) return
        this.errorList = data
        for (var i = 0; i < this.callbackList.length; i++) {
            var cb = this.callbackList[i]
            cb(data)
        }
    },
    on: function (cb) {
        if (typeof cb !== 'function') return
        if (this.errorList && this.errorList.length > 0) {
            cb(this.errorList)
        }
        this.callbackList = this.callbackList || []
        this.callbackList.push(cb)
    }
}

var PositionMgr = {
    positions: {},
    pendingPositions: [],  // pending position list, for emit
    lastMessageDatetime: null,  // to defined all message received
    callbackList: [],
    init: function () {
        var that = this
        setInterval(function () {
            that.lastMessageDatetime = that.lastMessageDatetime || (new Date()).getTime()
            if (!that.pendingPositions || that.pendingPositions.length <= 0) return
            if ((new Date()).getTime() - that.lastMessageDatetime > 500) {
                for (var i = 0; i < that.callbackList.length; i++) {
                    var cb = that.callbackList[i]
                    cb(that.pendingPositions)
                }
                that.pendingPositions = []
            }
        }, 500)
    },
    get: function (options) {
        options = options || {}
        var res = []
        for (var p in this.positions) {
            var obj = this.positions[p]._raw
            if (options.account && options.account !== obj[10]) continue
            if (options.symbol && options.symbol !== obj[0]) continue
            if (options.exchange && options.exchange !== obj[20]) continue
            res.push(this.positions[p])
        }
        return res
    },
    set: function (positionList) {
        if (!positionList || positionList.length <= 0) return
        for (var i = 0; i < positionList.length; i++) {
            var po = positionList[i]
            if (!po || !po._id) continue
            this.positions[po._id] = this.positions[po._id] || {}
            for (var p in po) {
                this.positions[po._id][p] = po[p]
            }
            this.positions[po._id][31] = getDisplayPrice(po[31], 'market', po)
            this.positions[po._id].costPrice = getDisplayPrice(po.costPrice, 'avg', po)
            this.positions[po._id].marketValue = po.marketValue === Number.MIN_SAFE_INTEGER ? Number.NaN : po.marketValue
            this.positions[po._id].acceptValue = po.acceptValue === Number.MIN_SAFE_INTEGER ? Number.NaN : po.acceptValue
            this.positions[po._id].market = $._map.exchange(po[20])
            var account = po[10]
            if (IsMarginAccount(account)) {
                if (po.acceptValue == Number.NaN) {
                    this.positions[po._id].acceptValue = 0  // v1.3.2 margin account cannot display N/A
                }
            } else if (!initial_data.forceShowAcceptValue) {
                this.positions[po._id].acceptValue = Number.NaN
            }
            this.pendingPositions.push(this.positions[po._id])
        }
        AccountMgr.updateAcctInfo()
    },
    on: function (cb) {
        if (typeof cb !== 'function') return
        var callbackData = []
        for (var p in this.positions) {
            callbackData.push(this.positions[p])
        }
        cb(callbackData)
        this.callbackList = this.callbackList || []
        this.callbackList.push(cb)
    }
}
PositionMgr.init()

var ExchangeMgr = {
    current_exchange: '',
    exchanges: [],
    exchange_flag: {},
    exchange_orderType: {},
    exchange_tif: {},
    exchange_isDayTrade: {},
    exchange_isPriceQuote: {},
    exchange_isAShare: {},
    callbackList: [],
    set: function (exchangeList) {
        if (!exchangeList) return
        for (var e in exchangeList) {
            var exchangeObj = exchangeList[e]
            if (!exchangeObj) continue
            this.exchange_flag[e] = exchangeObj.icon || ''
            this.exchange_orderType[e] = exchangeObj.type || []
            this.exchange_tif[e] = exchangeObj.tif || []
            this.exchange_isDayTrade[e] = exchangeObj.isDayTrade
            this.exchange_isAShare[e] = exchangeObj.isAShare
            this.exchange_isPriceQuote[e] = exchangeObj.isPriceQuote
            if (this.exchanges.indexOf(e) < 0) {
                this.exchanges.push(e)
            }
        }
        for (var i = 0; i < this.callbackList.length; i++) {
            var cb = this.callbackList[i]
            cb({ exchanges: this.exchanges })
        }
    },
    on: function (cb) {
        if (typeof cb !== 'function') return
        cb({ exchanges: this.exchanges })
        this.callbackList = this.callbackList || []
        this.callbackList.push(cb)
    }
}

var CurrencyMgr = {
    currencyMode: '',
    base_currency: '',
    currency_list: [],
    get: function (currency) {
        for (var i = 0; i < this.currency_list.length; i++) {
            if (this.currency_list[i].currency === currency) {
                return this.currency_list[i]
            }
        }
    },
    set: function (currencyList) {
        if (!currencyList || currencyList.length <= 0) return
        for (var i = 0; i < currencyList.length; i++) {
            var currencyObj = currencyList[i]
            if (currencyObj.currency_list) {
                setToArray(currencyObj.currency_list, this.currency_list, 'currency')
            }
        }
    },
    setInfo: function (currencyInfo) {
        if (!currencyInfo) return
        this.currencyMode = currencyInfo.currencyMode
        this.base_currency = currencyInfo.baseCurrency
        this.set(currencyInfo.currencList)
    }
}

var AccountMgr = {
    current_account: '',
    account_list: [],
    account_info_list: {},
    account_balance_list: [],
    BCAN: [],
    callbackList: [],
    get: function (account, currency) {
        var accountObj = _.find(this.account_balance_list, function (a) {
            return a.account === account && a.currency === currency
        })
        var baseAccountObj = _.find(this.account_balance_list, function (a) {
            return a.account === account && a.currency === null
        })
        if (baseAccountObj && currency && CurrencyMgr.currencyMode === 'single') {
            var cloneAccountObj = {}
            $.extend(cloneAccountObj, baseAccountObj.data)
            for (var p in cloneAccountObj) {
                if (typeof cloneAccountObj[p] === 'number' && cloneAccountObj[p] != Number.NaN) {
                    if (CurrencyMgr.get(currency)) {
                        cloneAccountObj[p] = cloneAccountObj[p] / (CurrencyMgr.get(currency).ratio || 1)
                    }
                }
            }
            return cloneAccountObj
        } else {
            return accountObj ? accountObj.data : (baseAccountObj ? baseAccountObj.data : null)
        }
    },
    set: function (accountDataList) {
        if (!accountDataList || accountDataList.length <= 0) return
        for (var i = 0; i < accountDataList.length; i++) {
            var obj = accountDataList[i]
            if (obj[1120]) {
                obj.interestAccrualWithDate = obj[1120]
                if (obj[1121] && !isNaN(obj[1121])) {
                    var d = moment((obj[1121] - 25569) * 24 * 60 * 60 * 1000).format('DDMMM')   // 25569 = 1970.01.01 - 1899.12.30
                    obj.interestAccrualWithDate += '({0})'.format(d)
                }
            }
            var balanceObj
            if (typeof obj.account_list !== 'undefined') {
                this.account_list = obj.account_list
                this.account_info_list = obj.account_info_list
                this.account_multi_currency_CB = obj.account_multi_currency_CB
            } else {
                balanceObj = { _id: obj[10] + '#' + obj[23], account: obj[10], currency: obj[23], base: CurrencyMgr.base_currency, data: obj }
                setToArray([balanceObj], this.account_balance_list, '_id')
            }
            for (var j = 0; j < this.callbackList.length; j++) {
                var cb = this.callbackList[j]
                cb({
                    account_list: obj.account_list,
                    account_info_list: obj.account_info_list,
                    account_multi_currency_CB: obj.account_multi_currency_CB,
                    balance: balanceObj
                })
            }
        }
    },
    setAcctInfo: function (info) {
        if (!info) return
        this.account_list = info.accounts || []
        this.account_info_list = info.accountsInfo
        this.account_multi_currency_CB = info.accountMultiCurrencyCB
        this.BCAN = info.BCAN
        for (var j = 0; j < this.callbackList.length; j++) {
            var cb = this.callbackList[j]
            cb({
                account_list: this.account_list,
                account_info_list: this.account_info_list,
                account_balance_list: this.account_balance_list
            })
        }
    },
    updateAcctInfo: function () {
        for (var i = 0; i < this.account_balance_list.length; i++) {
            var balanceObj = this.account_balance_list[i]
            balanceObj = balanceObj.data
            var account = balanceObj[10]
            var unrealizedPL = 0
            var realizedPL = 0
            var totalBuy = 0
            var totalSell = 0
            var marketValue = 0
            var acceptValue = 0
            var hasMarketValueFlag = false
            var hasAcceptValueFlag = false
            var positions = PositionMgr.get()
            for (var j = 0; j < positions.length; j++) {
                var positionObj = positions[j]
                if (positionObj[10] !== balanceObj[10]) continue
                var ratio = 0
                if (balanceObj[23]) {
                    if (balanceObj[23] == positionObj[23]) {
                        ratio = 1
                    }
                } else {
                    var currencyObj = CurrencyMgr.get(positionObj[23])
                    ratio = currencyObj ? currencyObj.ratio : 1
                }
                unrealizedPL += (positionObj.unrealizedPL || 0) * ratio
                realizedPL += (positionObj.realizedPL || 0) * ratio
                marketValue += (positionObj.marketValue || 0) * ratio
                acceptValue += (positionObj.acceptValue || 0) * ratio
                if (positionObj.trades) {
                    for (var p in positionObj.trades) {
                        var trade = positionObj.trades[p]
                        if (trade.voucherType === 'security') continue
                        if (trade[tags.side] == 0) {
                            totalBuy += trade[tags.price] * trade[tags.quantity] * ratio
                        } else if (trade[tags.side] == 1) {
                            totalSell += trade[tags.price] * trade[tags.quantity] * ratio
                        }
                    }
                }
                if (!hasMarketValueFlag && !isNaN(positionObj.marketValue)) {  // all market value is NaN, account's market value should be NA
                    hasMarketValueFlag = true
                }
                if (!hasAcceptValueFlag && !isNaN(positionObj.acceptValue)) {
                    hasAcceptValueFlag = true
                }
            }
            balanceObj.cashBalance = balanceObj[initial_data.keyTags.cashBalance] || 0
            balanceObj.tradingLimit = balanceObj[initial_data.keyTags.tradingLimit] || 0
            balanceObj.marketValue = marketValue
            balanceObj.acceptValue = acceptValue
            balanceObj.unrealizedPL = unrealizedPL
            balanceObj.realizedPL = realizedPL
            balanceObj.totalBuy = totalBuy
            balanceObj.totalSell = totalSell
            balanceObj.totalNet = balanceObj.totalSell - balanceObj.totalBuy
            balanceObj['-totalNet'] = -balanceObj.totalNet
            balanceObj.totalBuySell = Math.abs(balanceObj.totalBuy) + Math.abs(balanceObj.totalSell)
            balanceObj.totalPortfolioValue = balanceObj.cashBalance + marketValue
            balanceObj.netAssetValue = balanceObj.totalPortfolioValue
            if (initial_data.bankBalanceMode) {  // v1.3.5  ), if Trading Limit >= 0 then Net Asset Value = Bank Balance + Trading Limit, else Net Asset Value = Bank Balance
                if (balanceObj.tradingLimit >= 0) {
                    balanceObj.netAssetValue = (balanceObj.tradingLimit + (balanceObj.bankBalance || 0)) || 0
                } else {
                    balanceObj.netAssetValue = balanceObj.bankBalance || 0
                }
            }
            if (!hasMarketValueFlag) {
                balanceObj.marketValue = Number.NaN
            }
            if (!hasAcceptValueFlag) {
                balanceObj.acceptValue = Number.NaN
            }
        }
    },
    on: function (cb) {
        if (typeof cb !== 'function') return
        cb({
            account_list: this.account_list,
            account_info_list: this.account_info_list,
            account_balance_list: this.account_balance_list
        })
        this.callbackList = this.callbackList || []
        this.callbackList.push(cb)
    }
}

var ProductMgr = {
    products: {},
    get: function (code, callback) {
        if (!code) return
        callback = callback || function () { }
        var that = this
        if (this.products[code]) {
            return callback(this.products[code])
        } else {
            $.get('/iTrader/product?symbol=' + code, function (result) {
                var data = result.data
                if (data && data[0]) {
                    that.products[data[0]] = data
                    return callback(data)
                } else {
                    return callback()
                }
            })
        }
    }
}

var SpreadMgr = {
    spreadList: {},
    set: function (spreads) {
        if (!spreads || spreads.length <= 0) return
        for (var i = 0; i < spreads.length; i++) {
            var spread = spreads[i]
            if (spread[0] && spread[73]) {
                this.spreadList[spread[0]] = spread[73].split(',')
            }
        }
    },
    getSpreadValue: function (options, price) {
        var spreadValue = ''
        var displayRatio = 1
        var name = ''
        if (typeof options === 'object') {
            name = options[73] || options.spread
            displayRatio = options[1504] || options.displayRatio || 1
        } else if (typeof options === 'string') {
            name = options
        }
        price = price / displayRatio
        var spreadArray = this.spreadList[name]
        if (spreadArray) {
            for (var i = 0; i < spreadArray.length; i = i + 2) {
                if (Number(spreadArray[i]) > price) {
                    spreadValue = spreadArray[i + 1]
                    break
                }
            }
            spreadValue = spreadValue || spreadArray[spreadArray.length - 1] || 0.001
        }
        return Number(spreadValue * displayRatio).toString()
    },
    getSpreadPrecision: function (name, price) {
        var spreadValue = this.getSpreadValue(name, price)
        if (spreadValue) {
            spreadValue = Number(spreadValue).toString()
            return spreadValue.length - spreadValue.indexOf('.') - 1
        }
        return 3
    },
}

var MarginMgr = {
    marginList: [],
    callbackList: [],
    get: function (account, symbol) {
        return _.find(this.marginList, function (o) {
            return o[tags.symbol] === symbol && o[tags.account] === account
        })
    },
    set: function (marginObj) {
        if (!marginObj) return
        if (marginObj[tags.symbol] && marginObj[tags.account]) {
            _.remove(this.marginList, function (o) {
                return o[tags.symbol] === marginObj[tags.symbol] && o[tags.account] === marginObj[tags.account]
            })
            this.marginList.push(marginObj)
        }
        return marginObj
    },
}

function setToArray(srcData, destData, key) {
    if (!srcData || !destData) return
    for (var i = 0; i < srcData.length; i++) {
        var idx = -1
        for (var j = 0; j < destData.length; j++) {
            if (key && destData[j][key] == srcData[i][key]) {
                idx = j
            }
        }
        if (idx >= 0) {
            destData[idx] = srcData[i]
        } else {
            destData.push(srcData[i])
        }
    }
}