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

{ $Id: fullTrade.js,v 1.5 2017/12/26 03:14:36 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    control = require('../../control'),
    dataEntry = require('../../data/entry'),
    Const = require('../../lib/const'),
    Common = require('../../lib/common'),
    OmsUtility = require('../../lib/omsUtility'),
    router = express.Router(),
    location

router.get('/bond', control.isAuthenticated, function (req, res, next) {
    res.render(__views_path + 'iTrader/allInOneTrade/bond', {
        layout: __views_path + 'iTrader/allInOneTrade/layout',
        userOptions: req.session.userOptions,
        config: config.iTrader,
        user: req.user,
        globalConfig: configuration.global,
        bondLayout: configuration.__layout.BOND,//www    layout.config    
        banner: 'banner_bond.png',
        csrfToken: req.csrfToken()
    })

})

router.get('/fund', control.isAuthenticated, function (req, res, next) {
    res.render(__views_path + 'iTrader/allInOneTrade/fund', {
        layout: __views_path + 'iTrader/allInOneTrade/layout',
        userOptions: req.session.userOptions,
        config: config.iTrader,
        user: req.user,
        globalConfig: configuration.global,
        fundLayout: configuration.__layout.FUND,
        banner: 'banner_fund.png',
        csrfToken: req.csrfToken()
    })

})

module.exports = router