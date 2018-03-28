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

{ $Id: tfdds.js,v 1.3 2017/04/27 04:54:42 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


'use strict'

var config = require(__config_path),
    schema = require('common').Schema,
    BaseSocket = require('common').BaseSocket,
    logger = require('common').Logger.instance().getLogger(),
    ipoData = require('../data/eipo/ipos'),
    applicationData = require('../data/eipo/applications'),
    Const = require('../lib/const')

class TFDDS extends BaseSocket {
    constructor(options) {
        super(options)
        this.name = options.name
        this.clientHost = options.clientHost
        this.clientPort = options.clientPort
        this.subscribedList = []
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
                    var index = line.indexOf('|', 10)
                    var imageObj
                    if (line.indexOf('image|#EIPO_') == 0) {
                        if (index > 0 && index < line.length) {
                            imageObj = schema.IPOSchema.makeFromImage(line, 2)
                            ipoData.set(imageObj)
                        }
                    } else if (line.indexOf('image|#APP_') == 0) {
                        imageObj = schema.IPOSchema.makeFromImage(line, 2)
                        applicationData.set(imageObj.user, imageObj)
                    } else if (line.indexOf('image|#CALCAPP_') == 0) {
                        imageObj = schema.IPOSchema.makeFromImage(line, 2)
                        applicationData.setCalc(imageObj.user, imageObj)
                    } else if (line.indexOf('image|#ERRAPP') == 0) {
                        imageObj = schema.IPOSchema.makeFromImage(line, 2)
                        applicationData.setErr(imageObj.user, imageObj)
                    }
                }
            } catch (err) {
                logger.error(err)
            }
        }.bind(this))

        this.event.on('connect', function () {
            logger.info(this.name + ' connected.' + JSON.stringify(this.socketClient.address()))
            this.send('list|#EIPO|EIPO|mode|both|')
        }.bind(this))

        this.event.on('close', function () {
            logger.info(this.name + ' disconnected.' + JSON.stringify(this.socketClient.address()))
            this.subscribedList = []
        }.bind(this))
    }

    send(message) {
        if (!message) return
        super.send(message)
        if (message !== this.pingMsg) {
            logger.info('>' + this.name + '|' + message)
        }
    }

    subscribeApplications(user) {
        if (!user) return
        if (this.subscribedList.indexOf(user) >= 0) return
        this.subscribedList.push(user)
        this.send('list|#APP_{0}|APP_{0}|mode|both|'.format(user))
        this.send('open|#CALCAPP_{0}|CALCAPP_{0}|mode|both|'.format(user))
        this.send('open|#ERRAPP_{0}|ERRAPP_{0}|mode|both|'.format(user))
    }
}

var instance

exports.setInstance = function (options) {
    options = options || {
        name: 'TFDDS',
        clientHost: config.eipo.oms.servers.TFDDS.host,
        clientPort: config.eipo.oms.servers.TFDDS.port,
        reconnectInterval: config.eipo.oms.reconnectInterval || 30,
        encoding: config.eipo.oms.encoding,
        ping: true
    }
    instance = new TFDDS(options)
    instance.start()
}

exports.subscribeApplications = function (user) {
    if (instance) {
        instance.subscribeApplications(user)
    }
}