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

{ $Id: security.js,v 1.2 2017/11/06 09:34:05 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    signature = require(__node_modules + 'cookie-signature'),
    passport = require(__node_modules + 'passport'),
    control = require('../../control'),
    wxaDriver = require('../wxaDriver'),
    Const = require('../../lib/const'),
    logger = require('common').Logger.instance().getLogger(),
    router = express.Router()

router.post('/login', control.initPassport, function (req, res, next) {
    var code = req.body.code
    if (code) {
        passport.authenticate('local', { failureFlash: false }, function (err, data) {
            if (!err && data.uid) {
                req.logIn(data.uid, function (err) {
                    if (err) { return next(err) }
                    logger.info('account [{0}] log into the system throught wxa'.format(data.account))
                    return res.send({ data: signature.sign(req.sessionID, config.global.session.secret) })
                })
            } else {
                return res.send({ error: Const.error.wx.loginFailed })
            }
        })(req, res, next)
    } else {
        return res.send({ error: Const.error.wx.loginFailed })
    }
})

router.post('/verify', function (req, res) {
    var sid = req.body.sid || ''
    if (!sid) return res.send(false)
    var uid = signature.unsign(sid, config.global.session.secret)
    config.global.session.store.get(uid, function (err, session) {
        if (!err && session) {
            return res.send(true)
        } else {
            return res.send(false)
        }
    })
})

router.get('/bind', function (req, res, next) {
    req._parameters = ['mobile', 'countrycode']
    control.handleParameters(req, res, next)
}, function (req, res) {
    var systemUser = wxaDriver.getSystemUser()
    if (systemUser && systemUser.ssm) {
        systemUser.ssm.sendOTP({ tokenType: 3, notifyNumber: req.query.mobile, countryCode: req.query.countrycode }, function (err, data) {
            if (!err && data) {
                return res.send({ result: true })
            } else {
                return res.send({ error: Const.error.wx.requestTokenCode })
            }
        })
    } else {
        return res.send({ error: Const.error.internal })
    }

})

router.post('/bind', control.initPassport, function (req, res, next) {
    req._parameters = ['mobile', 'countrycode', 'tokencode', 'code']
    control.handleParameters(req, res, next)
}, function (req, res, next) {
    passport.authenticate('local', { failureFlash: false }, function (err, data) {
        if (data && data.openid) {
            var openid = data.openid
            var systemUser = wxaDriver.getSystemUser()
            if (systemUser && systemUser.ssm) {
                systemUser.ssm.bind({
                    sessionID: openid,
                    tokenType: 3,
                    notifyNumber: req.body.mobile,
                    countryCode: req.body.countrycode,
                    tokenCode: req.body.tokencode
                }, function (err, data) {
                    if (!err && data && data.account) {
                        req.logIn(openid, function (err) {
                            if (err) { return next(err) }
                            var data = signature.sign(req.sessionID, config.global.session.secret)
                            res.send({ data: data })
                        })
                    } else {
                        res.send({ error: Const.error.wx.bindAccount })
                    }
                })
            }
        }
    })(req, res, next)
})

module.exports = router