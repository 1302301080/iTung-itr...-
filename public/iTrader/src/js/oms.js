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

{ $Id: oms.js,v 1.22 2018/02/28 03:51:00 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

function GetOptions(orderObj) {
    var ordConst = initial_data.ordConst
    var options = ''
    if (orderObj) {
        var instruction = orderObj[tags.instruct]
        var instruction1 = orderObj[tags.instruct1]
        var instruction2 = orderObj[tags.instruct2]
        var instruction3 = orderObj[tags.instruct3]
        var instruction4 = orderObj[tags.instruct4]


        if ((instruction & ordConst.omsOrderMarket) !== 0) {
            options += messages.oms.order_type_market + ';'
        }
        if ((instruction & ordConst.omsOrderPreOpen) !== 0) {
            if (Number(orderObj['3']) == 0) {
                options += messages.oms.order_type_auction + ';'
            } else {
                options += messages.oms.order_type_auctionLimit + ';'
            }
        }
        if ((instruction & ordConst.omsOrderEnhancedLimit) !== 0) {
            options += messages.oms.order_type_enhancedLimit + ';'
        }
        if ((instruction & ordConst.omsOrderStopLimit) !== 0) {
            var stopPriceStr = getDisplayPrice(orderObj[41], 'order', orderObj)
            options += '{0} [{1}:{2}];'.format(messages.oms.order_type_stopLimit, messages.ticket_stop_price.text, stopPriceStr)
        }
        if ((instruction & ordConst.omsOrderFAK) !== 0) {
            options += messages.oms.order_tif_fak + ';'
        }
        if ((instruction & ordConst.omsOrderFOK) !== 0) {
            options += messages.oms.order_tif_fok + ';'
        }
        if ((instruction & ordConst.omsOrderGTC) !== 0) {
            if (orderObj[tags.expirationDate]) {
                options += '{0} [{1}];'.format(messages.oms.order_tif_gtd, orderObj[tags.expirationDate])
            } else {
                options += messages.oms.order_tif_gtc + ';'
            }
        }

        if (orderObj.transFee || orderObj.transFee == 0) {
            options += '{0}{1};'.format('TRANSFEE: ', $._format.percentage(orderObj.transFee, 2))
        }
    }
    return options
}

function IsOTCFund(productObj) {
    if (productObj && productObj['22'] == 10 && productObj['1508'] == 1) return true
}

function IsOTCBond(productObj) {
    if (productObj && productObj['22'] == 6 && productObj['1508'] == 1) return true
}

function GetMaxBuy(symbol, price, callback) {
    var max_buy = 0
    var balanceObj = {}
    if (symbol && price) {
        ProductMgr.get(symbol, function (productObj) {
            if (!productObj) return callback(0)
            var currency = productObj[tags.currency] || CurrencyMgr.base_currency
            var isMulti = CurrencyMgr.currencyMode
            if (isMulti) {
                var currencyList = CurrencyMgr.currency_list
                if (currencyList) {
                    for (var i = 0; i < currencyList.length; i++) {
                        if (currencyList[i].currency == currency) {
                            var isConvertible = currencyList[i].isConvertible
                            if (!isConvertible) {
                                balanceObj = AccountMgr.get(current.account, currency)
                            }
                            else {
                                balanceObj = AccountMgr.get(current.account, null)
                            }
                        }
                    }
                }
            } else {
                balanceObj = AccountMgr.get(current.account, null)
            }
            if (balanceObj && productObj) {
                var tradingLimit = balanceObj[initial_data.keyTags.tradingLimit] || 0
                if (initial_data.bankBalanceMode) {
                    tradingLimit = balanceObj.netAssetValue
                }
                var lotSize = productObj[24] || 0
                if (tradingLimit && lotSize) {
                    var currencyObj = CurrencyMgr.get(productObj[tags.currency])
                    if (currencyObj && currencyObj.ratio) {
                        tradingLimit = tradingLimit / currencyObj.ratio
                        max_buy = Math.floor(tradingLimit / price / lotSize) * lotSize
                    }
                }
            }
            return callback(max_buy >= 0 ? max_buy : 0)
        })
    } else {
        callback(0)
    }
}

function GetMaxSellSync(symbol) {
    if (!symbol) return
    var max_sell = 0
    var positions = PositionMgr.get({ symbol: symbol, account: current.account })
    if (positions && positions.length > 0) {
        max_sell = positions[0][tags.quantity] - (positions[0].queueQuantity || 0)
        if (ExchangeMgr.exchange_isDayTrade && ExchangeMgr.exchange_isDayTrade[positions[0]['20']])
            max_sell -= positions[0].todayBuyQuantity
    }
    return max_sell >= 0 ? max_sell : 0
}

function IsOutstandingStatus(status) {
    if (status == 1 || status == 2 || status == 100 || status == 8) {
        return true
    }
}

// all non-cash account will treat as margin account that maybe has accept value
function IsMarginAccount(account) {
    if (typeof AccountMgr === 'undefined') return true
    if (account && AccountMgr && AccountMgr.account_info_list && AccountMgr.account_info_list[account] && AccountMgr.account_info_list[account].margin_type == 0) {
        return false
    }
    return true
}