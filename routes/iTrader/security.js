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

{ $Id: security.js,v 1.13 2018/03/09 10:16:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var express = require(__node_modules + 'express'),
    config = require(__config_path),
    control = require('../../control'),
    logger = require('common').Logger.instance().getLogger(),
    schema = require('common').Schema,
    Const = require('../../lib/const'),
    SSM = require('../../connection/ssm'),
    parse = require('../../lib/parser'),
    // ccap = require(__node_modules + 'ccap')(),
    router = express.Router()

router.get('/password/change', control.unAuthenticatedPassed, function (req, res) {
    res.render(__views_path + 'iTrader/password/change', {
        layout: __views_path + 'layout',
        csrfToken: req.csrfToken()
    })
})

router.get('/2FARegistration', control.unAuthenticatedPassed, function (req, res) {
    if (!req.user) {
        return res.send({ error: Const.error.internal })
    }
    var user = req.user
    user = user.sessionObj.imageObj
    var availableTokenTypes = (user[128] || '').split(',')
    var availableDeliveryMethods = (user[129] || '').split(',')
    res.render(__views_path + 'iTrader/user/2FARegistration', {
        layout: __views_path + 'layout',
        csrfToken: req.csrfToken(),
        availableTokenTypes: availableTokenTypes,
        availableDeliveryMethods: availableDeliveryMethods
    })
})

router.post('/2FARegistration', control.unAuthenticatedPassed, function (req, res) {
    if (!req.user) {
        return res.send({ error: Const.error.internal })
    }
    if (!req.body.tokenType) {
        return res.send({ error: Const.error.parameter })
    }
    if (req.body.cmd !== 'regtoken' && req.body.cmd !== 'chgtoken') {
        return res.send({ error: Const.error.parameter })
    }
    try {
        var sessionObj = {}
        var options = {}
        var user = req.user
        sessionObj = user.sessionObj
        options.cmd = req.body.cmd
        options.tokenType = req.body.tokenType
        options.deliveryMethod = req.body.deliveryMethod
        options.clientIP = user.requestDeviceInfo.clientIP
        options.deviceOS = user.requestDeviceInfo.deviceOS
        options.browser = user.requestDeviceInfo.browser
        options.location = user.requestDeviceInfo.location
        user.ssm = (user.ssm && user.ssm.isConnected) ? user.ssm : new SSM()
        user.ssm.event.once('connect', () => {
            user.ssm.once(function (event, data) {
                var sessionObj = schema.SessionSchema.makeFromImage(data, 1)
                if (sessionObj) {
                    if (!sessionObj.errorCode) {
                        if (req.body.cmd == 'chgtoken') {
                            // req.user.its.logout()
                            // req.session.destroy()
                            // req.user.auth_status = 1
                            req.user.forceReLogin = true
                        }
                        res.send({ data: parse.session(sessionObj, null, req) })
                    } else {
                        res.send({ error: parse.session(sessionObj, null, req) })
                    }
                }
            })
            user.ssm.registration2FA(sessionObj, options)
        })
        user.ssm.connect()
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

router.post('/resendActCode', control.unAuthenticatedPassed, function (req, res) {
    if (!req.user) {
        return res.send({ error: Const.error.internal })
    }
    try {
        var options = {}
        var user = req.user
        options.sessionID = user.sessionID
        options.clientIP = user.requestDeviceInfo.clientIP
        options.deviceOS = user.requestDeviceInfo.deviceOS
        options.browser = user.requestDeviceInfo.browser
        options.location = user.requestDeviceInfo.location
        var user = req.user
        user.ssm = (user.ssm && user.ssm.isConnected) ? user.ssm : new SSM()
        user.ssm.event.once('connect', () => {
            user.ssm.once(function (event, data) {
                var sessionObj = schema.SessionSchema.makeFromImage(data, 1)
                if (sessionObj) {
                    if (!sessionObj.errorCode) {
                        res.send({ data: parse.session(sessionObj, null, req) })
                    } else {
                        res.send({ error: parse.session(sessionObj, null, req) })
                    }
                }
            })
            user.ssm.resendactcode(user.sessionObj, options)
        })
        user.ssm.connect()
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

router.post('/password/change', control.unAuthenticatedPassed, function (req, res, next) {
    var old_pwd = req.body.old_password
    var new_pwd = req.body.new_password
    var confirm_pwd = req.body.confirm_password
    if (!old_pwd || !new_pwd || !confirm_pwd || new_pwd !== confirm_pwd) {
        res.send({ error: Const.error.parameter })
        return
    }
    try {
        var user = req.user
        user.ssm = (user.ssm && user.ssm.isConnected) ? user.ssm : new SSM()
        user.ssm.event.once('connect', () => {
            user.ssm.once(function (event, data) {
                var sessionObj = schema.SessionSchema.makeFromImage(data, 1)
                if (sessionObj) {
                    if (!sessionObj.errorCode) {
                        user.password = new_pwd   // to make trading password take effect  v1.5.1
                        res.send({ data: true })
                    } else {
                        res.send({ error: parse.session(sessionObj, null, req) })
                    }
                    user.ssm.destroy()
                    user.ssm = null
                }
            })
            user.ssm.changePassword(user.id, old_pwd, new_pwd)
        })
        user.ssm.connect()
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

router.post('/password/validate', control.unAuthenticatedPassed, function (req, res, next) {
    var new_pwd = req.body.new_password
    var mode = req.body.mode || 0
    if (!new_pwd) {
        res.send({ error: Const.error.parameter })
        return
    }
    try {
        // default use password rule in config, otherwise use SSM testpwd function
        if (config.iTrader.oms.password && config.iTrader.oms.password.pattern) {
            var matches = new_pwd.match(config.iTrader.oms.password.pattern)
            if (matches && matches.length > 0 && matches[0] === new_pwd) {
                res.send(true)
            } else {
                res.send(false)
            }
        } else {
            var user = req.user
            user.ssm = (user.ssm && user.ssm.isConnected) ? user.ssm : new SSM()
            user.ssm.event.once('connect', (e) => {
                user.ssm.once(function (event, data) {
                    var sessionObj = schema.SessionSchema.makeFromImage(data, 1)
                    if (sessionObj && !sessionObj.errorCode) {
                        res.send(true)
                    } else {
                        var errorObj = { error: parse.error({ 39: sessionObj.errorCode, 25: sessionObj.freeText }, null, req) }
                        res.send(mode == 1 ? errorObj : false)
                    }
                })
                user.ssm.validatePassword(user.id, new_pwd, { loginType: 1 })
            })
            user.ssm.connect()
        }
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

router.post('/pin/verify', control.unAuthenticatedPassed, function (req, res, next) {
    if (!req.body.pin) {
        res.send({ error: Const.error.parameter })
        return
    }
    try {
        var user = req.user
        user.ssm = (user.ssm && user.ssm.isConnected) ? user.ssm : new SSM()
        user.ssm.event.once('connect', (e) => {
            user.ssm.once(function (event, data) {
                var sessionObj = schema.SessionSchema.makeFromImage(data, 1)
                var sessionTag = parse.session(sessionObj, null, req)
                if (!sessionObj.errorCode) {
                    res.send({ data: sessionTag })
                } else {
                    res.send({ error: sessionTag })
                }
            })
            user.ssm.verifyPIN(req.body.pin, user.sessionObj)
        })
        user.ssm.connect()
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

router.post('/resendOTP', control.unAuthenticatedPassed, function (req, res, next) {
    if (!req.user) {
        return res.send({ error: Const.error.internal })
    }
    try {
        var user = req.user
        var secondaryTokenType = req.body.secondTokenType
        user.ssm = (user.ssm && user.ssm.isConnected) ? user.ssm : new SSM()
        user.ssm.event.once('connect', (e) => {
            user.ssm.once(function (event, data) {
                var sessionObj = schema.SessionSchema.makeFromImage(data, 1)
                var sessionTag = parse.session(sessionObj, null, req)
                if (!sessionObj.errorCode) {
                    res.send({ data: sessionTag })
                } else {
                    res.send({ error: sessionTag })
                }
            })
            user.ssm.resendOTP(user.sessionObj, { 'secondaryTokenType': secondaryTokenType })
        })
        user.ssm.connect()
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

router.post('/requestOTP', control.unAuthenticatedPassed, function (req, res, next) {
    if (!req.user) {
        return res.send({ error: Const.error.internal })
    }
    try {
        var user = req.user
        var options = {}
        options.tokenType = req.body.tokenType
        options.notifyNumber = req.body.notifyNumber
        options.countryCode = req.body.countryCode
        user.ssm = (user.ssm && user.ssm.isConnected) ? user.ssm : new SSM()
        user.ssm.event.once('connect', (e) => {
            user.ssm.once(function (event, data) {
                var sessionObj = schema.SessionSchema.makeFromImage(data, 1)
                var sessionTag = parse.session(sessionObj, null, req)
                if (!sessionObj.errorCode) {
                    res.send({ data: sessionTag })
                } else {
                    res.send({ error: sessionTag })
                }
            })
            user.ssm.requestOTP(user.sessionObj, options)
        })
        user.ssm.connect()
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

router.get('/captcha', function (req, res, next) {
    // this function is not ready
    var ary = ccap.get()
    req.session.captcha = ary[0]
    res.end(ary[1])
})

module.exports = router