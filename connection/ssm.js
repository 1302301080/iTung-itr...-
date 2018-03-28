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

{ $Id: ssm.js,v 1.15 2018/03/09 10:16:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

var config = require(__config_path),
    schema = require('common').Schema,
    logger = require('common').Logger.instance().getLogger(),
    BaseSocket = require('./baseSocket')

module.exports = class SSM extends BaseSocket {
    constructor(options) {
        options = options || {}
        super(options)
        this.clientHost = options.host || config.iTrader.oms.servers.SSM.host
        this.clientPort = options.port || config.iTrader.oms.servers.SSM.port
        this.name = 'SSM'
    }

    login(loginID, password, options, callback) {
        try {
            options = options || {}
            var image = ''
            if (options.type === 'verify' && options.tokenCode) {
                image = schema.SessionSchema.makeFromObject({
                    header: ['verifytoken'],
                    sessionID: options.sessionID,
                    device: config.iTrader.oms.device,
                    user: loginID,
                    tokenCode: options.tokenCode,
                    tokenType: options.tokenType,
                }).castImage()
            } else if (options.type === 'querylogin') {
                image = schema.SessionSchema.makeFromObject({
                    header: ['querylogin'],
                    sessionID: options.sessionID,
                    user: loginID,
                }).castImage()
            } else {
                image = schema.SessionSchema.makeFromObject({
                    header: ['login'],
                    user: loginID,
                    password: password,
                    loginType: typeof options.loginType === 'undefined' ? 1 : options.loginType,
                    device: config.iTrader.oms.device,
                    appID: config.iTrader.oms.applicationID,
                    appVersion: config.global.site.version,
                    clientIP: options.clientIP,
                    browser: options.browser,
                    deviceOS: options.deviceOS,
                    location: options.location,
                }).castImage()
            }
            this.send(image, function (err, data) {
                var sessionObj = schema.SessionSchema.makeFromImage(data, 1)
                if (data.indexOf('error') === 0) {
                    callback(sessionObj, null)
                } else if (data.indexOf('challenge') === 0) {
                    callback(sessionObj, null)
                } else if (data.indexOf('session') === 0) {
                    callback(err, sessionObj)
                }
            })
        } catch (err) {
            logger.error(err)
        }
    }

    verify(sessionID, loginID, callback) {
        try {
            var cmd = {
                header: ['verify'],
                user: loginID,
                sessionID: sessionID
            }
            var image = schema.SessionSchema.makeFromObject(cmd).castImage()
            this.send(image, function (err, data) {
                var sessionObj = schema.SessionSchema.makeFromImage(data, 1)
                if (data.indexOf('error') === 0) {
                    callback(sessionObj, null)
                } else if (data.indexOf('session') === 0) {
                    callback(err, sessionObj)
                }
            })
        } catch (err) {
            logger.error(err)
        }
    }

    changePassword(account, old_pwd, new_pwd, options) {
        options = options || {}
        try {
            var cmd = {
                header: ['password'],
                user: account,
                password: old_pwd,
                freeText: new_pwd,
                device: config.iTrader.oms.device,
                loginType: typeof options.loginType === 'undefined' ? 1 : options.loginType
            }
            var image = schema.SessionSchema.makeFromObject(cmd).castImage()
            this.send(image)
        } catch (err) {
            logger.error(err)
        }
    }

    registration2FA(sessionObj, options) {
        options = options || {}
        try {
            var cmd = {
                header: [options.cmd],
                sessionID: sessionObj.sessionID,
                user: sessionObj.user,
                tokenType: options.tokenType,
                deliveryMethod: options.deliveryMethod
            }
            this.getAuditInfo(cmd, options)
            var image = schema.SessionSchema.makeFromObject(cmd).castImage()
            this.send(image)
        } catch (err) {
            logger.error(err)
        }
    }

    resendactcode(sessionObj, options) {
        options = options || {}
        try {
            var cmd = {
                header: ['resendactcode'],
                sessionID: sessionObj.sessionID,
            }
            this.getAuditInfo(cmd, options)
            var image = schema.SessionSchema.makeFromObject(cmd).castImage()
            this.send(image)
        } catch (err) {
            logger.error(err)
        }
    }

    validatePassword(account, new_pwd, options) {
        options = options || {}
        try {
            var image = schema.SessionSchema.makeFromObject({
                header: ['testpwd'],
                user: account,
                password: new_pwd,
                loginType: options.loginType,
                device: config.iTrader.oms.device,
                userRef: 'testpwd'
            }).castImage()
            this.send(image)
        } catch (err) {
            logger.error(err)
        }
    }

    verifyPIN(pin, sessionObj) {
        if (!pin || !sessionObj) return
        try {
            var image = schema.SessionSchema.makeFromObject({
                header: ['PIN'],
                sessionID: sessionObj.sessionID,
                device: config.iTrader.oms.device,
                user: sessionObj.user,
                pin: pin
            }).castImage()
            this.send(image)
        } catch (err) {
            logger.error(err)
        }
    }

    resendOTP(sessionObj, options) {
        options = options || {}
        if (!sessionObj) return
        try {
            var cmd = {
                header: ['resendotp'],
                sessionID: sessionObj.sessionID,
                user: sessionObj.user,
                loginType: sessionObj.loginType,
                secondaryTokenType: options.secondaryTokenType
            }
            this.getAuditInfo(cmd, options)
            var image = schema.SessionSchema.makeFromObject(cmd).castImage()
            this.send(image)
        } catch (err) {
            logger.error(err)
        }
    }

    requestOTP(sessionObj, options) {
        options = options || {}
        if (!sessionObj) return
        try {
            var cmd = {
                header: ['requestotp'],
                sessionID: sessionObj.sessionID,
                user: sessionObj.user,
                loginType: sessionObj.loginType,
                tokenType: options.tokenType,
                notifyNumber: options.notifyNumber,
                countryCode: options.countryCode
            }
            this.getAuditInfo(cmd, options)
            var image = schema.SessionSchema.makeFromObject(cmd).castImage()
            this.send(image)
        } catch (err) {
            logger.error(err)
        }
    }

    getAuditInfo(cmd, options) {
        if (cmd && options) {
            if (options.clientIP) {
                cmd.clientIP = options.clientIP
            }
            if (options.deviceOS) {
                cmd.deviceOS = options.deviceOS
            }
            if (options.browser) {
                cmd.browser = options.browser
            }
            if (options.location) {
                cmd.location = options.location
            }
        }
    }

    // for wxa send OTP
    sendOTP(options, callback) {
        if (!options) return
        try {
            var image = schema.SessionSchema.makeFromObject({
                header: ['requestotp'],
                tokenType: options.tokenType,
                notifyNumber: options.notifyNumber,
                countryCode: options.countryCode,
                device: config.iTrader.oms.device,
            }).castImage()
            this.send(image, function (err, data) {
                if (typeof callback === 'function') {
                    callback(err, data)
                }
            })
            return true
        } catch (err) {
            logger.error(err)
        }
    }

    bind(options, callback) {
        if (!options) return
        try {
            var image = schema.SessionSchema.makeFromObject({
                header: ['bind'],
                sessionID: options.sessionID,
                tokenType: options.tokenType,
                notifyNumber: options.notifyNumber,
                countryCode: options.countryCode,
                tokenCode: options.tokenCode,
                device: config.iTrader.oms.device,
            }).castImage()
            this.send(image, function (err, data) {
                if (typeof callback === 'function') {
                    callback(err, data)
                }
            })
            return true
        } catch (err) {
            logger.error(err)
        }
    }
}