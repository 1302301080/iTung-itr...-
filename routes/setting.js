var express = require(__node_modules + 'express')
var control = require('../control')
var logger = require('common').Logger.instance().getLogger()
var router = express.Router()
var utility = require('../lib/utility')
var parser = require('../lib/parser')
var Const = require('../lib/const')

router.get('/webapp', control.isApiAuthenticated, function (req, res) {
    var setting = {
        account_balance: {
            schema: configuration.iTrader.views.trade.account_balance.schema
        }
    }
    res.set('Content-Type', 'text/javascript')
    res.send("__setting = " + JSON.stringify(setting))
})

router.post('/webapp', control.isApiAuthenticated, function (req, res) {
    var data = {}
    if (req && req.user) {
        var user = req.user
        data.id = user.id
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
        }
        data.tradeExchange = tradeExchange
    }
    res.send(data)
})

router.get('/', function (req, res) {
    var lang = req.query.lang || req.session.userOptions.lang || 'en-US'

    res.send({
        data: {
            resetPasswordURL: configuration.iTrader.views.login.forgetPasswordUrl,
            disclaimerURL: "/html/disclaimer_{0}.html".format(lang),
            announcementURL: "/html/announcement_{0}.html".format(lang),
            disclosureURL: "/html/disclosure_{0}.html".format(lang),
            privacyURL: "/html/privacy_{0}.html".format(lang)
        }
    })
})

router.post('/language', control.isApiAuthenticated, function (req, res) {
    var lang = req.body.lang || req.query.lang
    if (!lang) {
        return res.send(utility.getParameterError(req))
    }
    if (req && req.session && req.session.userOptions && req.session.userOptions.lang) {
        return res.send(true)
    }
    return res.send({ error: parser.error(Const.error.internal, null, req) })
})

module.exports = router