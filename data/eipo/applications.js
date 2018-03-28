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

{ $Id: applications.js,v 1.2 2017/06/14 04:23:42 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


'use strict'

const EventEmitter = require('events')
var ipoData = require('./ipos')
var config = require(__config_path)
var formatSection = config.eipo.format

class Application {
    constructor(options) {
        this.event = new EventEmitter()
        this.event.setMaxListeners(0)
        this.dataList = new Map()
        this.schema = config.eipo.views.app.schema
    }

    get(options) {
        options = options || {}
        var list = []
        for (var item of this.dataList.values()) {
            if (options.user) {
                if (item.user == options.user) {
                    list.push(item)
                }
            } else if (options.account) {
                if (item.account == options.account) {
                    list.push(item)
                }
            } else {
                list.push(item)
            }
        }
        return list
    }

    getByKey(orderNo) {
        return this.dataList.get(orderNo)
    }

    set(user, data) {
        if (user && data && data.orderNo) {
            if (!data.currency) {
                var symbolObj = ipoData.getByKey(data.symbol, data.announceCode)
                data.currency = symbolObj ? symbolObj.currency : ''
            }
            this.dataList.set(data.orderNo, data)
            this.event.emit('APP_' + user, data)
            this.event.emit('APP', data)
        }
    }

    setCalc(user, data) {
        this.event.emit('CALCAPP_' + user, data)
    }

    setErr(user, data) {
        this.event.emit('ERRAPP_' + user, data)
    }

    convert(data) {
        if (!data) return []
        if (!IsArray(data)) {
            data = [data]
        }
        var extendKeys = ['1505', '1506']
        var array = []
        for (var item of data) {
            var tagObj = item.makeOmsTag()
            var newObj = {}
            for (var p of this.schema) {
                newObj[p.key] = tagObj[p.key]
            }
            for (var e of extendKeys) {
                newObj[e] = tagObj[e]
            }
            array.push(newObj)
        }
        return array
    }
}

var instance = new Application()
module.exports = instance