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

{ $Id: spread.js,v 1.4 2018/01/19 10:00:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

/*
  <spreadname, spread>
*/

var base = require('./base')
var priceDDS = require('../../connection/dds')

class Spread extends base {
    constructor(name) {
        super(name)
        this.custom.invalidSpreadList = []
        var that = this
        priceDDS.event.on('spread', function (data) {
            if (data && data.symbol) {
                that.set(data.symbol, data)
                that.event.emit(data.symbol, data)
            }
        })
    }
    getAsny(key, options, callback) {
        callback = callback || function () { }
        if (!key) return callback('invalid key', { symbol: key })
        if (this.custom.invalidSpreadList.indexOf(key) >= 0) return callback('invalid spread', { symbol: key })
        var that = this
        if (this.maps.has(key)) {
            return callback(null, this.maps.get(key))
        } else {
            priceDDS.event.once(key, function (data) {
                if (!data || data._isError) {
                    if (that.custom.invalidSpreadList.indexOf(key) < 0) {
                        that.custom.invalidSpreadList.push(key)
                    }
                    return callback('invalid spread', data)
                } else {
                    return callback(null, data)
                }
            })
            priceDDS.SubscribeSpread(key)
        }
    }
}

module.exports = new Spread('spread')