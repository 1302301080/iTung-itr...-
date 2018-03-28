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

{ $Id: entry.js,v 1.8 2018/01/19 10:00:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

// var logger = require('common').Logger.instance().getLogger(),
var logger = __logger
var Const = require('../lib/const'),
    Order = require('./trading/order'),
    SubOrder = require('./trading/sub_order'),
    CalcOrder = require('./trading/calc_order'),
    ErrorOrder = require('./trading/error_order'),
    Trade = require('./trading/trade'),
    Position = require('./trading/position'),
    Account = require('./trading/account'),
    Margin = require('./trading/margin'),
    HistoryOrder = require('./trading/history_order'),

    Product = require('./market/product'),
    Spread = require('./market/spread'),
    Currency = require('./market/currency'),
    Exchange = require('./market/exchange'),

    User = require('./user')

var globalData = {
    exchanges: [],
    exchanges_full: [],
}

class DataEntry {
    constructor() {
        this.global = globalData
        this.actions = new Map()
        this.actions.set(Const.DataAction.order, Order)
        this.actions.set(Const.DataAction.subOrder, SubOrder)
        this.actions.set(Const.DataAction.calcOrder, CalcOrder)
        this.actions.set(Const.DataAction.errorOrder, ErrorOrder)
        this.actions.set(Const.DataAction.trade, Trade)
        this.actions.set(Const.DataAction.position, Position)
        this.actions.set(Const.DataAction.account, Account)
        this.actions.set(Const.DataAction.margin, Margin)
        this.actions.set(Const.DataAction.historyOrder, HistoryOrder)

        this.actions.set(Const.DataAction.product, Product)
        this.actions.set(Const.DataAction.spread, Spread)
        this.actions.set(Const.DataAction.currency, Currency)
        this.actions.set(Const.DataAction.exchange, Exchange)

        this.actions.set(Const.DataAction.user, User)
    }

    get(action) {
        try {
            var args = this.handleArgs.apply(this, arguments)
            var target = this.actions.get(action.name)
            return target.get.apply(target, args)
        } catch (error) {
            logger.error(error)
        }
    }

    getSymbol(code) {
        if (!code) return
        return this.get({ name: Const.DataAction.product }, code)
    }

    getAsny(action) {
        try {
            var args = this.handleArgs.apply(this, arguments)
            var target = this.actions.get(action.name)
            target.getAsny.apply(target, args)
        } catch (error) {
            logger.error(error)
        }
    }

    set(action) {
        try {
            var args = this.handleArgs.apply(this, arguments)
            var target = this.actions.get(action.name)
            return target.set.apply(target, args)
        } catch (error) {
            logger.error(error)
        }
    }

    delete(action) {
        try {
            var args = this.handleArgs.apply(this, arguments)
            var target = this.actions.get(action.name)
            return target.delete.apply(target, args)
        } catch (error) {
            logger.error(error)
        }
    }

    event(action) {
        var target = this.actions.get(action.name)
        if (target && target.event) {
            return target.event
        }
        throw new Error('Cannot find specified event. parameters: ' + action)
    }

    custom(action) {
        var target = this.actions.get(action.name)
        if (target && target.custom) {
            return target.custom || {}
        }
        throw new Error('Cannot find specified custom, parameters: ' + action)
    }

    handleArgs() {
        if (arguments.length <= 0 || typeof (arguments[0]) !== 'object' || !arguments[0].name)
            throw new Error('Invalid parameter.')
        if (!this.actions.get(arguments[0].name))
            throw new Error('Invalid parameter.')
        var args = []
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i])
        }
        return args
    }

    clearup(loginID) {
        var user = User.findUserById(loginID)
        if (user) {
            User.delete(user.uid)
        }
        Order.delete(loginID)
        SubOrder.delete(loginID)
        Trade.delete(loginID)
        CalcOrder.delete(loginID)
        ErrorOrder.delete(loginID)
        Account.delete(loginID)
        Position.delete(loginID)
        HistoryOrder.delete(loginID)
    }
}

module.exports = new DataEntry()