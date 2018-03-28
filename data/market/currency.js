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

{ $Id: currency.js,v 1.7 2018/01/19 10:00:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

/*
  <currencyName, { currency: <currency>, ratio: <ratio>, isBase: <true|false>, isTradable<true|false|, isConvertible }>
*/

var base = require('./base')

class Spread extends base {
    constructor(name) {
        super(name)
        this.custom.currencyMode = 'single'
    }

    set(key, value) {
        if (!key || !value) return
        var currency = this.maps.get(key) || { ratio: 1, isBase: false, isTradable: false, isConvertible: true }
        var ratio = value.ratio
        var isBase = value.isBase
        var isTradable = value.isTradable
        var isConvertible = value.isConvertible
        if (typeof (ratio) !== 'undefined' && ratio != null) {
            currency.ratio = ratio
        }
        if (typeof (isBase) !== 'undefined' && isBase != null) {
            currency.isBase = isBase
        }
        if (typeof (isTradable) !== 'undefined' && isTradable != null) {
            currency.isTradable = isTradable
        }
        if (typeof (isConvertible) !== 'undefined' && isConvertible != null) {
            currency.isConvertible = isConvertible
        }
        if (currency.isBase) {
            this.custom.baseCurrency = key
        }
        currency.currencyMode = this.custom.currencyMode
        currency.currency = key
        this.maps.set(key, currency)
        this.event.emit('currency', currency)
    }
}

module.exports = new Spread('spread')