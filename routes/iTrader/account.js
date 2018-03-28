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

{ $Id: account.js,v 1.13 2018/01/19 10:00:25 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    uuid = require(__node_modules + 'node-uuid'),
    control = require('../../control'),
    logger = require('common').Logger.instance().getLogger(),
    Const = require('../../lib/const'),
    ordConst = require('../../lib/omsOrdConst'),
    dataEntry = require('../../data/entry'),
    OmsUtility = require('../../lib/omsUtility'),
    router = express.Router()

router.get('/', control.isApiAuthenticated, function (req, res) {
    var data = {}
    if (req && req.user) {
        var user = req.user
        data.id = user.id
        data.accounts = user.accounts
        data.BCAN = user.BCAN || ''//BCAN
        data.skipTradingPassword = user.skipTradingPassword || false  // skip trading password
        if (user.info) {
            data.name = user.info.name
            data.margin_type = user.info.margin_type
            data.lastLoginApp = user.info.lastLoginApp
            data.lastLoginTime = user.info.lastLoginTime
        }
        if (user.accountsInfo && user.accountsInfo[user.id]) {
            var customInfo = user.accountsInfo[user.id].customInfo
            if (customInfo) {
                data.customInfo = customInfo
            }
        }
        data.accountsInfo = user.accountsInfo   // all accounts info, include margin_type & customInfo, account id as key
        data.accountMultiCurrencyCB = user._accountMultiCurrencyCB  // account multi currency CB

        // entitlements
        data.allowOpenClose = user.entitlement.indexOf('OEOpenC') > 0 ? true : false
        data.allowPrincipal = user.entitlement.indexOf('OEPrin') > 0 ? true : false
        data.allowAHFT = user.entitlement.indexOf('OEAHFT') > 0 ? true : false

        data.forceReLogin = user.forceReLogin  // after chagne token type, force user to relogin

        // process trading exchange/order type/ order tif
        var tradeExchange = {}
        var exchanges = dataEntry.global.exchanges
        for (var exchange of exchanges) {
            var item = configuration.iTrader.oms.exchanges.find((a) => { return a.key === exchange }) || {}
            if (item.enable === false) continue
            tradeExchange[exchange] = { type: ['limit'], tif: ['day'] }
            var type = item.type && item.type.length > 0 ? item.type : OmsUtility.MapOrderType()
            var tif = item.tif && item.tif.length > 0 ? item.tif : OmsUtility.MapOrderTif()
            if (user.entitlement.indexOf('OEMarketOrder') >= 0 && type.indexOf('market') >= 0) {
                tradeExchange[exchange].type.push('market')
            }
            if (user.entitlement.indexOf('OEAO') >= 0 && type.indexOf('auction') >= 0) {
                tradeExchange[exchange].type.push('auction')
            }
            if (user.entitlement.indexOf('OEALO') >= 0 && type.indexOf('auctionLimit') >= 0) {
                tradeExchange[exchange].type.push('auctionLimit')
            }
            if (user.entitlement.indexOf('OEEnhanced') >= 0 && type.indexOf('enhancedLimit') >= 0) {
                tradeExchange[exchange].type.push('enhancedLimit')
            }
            if (user.entitlement.indexOf('OEStopL') >= 0 && type.indexOf('stopLimit') >= 0) {
                tradeExchange[exchange].type.push('stopLimit')
            }
            if (user.entitlement.indexOf('OESpecial') >= 0 && type.indexOf('specialLimit') >= 0) {
                tradeExchange[exchange].type.push('specialLimit')
            }

            if (user.entitlement.indexOf('OEFOK') >= 0 && tif.indexOf('fak') >= 0) {
                tradeExchange[exchange].tif.push('fak')
            }
            if (user.entitlement.indexOf('OEFAK') >= 0 && tif.indexOf('fok') >= 0) {
                tradeExchange[exchange].tif.push('fok')
            }
            if (user.entitlement.indexOf('OEGoodtillCancel') >= 0 && tif.indexOf('gtc') >= 0) {
                tradeExchange[exchange].tif.push('gtc')
            }
            if (user.entitlement.indexOf('OEGoodtillDate') >= 0 && tif.indexOf('gtd') >= 0) {
                tradeExchange[exchange].tif.push('gtd')
            }

            tradeExchange[exchange].icon = item.icon
            tradeExchange[exchange].isDayTrade = item.isDayTrade
            tradeExchange[exchange].isAShare = item.isAShare
            tradeExchange[exchange].isPriceQuote = item.isPriceQuote
            tradeExchange[exchange].isPricing = item.isPricing
        }
        data.tradeExchange = tradeExchange

        var currencyCustom = dataEntry.custom({ name: Const.DataAction.currency })
        var currencyObj = {
            currencyMode: currencyCustom.currencyMode,
            baseCurrency: currencyCustom.baseCurrency,
            currencyList: dataEntry.get({ name: Const.DataAction.currency })
        }
        data.currencyInfo = currencyObj
    }
    res.send({ data: data })
})

router.get('/transfer', control.isAuthenticated, function (req, res, next) {
    var currency_list = dataEntry.get({ name: Const.DataAction.currency })
    var currency_array = []
    for (var c of currency_list) {
        currency_array.push(c.currency)
    }
    res.render(__views_path + 'iTrader/account/cash_transfer', {
        layout: __views_path + 'layout.ejs',
        accounts: req.user.accounts,
        currency_list: currency_array,
        csrfToken: req.csrfToken()
    })
})

router.post('/transfer', control.csrfProtection, control.isAuthenticated, function (req, res, next) {
    var amount = Number(req.body.amount)
    var currency = req.body.currency
    var account_in = req.body.account_in
    var account_out = req.body.account_out
    if (!amount || !currency || !account_in || !account_out) {
        res.send({ error: Const.error.parameter })
        return
    }
    var userRef1 = uuid.v1()
    var userRef2 = uuid.v1()
    var extra = {
        cmd: 'depositcash',
        operatorFlag: 'S',
        exchange: 'MANU',
        currency: currency,
        instruct: ordConst.omsOrderFOK | ordConst.omsOrderSettle | ordConst.omsOrderNoComm | ordConst.omsOrderAutoFill,
        instruct2: ordConst.omsOrder2SI_CASH
    }
    try {
        extra.userRef = userRef1
        extra.account = account_out
        req.user.its.submitAddOrder(currency, 0, amount, 1, extra)
        req.user.its.OnSubmitOrder(userRef1, function (err, order) {
            if (err) {
                res.send({ error: err })
            } else {
                extra.userRef = userRef2
                extra.account = account_in
                req.user.its.submitAddOrder(currency, 1, amount, 1, extra)
                req.user.its.OnSubmitOrder(userRef1, function (err, order) {
                    if (err) {
                        res.send({ error: err })
                    } else {
                        res.send(true)
                    }
                })
            }
        })
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

router.get('/summary', control.isAuthenticated, function (req, res, next) {
    res.render(__views_path + 'iTrader/assets/index', {
        layout: __views_path + 'iTrader/assets/layout',
        userOptions: req.session.userOptions,
        config: config.iTrader,
        globalConfig: config.global,
        user: req.user,
    })
})

router.get('/setting', control.isAuthenticated, function (req, res) {
    var options = { skipDisclaimer: req.user.skipDisclaimer || false }
    res.render(__views_path + 'iTrader/account/user_setting', {
        layout: __views_path + 'layout.ejs',
        options: options,
        csrfToken: req.csrfToken()
    })
})

router.get('/bankBalance', control.isApiAuthenticated, function (req, res) {
    req.user.its.queryBankBalance() // send bank symbol
    res.send()
})

router.post('/setting', control.isApiAuthenticated, function (req, res) {
    try {
        var user = req.user
        var skipDisclaimer = req.body.skipDisclaimer || false
        if (skipDisclaimer != user.skipDisclaimer) {
            var side = skipDisclaimer ? 1 : 0
            user.its.setSkipDisclaimer(side, (err, data) => {
                if (err && err.length > 0) {
                    res.send({ error: err[0] })
                } else if (data) {
                    res.send({ data: true })
                }
            })
        } else {
            res.send(null)
        }
    } catch (err) {
        logger.error(err)
    }
})

module.exports = router