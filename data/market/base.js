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

{ $Id: base.js,v 1.5 2017/04/26 08:52:14 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

const EventEmitter = require('events')
class BaseEmitter extends EventEmitter { }

module.exports = class Base {
    constructor(name) {
        this.name = name
        this.event = new BaseEmitter()
        this.event.setMaxListeners(0)
        this.custom = {}
        this.maps = new Map()
    }

    get(key, options) {
        if (key) {
            var obj = this.maps.get(key)
            if (obj && options) {
                for (var o in options) {
                    if (obj[o] !== options[o]) return
                }
            }
            return obj
        }
        var array = []
        for (var value of this.maps.values()) {
            var filter = false
            if (options) {
                for (var p in options) {
                    if (value[p] !== options[p]) {
                        filter = true
                    }
                }
            }
            if (!filter) {
                array.push(value)
            }
        }
        return array
    }

    set(key, value) {
        if (!key || !value) return
        this.maps.set(key, value)
        this.event.emit(this.name, value)
    }

    delete(key, options) {
        if (key) {
            this.maps.delete(key)
        }
    }
}