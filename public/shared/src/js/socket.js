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

{ $Id: socket.js,v 1.1 2016/12/20 11:04:19 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var g_socket
var subscribedSymbol = []   // { symbol: <symbol code>, count: <count>, state: <processing, done> }
define(function(require, exports, module) {

function init() {
    var connectionString = window.location.protocol + '//' + window.location.host
    g_socket = io.connect(connectionString, { secure: _.startsWith(connectionString, 'https') ? true : false })
    g_socket.on('auth', function (result) {
        if (result) {
            SubscribeCurrency()
            SubscribeExchange()
            SubscribeAccounts()
            SubscribeSpread()
            SubscribePositions()
            SubscribeOrders()
            SubscribeMessage()
            SubscribeMargin()
            SubscribeProduct()
        }
    })
}

function SubscribeMessage() {
    g_socket.on('message', function (messageObj) {
        if (messageObj) {
            if (messageObj.action === 'logout') {
                $('.index-row').remove()
            } else if (messageObj.action === 'announce') {
                PopupAnnouncement(messageObj.announcement)
            }
            if (messageObj.errorCode) {
                handleError(messageObj, function () {
                    if (messageObj.action === 'logout') {
                        Logout()
                    }
                })
            }
        }
    })
    g_socket.emit('message')
}

function SubscribeAccounts() {
    g_socket.on('account', function (data) {
        if (data) {
            if (data.account_list) {
                AccountMgr.setAccountList(data)
            }
            if (data.balance && _.isArray(data.balance)) {
                for (var i = 0; i < data.balance.length; i++) {
                    AccountMgr.set(data.balance[i])
                }
            }
        }
    })
    g_socket.emit('accounts')
}

function SubscribeOrders() {
    g_socket.on('orders', function (data) {
        if (!data || !_.isArray(data)) return
        var orders = []
        _(data).forEach(function (value) {
            OrderMgr.set(value, function (orderObj) {
                orders.push(orderObj)
                if (orders.length === data.length) {
                    $(document).trigger('orders', { orders: orders })
                }
            })
        })
    })
    g_socket.emit('orders')
}

function SubscribePositions() {
    g_socket.on('positions', function (data) {
        if (!data || !_.isArray(data)) return
        var positions = []
        _(data).forEach(function (value) {
            GetProduct(value[tags.symbol], { flag: 1 })
            var positionObj = PositionMgr.set(value)
            if (positionObj) {
                positions.push(positionObj)
            }
        })
        $(document).trigger('positions', { positions: positions })
    })
    g_socket.emit('positions')
}

function SubscribeMargin() {
    g_socket.on('margin', function (data) {
        if (_.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                var marginObj = MarginMgr.set(data[i])
                $(document).trigger('margin', marginObj)
            }
        }
    })
    g_socket.emit('margin')
}

function SubscribeSpread() {
    g_socket.on('spread', function (data) {
        if (_.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                ProductMgr.setSpread(data[i])
            }
        }
    })
    g_socket.emit('spread')
}

function SubscribeCurrency() {
    g_socket.on('currency', function (data) {
        if (_.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                CurrencyMgr.set(data[i])
            }
        }
    })
    g_socket.emit('currency')
}

function SubscribeExchange() {
    g_socket.on('exchange', function (data) {
        if (_.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                ExchangeMgr.set(data[i])
            }
        }
    })
    g_socket.emit('exchange')
}

function SubscribeProduct() {
    g_socket.on('product', function (data) {
        if (_.isArray(data)) {
            var products = []
            for (var i = 0; i < data.length; i++) {
                var productObj = ProductMgr.set(data[i])
                products.push(productObj)
                $(document).trigger('#' + productObj[tags.symbol], productObj)
            }
            $(document).trigger('products', { products: products })
        }
    })
}

function refresh(type, data) {
    if (!type) return
    if (_.isArray(type)) {
        for (var i = 0; i < type.length; i++) {
            g_socket.emit('refresh', { type: type[i], data: data })
        }
    } else {
        g_socket.emit('refresh', { type: type, data: data })
    }
}

exports.init = init
})


function GetProduct(code, options, callback) {
    code = _.trim(code)
    if (!code) return
    options = options || { flag: 0 }
    var subscribedSymbolItem = _.find(subscribedSymbol, function (o) { return o.symbol === code })
    if (!subscribedSymbolItem) {
        subscribedSymbolItem = { symbol: code, count: 0 }
        subscribedSymbol.push(subscribedSymbolItem)
    }
    if (typeof callback === 'function') {
        var productObj = ProductMgr.get(code)
        if (productObj) {
            callback(productObj)
        } else {
            $(document).one('#' + code, function (event, data) {
                subscribedSymbolItem.state = 'done'
                callback(data)
                $(document).off('#' + code, event)
            })
        }
    }
    if (options.flag == 0) {
        if (subscribedSymbolItem.state !== 'processing') {
            subscribedSymbolItem.state = 'processing'
            if (subscribedSymbolItem.count <= 0) {
                g_socket.emit('product', { symbol: code, flag: 0 })
            }
        }
    } else if (options.flag == 1) {
        if (subscribedSymbolItem.count <= 0) {
            g_socket.emit('product', { symbol: code, flag: 1 })
        }
        subscribedSymbolItem.count++
    } else if (options.flag == -1) {
        if (subscribedSymbolItem.count <= 1) {
            g_socket.emit('product', { symbol: code, flag: -1 })
        }
        subscribedSymbolItem.count--
    }
}