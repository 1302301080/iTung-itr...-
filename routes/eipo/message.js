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

{ $Id: message.js,v 1.1 2016/12/20 11:04:19 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    control = require('../../control'),
    Const = require('../../lib/const'),
    ipoData = require('../../data/eipo/ipos'),
    applicationData = require('../../data/eipo/applications'),
    memberData = require('../../data/eipo/members'),
    router = express.Router()

router.get('/', function (req, res) {
    res.send('messages = ' + JSON.stringify(Const.messages[req.session.userOptions.lang]))
})

router.get('/info', control.isAuthenticated, function (req, res, next) {
})

router.get('/tags', function (req, res) {
    res.send(Const.tags)
})

router.get('/config', control.isAuthenticated, function (req, res, next) {
    res.send({
        schema: {
            ipo: ipoData.schema,
            application: applicationData.schema,
            account: memberData.schema,
        },
        deadlineClosing: config.eipo.deadlineClosing,
        allowClientChange: config.eipo.allowClientChange,
        allowClientCancel: config.eipo.allowClientCancel,
        disclaimer: config.eipo.disclaimer,
        format: config.eipo.format,
        entitlement: req.user.entitlement
    })

})

module.exports = router