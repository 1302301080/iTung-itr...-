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

{ $Id: control.js,v 1.28 2018/03/09 10:16:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    uuid = require(__node_modules + 'node-uuid'),
    passport = require(__node_modules + 'passport'),
    LocalStrategy = require(__node_modules + 'passport-local').Strategy,
    ipaddr = require(__node_modules + 'ipaddr.js'),
    cookie = require(__node_modules + 'express/node_modules/cookie'),
    signature = require(__node_modules + 'cookie-signature'),
    UA = require(__node_modules + 'ua-device'),
    request = require(__node_modules + 'request'),
    Const = require('./lib/const'),
    mktData = require('./lib/mktData'),
    SSM = require('./connection/ssm'),
    schema = require('common').Schema,
    dataEntry = require('./data/entry'),
    memberData = require('./data/eipo/members'),
    tfDds = require('./connection/tfdds'),
    logger = require('common').Logger.instance().getLogger(),
    wxaDriver = require('./wxa/wxaDriver')

var dllWrap = require('./lib/dllWrap')

exports.initPassport = function (req, res, next) {
    handleExternalAccess(req, res)
    var source = req.body.source
    if (req.body.username) {
        req.body.username = req.body.username.toUpperCase()  // auto upper username in server side
    }
    if (req.body.sessionID && (req.body.type === 'verify' || req.body.type === 'querylogin')) {
        req.body.username = Const.dummyLoginID  // use dummy usernmae & password to pass passport checking
        req.body.password = Const.dummyLoginPassword
    }
    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,
        session: true
    }, source === 'wxa' ? wxaLoginHandler : function (req, username, password, done) {
        var ssm = new SSM({ host: req.body.SSMHost, port: req.body.SSMPort })
        var user = dataEntry.get({ name: Const.DataAction.user }, req.body.sessionID)
        if (user && (req.body.type === 'verify' || req.body.type === 'querylogin')) {
            username = user.id
            password = ''
        }
        var handler = function (err, sessionObj, done) {
            if (err) {
                return done(err)
            } else if (sessionObj) {
                try {
                    mktData.CheckUpdate()
                    var accountID = username
                    if (sessionObj.user) {  // account id != username  for logon by name case
                        var index = sessionObj.user.indexOf('@')
                        accountID = index >= 0 ? sessionObj.user.substring(0, index) : sessionObj.user
                    }
                    var accounts = [accountID]
                    if (sessionObj.accounts) {
                        for (var a of sessionObj.accounts) {
                            if (accounts.indexOf(a) < 0) {
                                accounts.push(a)
                            }
                        }
                    }
                    sessionObj.accounts = sessionObj.accounts || [accountID]
                    var user = schema.UserSchema.makeFromObject({
                        id: accountID,
                        loginID: accountID,
                        uid: uuid.v1(),
                        status: 1,
                        username: username,  // username, input value in the login form
                        password: password,
                        accounts: accounts,
                        type: sessionObj.loginType
                    })
                    user.entitlement = []
                    user.info = {
                        lastLoginTime: sessionObj.lastLoginTime,
                        lastLoginApp: sessionObj.lastLoginApp
                    }
                    user.sessionObj = sessionObj
                    if (sessionObj.imageObj) {
                        var i = 200
                        while (true) {
                            var item = sessionObj.imageObj[i.toString()]
                            if (typeof (item) === 'undefined') {
                                break
                            } else if (item) {
                                user.entitlement.push(item)
                            }
                            i++
                        }
                    }
                    if (user.entitlement.indexOf(Const.entitlement.skipDisclaimer) >= 0) {
                        user.skipDisclaimer = true
                    }
                    if (!config.iTrader.views.trade.order_confirmation.compulsoryPasswordConfirmation && user.entitlement.indexOf(Const.entitlement.skipTradingPassword) >= 0) {
                        user.skipTradingPassword = true
                    }

                    if (EntryList.indexOf('eipo') >= 0) {
                        memberData.getMembers(user.id, user.type, function (err, data) {
                            if (data && data.length > 0) {
                                user.AECode = data[0]
                                for (var item of data) {
                                    tfDds.subscribeApplications(item)
                                }
                            }
                        })
                    }
                    if (req.body.isExternalAccess) {
                        user.status = 2
                        req.user = user
                    }
                    if (configuration.iTrader.quote) {
                        if (configuration.iTrader.quote.testAccount) {
                            user._quoteSession = configuration.iTrader.quote.testAccount
                        } else {
                            try {
                                user._quoteSession = {
                                    username: username,
                                    password: dllWrap.EncryptPassword('{0}@{1}'.format(account, obj.broker), 10)
                                }
                            } catch (error) {
                                logger.error('get password failed. error: ' + error)
                            }
                        }
                        user._quoteSession = {  // for login to session server
                            username: 'test1',
                            password: '1234'
                        }
                    }
                    dataEntry.set({ name: Const.DataAction.user }, user.uid, user)
                    return done(null, user.uid)
                } catch (err) {
                    logger.error(err)
                    return done(err)
                }
            }
        }
        ssm.event.on('connect', () => {
            var browser = new UA(req.headers['user-agent']) || {}
            if (req.body.isExternalAccess) {
                ssm.verify(req.body.password, req.body.username, function (err, sessionObj) {
                    handler(err, sessionObj, done)
                })
            } else {
                var browserInfo = ''
                var deviceOS = ''
                if (browser) {
                    if (browser.browser && browser.browser.name) {
                        browserInfo = browser.browser.name
                    }
                    if (browser.browser && browser.browser.version && browser.browser.version.original) {
                        browserInfo += ' ' + browser.browser.version.original
                    }
                    if (browser.os && browser.os.name) {
                        deviceOS = browser.os.name + ' ' + (browser.os.version ? browser.os.version.alias : '')
                    }
                }
                req.RequestDeviceInfo = {
                    clientIP: req.clientIP || '',
                    deviceOS: deviceOS || '',
                    browser: browserInfo || '',
                    location: req.body.location || ''
                }
                ssm.login(username, password, {
                    clientIP: req.clientIP,
                    type: req.body.type,
                    loginType: req.body.loginType || config.iTrader.oms.loginType,
                    sessionID: user && user.sessionObj ? user.sessionObj.sessionID : '',
                    tokenCode: req.body.tokenCode,
                    deviceOS: deviceOS,
                    browser: browserInfo,
                    tokenType: req.body.tokenType || '',
                    location: req.body.location,
                }, (err, sessionObj) => {
                    handler(err, sessionObj, done)
                })
            }
        })
        ssm.connect()
    }
    ))

    passport.serializeUser(function (sessionID, done) {
        done(null, sessionID)
    })

    passport.deserializeUser(function (sessionID, done) {
        done(null, sessionID)
    })

    next()
}

exports.Authenticate = function (req, res, next) {
    req.auth_status = -1
    var sessionID = (req.session && req.session.passport) ? req.session.passport.user : ''
    sessionID = req.body.sessionID || sessionID
    sessionID = req.query.sessionID || sessionID
    if (sessionID) {
        req.user = dataEntry.get({ name: Const.DataAction.user }, sessionID)
        if (req.user && req.user.status) {
            req.auth_status = req.user.status
        }
    }
    if (req && req.headers && req.headers.authorization) {
        var passportSessionID = signature.unsign(req.headers.authorization, config.global.session.secret)
        config.global.session.store.get(passportSessionID, function (err, session) {
            if (!err && session && session.passport && session.passport.user) {
                req.session = session
                req.user = dataEntry.get({ name: Const.DataAction.user }, session.passport.user)
                if (req.user && req.user.status) {
                    req.auth_status = req.user.status
                }
            }
            return next()
        })
    } else {
        return next()
    }
}

exports.unAuthenticatedPassed = function (req, res, next) {
    if (req.auth_status >= 0) {
        return next()
    }
    res.redirect('/iTrader/user/login')
}

exports.unAcceptedPassed = function (req, res, next) {
    if (req.auth_status >= 1) {
        return next()
    }
    res.redirect('/iTrader/user/login')
}

exports.isAuthenticated = function isAuthenticated(req, res, next) {
    if (req.auth_status >= 2) {
        return next()
    }
    if (req._apiInfo && req._apiInfo.accessViaApi) {
        res.status(401).send('Unauthorized request.')
    } else {
        res.redirect('/iTrader/user/login')
    }
}

exports.isApiAuthenticated = function (req, res, next) {
    if (req.auth_status >= 2) {
        return next()
    }
    res.status(401).send('Unauthorized request.')
}

exports.csrfProtection = function (req, res, next) {
    if ((!req._apiInfo || !req._apiInfo.accessViaApi) && req.CSRFTOKENRequired && (req.user && !req.user.skipCSRFProtection)) {
        res.status(403)
        res.send({ errorCode: 'I_forbidden' })
    } else {
        next()
    }
}

exports.setup = function (req, res, next) {
    req.site = config.global.site
    var theme
    if (req.headers.cookie) {
        var cookieObj = cookie.parse(req.headers.cookie)
        theme = cookieObj.theme
    }
    if (!req.session.userOptions) {
        var accept_languase = req.headers["accept-language"]
        if (accept_languase) {
            if (accept_languase.startsWith('zh-HK') || accept_languase.startsWith('zh-TW')) {
                accept_languase = Const.languages.zh_hk
            } else if (accept_languase.startsWith('zh')) {
                accept_languase = Const.languages.zh_cn
            } else {
                accept_languase = Const.languages.en_us
            }
        }
        req.session.userOptions = {
            lang: accept_languase || config.global.site.languages[0],
            theme: theme || (config.global.site.themes ? config.global.site.themes[0] : config.global.site.theme)
        }
    }
    if (req.query.lang || req.body.lang || req.body.culture) {
        var lang = req.query.lang || req.body.lang || req.body.culture
        lang = lang.toLowerCase()
        if (lang === 'chi' || lang === 'zh-chi' || lang === 'zh-cht' || lang === 'zh-hk') {
            lang = 'zh-HK'
        } else if (lang === 'chn' || lang === 'zh-chn' || lang === 'zh-chs' || lang === 'zh-cn') {
            lang = 'zh-CN'
        } else if (lang === 'eng' || lang === 'en' || lang === 'en-us') {
            lang = 'en-US'
        }
        for (var i in Const.languages) {
            if (lang === Const.languages[i]) {
                req.session.userOptions.lang = lang
            }
        }
    }
    if (req.query.theme || theme) {
        req.session.userOptions.theme = req.query.theme || theme
    }
    if (config.global.site.themes.indexOf(req.session.userOptions.theme) < 0) {  // handle invalid theme
        req.session.userOptions.theme = config.global.site.themes ? config.global.site.themes[0] : config.global.site.theme
    }
    req.session.userOptions.themes = config.global.site.themes
    try {
        req.clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
        var addr = ipaddr.parse(req.clientIP)
        if (typeof (addr.isIPv4MappedAddress) === 'function' && addr.isIPv4MappedAddress()) {
            req.clientIP = addr.toIPv4Address()
        }
        req.clientIP = req.clientIP === '::1' ? '127.0.0.1' : req.clientIP
        if (req.body.clientIP) {
            req.clientIP = req.body.clientIP
        }
    } catch (error) {
        logger.error('get client ip failed. error: ' + error)
    }

    if (typeof req.session.userOptions.isMobile === 'undefined') {
        var ua = req.headers["user-agent"]
        var ipad = /(iPad).*OS\s([\d_]+)/.test(ua),
            isIphone = !ipad && /(iPhone\sOS)\s([\d_]+)/.test(ua),
            isAndroid = /(Android)\s+([\d.]+)/.test(ua),
            isMobile = isIphone || isAndroid
        req.session.userOptions.isMobile = isMobile
    }
    if (req.headers["content-type"] === "application/json") {
        req._isJsonRequest = true
    }
    req.session.userOptions.randomKey = (new Date()).getTime()
    req.session._apiInfo = req._apiInfo
    next()
}

exports.trimBody = function (req, res, next) {
    function toDBC(str) {
        var result = ''
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i)
            if (code >= 65281 && code <= 65373) {
                result += String.fromCharCode(str.charCodeAt(i) - 65248)
            } else if (code == 12288) {
                result += String.fromCharCode(str.charCodeAt(i) - 12288 + 32)
            } else {
                result += str.charAt(i)
            }
        }
        return result
    }
    function trimObj(obj) {
        if (!obj || typeof obj !== 'object') return
        try {
            for (var p in obj) {
                if (typeof obj[p] === 'object') trimObj(obj[p])
                else obj[p] = toDBC(String(obj[p]).trim())
            }
        } catch (err) {
            logger.error(err)
        }
    }
    trimObj(req.body)
    trimObj(req.query)
    next()
}

exports.checkCaptcha = function (req, res, next) {
    if (!config.iTrader.views.login.captcha) return next()
    if (req.session && req.session.captcha && req.body.captcha) {
        var txt1 = req.session.captcha.toLowerCase()
        var txt2 = req.body.captcha.toLowerCase()
        if (txt1 === txt2) return next()
    }
    return res.send({ error: Const.error.tokenCodeError })
}

exports.handleParameters = function (req, res, next) {
    var parameters = req._parameters
    var dataObj = req.method === 'GET' ? req.query : req.body
    if (IsArray(parameters)) {
        for (var item of parameters) {
            if (typeof item === 'string') {
                if (!dataObj[item]) return res.send({ error: Const.error.parameter })
            }
        }
    }
    next()
}

function wxaLoginHandler(req, username, password, done) {
    var wxac = config.wxa
    var url = '{0}?appid={1}&secret={2}&js_code={3}&grant_type={4}'.format(wxac.url, wxac.appid, wxac.secret, password, 'authorization_code')
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body)
            if (data) {
                // var openid = data.unionid || data.openid
                var openid = data.openid
                wxaDriver.getUserByOpenID(openid, function (err, account) {
                    if (!err && account) {
                        var user = schema.UserSchema.makeFromObject({
                            id: account,
                            loginID: configuration.wxa.oms.user,
                            uid: uuid.v1(),
                            status: 2,
                            type: 1
                        })
                        var systemUser = wxaDriver.getSystemUser() || {}
                        user.its = systemUser.its || {}
                        user.accounts = [account]
                        user.skipCSRFProtection = true
                        dataEntry.set({ name: Const.DataAction.user }, user.uid, user)
                        return done(null, { uid: user.uid, account: account })
                    } else {
                        return done(false, { openid: openid })
                    }
                })
            } else {
                logger.error('weixin login failed. invalid data: ' + data)
                return done(false)
            }
        } else {
            logger.error('weixin login failed. error: {0}  {1}'.format(error, body))
            return done(false)
        }
    })
}

function handleExternalAccess(req, res) {
    // compatible with eipo.net
    if (req.body.Auto == 'True' && req.body.Session) {
        req.body.isExternalAccess = true
        req.body.username = req.body.UserCode
        req.body.password = req.body.Session
        req.body.SSMHost = req.body.Host
        req.body.SSMPort = req.body.Port
    }
    // compatible with eStatement.net
    if (req.body.acct && req.body.session) {
        req.body.isExternalAccess = true
        req.body.username = req.body.acct
        req.body.password = req.body.session
        req.body.SSMHost = req.body.host
        req.body.SSMPort = req.body.port
    }

    if (req.body.source === 'wxa' && req.body.code) {
        req.body.username = req.body.code  // dummy name for pass LocalStrategy
        req.body.password = req.body.code
    }
}