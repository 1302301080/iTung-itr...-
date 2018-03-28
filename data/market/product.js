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

{ $Id: product.js,v 1.19 2018/02/27 05:27:01 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

/*
  <symbol, product>
*/

var config = require(__config_path),
    logger = require('common').Logger.instance().getLogger(),
    priceDDS = require('../../connection/dds'),
    base = require('./base')

class Product extends base {
    constructor(name) {
        super(name)
        this.times = new Map()
        this.custom.invalidSymbolList = []
        this.ISINList = {}

        var that = this
        priceDDS.event.on('symbol', function (data) {
            if (data && data.symbol) {
                that.set(data.symbol, data)
                that.event.emit(data.symbol, data)
            }
        })
    }

    getAsny(key, options, callback) {
        var that = this
        var isISINCode = options.ISINCode
        if (options) {
            delete (options.ISINCode)
        }
        var productObj = this.get(key, options)
        if (isISINCode) {
            if (!productObj && this.ISINList[key]) {
                productObj = this.get(this.ISINList[key], options)
            }
        }
        if (productObj && !options.mode) {   // mode = 'both' or mode = 'image' means need to subscribe data from DDS
            return callback(null, productObj)
        } else {
            if (this.custom.invalidSymbolList.indexOf(key) >= 0) {
                return callback('invalid symbol: ' + key)
            }
            priceDDS.event.once(key, function (data) {
                if (callback) {
                    if (!data || data._isError) {
                        callback(data)
                    } else {
                        callback(null, data)
                    }
                    callback = null
                }
            })
            priceDDS.SubscribeSymbol(key, options.mode)
        }
        setTimeout(function () {
            if (callback) {
                callback('get symbol timeout: ' + key)
                if (that.custom.invalidSymbolList.indexOf(key) < 0) {
                    that.custom.invalidSymbolList.push(key)
                }
                callback = null
            }
        }, 5 * 1000)
    }

    set(key, value, options) {
        if (!key || !value) return
        if (value.isInvalid) {
            logger.error('skip symbol. error: ' + value.errorMsg)
            return
        }
        this.touch()
        var product = this.update(key, value, options)
        this.ISINList[product.ISIN] = product.symbol
        this.event.emit(key, product)
        this.event.emit(this.name, product)
    }

    touch(key) {
        if (key) {
            this.times.set(key, new Date().getTime())
        }
    }

    update(key, value, options) {
        var encoding = (options && options.encoding) ? options.encoding : config.iTrader.oms.encoding
        var productObj = value
        var oldPrice
        if (key && value) {
            if (this.maps.has(key)) {
                productObj = this.maps.get(key)
                oldPrice = productObj.price
                for (var name in value) {
                    if (typeof (value[name]) === 'function') continue
                    if (name === 'schema') continue
                    if ((name === 'name' || name === 'CHTName' || name === 'CHSName') && productObj[name]) continue
                    productObj[name] = value[name]
                }
            }
            productObj.symbol = productObj.symbol || key  // some product without tag#0
            productObj._searchingIndex = (productObj.name || '') + (productObj.CHSName || '') + (productObj.CHTName || '')
            productObj[0] = productObj[0] || key

            // chcek price update
            if (value.price) {
                if (oldPrice !== value.price) {
                    this.event.emit('price-update', { 0: value.symbol || productObj.symbol, 3: value.price, 31: value.preClose || productObj.preClose })
                }
            }

            this.maps.set(key, productObj)
            return productObj
        }
    }
}

module.exports = new Product('product')