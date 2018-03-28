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

{ $Id: util.js,v 1.7 2018/01/19 10:00:24 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    function getSymbolName(obj) {
        var name = ''
        if (obj) {
            var lang = $('html').attr('lang') || 'en-US'
            if (lang === 'zh-CN') {
                name = obj[505] || obj[21] || obj[10]
            } else if (lang === 'zh-HK') {
                name = obj[36] || obj[21] || obj[10]
            } else {
                name = obj[21] || obj[10]
            }
            if (obj[30]) {
                name += '(' + obj[3] + ')'
            }
        }
        return name
    }

    function getShortSymbolName(obj) {
        if (obj) {
            var lang = $('html').attr('lang') || 'en-US'
            if (lang === 'zh-CN') {
                return obj[505] || obj[10] || obj[21]
            } else if (lang === 'zh-HK') {
                return obj[36] || obj[10] || obj[21]
            } else {
                return obj[10] || obj[21]
            }
        }
        return ''
    }

    function applyColor(row, options) {
        if (!row || !row.data()) return
        options = options || {}
        var colorSchema = options.color_schema || initial_data.views.trade.order_book.color_schema
        if (!colorSchema || colorSchema.length <= 0) return
        var data = row.data()
        if (!data || !data._raw) return
        var status = data._raw[5]
        var side = data._raw[11]
        for (var i = 0; i < colorSchema.length; i++) {
            var schemaStatus = colorSchema[i].status
            var schemaSide = colorSchema[i].side
            if (typeof (schemaStatus) !== 'undefined') {
                if (status != schemaStatus) continue
            }
            if (typeof (schemaSide) !== 'undefined') {
                if (side != schemaSide) continue
            }
            if (colorSchema[i].class) {
                $(row.node()).addClass(colorSchema[i].class)
            }
            if (colorSchema[i].color) {
                $(row.node()).css('color', colorSchema[i].color)
            }
            if (colorSchema[i].background) {
                $(row.node()).css('background-color', colorSchema[i].background)
            }
        }
    }

    // format order info(price), in add/chagne/cancel confirmation and order detail popup
    function formatOrderInfo(symbol, container, cb) {
        if (!symbol || !container) return
        $.get('/iTrader/product?symbol=' + symbol, function (result) {
            var data = result.data
            if (data) {
                if (!IsOTCBond(data)) {  // no need format price rate
                    container.find('[data-price]').each(function () {
                        var priceType = $(this).attr('data-price')
                        var oriText = $(this).text()
                        var oriVal = $(this).val()
                        var price = getDisplayPrice(oriText || oriVal, priceType, data)
                        if (oriText) {
                            $(this).text(price)
                        } else if (oriVal) {
                            price = (price || '').replace(/,/g, '')
                            $(this).val(price)
                        }
                    })
                }
                container.format()
                container.translate()
                if (typeof cb === 'function') {
                    cb(data)
                }
            }
        })
    }

    /* account balance */
    exports.IsNeedToHideGroupBalance = function (currency_list) {
        var convertableCount = 0
        var tradableCount = 0
        if (currency_list && currency_list.length > 0) {
            for (var i = 0; i < currency_list.length; i++) {
                var curObj = currency_list[i]
                if (curObj) {
                    if (curObj.isTradable) {
                        tradableCount++
                    }
                    if (curObj.isConvertible) {
                        convertableCount++
                    }
                }
            }
        }
        return (tradableCount - convertableCount > 1) ? true : false
    }

    function isPriceQuoteOrder(orderObj) {
        if (!orderObj || !orderObj._raw) return false
        if (orderObj.voucherType === 'cash') return false    // cash voucher
        if ((orderObj._raw[491] & 262144) == 0) return false  // order without price quote flag
        return true
    }

    function isOrderInPriceQuoteStage(orderObj) {
        if (!isPriceQuoteOrder(orderObj)) return false
        if (orderObj._raw[5] == '-1' || orderObj._raw[5] == '4') return false  // cancel/reject orders
        if ((orderObj._raw[40] & 32) == 0) return false  // order with manual flag
        return true
    }

    /**
     * get the NA charater from messages, default return N/A
     */
    function getNotApplicableValueChar() {
        var NA = 'N/A'
        if (typeof messages !== 'undefined' && messages.NotApplicableValue) {
            NA = messages.NotApplicableValue.text || 'N/A'
        }
        return NA
    }

    /**
     * set the default value if the field is null/emtpy/zero
     * @param {object} objs object need to process 
     */
    function handleZeroShowNA(objs) {
        if (typeof initial_data === 'undefined' || !initial_data.zeroShowNA) return
        if (typeof objs !== 'object' || !objs) return
        var data = objs
        if (!IsArray(objs)) {
            data = [objs]
        }
        for (var i = 0; i < data.length; i++) {
            var item = data[i]
            if (!item) continue
            for (var i = 0; i < initial_data.zeroShowNA.length; i++) {
                var key = initial_data.zeroShowNA[i]
                if (item[key] != undefined && !item[key] || Number(item[key]) == 0) {
                    item[key] = getNotApplicableValueChar()
                }
            }
        }
    }

    exports.GetSymbolName = getSymbolName
    exports.GetShortSymbolName = getShortSymbolName
    exports.ApplyColor = applyColor
    exports.FormatOrderInfo = formatOrderInfo
    exports.IsPriceQuoteOrder = isPriceQuoteOrder
    exports.IsOrderInPriceQuoteStage = isOrderInPriceQuoteStage
    exports.GetNotApplicableValueChar = getNotApplicableValueChar
    exports.HandleZeroShowNA = handleZeroShowNA
})