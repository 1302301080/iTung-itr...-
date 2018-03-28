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

{ $Id: index.js,v 1.7 2018/03/09 10:16:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    control = require('../../control'),
    dataEntry = require('../../data/entry'),
    router = express.Router()

router.get('/', control.isAuthenticated, function (req, res, next) {
    if (req.session && req.session.userOptions && req.session.userOptions.isMobile) {
        return res.render(__views_path + 'iTrader-app/index', {
            csrfToken: req.csrfToken(),
            userOptions: req.session.userOptions
        })
    }
    // return res.render(__views_path + 'iTrader-app/index', {
    //     csrfToken: req.csrfToken(),
    //     userOptions: req.session.userOptions
    // }),
    res.render(__views_path + 'iTrader/trading/index', {
        layout: __views_path + 'iTrader/layout',
        userOptions: req.session.userOptions,
        config: config.iTrader,
        globalConfig: config.global,
        user: req.user,
        exchanges: dataEntry.global.exchanges,
        eStatementPeriodsList: config.iTrader.views.eStatement ? config.iTrader.views.eStatement.periods : null,
        csrfToken: req.csrfToken()
    })
})

module.exports = router