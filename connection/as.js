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

{ $Id: as.js,v 1.2 2018/01/19 10:00:20 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


'use strict'

var config = require(__config_path),
    schema = require('common').Schema,
    BaseSocket = require('common').BaseSocket,
    logger = require('common').Logger.instance().getLogger(),
    ipoData = require('../data/eipo/ipos'),
    applicationData = require('../data/eipo/applications'),
    Const = require('../lib/const')

class AS extends BaseSocket {
    constructor(options) {
        super(options)
        this.name = options.name
        this.clientHost = options.clientHost
        this.clientPort = options.clientPort
    }

    start() {
        this.on()
        this.connect()
    }

    on() {
        this.event.on('line', function (line) {
            try {
                if (line) {
                    if (line !== this.pingMsg) {
                        logger.debug('<=' + this.name + '|' + line)
                    }
                    if (line.indexOf('update') == 0) {
                        var imageObj = schema.IPOSchema.makeFromImage(line, 1)
                        ipoData.set(imageObj)
                    }
                }
            } catch (err) {
                logger.error(err)
            }
        }.bind(this))

        this.event.on('connect', function () {
            logger.info(this.name + ' connected.' + JSON.stringify(this.socketClient.address()))
        }.bind(this))

        this.event.on('close', function () {
            logger.info(this.name + ' disconnected.' + JSON.stringify(this.socketClient.address()))
        }.bind(this))
    }

    send(message) {
        if (!message) return
        super.send(message)
        if (message !== this.pingMsg) {
            logger.info('>' + this.name + '|' + message)
        }
    }

    calc(options, callback) {
        var cmd = "calcApp|0|{0}|1599|{1}|10|{2}|13|{3}|4|{4}|1505|{5}|1506|{6}|23|HKD|".format(
            options.symbol, options.announceCode, options.account, options.user, options.quantity,
            options.marginRate ? 1 : 0,
            options.marginRate ? (1 - options.marginRate / 100).toFixed(3) : 0
        )
        applicationData.event.once('CALCAPP_' + options.user, function (data) {
            callback(null, data.makeOmsTag())
            callback = function () { }
        })
        applicationData.event.once('ERRAPP_' + options.user, function (err) {
            callback(err.makeOmsTag(), null)
            callback = function () { }
        })
        this.send(cmd)
    }

    submit(options, callback) {
        var cmd = "apply|0|{0}|1599|{1}|10|{2}|13|{3}|4|{4}|1505|{5}|1506|{6}|23|HKD|".format(
            options.symbol, options.announceCode, options.account, options.user, options.quantity,
            options.marginRate ? 1 : 0,
            options.marginRate ? (1 - options.marginRate / 100).toFixed(3) : 0
        )
        applicationData.event.once('APP_' + options.user, function (data) {
            callback(null, data.makeOmsTag())
            callback = function () { }
        })
        applicationData.event.once('ERRAPP_' + options.user, function (err) {
            callback(err.makeOmsTag(), null)
            callback = function () { }
        })
        this.send(cmd)
    }

    change(options, callback) {
        var cmd = "changeApp|6|{0}|13|{1}|4|{2}|".format(options.orderNo, options.user, options.newQuantity)
        applicationData.event.once('APP_' + options.user, function (data) {
            callback(null, data.makeOmsTag())
            callback = function () { }
        })
        applicationData.event.once('ERRAPP_' + options.user, function (err) {
            callback(err.makeOmsTag(), null)
            callback = function () { }
        })
        this.send(cmd)
    }

    cancel(options, callback) {
        var cmd = "cancelApp|6|{0}|13|{1}|".format(options.orderNo, options.user)
        applicationData.event.once('APP_' + options.user, function (data) {
            callback(null, data.makeOmsTag())
            callback = function () { }
        })
        applicationData.event.once('ERRAPP_' + options.user, function (err) {
            callback(err.makeOmsTag(), null)
            callback = function () { }
        })
        this.send(cmd)
    }
}
var instance = {}

if (config.eipo.oms.servers.AS) {
    instance = new AS({
        name: 'AS',
        clientHost: config.eipo.oms.servers.AS.host,
        clientPort: config.eipo.oms.servers.AS.port,
        reconnectInterval: config.eipo.oms.reconnectInterval || config.eipo.oms.reconnectInterval || 30,
        ping: true
    })
}
module.exports = instance