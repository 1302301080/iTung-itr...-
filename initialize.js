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

{ $Id: initialize.js,v 1.25 2018/02/28 03:51:00 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    path = require('path'),
    fs = require('fs'),
    glob = require(__node_modules + 'glob'),
    dataEntry = require('./data/entry'),
    logger = require('common').Logger.instance().getLogger(),
    Const = require('./lib/const'),
    utility = require('./lib/utility'),
    extend = require('./lib/extend'),
    mktData = require('./lib/mktData'),
    OmsUtility = require('./lib/omsUtility'),
    message = require('./lib/message'),
    // socketIO = require('./connection/socket.io')
    socketIO = require('./connection/socket.io_v2')

exports.init = function (entryList) {
    if (!entryList) return
    extend.init()
    message.update()
    if (entryList.indexOf('elite') >= 0) {
        initializeELite()
    }
    if (entryList.indexOf('eipo') >= 0) {
        initializeEIpo()
    }
    if (entryList.indexOf('wxa') >= 0) {
        initializeWxa()
    }
}

exports.initSocketIO = function (server) {
    socketIO.connect(server)
}


/*
 * initialize for eilte part
 */
function initializeELite() {
    require('./connection/dds').start()
    prepareConfig()
    mktData.CheckUpdate()
    SetupOms()


    function SetupOms() {
        dataEntry.set({ name: Const.DataAction.currency }, config.iTrader.oms.baseCurrency, { isBase: true })
    }

    /*
    * pre handle config, apply default values
    */
    function prepareConfig() {
        var accountBalanceSection = config.iTrader.views.trade.account_balance
        var exchangeSection = config.iTrader.oms.exchanges

        var defaultStatusList = [1, 2, 3, 4, 5, 7, 100, -1]
        var orderbook = config.iTrader.views.trade.order_book
        if (orderbook) {
            if (!orderbook.filter) orderbook.filter = {}
            if (!orderbook.filter.status) {
                orderbook.filter.status = defaultStatusList
            }
        }
        var historyOrderbook = config.iTrader.views.trade.history_order
        if (historyOrderbook) {
            if (!historyOrderbook.filter) historyOrderbook.filter = {}
            if (!historyOrderbook.filter.status) {
                historyOrderbook.filter.status = defaultStatusList
            }
            if (!historyOrderbook.fundSchema && config.iTrader.views.trade.fund_book) {
                historyOrderbook.fundSchema = config.iTrader.views.trade.fund_book.schema
            }
            if (!historyOrderbook.cashSchema && config.iTrader.views.trade.cash_book) {
                historyOrderbook.cashSchema = config.iTrader.views.trade.cash_book.schema
            }
        }

        var exchangeSection = config.iTrader.oms.exchanges
        if (exchangeSection) {
            for (var item of exchangeSection) {
                item.type = OmsUtility.MapOrderType(item.type)
                item.tif = OmsUtility.MapOrderTif(item.tif)
            }
        }

        var confirmationSection = config.iTrader.views.trade.order_confirmation
        if (confirmationSection) {
            confirmationSection.transactionCost = typeof confirmationSection.transactionCost === 'undefined' ? true : confirmationSection.transactionCost
            confirmationSection.commission = typeof confirmationSection.commission === 'undefined' ? true : confirmationSection.commission
            confirmationSection.orderAmount = typeof confirmationSection.orderAmount === 'undefined' ? true : confirmationSection.orderAmount
            confirmationSection.totalAmount = typeof confirmationSection.totalAmount === 'undefined' ? true : confirmationSection.totalAmount
        }

        // specified cb/tl tag
        var cashBalanceTag = config.iTrader.oms.cashBalanceTag || 156
        var tradingLimitTag = config.iTrader.oms.tradingLimitTag || 155
        for (var item of accountBalanceSection.schema) {
            if (item && item.alias) {
                switch (item.alias.toLowerCase()) {
                    case 'cb':
                        cashBalanceTag = item.key
                        break
                    case 'tl':
                        tradingLimitTag = item.key
                        break
                    default:
                        break
                }
            }
        }
        config.iTrader.oms.cashBalanceTag = cashBalanceTag
        config.iTrader.oms.tradingLimitTag = tradingLimitTag

        //CNY account map default suffix, only enabl when has CNYAcctMapExchList
        if (config.iTrader.oms.CNYAcctMapExchList) {
            config.iTrader.oms.CNYAcctMapExchList = (config.iTrader.oms.CNYAcctMapExchList || '').split(',')
            config.iTrader.oms.CNYAcctSuffix = config.iTrader.oms.CNYAcctSuffix || '_CNY'
        } else {
            config.iTrader.oms.CNYAcctSuffix = ''
        }

        // set default recover file
        config.iTrader.oms.recover = config.iTrader.oms.recover || {}
        config.iTrader.oms.recover.fundSwitchIDSeq = 'D:/oms/recover/fund-switchID-seq.txt'

        function applyDefaultFormat(schema, key, formatStr) {
            if (!schema || !key || !formatStr) return
            for (var i = 0; i < schema.length; i++) {
                var item = schema[i]
                if (item.key == key && !item.format) {
                    item.format = formatStr
                }
            }
        }
        applyDefaultFormat(config.iTrader.views.full_trade.fund.schema, 4, '-' + config.iTrader.format.fund_unit)
        applyDefaultFormat(config.iTrader.views.full_trade.fund.schema, 'availableQuantity', '-' + config.iTrader.format.fund_unit)
        applyDefaultFormat(config.iTrader.views.full_trade.bond.schema, 4, '-' + config.iTrader.format.bond_unit)
        applyDefaultFormat(config.iTrader.views.full_trade.bond.schema, 'availableQuantity', '-' + config.iTrader.format.bond_unit)
        applyDefaultFormat(config.iTrader.views.trade.fund_book.schema, 4, '-' + config.iTrader.format.fund_unit)
        applyDefaultFormat(config.iTrader.views.trade.price_quote_book.schema, 4, '-' + config.iTrader.format.bond_unit)

        // fund disclaimer & disclosure
        config._getFundDisclosure = function () {
            if (config.iTrader.views.full_trade.fund) {
                var fundSection = config.iTrader.views.full_trade.fund
                if (fundSection && fundSection.disclosure && fundSection.disclosure.url && fundSection.disclosure.enable !== false) {
                    return fundSection.disclosure
                }
            }
        }
        config._getFundDisclaimer = function () {
            if (config.iTrader.views.full_trade.fund) {
                var fundSection = config.iTrader.views.full_trade.fund
                if (fundSection && fundSection.disclaimer && fundSection.disclaimer.url && fundSection.disclaimer.enable !== false) {
                    return fundSection.disclaimer
                }
            }
        }

        // bond disclaimer & disclosure
        config._getBondDisclosure = function () {
            if (config.iTrader.views.full_trade.bond) {
                var bondSection = config.iTrader.views.full_trade.bond
                if (bondSection && bondSection.disclosure && bondSection.disclosure.url && bondSection.disclosure.enable !== false) {
                    return bondSection.disclosure
                }
            }
        }
        config._getBondDisclaimer = function () {
            if (config.iTrader.views.full_trade.bond) {
                var bondSection = config.iTrader.views.full_trade.bond
                if (bondSection && bondSection.disclaimer && bondSection.disclaimer.url && bondSection.disclaimer.enable !== false) {
                    return bondSection.disclaimer
                }
            }
        }

        config._needQueryBankBalance = function () {
            if (accountBalanceSection.schema) {
                var schema = accountBalanceSection.schema
                for (var i = 0; i < schema.length; i++) {
                    if (schema[i].key == 'bankBalance') return true
                }
            }
        }

        config._showMultiCurrencyCB = function () {
            if (accountBalanceSection.showMultiCurrencyCB === true) return true
            return false
        }

        config._showConsolidatedCB = function () {
            if (accountBalanceSection.showConsolidatedCB !== false) return true
            return false
        }

        config._isNeedPriceQuote = function (type) {
            if (exchangeSection && exchangeSection.length > 0) {
                for (var item of exchangeSection) {
                    if (item && item.key === type && item.isPriceQuote === true) {
                        return true
                    }
                }
            }
            return false
        }

        config._isSupportSLOExchange = function (exchange) {
            if (exchangeSection && exchangeSection.length > 0) {
                for (var item of exchangeSection) {
                    if (item && item.key === exchange && item.type.indexOf('specialLimit') >= 0) {
                        return true
                    }
                }
            }
            return false
        }

        config._isPricingExchange = function (exchange) {
            if (exchangeSection && exchangeSection.length > 0) {
                for (var item of exchangeSection) {
                    if (item && item.key === exchange && item.isPricing === false) {
                        return false
                    }
                }
            }
            return true
        }

        config._isDayTradeExchange = function (exchange) {
            if (exchangeSection && exchangeSection.length > 0) {
                for (var item of exchangeSection) {
                    if (item && item.key === exchange && item.isDayTrade === false) {
                        return false
                    }
                }
            }
            return true
        }

        config._isAShareExchange = function (exchange) {
            if (exchangeSection && exchangeSection.length > 0) {
                for (var item of exchangeSection) {
                    if (item && item.key === exchange && item.isAShare === true) {
                        return true
                    }
                }
            }
            return false
        }
    }
}





/*
 * initialize for eipo part
 */
function initializeEIpo() {
    prepareConfig()
    require('common').DB.instance(config.eipo.db)
    require('./connection/as').start()
    require('./connection/tfdds').setInstance()

    /*
    * pre handle config, apply default values
    */
    function prepareConfig() {
        if (config.iTrader.oms && config.eipo.oms) {
            utility.CopyObj(config.eipo.oms, config.iTrader.oms, false)
        }
        var decimalKeys = ['4', '24', '34', '1511']
        var priceKeys = ['3', '1512', '1514', '1601', '1602', '1603']
        var viewSection = config.eipo.views
        if (viewSection) {
            if (viewSection.ipo.schema) {
                for (var item of viewSection.ipo.schema) {
                    if (item.key == '1514') {
                        item.entitlement = 'EIPOREMAINLOANAMT'
                        item.default = 0
                    } else if (item.key == '1507') {
                        item.default = 0
                    }
                    if (!item.format) {
                        if (decimalKeys.indexOf(item.key) >= 0) item.format = config.eipo.format.decimal
                        if (priceKeys.indexOf(item.key) >= 0) item.format = config.eipo.format.price
                    }
                }
            }
            if (viewSection.app.schema) {
                for (var item of viewSection.app.schema) {
                    if (!item.format) {
                        if (decimalKeys.indexOf(item.key) >= 0) item.format = config.eipo.format.decimal
                        if (priceKeys.indexOf(item.key) >= 0) item.format = config.eipo.format.price
                    }
                }
            }
        }
        config.global.session.name = 'sid_eipo'
    }
}


/* initialize for wei xin app */
function initializeWxa() {
    var wxaDriver = require('./wxa/wxaDriver')
    prepareConfig()
    wxaDriver.initialize()

    /*
   * pre handle config, apply default values
   */
    function prepareConfig() {
        if (!config.wxa) return
        if (config.wxa.oms && config.wxa.oms.user) {
            config._systemUser = config.wxa.oms.user
        }
    }
}