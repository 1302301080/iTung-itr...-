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

{ $Id: error_order.js,v 1.4 2017/11/06 09:34:02 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

/*
  <sessionID, <userRef, order>>
*/

var base = require('./base'),
    OmsUtility = require('../../lib/omsUtility'),
    schema = require('common').Schema,
    order = require('./order')


class ErrorOrder extends base {
    constructor(name) {
        super(name)
    }

    set(loginID, key, value, options) {
        if (!loginID || !value) return
        var sub_maps
        value._isErrorOrder = true

        if (this.maps.has(loginID)) {
            sub_maps = this.maps.get(loginID)
        } else {
            sub_maps = new Map()
            this.maps.set(loginID, sub_maps)
        }
        var switchID = OmsUtility.IsFundSwitchOrder(value) || ''
        key = key || (switchID + value.symbol + value.quantity + value.side)  // if no tag6, use symbol+quantity+price+side as key
        var hasDuplicatedErrorOrder = sub_maps.get(key) ? true : false
        sub_maps.set(key, value)
        this.event.emit(this.name, value)
        this.event.emit(loginID, value)
        this.event.emit(key, value)
        if (value.userRef) {
            this.event.emit(value.userRef, value)
        }

        if (switchID && !hasDuplicatedErrorOrder) {
            order.set(loginID, key, value, options)
        }
        return value
    }

}

module.exports = new ErrorOrder('errororder')