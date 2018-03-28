/*!
{*******************************************************************}
{                                                                   }
{       eBroker Systems Javascript Component Library                }
{                                                                   }
{                                                                   }
{       Copyright(c) 2000-2017 eBroker Systems Ltd.                 }
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

{ $Id: index.js,v 1.1 2017/08/18 08:47:35 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    control = require('../../control'),
    dataEntry = require('../../data/entry'),
    // logger = require('common').Logger.instance().getLogger(),
    wxaDriver = require('../wxaDriver'),
    Const = require('../../lib/const'),
    router = express.Router()

router.get('/', control.isApiAuthenticated, function (req, res) {
    return res.send(config.wxa)
})

router.get('/account/info', control.isApiAuthenticated, function (req, res) {
    var systemUser = wxaDriver.getSystemUser()
    if (systemUser && systemUser.its) {
        systemUser.its.customQuery({ systemRef: Const.customQuery.getMoreAcctInfo, account: req.user.id }, function (err, data) {
            if (err && err.length > 0) {
                return res.send()
            } else if (data && data.length > 0) {
                return res.send({
                    id: data[0].account,
                    name: data[0].row2
                })
            }
            return res.send()
        })
    } else {
        return res.send()
    }
})

router.get('/account/balance', control.isApiAuthenticated, function (req, res) {
    var systemUser = wxaDriver.getSystemUser()
    if (systemUser && systemUser.its) {
        var items = dataEntry.get({ name: Const.DataAction.account }, systemUser.loginID, req.user.id)
        for (var item of items) {
            if (item && !item.currency) {
                return res.send(item.makeOmsTag())
            }
        }
    } else {
        return res.send()
    }
})

module.exports = router