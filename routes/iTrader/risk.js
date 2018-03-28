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

{ $Id: risk.js,v 1.8 2018/01/19 10:00:26 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    control = require('../../control'),
    logger = require('common').Logger.instance().getLogger(),
    ITS = require('../../connection/its'),
    dataEntry = require('../../data/entry'),
    Const = require('../../lib/const'),
    router = express.Router()

router.get('/disclosure', control.unAcceptedPassed, function (req, res) {
    var action = IsSkipDisclosure(req) || req.query.action
    if (action) {
        if (!req.user || req.user.status != 1) {
            return res.redirect('/')
        }
        try {
            if (action === 'accept') {
                req.user.status = 2
                var its = new ITS()
                its.sessionObj = req.user.sessionObj
                its.loginID = req.user.id
                its.uid = req.user.uid
                req.user.its = its
                its.event.once('connect', () => {
                    its.verify()
                })
                its.event.once('close', (had_error) => {
                    if (had_error) {
                        res.redirect('/iTrader/user/login/?error=-998')
                        done = true
                    }
                })
                var done = false
                its.event.once('verified', (result) => {
                    if (result) {
                        its.initialize()
                        its.event.once('initialized', () => {
                            if (!done) {
                                res.redirect('/')
                                done = true
                            }
                        })
                    } else {
                        dataEntry.delete({ name: Const.DataAction.user }, req.user.uid)
                    }
                    if (req.query.skipDisclaimer) {
                        req.user.its.setSkipDisclaimer(1)
                    }
                    setTimeout(function () {
                        if (!done) {
                            res.redirect('/')
                            done = true
                        }
                    }, 1000 * 5)
                })
                its.connect()
            } else if (action === 'reject') {
                dataEntry.delete({ name: Const.DataAction.user }, req.user.uid)
                res.redirect('/')
            }
        } catch (err) {
            logger.error(err)
        }
    } else {
        res.render(__views_path + 'iTrader/risk/disclosure', {
            layout: __views_path + 'layout',
            userOptions: req.session.userOptions,
            config: config.iTrader,
            user: req.user,
        })
    }
})

function IsSkipDisclosure(req) {
    if (!req || !req.user) return
    if (req.user.skipDisclaimer) return 'accept'
}

module.exports = router