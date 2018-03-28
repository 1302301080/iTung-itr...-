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

{ $Id: ipos.js,v 1.1 2016/12/20 11:04:18 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


'use strict'

const EventEmitter = require('events')
var config = require(__config_path)


class IPO {
    constructor(options) {
        this.event = new EventEmitter()
        this.event.setMaxListeners(0)
        this.dataList = new Map()
        this.schema = config.eipo.views.ipo.schema
    }

    get() {
        var list = []
        for (var item of this.dataList.values()) {
            list.push(item)
        }
        return list
    }

    set(data) {
        if (data && data.symbol && data.announceCode) {
            var key = data.symbol + '.' + data.announceCode
            var newObj
            if (this.dataList.has(key)) {
                newObj = this.dataList.get(key)
                for (var p in data) {
                    newObj[p] = data[p]
                }
            } else {
                newObj = data
                this.dataList.set(key, newObj)
            }
            // newObj.marginEnabled = newObj.marginEnabled == -1 ? 1 : 0  // design set -1 means enable
            this.event.emit('ipo', newObj)
        }
    }

    getByKey(symbolCode, announceCode) {
        if (symbolCode && announceCode) {
            var key = symbolCode + '.' + announceCode
            if (this.dataList.has(key)) {
                return this.dataList.get(key)
            }
        }
    }

    convert(data) {
        if (!IsArray(data)) {
            data = [data]
        }
        var extendKeys = ['21', '36', '32', '37', '1599']
        var array = []
        for (var item of data) {
            var tagObj = item.makeOmsTag(item)
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

var instance = new IPO()
module.exports = instance

