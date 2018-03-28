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

{ $Id: user.js,v 1.18 2018/03/09 10:16:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    passport = require(__node_modules + 'passport'),
    uuid = require(__node_modules + 'node-uuid'),
    moment = require(__node_modules + 'moment'),
    signature = require(__node_modules + 'cookie-signature'),
    router = express.Router(),
    logger = require('common').Logger.instance().getLogger(),
    schema = require('common').Schema,
    dataEntry = require('../../data/entry'),
    control = require('../../control'),
    Const = require('../../lib/const'),
    socketIO = require('../../connection/socket.io_v2')

const ITS = require('../../connection/its')
const ITSAE = require('../../connection/its_AE')
const parse = require('../../lib/parser')

router.get('/login', function (req, res) {
    res.render(__views_path + 'iTrader/user/login', {
        layout: __views_path + 'layout.ejs',
        site: config.global.site,
        userOptions: req.session.userOptions,
        error: req.query.error,
        username: req.body.username,
        config: config.iTrader,
        csrfToken: req.csrfToken(),
        loginConfig: config.iTrader.views.login
    })
    // if client has login and try to access the login page, force to logout it.
    if (req.user) {
        try {
            socketIO.emit(req.user.uid, { errorCode: '52', action: 'logout' })
            if (req.user.its) {
                req.user.its.logout()
            }
            if (req.session) {
                req.session.destroy(function (err) {
                    if (err) {
                        logger.error(err)
                    }
                })
            }
        } catch (err) {
            logger.error(err)
        }
    }
})

router.post('/login', control.initPassport, control.checkCaptcha, function (req, res, next) {
    passport.authenticate('local', { failureFlash: false }, function (err, username) {
        if (err) {
            var errorObj = parse.session(err, null, req)
            if (err.header && err.header.indexOf('challenge') >= 0) {
                errorObj.sessionID = uuid.v1()
                var temp_user = schema.UserSchema.makeFromObject({
                    id: req.body.username,
                    sessionID: errorObj.sessionID,
                    status: 0,
                    sessionObj: err,
                    requestDeviceInfo: req.RequestDeviceInfo,
                })
                dataEntry.set({ name: Const.DataAction.user }, temp_user.sessionID, temp_user)
                res.send({ data: errorObj })
            } else {
                if (err.errorCode == Const.error.ssm.password_expire) {
                    errorObj.sessionID = uuid.v1()
                    var temp_user = schema.UserSchema.makeFromObject({ id: req.body.username, sessionID: errorObj.sessionID, status: 0 })
                    dataEntry.set({ name: Const.DataAction.user }, temp_user.sessionID, temp_user)
                }
                res.send({ error: errorObj })
            }
        } else if (username) {
            req.logIn(username, function (err) {
                if (err) { return next(err) }
                var user = dataEntry.get({ name: Const.DataAction.user }, username)
                if (user && user.sessionObj) {
                    try {
                        user.requestDeviceInfo = req.RequestDeviceInfo
                        var data = parse.session(user.sessionObj, null, req)
                        var pwdExpiryPromptDays = config.iTrader.views.login.pwdExpiryPromptDays
                        // var datetimeFormat = 'YYYY/MM/DD HH:mm:ss'
                        var datetimeFormat = 'YYYY/MM/DD'
                        var expiryDate = moment(user.sessionObj.passwordExpiryDatetime, datetimeFormat)
                        var serverDate = moment(user.sessionObj.serverDatetime, datetimeFormat)
                        if (pwdExpiryPromptDays > 0) {
                            var durationDays = expiryDate.diff(serverDate, 'days', true)
                            if (durationDays <= pwdExpiryPromptDays) {
                                data.pwdExpiryPromptDays = durationDays
                            }
                        }
                        req.user = user
                        if (req._apiInfo && req._apiInfo.accessViaApi) {
                            handleAPIAccess(req, res, data)
                        } else {
                            return res.send({ data: data })
                        }
                    } catch (err) {
                        logger.error(err)
                    }
                }
            })
        }
    })(req, res, next)
})

router.get('/logout', control.isAuthenticated, function (req, res) {
    try {
        if (req.user && req.user.its) {
            socketIO.emit(req.user.uid, { errorCode: '52', action: 'logout' })
            req.user.its.logout()
        }
        var userOptions = req.session.userOptions
        req.session.destroy(function (err) {
            if (err) {
                logger.error(err)
            }
            if (req._isJsonRequest) {
                return res.send({ data: true })
            } else {
                res.redirect('/iTrader/user/login?lang=' + userOptions.lang)
            }
        })
    } catch (err) {
        res.send({ error: parse.error(Const.error.internal, null, req) })
        logger.error(err)
    }
})

router.post('/verifySession', control.isApiAuthenticated, function (req, res) {
    req.user.its.manualVerifySession()
    res.send(true)
})

router.post('/heartbeat', control.isApiAuthenticated, function (req, res) {
    req.user.its.heartbeat()
    req.user.its.verifySession()
    res.send(true)
})

function handleAPIAccess(req, res, data) {
    if (!req || !req.user) return
    res.setHeader('authorization', signature.sign(req.sessionID, configuration.global.session.secret))
    req.user.status = 2
    var its
    if (req.user.loginType == 0) {
        its = new ITSAE()
    } else {
        its = new ITS()
    }
    its.sessionObj = req.user.sessionObj
    its.loginID = req.user.id
    its.uid = req.user.uid
    req.user.its = its
    its.event.once('connect', () => {
        its.verify()
    })
    var done = false
    its.event.once('close', (had_error) => {
        if (!done && had_error) {
            res.send({ error: { 39: '-998' } })
            done = true
        }
    })
    its.event.once('verified', (result) => {
        if (result) {
            its.event.once('initialized', () => {
                if (!done) {
                    res.send({ data: data })
                    done = true
                }
                its.initialize()
            })
        } else {
            dataEntry.delete({ name: Const.DataAction.user }, req.user.uid)
        }
        setTimeout(function () {
            if (!done) {
                res.send({ data: data })
                done = true
            }
        }, 1000 * 5)
    })
    its.connect()
}

module.exports = router