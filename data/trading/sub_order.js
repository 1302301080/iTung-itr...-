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

{ $Id: sub_order.js,v 1.7 2017/08/17 04:35:54 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

/*
  <loginID, <exchNo, subOrder>>
*/

var base = require('./base')
var OmsUtility = require('../../lib/omsUtility')
var order = require('./order')

class SubOrder extends base {
    constructor(name) {
        super(name)
    }

    set(loginID, key, value, options) {
        if (!loginID || !key || !value) return
        options = options || {}
        var sub_maps
        if (this.maps.has(loginID)) {
            sub_maps = this.maps.get(loginID)
        } else {
            sub_maps = new Map()
            this.maps.set(loginID, sub_maps)
        }
        if (sub_maps.has(key)) {
            value.trades = sub_maps.get(key).trades
        }
        value.trades = value.trades || {}
        this.linkOrder(loginID, value)
        this.linkTrade(loginID, value, options.trade)
        sub_maps.set(key, value)
        this.event.emit(loginID, value)
        this.event.emit(key, value)
        return value
    }

    linkOrder(loginID, subOrderObj) {
        if (!loginID || !subOrderObj || !subOrderObj.exchNo) return
        var orderObj = order.get(loginID, subOrderObj.orderNo)
        if (orderObj) {
            subOrderObj.voucherType = typeof orderObj.voucherType !== 'undefined' ? orderObj.voucherType : OmsUtility.UpdateVoucherType(subOrderObj)
            orderObj.subOrders[subOrderObj.exchNo] = subOrderObj
        }
    }

    linkTrade(loginID, subOrderObj, trades) {
        if (!loginID || !subOrderObj || !subOrderObj.exchNo) return
        if (!trades) return
        if (!IsArray(trades)) trades = [trades]
        if (trades.length > 0) {
            for (var tradeObj of trades) {
                if (tradeObj.exchNo === subOrderObj.exchNo) {
                    tradeObj.voucherType = subOrderObj.voucherType
                    subOrderObj.trades[tradeObj.tranNo] = tradeObj
                }
            }
        }
    }
}

var sub_order = new SubOrder('suborder')
module.exports = sub_order