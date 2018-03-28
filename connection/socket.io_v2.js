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

{ $Id: socket.io_v2.js,v 1.15 2018/01/19 10:00:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

var signature = require(__node_modules + 'cookie-signature'),
    cookie = require(__node_modules + 'express/node_modules/cookie'),
    dataEntry = require('../data/entry'),
    logger = require('common').Logger.instance().getLogger(),
    Const = require('../lib/const'),
    OmsUtility = require('../lib/omsUtility'),
    ipoData = require('../data/eipo/ipos'),
    applicationData = require('../data/eipo/applications'),
    dds = require('./dds')

const EventEmitter = require('events')

var parser = require('../lib/parser')
var util = require('../lib/utility')

var socketMap = {}                     // <socket.id, socket>
var pendingAccountData = {}            // key: <Acct>_<CURRENCY>
var pendingProductData = {}            // key: <SYMBOL>

function connect(server) {
    var io = require('socket.io')(server)
    subscribeData()
    handleUpdate()
    io.on('connection', function (socket) {
        log('soicket.io client connected.', socket, 'info')
        socket.on('disconnect', function () {
            log('socket disconnectd.', socket, 'info')
            if (socketMap[socket.id]) {
                if (socketMap[socket.id]._subscribedSymbolPriceList) {
                    dds.UnSubscribeSymbol(socketMap[socket.id]._subscribedSymbolPriceList)
                }
                socketMap[socket.id] = null
                delete (socketMap[socket.id])
            }
            socket = null
        }.bind(this))

        socket.on('error', function (err) {
            log(err, socket, 'error')
        })
        socket.on('auth', function (data) {
            log('socket auth, sid: ' + data || '', socket, 'info')
            auth(socket, data)
        })
        socket._emit = socket.emit
        socket.emit = function (name, value) {
            log(name + '  ' + typeof value === 'object' ? JSON.stringify(value) : value, socket, 'trace')
            socket._emit(name, value)
        }
    }.bind(this))
}

function auth(socket, sid) {
    if (!sid) {
        if (socket.request.headers.authorization) {
            sid = signature.unsign(socket.request.headers.authorization, configuration.global.session.secret)
        } else {
            var signedCookies = cookie.parse(socket.request.headers.cookie || '')
            if (signedCookies && signedCookies.sid) {
                sid = signature.unsign(signedCookies.sid.slice(2), configuration.global.session.secret)
            }
        }
    } else {
        sid = signature.unsign(sid, configuration.global.session.secret)
    }
    if (sid) {
        configuration.global.session.store.get(sid, function (err, session) {
            if (err) {
                log(err, socket, 'error')
                socket.emit('auth', false)
            } else {
                if (session) {
                    socket._requestInfo = {
                        lang: session.userOptions ? session.userOptions.lang : 'en-US',
                        channel: session._apiInfo ? session._apiInfo.channel : ''
                    }
                    socket.getRequestInfo = function () {
                        socket._requestInfo.lang = session.userOptions ? session.userOptions.lang : 'en-US'
                        return socket._requestInfo
                    }
                    var uid
                    if (session.passport) {
                        uid = session.passport.user
                    } else if (session.req.user) {
                        uid = session.req.user.uid
                    }
                    if (uid) {
                        socket._user = dataEntry.get({ name: Const.DataAction.user }, uid)
                        if (!socket._user) {
                            socket.emit('auth', false)
                            return
                        }
                        socket.on('data', function (data) {
                            try {
                                if (typeof data === "string") {
                                    socket._subscribeData = data.split(',')
                                } else {
                                    socket._subscribeData = data
                                }
                                distributeInitData(socket)
                            } catch (error) {
                                log(error, socket, 'error')
                            }
                        })
                        socket.on('update', function (data) {
                            if (!data) return
                            if (data === 'position') {
                                distributeData(socket, dataEntry.get({ name: Const.DataAction.position }, socket._user.loginID), 'position')
                            } else if (data === 'account') {
                                distributeData(socket, dataEntry.get({ name: Const.DataAction.account }, socket._user.loginID), 'account')
                            }
                        })
                        socket.on('price', function (data) {
                            if (IsArray(data)) {
                                dds.UnSubscribeSymbol(socket._subscribedSymbolPriceList)
                                dds.SubscribeSymbol(data)
                                socket._subscribedSymbolPriceList = data
                            }
                        })
                        socket._user = dataEntry.get({ name: Const.DataAction.user }, uid)
                        handleAnnouncement(socket)
                        socketMap[socket.id] = socket
                        socket.emit('auth', true)
                    } else {
                        socket.emit('auth', false)
                    }
                } else {
                    socket.emit('auth', false)
                }
            }
        }.bind(this))
    } else {
        socket.emit('auth', false)
        return
    }
}

/* subscribe data */
function subscribeData() {
    dataEntry.event({ name: Const.DataAction.currency }).on('currency', function (data) {
        distributeData(null, data, 'currency')
    })
    dataEntry.event({ name: Const.DataAction.spread }).on('spread', function (data) {
        distributeData(null, data, 'spread')
    })
    dataEntry.event({ name: Const.DataAction.order }).on('order', function (data) {
        if (!data) return
        distributeData(null, data, 'order')
        positionUpdate(data.symbol)
    })
    var errorOrderEvent = dataEntry.event({ name: Const.DataAction.errorOrder })

    errorOrderEvent.on('errororder', function (data) {
        if (!data) return
        distributeData(null, data, 'errororder')
    })

    dataEntry.event({ name: Const.DataAction.position }).on('position', function (data) {
        distributeData(null, data, 'position')
    })
    dataEntry.event({ name: Const.DataAction.account }).on('account', function (data) {
        if (!data) return
        if (getUpdateFrequency('account') > 0) {
            var key = data.account + '_' + (data.currency || '')
            pendingAccountData[key] = data
        } else {
            distributeData(null, data, 'account')
        }
    })
    dataEntry.event({ name: Const.DataAction.product }).on('product', function (data) {
        if (!data) return
        if (getUpdateFrequency('product') > 0) {
            var key = data.symbol
            pendingProductData[key] = data
        }
    })
    dataEntry.event({ name: Const.DataAction.exchange }).on('exchange', function (data) {
        if (!data) return
        distributeData(null, data, 'exchange')
    })
    dataEntry.event({ name: Const.DataAction.margin }).on('margin', function (data) {
        if (!data) return
        positionUpdate(data.symbol)
    })
    dataEntry.event({ name: Const.DataAction.exchange }).on('exchange', function (data) {
        if (!data) return
        distributeData(null, data, 'exchange')
    })

    applicationData.event.on('APP', function (data) {
        distributeData(null, applicationData.convert(data), 'ipo-app')
    })

    // subscribe symbol price update
    dataEntry.event({ name: Const.DataAction.product }).on('price-update', function (data) {
        if (!data) return
        distributeData(null, data, 'price', ProcessPriceUpdate)
    })
}

function handleUpdate() {
    var accountFrequency = getUpdateFrequency('account')
    var productFrequency = getUpdateFrequency('product')
    if (accountFrequency > 0) {
        setInterval(function () {
            for (var a in pendingAccountData) {
                distributeData(null, pendingAccountData[a], 'account')
            }
            pendingAccountData = {}
        }, accountFrequency)
    }
    if (productFrequency > 0) {
        setInterval(function () {
            if (!pendingProductData) return
            for (var p in pendingProductData) {
                var symbolObj = pendingProductData[p]
                positionUpdate(symbolObj.symbol)
            }
            pendingProductData = {}
        }, productFrequency)
    }
}

function positionUpdate(symbol) {
    if (!symbol) return
    for (var s in socketMap) {
        var socket = socketMap[s]
        if (!socket || !socket._user) continue
        var positions = dataEntry.get({ name: Const.DataAction.position }, socket._user.loginID)
        if (positions && positions.length > 0) {
            for (var p of positions) {
                if (symbol === p.symbol) {
                    distributeData(socket, p, 'position')
                }
            }
        }
    }
}

/* process data */
function processData(socket, data, name, cb) {
    if (!socket || !socket._user || !name || !data) return
    if (!IsArray(data)) {
        data = [data]
    }
    var resData = {
        name: name,
        account: '',
        data: []
    }
    var processedDataKeyList = []
    for (var item of data) {
        var account = OmsUtility.TrimCNYAccountSuffix(item.account)
        if (account) {
            if (socket._user.accounts && socket._user.accounts.indexOf(account) < 0) {
                continue
            }
        }
        resData.account = account
        var omsTagObj
        if (name === 'order') {
            item.__getProductSync = function (symbol) {
                return dataEntry.get({ name: Const.DataAction.product }, symbol)
            }
            var symbolObj = dataEntry.get({ name: Const.DataAction.product }, item.symbol)
            if (symbolObj) {
                processedDataKeyList.push(item.symbol)
                omsTagObj = parser.order(item, Object.assign({}, { symbol: symbolObj }, socket.getRequestInfo()))
            } else {
                dataEntry.getAsny({ name: Const.DataAction.product }, item.symbol, {}, function (err, symbolObj) {
                    symbolObj = symbolObj || {}
                    if (!symbolObj.symbol && processedDataKeyList.indexOf(symbolObj.symbol) >= 0) return
                    var objList = []
                    for (var item of data) {
                        if (symbolObj.symbol != item.symbol) continue  // filter out duplicate record v1.5.5
                        omsTagObj = parser.order(item, Object.assign({}, { symbol: symbolObj }, socket.getRequestInfo()))
                        objList.push(omsTagObj)
                    }
                    cb(socket, { name: name, account: account, data: objList })
                    processedDataKeyList.push(symbolObj.symbol)
                })
            }
        } else if (name === 'position') {
            var symbolObj = dataEntry.get({ name: Const.DataAction.product }, item.symbol)
            if (symbolObj) {
                omsTagObj = parser.position(item, Object.assign({}, {
                    symbol: symbolObj,
                    margin: dataEntry.get({ name: Const.DataAction.margin }, socket._user.loginID, item.account + '#' + item.symbol),
                    orders: dataEntry.get({ name: Const.DataAction.order }, socket._user.loginID),
                    currency: dataEntry.get({ name: Const.DataAction.currency }, symbolObj.currency)
                }, socket.getRequestInfo()))
                processedDataKeyList.push(item.symbol)
            } else {
                dataEntry.getAsny({ name: Const.DataAction.product }, item.symbol, {}, function (err, symbolObj) {
                    symbolObj = symbolObj || {}
                    if (!symbolObj.symbol && processedDataKeyList.indexOf(symbolObj.symbol) >= 0) return
                    var objList = []
                    for (var item of data) {
                        if (symbolObj.symbol !== item.symbol) continue  // filter out duplicate record v1.5.5
                        omsTagObj = parser.position(item, Object.assign({}, {
                            symbol: symbolObj,
                            margin: dataEntry.get({ name: Const.DataAction.margin }, socket._user.loginID, item.account + '#' + item.symbol),
                            orders: dataEntry.get({ name: Const.DataAction.order }, socket._user.loginID),
                            currency: dataEntry.get({ name: Const.DataAction.currency }, symbolObj.currency)
                        }, socket.getRequestInfo()))
                        objList.push(omsTagObj)
                    }
                    cb(socket, { name: name, account: account, data: objList })
                    processedDataKeyList.push(symbolObj.symbol)
                })
            }
        } else if (name === 'currency') {
            omsTagObj = parser.currency(item, socket.getRequestInfo())
        } else if (name === 'exchange') {
            omsTagObj = parser.exchange(item, socket.getRequestInfo())
        } else if (name === 'spread') {
            omsTagObj = parser.spread(item, socket.getRequestInfo())
        } else if (name === 'account') {
            omsTagObj = parser.account(item, socket.getRequestInfo())
        } else {
            omsTagObj = util.GetOmsTagObj(item)
        }
        if (omsTagObj) {
            resData.data.push(omsTagObj)
        }
    }
    cb(socket, resData)
}

function ProcessPriceUpdate(socket, data, name, callback) {
    callback = callback || function () { }
    if (name && socket && socket._subscribedSymbolPriceList && socket._subscribedSymbolPriceList.length > 0) {
        if (data && data[0] && socket._subscribedSymbolPriceList.indexOf(data[0]) >= 0) {
            callback(socket, { name: name, data: data })
        }
    }
}

function distributeInitData(socket) {
    if (!socket || !socket._user || !socket._subscribeData || socket._subscribeData <= 0) return
    if (socket._subscribeData.indexOf('exchange') >= 0) {
        distributeData(socket, dataEntry.get({ name: Const.DataAction.exchange }), 'exchange')
    }
    if (socket._subscribeData.indexOf('currency') >= 0) {
        distributeData(socket, dataEntry.get({ name: Const.DataAction.currency }), 'currency')
    }
    if (socket._subscribeData.indexOf('spread') >= 0) {
        distributeData(socket, dataEntry.get({ name: Const.DataAction.spread }), 'spread')
    }
    if (socket._subscribeData.indexOf('account') >= 0) {
        distributeData(socket, dataEntry.get({ name: Const.DataAction.account }, socket._user.loginID), 'account')
    }
    if (socket._subscribeData.indexOf('order') >= 0) {
        distributeData(socket, dataEntry.get({ name: Const.DataAction.order }, socket._user.loginID), 'order')
    }
    if (socket._subscribeData.indexOf('errororder') >= 0) {
        distributeData(socket, dataEntry.get({ name: Const.DataAction.errorOrder }, socket._user.loginID), 'errororder')
    }
    if (socket._subscribeData.indexOf('position') >= 0) {
        distributeData(socket, dataEntry.get({ name: Const.DataAction.position }, socket._user.loginID), 'position')
    }
    if (socket._subscribeData.indexOf('ipo-symbol') >= 0) {
        distributeData(socket, ipoData.convert(ipoData.get()), 'ipo-symbol')
    }
    if (socket._subscribeData.indexOf('ipo-app') >= 0) {
        var options = {}
        var user = socket._user
        if (user.type == 0) {
            options.user = user.id
        } else {
            options.account = user.id
        }
        distributeData(socket, applicationData.convert(applicationData.get(options)), 'ipo-app')
    }
}

function distributeData(socket, data, name, getDataHandler) {
    if (!data) return
    getDataHandler = getDataHandler || processData
    var socketList = []
    if (socket) {
        socketList.push(socket)
    } else {
        for (var p in socketMap) {
            socketList.push(socketMap[p])
        }
    }
    for (var s of socketList) {
        if (!s || !s._subscribeData || s._subscribeData.indexOf(name) < 0) continue  // filter unsubscribe data
        getDataHandler(s, data, name, function (s, resData) {
            try {
                if (s && resData) {
                    if (IsArray(resData.data)) {
                        var data = []
                        for (var item of resData.data) {
                            if (item !== null || typeof (item) !== 'undefined') data.push(item)   // filter out unexpected records
                        }
                        resData.data = data
                    }
                    if (resData.data.length > 0) {  // filter out empty data
                        s.emit('data', resData)
                        log(JSON.stringify(resData), s, 'trace')
                    }
                }
            } catch (error) {
                log(error, s, 'error')
            }
        })
    }
}

function emitMessage(sessionID, message) {
    if (sessionID && message) {
        for (var s in socketMap) {
            var socket = socketMap[s]
            if (socket && socket._user && socket._user.uid === sessionID) {
                socket.emit('message', message)
            }
        }
    }
}

function handleAnnouncement(socket) {
    if (!socket || !socket._user) return
    var user = socket._user
    if (user && !user.announced) {
        user.announced = true
        if (configuration.iTrader.announcement && configuration.iTrader.announcement.items) {
            for (var item of configuration.iTrader.announcement.items) {
                if (item && item.url) {
                    socket.emit('message', { action: 'announce', announcement: item })
                }
            }
        }
    }
}

function getUpdateFrequency(type) {
    var section = configuration.iTrader.update_frequency
    if (section && section[type] && section[type] > 0) {
        return section[type] * 1000
    }
    return 0
}

function log(message, socket, type) {
    var prefix
    if (socket && socket._user) {
        prefix = '[' + socket._user.id + ' - ' + socket.id + ']'
    }
    if (typeof message === 'object') {
        message = JSON.stringify(message)
    }
    logger[type](prefix ? (prefix + message) : message)
}

exports.connect = connect
exports.emit = emitMessage
