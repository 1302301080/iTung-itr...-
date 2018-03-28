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

{ $Id: trade.js,v 1.7 2017/08/14 07:18:14 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

/*
  <sessionID, <tradeID, trade>>
*/

var base = require('./base')
var order = require('./order')
var sub_order = require('./sub_order')

class Trade extends base {
    constructor(name) {
        super(name)
    }

    set(loginID, key, value, options) {
        if (!loginID || !key || !value || !value.account) return
        options = options || {}
        var sub_maps
        if (this.maps.has(loginID)) {
            sub_maps = this.maps.get(loginID)
        } else {
            sub_maps = new Map()
            this.maps.set(loginID, sub_maps)
        }
        value.originalTradePrice = value.price
        this.link(loginID, value)
        sub_maps.set(key, value)
        this.event.emit(loginID, value)
        this.event.emit(key, value)
        return value
    }

    link(loginID, value) {
        if (!loginID || !value || !value.exchNo || !value.tranNo) return
        var subOrderObj = sub_order.get(loginID, value.exchNo)
        if (subOrderObj) {
            value.voucherType = subOrderObj.voucherType
            subOrderObj.trades[value.tranNo] = value
        }
    }
}

module.exports = new Trade('trade')