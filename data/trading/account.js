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

{ $Id: account.js,v 1.9 2018/01/19 10:00:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

/*
  <loginID, <account, <currency balanceInfo>>>
*/

var base = require('./base'),
    logger = require('common').Logger.instance().getLogger()

class Account extends base {
    constructor(name) {
        super(name)
    }

    get(loginID, key, options) {
        var array = []
        if (loginID && this.maps.has(loginID)) {
            try {
                var account_maps = this.maps.get(loginID)
                if (key && account_maps.has(key)) {
                    var currency_maps = account_maps.get(key)
                    if (options && options.currency && currency_maps.has(options.currency)) {
                        array.push(currency_maps.get(options.currency))
                    } else {
                        for (var balance of currency_maps.values()) {
                            array.push(balance)
                        }
                    }
                } else {
                    for (var account of account_maps.values()) {
                        for (var balance of account.values()) {
                            array.push(balance)
                        }
                    }
                }
            } catch (err) {
                logger.error(err)
            }
        }
        return array
    }

    set(loginID, key, value, options) {
        if (!loginID || !key || !value) return
        value.currency = value.currency || ''
        var account_maps
        var currency_maps
        var originalBankBalance
        try {
            if (this.maps.has(loginID)) {
                account_maps = this.maps.get(loginID)
                if (!account_maps.has(key)) {
                    currency_maps = new Map()
                    account_maps.set(key, currency_maps)
                } else {
                    currency_maps = account_maps.get(key)
                    if (currency_maps && currency_maps.has(value.currency)) {
                        if (options && options.initial) {
                            if (currency_maps && currency_maps.has(value.currency)) return // skip the initial data, prevent override
                        }
                        originalBankBalance = currency_maps.get(value.currency).bankBalance
                    }
                }
            } else {
                account_maps = new Map()
                currency_maps = new Map()
                this.maps.set(loginID, account_maps)
                account_maps.set(key, currency_maps)
            }
            if (value.header && value.header.length > 1 && value.header[1] === 'BankBalance') {
                var bankBalance = value.acctAvailableb
                if (currency_maps.has(value.currency)) {
                    value = currency_maps.get(value.currency)
                    value.bankBalance = bankBalance
                } else {
                    value = { account: value.account, currency: value.currency, bankBalance: bankBalance }
                }
            } else {
                if (typeof originalBankBalance !== 'undefined') {
                    value.bankBalance = originalBankBalance
                }
            }
            currency_maps.set(value.currency, value)
            this.event.emit(this.name, value)
            this.event.emit(loginID, value)
            return value
        } catch (error) {
            logger.error('set account failed. Error: ' + error)
        }
    }
}

module.exports = new Account('account')