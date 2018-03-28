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

{ $Id: initialize.js,v 1.16 2017/11/29 10:42:28 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    control = require('../../control'),
    Const = require('../../lib/const'),
    OrdConst = require('../../lib/omsOrdConst'),
    router = express.Router()

router.get('/', control.isAuthenticated, function (req, res, next) {
    var iTrader = {
        'socket.io': { connection: config.global.site.connection || req.hostname },
        footer: config.iTrader.footer,
        tags: Const.tags,
        ordConst: OrdConst,
        exchange_rule: config.iTrader.exchange_rule,
        languages: config.global.site.languages,
        themes: config.global.site.themes,
        views: config.iTrader.views,
        keyTags: getKeyTags(),
        ticket: config.iTrader.views.trade.ticket,
        CNYAcctSuffix: config.iTrader.oms.CNYAcctSuffix,
        format: config.iTrader.format,
        update_frequency: config.iTrader.oms.update_frequency,
        bankBalanceMode: config._needQueryBankBalance(),
        manualVerifyInterval: config.iTrader.oms.manualVerifyInterval,
        popupRejectedOrder: config.iTrader.views.popupRejectedOrder,
        zeroShowNA: config.iTrader.views.zeroShowNA,
        forceShowAcceptValue: config.iTrader.views.forceShowAcceptValue
    }
    res.send(iTrader)
})

router.get('/tags', function (req, res) {
    res.send(Const.tags)
})

router.get('/messages', function (req, res) {
    if (req._isJsonRequest) {
        return res.send(Const.messages[req.session.userOptions.lang])
    }
    res.set('Content-Type', 'text/javascript')
    res.send('messages = ' + JSON.stringify(Const.messages[req.session.userOptions.lang]))
})

function getKeyTags() {
    return {
        cashBalance: config.iTrader.oms.cashBalanceTag || 156,
        tradingLimit: config.iTrader.oms.tradingLimitTag || 155
    }
}
module.exports = router
