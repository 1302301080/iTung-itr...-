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

{ $Id: data.js,v 1.2 2017/04/26 08:52:15 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


var config = require(__config_path),
    express = require(__node_modules + 'express'),
    control = require('../../control'),
    Const = require('../../lib/const'),
    ipoData = require('../../data/eipo/ipos'),
    memberData = require('../../data/eipo/members'),
    router = express.Router()

router.get('/ipo', control.isAuthenticated, function (req, res) {
    var ipoObj = ipoData.getByKey(req.query.symbol, req.query.announce)
    if (ipoObj) {
        ipoObj = ipoObj.makeOmsTag()
    }
    res.send(ipoObj)
})

router.get('/accounts', control.isAuthenticated, function (req, res) {
    var user = req.query.user
    memberData.getAccounts(req.query.user, function (err, data) {
        res.send(data)
    })
})

module.exports = router
