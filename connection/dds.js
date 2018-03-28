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

{ $Id: dds.js,v 1.14 2018/01/19 10:00:20 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

var config = require(__config_path),
    BaseSocket = require('./baseSocket'),
    dataEntry = require('../data/entry'),
    schema = require('common').Schema,
    logger = require('common').Logger.instance().getLogger(),
    Const = require('../lib/const')

class DDS extends BaseSocket {
    constructor(options) {
        super(options)
        this.name = 'DDS'
        this.clientHost = options.host || config.iTrader.oms.servers.PriceDDS.host
        this.clientPort = options.port || config.iTrader.oms.servers.PriceDDS.port
        this.subscribeList = {}
    }

    start() {
        var that = this
        this.on()
        this.connect()
        this.event.on('connect', function () {
            // pre subscribe spread
            that.SubscribeSpread('SPREAD_SEHK_1')
            that.SubscribeSpread('SPREAD_SEHK_3')
            that.send('open|#EXCH_STATUS|EXCH_STATUS|mode|both|')
        })
    }

    on() {
        var that = this
        this.event.on('line', function (line) {
            try {
                if (line) {
                    var index = line.indexOf('|', 10)
                    var imageObj
                    if (line.indexOf('image|#SPREAD_') == 0) {
                        if (index > 0 && index < line.length) {
                            var spreadname = line.substring(14, index)
                            imageObj = schema.OrderSchema.makeFromImage(line, 2)
                            imageObj.symbol = spreadname
                            that.event.emit('spread', imageObj)
                        }
                    } else if (line.indexOf('image|#SYMBOL_') == 0) {
                        if (index > 0 && index < line.length) {
                            imageObj = schema.OrderSchema.makeFromImage(line, 2)
                            that.SubscribeSpread(imageObj.spread)
                            var image_symbol = line.substring(line.indexOf('_') + 1, line.indexOf('|', 10))
                            imageObj.symbol = image_symbol
                            imageObj.isDDS = true
                            that.event.emit('symbol', imageObj)
                        }
                    } else if (line.indexOf('update|#SYMBOL_') == 0) {
                        if (index > 0 && index < line.length) {
                            imageObj = schema.OrderSchema.makeFromImage(line, 2)
                            var update_symbol = line.substring(line.indexOf('_') + 1, line.indexOf('|', 10))
                            imageObj.symbol = update_symbol
                            imageObj.isDDS = true
                            imageObj._isUpdate = true
                            that.event.emit('symbol', imageObj)
                        }
                    } else if (line.indexOf('image|#EXCH_STATUS') == 0) {
                        if (index > 0 && index < line.length) {
                            imageObj = schema.OrderSchema.makeFromImage(line, 2)
                            that.event.emit('exchange', imageObj)
                        }
                    } else if (line.indexOf('error|#SYMBOL_') == 0) {
                        if (index > 0 && index < line.length) {
                            var symbol = line.substring(14, line.indexOf('|', index))
                            imageObj = schema.OrderSchema.makeFromImage(line, 2)
                            imageObj.setValue('symbol', symbol)
                            imageObj._isError = true
                        }
                    } else if (line.indexOf('error|#SPREAD_') == 0) {
                        if (index > 0 && index < line.length) {
                            var symbol = line.substring(14, line.indexOf('|', index))
                            imageObj = schema.OrderSchema.makeFromImage(line, 2)
                            imageObj.setValue('symbol', symbol)
                            imageObj._isError = true
                        }
                    }
                    if (imageObj && imageObj.symbol) {
                        that.event.emit(imageObj.symbol, imageObj)
                    }
                }
            } catch (err) {
                logger.error(err)
            }
        })
        this.event.on('close', function () {
            that.subscribeList = {}
        })
    }

    SubscribeSpread(name) {
        if (!name) return
        if (!this.subscribeList[name]) {
            this.subscribeList[name] = 1
            var cmd = 'open|#SPREAD_' + name + '|' + name + '|mode|both|'
            this.send(cmd)
        } else {
            this.subscribeList[name]++
        }
    }

    SubscribeSymbol(code, mode) {
        if (!code) return
        mode = mode || 'both'
        if (!IsArray(code)) {
            code = [code]
        }
        for (var c of code) {
            var cmd = 'open|#SYMBOL_{0}|{0}|mode|{1}|'.format(c, mode)
            if (mode === 'image') {
                this.send(cmd)
                continue
            }
            if (!this.subscribeList[c]) {
                this.subscribeList[c] = 1
                this.send(cmd)
            } else {
                this.subscribeList[c]++
            }
        }
    }

    UnSubscribeSymbol(code) {
        if (!code) return
        if (!IsArray(code)) {
            code = [code]
        }
        for (var c of code) {
            if (this.subscribeList[c]) {
                this.subscribeList[c]--
                if (this.subscribeList <= 0) {
                    this.send('close|#SYMBOL_' + c + '|' + c + '|')
                }
            }
        }
    }

    OnProductStatus() {
        var e = dataEntry.event({ name: Const.DataAction.product })
        e.on('unsubscribe', function (data) {
            this.UnSubscribeSymbol(data)
        })
    }
}
var priceDDS = new DDS({ reconnectInterval: config.iTrader.oms.reconnectInterval || 30, ping: true, messEncoding: true })
module.exports = priceDDS