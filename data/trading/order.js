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

{ $Id: order.js,v 1.14 2017/11/06 09:34:02 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

/*
  <loginID, <orderNo, order>>
*/

var base = require('./base'),
    uuid = require(__node_modules + 'node-uuid'),
    OmsUtility = require('../../lib/omsUtility'),
    schema = require('common').Schema,
    logger = require('common').Logger.instance().getLogger(),
    util = require('../../lib/utility')


class Order extends base {
    constructor(name) {
        super(name)
    }

    set(loginID, key, value, options) {
        if (!loginID || !key || !value) return
        var switchID = OmsUtility.IsFundSwitchOrder(value)
        var sub_maps
        if (this.maps.has(loginID)) {
            sub_maps = this.maps.get(loginID)
        } else {
            sub_maps = new Map()
            this.maps.set(loginID, sub_maps)
        }
        if (sub_maps.has(key)) {
            value.subOrders = sub_maps.get(key).subOrders
        }
        value.subOrders = value.subOrders || {}
        OmsUtility.UpdateVoucherType(value)
        if (switchID) {
            key = switchID
            value = this.updateFundSwitchOrder(value, sub_maps.get(key))
        }
        this.update(value, sub_maps.get(key))
        sub_maps.set(key, value)
        if (options && options.subOrder) {
            this.linkSubOrder(loginID, value, options.subOrder)
        }
        this.event.emit(loginID, value)
        this.event.emit(key, value)
        this.event.emit(this.name, value)
        if (value.userRef) {
            this.event.emit(value.userRef, value)
        }
        return value
    }

    linkSubOrder(loginID, orderObj, subOrderObj) {
        if (!loginID || !orderObj || !orderObj.orderNo || !subOrderObj || !subOrderObj.exchNo) return
        subOrderObj.voucherType = orderObj.voucherType
        orderObj.subOrders[subOrderObj.exchNo] = subOrderObj
    }

    update(value, oldValue) {
        if (!value) return
        try {
            if (value && value.compSystemRef && value.compSystemRef.TRANSFEE) {
                value.transFee = value.compSystemRef.TRANSFEE / 100
            }
            if (oldValue) {
                if (!value.time) {
                    value.time = oldValue.time
                }
            }
        } catch (err) {
            logger.error(err)
        }
    }

    updateFundSwitchOrder(value, oldValue) {
        var switchID = OmsUtility.IsFundSwitchOrder(value)
        if (!switchID) return value
        var tempVlaue = value
        if (oldValue) {
            if (!value.orderNo && oldValue.orderNo) {
                tempVlaue = oldValue
            }
            tempVlaue.FundSwitchOrderList = oldValue.FundSwitchOrderList
            if (oldValue.status == '-1') {
                tempVlaue.status = '-1'
            }
        } else tempVlaue.FundSwitchOrderList = {}
        var orderKey = value.orderNo || value.userRef || uuid.v1()
        var orderObj = schema.OrderSchema.makeFromObject({
            symbol: value.symbol,
            orderNo: value.orderNo,
            side: value.side,
            status: value.status,
            account: value.account,
            user: value.user,
            currency: value.currency,
            price: value.price,
            quantity: value.quantity,
            compSystemRef: value.compSystemRef,
            errorCode: value.errorCode,
            minorCode: value.minorCode,
            freeText: value.freeText,
        })
        // delete orderObj.FundSwitchOrderList   // in some case, without this will make maximun call stack size exceeded v1.3.8
        orderObj.allocation = value.compSystemRef ? Number(value.compSystemRef.SwitchP) : 1
        orderObj._isErrorOrder = value._isErrorOrder
        orderObj.switchID = switchID
        if (!tempVlaue.orderNo) {
            if (value.orderNo) {
                tempVlaue.orderNo = value.orderNo
            } else {
                tempVlaue.orderNo = orderKey
            }
        }
        tempVlaue.switchID = switchID
        tempVlaue.FundSwitchOrderList[orderKey] = orderObj
        return tempVlaue
    }
}

var order = new Order('order')
module.exports = order