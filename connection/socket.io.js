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

{ $Id: socket.io.js,v 1.14 2017/03/13 07:37:26 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

var config = require(__config_path),
    signature = require(__node_modules + 'cookie-signature'),
    cookie = require(__node_modules + 'express/node_modules/cookie'),
    dataEntry = require('../data/entry'),
    logger = require('common').Logger.instance().getLogger(),
    dds = require('./dds'),
    Const = require('../lib/const'),
    OmsUtility = require('../lib/omsUtility'),
    ipoData = require('../data/eipo/ipos'),
    applicationData = require('../data/eipo/applications')

class SocketIO {
    constructor() {
        this.socketMap = new Map()              // <socket.id, socket>
        this.subscribedProductMap = new Map()   // <symbol, { sockets: [socket.id], data: productObj }>
        this.handleUpdate()
    }

    connect(server) {
        var io = require('socket.io')(server)
        io.on('connection', function (socket) {
            var signedCookies = cookie.parse(socket.request.headers.cookie)
            if (!signedCookies || !signedCookies.sid) return
            var sid = signature.unsign(signedCookies.sid.slice(2), config.global.session.secret)
            if (sid) {
                config.global.session.store.get(sid, function (err, session) {
                    if (err) {
                        logger.error(err)
                        socket.emit('auth', false)
                    } else {
                        if (session && session.passport) {
                            socket.on('accounts', function (data) { this.SubscribeAccounts(socket) }.bind(this))
                            socket.on('orders', function (data) { this.SubscribeOrders(socket) }.bind(this))
                            socket.on('positions', function (data) { this.SubscribePositions(socket) }.bind(this))
                            socket.on('spread', function (data) { this.SubscribeSpread(socket) }.bind(this))
                            socket.on('product', function (data) { this.SubscribeProduct(socket, data) }.bind(this))
                            socket.on('currency', function (data) { this.SubscribeCurrency(socket) }.bind(this))
                            socket.on('exchange', function (data) { this.SubscribeExchange(socket) }.bind(this))
                            socket.on('message', function (data) { this.SubscribeMessage(socket) }.bind(this))
                            socket.on('margin', function (data) { this.SubscribeMargin(socket) }.bind(this))
                            socket.on('refresh', function (data) { this.OnRefresh(socket, data) }.bind(this))

                            socket.on('ipos', function (data) { this.subscribeIPOs(socket) }.bind(this))
                            socket.on('applications', function (data) { this.subscribeApplications(socket) }.bind(this))

                            socket.emit('auth', true)
                            this.socketMap.set(socket.id, {
                                sessionID: session.passport.user,
                                socket: socket,
                                pendingAccount: new Map()
                            })
                        } else {
                            socket.emit('auth', false)
                        }
                    }
                }.bind(this))
            } else {
                socket.emit('auth', false)
                return
            }

            socket.on('disconnect', function () {
                this.socketMap.delete(socket.id)
                for (var item of this.subscribedProductMap.values()) {
                    var idx = item.sockets.indexOf(socket.id)
                    if (idx >= 0) {
                        item.sockets.splice(idx, 1)
                    }
                }
                socket.removeAllListeners()
                socket = null
            }.bind(this))

            socket.on('error', function (err) {
                logger.error(err)
            })
        }.bind(this))
    }

    FindSocketByUser(sessionID) {
        var sockets = []
        if (sessionID) {
            try {
                for (var value of this.socketMap.values()) {
                    if (value && value.socket && value.sessionID === sessionID) {
                        sockets.push(value.socket)
                    }
                }
            } catch (error) {
                logger.error('find socket failed. Error: ' + error)
            }
        }
        return sockets
    }

    EmitMessage(sessionID, message) {
        if (sessionID && message) {
            var sockets = this.FindSocketByUser(sessionID)
            if (sockets) {
                for (var socket of sockets) {
                    socket.emit('message', message)
                }
            }
        }
    }

    SubscribeAccounts(socket) {
        var user = this.AuthenticatedUser(socket)
        if (user) {
            var accounts = dataEntry.get({ name: Const.DataAction.account }, user.id)
            socket.emit('account', { account_list: user.accounts, account_info_list: user.accountsInfo, balance: ConvertToOmsTagObjects(accounts) })
            dataEntry.event({ name: Const.DataAction.account }).on(user.id, function (balance) {
                if (config.iTrader.update_frequency.account > 0) {
                    var item = this.socketMap.get(socket.id)
                    if (item) {
                        item.pendingAccount.set(balance.account + balance.currency, balance)
                    }
                } else {
                    socket.emit('account', { balance: ConvertToOmsTagObjects(balance) })
                }
            }.bind(this))
        }
    }

    SubscribeOrders(socket) {
        var user = this.AuthenticatedUser(socket)
        if (user) {
            socket.emit('orders', this.GetOrders(dataEntry.get({ name: Const.DataAction.order }, user.id)))
            var e = dataEntry.event({ name: Const.DataAction.order })
            e.on(user.id, function (order) {
                socket.emit('orders', this.GetOrders(order))
            }.bind(this))
        }
    }

    SubscribePositions(socket) {
        var user = this.AuthenticatedUser(socket)
        if (user) {
            var temp = this.GetPositions(dataEntry.get({ name: Const.DataAction.position }, user.id))
            socket.emit('positions', temp)
            var e = dataEntry.event({ name: Const.DataAction.position })
            e.on(user.id, function (order) {
                socket.emit('positions', this.GetPositions(order))
            }.bind(this))
        }
    }

    SubscribeMargin(socket) {
        var user = this.AuthenticatedUser(socket)
        if (user) {
            socket.emit('margin', ConvertToOmsTagObjects(dataEntry.get({ name: Const.DataAction.margin }, user.id)))
            var e = dataEntry.event({ name: Const.DataAction.margin })
            e.on(user.id, function (imageObj) {
                socket.emit('margin', ConvertToOmsTagObjects(imageObj))
            }.bind(this))
        }
    }

    SubscribeSpread(socket) {
        socket.emit('spread', ConvertToOmsTagObjects(dataEntry.get({ name: Const.DataAction.spread })))
        var e = dataEntry.event({ name: Const.DataAction.spread })
        e.on('spread', function (spread) {
            socket.emit('spread', ConvertToOmsTagObjects(spread))
        }.bind(this))
    }

    SubscribeProduct(socket, data) {
        var callback = function fn(productObj) {
            if (!productObj) return
            var productTagObj = ConvertToOmsTagObjects(productObj)
            var subscribedProductItem = this.subscribedProductMap.get(productObj.symbol)
            if (subscribedProductItem) {
                if (config.iTrader.update_frequency.product > 0) {
                    subscribedProductItem.data = productTagObj
                } else {
                    for (var socketID of subscribedProductItem.sockets) {
                        var socketObj = this.socketMap.get(socketID)
                        if (socketObj && socketObj.socket) {
                            socketObj.socket.emit('product', ConvertToOmsTagObjects(productTagObj))
                        }
                    }
                }
            }
        }
        var feedback = function fn() {
            socket.emit('product', ConvertToOmsTagObjects(dataEntry.get({ name: Const.DataAction.product }, data.symbol)))
            dataEntry.event({ name: Const.DataAction.product }).once(data.symbol, function (product) {
                socket.emit('product', ConvertToOmsTagObjects(product))
            })
            dds.SubscribeSymbol(data.symbol)
        }
        if (!data || typeof data !== 'object' || !data.symbol) return
        var socketIdIdx = -1
        var subscribedProductItem = this.subscribedProductMap.get(data.symbol)
        if (data.flag == 0) {  // get product, no update
            feedback.bind(this)()
        } else if (data.flag == 1) {  // subscribe product
            if (this.subscribedProductMap.has(data.symbol)) {
                subscribedProductItem = this.subscribedProductMap.get(data.symbol)
                if (subscribedProductItem.sockets.indexOf(socket.id) < 0) {
                    subscribedProductItem.sockets.push(socket.id)
                }
            } else {
                subscribedProductItem = {}
                subscribedProductItem.sockets = [socket.id]
                this.subscribedProductMap.set(data.symbol, subscribedProductItem)
                dataEntry.event({ name: Const.DataAction.product }).on(data.symbol, callback.bind(this))
            }
            feedback.bind(this)()
        } else if (data.flag == -1) {  // unsubscribe product
            if (subscribedProductItem) {
                socketIdIdx = subscribedProductItem.sockets.indexOf(socket.id)
                if (socketIdIdx >= 0) {
                    subscribedProductItem.sockets.splice(socketIdIdx, 1)
                }
                if (subscribedProductItem.sockets.length <= 0) {
                    dataEntry.event({ name: Const.DataAction.product }).removeAllListeners(data.symbol, callback)
                    this.subscribedProductMap.delete(data.symbol)
                }
            }
        }
    }

    SubscribeCurrency(socket) {
        var currency_list = dataEntry.get({ name: Const.DataAction.currency })
        var currencyCustom = dataEntry.custom({ name: Const.DataAction.currency })
        for (var item of currency_list) {
            item.currencyMode = currencyCustom.currencyMode
        }
        socket.emit('currency', currency_list)
        dataEntry.event({ name: Const.DataAction.currency }).on('currency', (c) => {
            if (c) {
                socket.emit('currency', [c])
            }
        })
    }

    SubscribeExchange(socket) {
        var exchangeObjList = []
        var exchanges = dataEntry.global.exchanges
        for (var exchange of exchanges) {
            var item = config.iTrader.oms.exchanges.find((a) => { return a.key === exchange })
            var icon = ''
            var type
            var tif
            var isDayTrade
            var isAShare
            if (item) {
                icon = item.icon
                type = item.type
                tif = item.tif
                isDayTrade = item.isDayTrade
                isAShare = item.isAShare
            } else {
                type = OmsUtility.MapOrderType()
                tif = OmsUtility.MapOrderTif()
                isDayTrade = true
                isAShare = true
            }
            exchangeObjList.push({ exchange: exchange, icon: icon || '', type: type, tif: tif, isDayTrade: isDayTrade, isAShare: isAShare })
        }
        socket.emit('exchange', exchangeObjList)
    }

    SubscribeMessage(socket) {
        var user = this.AuthenticatedUser(socket)
        if (user && !user.announced) {
            user.announced = true
            if (config.iTrader.announcement && config.iTrader.announcement.items) {
                for (var item of config.iTrader.announcement.items) {
                    if (item && item.url) {
                        socket.emit('message', { action: 'announce', announcement: item })
                    }
                }
            }
        }
    }

    AuthenticatedUser(socket, cmd) {
        if (this.socketMap.has(socket.id)) {
            return dataEntry.get({ name: Const.DataAction.user }, this.socketMap.get(socket.id).sessionID)
        }
        socket.emit('error', 'Unauthorized request.')
        return false
    }

    GetOrders(orderObjs) {
        var orders = []
        if (typeof (orderObjs) === 'object') {
            if (orderObjs.constructor === Array) {
                for (var o in orderObjs) {
                    orders.push(this.ConvertOrder(orderObjs[o]))
                }
            } else {
                orders.push(this.ConvertOrder(orderObjs))
            }
        }
        return orders
    }

    ConvertOrder(orderObj) {
        try {
            var orderTagObj = orderObj.makeOmsTag()
            orderTagObj[Const.tags.status] = OmsUtility.GetOrderStatus(orderTagObj)
            orderTagObj.voucherType = orderObj.voucherType
            orderTagObj.trades = {}
            if (orderObj.subOrders) {
                for (var s in orderObj.subOrders) {
                    for (var t in orderObj.subOrders[s].trades) {
                        orderTagObj.trades[t] = orderObj.subOrders[s].trades[t].makeOmsTag()
                    }
                }
            }
            return orderTagObj
        } catch (err) {
            logger.error(err)
        }
    }

    GetPositions(positionObjs) {
        function getTagObj(obj) {
            var tagObj = obj.makeOmsTag()
            tagObj.trades = {}
            if (obj.trades) {
                for (var p in obj.trades) {
                    if (obj.trades[p].voucherType === 'cash') return
                    tagObj.trades[p] = obj.trades[p].makeOmsTag()
                    tagObj.trades[p].voucherType = obj.trades[p].voucherType
                }
            }
            if (obj.bod) {
                tagObj.bod = obj.bod.makeOmsTag()
            }
            return tagObj
        }
        var positionTagObjs = []
        if (typeof (positionObjs) === 'object') {
            if (positionObjs.constructor === Array) {
                for (var i = 0; i < positionObjs.length; i++) {
                    var positionTagObj = getTagObj(positionObjs[i])
                    if (positionTagObj) {
                        positionTagObjs.push(positionTagObj)
                    }
                }
            } else {
                var positionTagObj = getTagObj(positionObjs)
                if (positionTagObj) {
                    positionTagObjs.push(positionTagObj)
                }
            }
        }
        return positionTagObjs
    }

    handleUpdate() {
        if (config.iTrader.update_frequency.product > 0) {
            setInterval(function () {
                this.refreshProduct()
            }.bind(this), config.iTrader.update_frequency.product * 1000)
        }
        if (config.iTrader.update_frequency.account > 0) {
            setInterval(function () {
                this.refreshAccount()
            }.bind(this), config.iTrader.update_frequency.account * 1000)
        }
    }

    refreshProduct(socket, list) {
        try {
            for (var item of this.subscribedProductMap.values()) {
                if (!item.data || item.data.length <= 0) continue
                var symbol = item.data[0][Const.tags.symbol]
                if (list && list.indexOf(symbol) < 0) continue
                for (var socketID of item.sockets) {
                    var socketObj = this.socketMap.get(socketID)
                    if (socket && socket.id != socketObj.socket.id) continue  // if socket, emit for specified socket
                    if (socketObj) {
                        socketObj.socket.emit('product', item.data)
                    }
                }
                item.data = null
            }
        } catch (err) {
            logger.error(err)
        }
    }

    refreshAccount(socket) {
        try {
            for (var item of this.socketMap.values()) {
                if (socket && socket.id != item.socket.id) continue  // if socket, emit for specified socket
                var list = []
                for (var balanceObj of item.pendingAccount.values()) {
                    list.push(balanceObj)
                }
                if (list.length > 0) {
                    item.socket.emit('account', { balance: ConvertToOmsTagObjects(list) })
                }
                item.pendingAccount.clear()
            }
        } catch (err) {
            logger.error(err)
        }
    }

    OnRefresh(socket, data) {
        if (!data) return
        if (data.type === 'product') {
            var productList
            if (data.data && IsArray(data.data)) {
                productList = []
                for (var p of data.data) {
                    if (p && productList.indexOf(p) < 0) {
                        productList.push(p)
                    }
                }
            }
            this.refreshProduct(socket, productList)
        } else if (data.type === 'account') {
            this.refreshAccount(socket)
        }
    }

    subscribeIPOs(socket) {
        var user = this.AuthenticatedUser(socket)
        if (user) {
            socket.emit('ipos', ipoData.convert(ipoData.get()))
            socket.ipoDataEventHandler = function (data) {
                socket.emit('ipos', ipoData.convert(data))
            }
            ipoData.event.on('ipos', socket.ipoDataEventHandler)
        }
    }

    subscribeApplications(socket) {
        var user = this.AuthenticatedUser(socket)
        if (user) {
            var options = {}
            if (user.type == 0) {
                options.user = user.id
            } else {
                options.account = user.id
            }
            socket.applicationDataEventHandler = function (data) {
                if (user.type == 1 && data.account != user.id) return
                socket.emit('applications', applicationData.convert(data))
            }
            socket.emit('applications', applicationData.convert(applicationData.get(options)))
            applicationData.event.on('APP_' + user.AECode, socket.applicationDataEventHandler)
        }
    }
}

function ConvertToOmsTagObjects(data) {
    var array = []
    if (typeof (data) === 'object') {
        try {
            if (data.constructor === Array) {
                for (var o of data) {
                    array.push(o.makeOmsTag())
                }
            } else {
                array.push(data.makeOmsTag())
            }
        } catch (err) {
            logger.error(err)
        }
    }
    return array
}

module.exports = new SocketIO()