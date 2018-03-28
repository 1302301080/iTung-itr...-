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

{ $Id: transaction.js,v 1.2 2016/12/20 11:04:18 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    uuid = require(__node_modules + 'node-uuid'),
    moment = require(__node_modules + 'moment'),
    control = require('../../control'),
    ordConst = require('../../lib/omsOrdConst'),
    common = require('../../lib/common'),
    OmsUtility = require('../../lib/omsUtility'),
    dataEntry = require('../../data/entry'),
    logger = require('common').Logger.instance().getLogger(),
    Const = require('../../lib/const'),
    PriceDDS = require('../../connection/dds'),
    router = express.Router()

router.post('/history', control.isApiAuthenticated, function (req, res, next) {
    if (checkParams(req.body)) {
        req.user.its.queryTransactionHistory(req.body, function (err, data) {
            var list = []
            if (data) {
                for (var item of data) {
                    if (item) {
                        list.push(item.makeOmsTag())
                    }
                }
            }
            res.send({ error: err, data: list })
        })
    } else {
        res.send({ error: Const.error.parameter })
    }
})

function checkParams(body) {
    var err = ''
    if (body && body.startDate && body.endDate && body.action) {
        if (config.iTrader.views.trade.transaction_history) {
            var dateFormat = config.iTrader.views.trade.transaction_history.dateFormat
            body.startDate = moment(body.startDate, dateFormat).format('YYYY/MM/DD')
            body.endDate = moment(body.endDate, dateFormat).format('YYYY/MM/DD')
        }
        switch (body.action) {
            case '0': body.action = ['gettrade', 'getstockvoucher', 'getmoneyvoucher']; return true
            case '1': body.action = ['gettrade']; return true
            case '2': body.action = ['getstockvoucher']; return true
            case '3': body.action = ['getmoneyvoucher']; return true
            default: return false
        }
    }
    return false
}

module.exports = router