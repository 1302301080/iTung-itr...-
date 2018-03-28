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

{ $Id: format.js,v 1.8 2017/12/26 03:14:36 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var NA = (messages && messages.NotApplicableValue) ? (messages.NotApplicableValue.text || 'N/A') : 'N/A'
    var FormatSetting = typeof initial_data === 'undefined' ? {} : (initial_data.format || {})

    $(function () {
        $.fn.format = function () {
            format({ container: $(this) })
        }
        $.extend({
            _setDefault: setDefault,
            _map: {
                side: map_orderSide,
                status: map_orderStatus,
                productType: map_productType,
                currency: map_currency,
                exchange: map_exchange,
                source: map_source
            },
            _format: {
                price: f_price,
                amount: f_amount,
                quantity: f_quantity,
                percentage: f_percentage,
                pattern: formatWithPattern
            },
            _notApplicabel: NA
        })
    })

    function format(options) {
        options = options || {}
        format_value('[data-format^=price]', f_price, options)
        format_value('[data-format^=amount]', f_amount, options)
        format_value('[data-format^=quantity]', f_quantity, options)
        format_value('[data-format^=percentage]', f_percentage, options)
        format_value('[data-format=side]', map_orderSide, options)
        format_value('[data-format=status]', map_orderStatus, options)
        format_value('[data-format=product_type]', map_productType, options)
        format_value('[data-format=currency]', map_currency, options)
        format_value('[data-format=exchange]', map_exchange, options)
        format_value('[data-format^=-]', formatWithPattern, options)
    }

    function format_value(pattern, method, options) {
        options = options || {}
        var elements = options.container instanceof jQuery ? options.container.find(pattern) : $(pattern)
        elements.each(function () {
            var value = $(this).text()
            var attr = $(this).attr('data-format')
            var pattern
            if (attr.indexOf('-') == 0) {
                pattern = attr.substring(1)
            }
            var index = attr.indexOf('@')
            var precision = index > 0 && attr.length > index ? attr.substring(index + 1) : 0
            if (value.length > 0) {
                $(this).text(method($.trim(value), pattern || Number(precision)))
            } else {
                value = $(this).val()
                if (value.length > 0) {
                    $(this).val(method($.trim(value), pattern || Number(precision)))
                }
            }
            if (options) {
                if (options.once) {
                    $(this).removeAttr('data-format')
                }
            }
        })
    }

    function f_amount(value, precision) {
        if (FormatSetting.amount) {
            return formatWithPattern(value, FormatSetting.amount)
        }
        value = ReplaceComma(value)
        if (isNaN(value)) return NA
        if (typeof ($.number) === 'undefined') return value
        return $.number(value, precision || 2)
    }

    function f_price(value, precision) {
        if (FormatSetting.price) {
            return formatWithPattern(value, FormatSetting.price)
        }
        if (isNaN(precision)) {  // precision maybe an format pattern
            return formatWithPattern(value, precision)
        }
        value = ReplaceComma(value)
        if (isNaN(value)) return NA
        if (typeof ($.number) === 'undefined') return value
        precision = precision || 3
        return $.number(value, precision)
    }

    function f_quantity(value, precision) {
        if (FormatSetting.quantity) {
            return formatWithPattern(value, FormatSetting.quantity)
        }
        value = ReplaceComma(value)
        if (isNaN(value)) return NA
        if (typeof ($.number) === 'undefined') return value
        if (value % 1 === 0) {
            return $.number(value)
        } else {
            return $.number(value, precision || 2)
        }
    }

    function f_percentage(value, precision) {
        if (typeof value === 'string') {
            if (value.indexOf('%') === value.length - 1) {
                value = value.replace(/%/g, '')
                if (!isNaN(value)) {
                    value = String((value / 100))
                }
            }
        }
        value = ReplaceComma(value)
        if (isNaN(value)) return NA
        if (FormatSetting.percentage) {
            var res = formatWithPattern(value * 100, FormatSetting.percentage)
            if (res && res != NA)
                return res + '%'
            return res
        }
        if (typeof ($.number) === 'undefined') return value
        if (isNaN(Number(value))) return value
        precision = precision || 0
        return $.number((Number(value) * 100), precision) + '%'
    }

    function map_orderSide(value) {
        var side = messages.oms['side_' + value]
        return side || value
    }

    function map_orderStatus(value) {
        var status = messages.oms['status_' + value]
        return status || value
    }

    function map_productType(value) {
        var productType = messages.oms['product_type_' + value]
        return productType || value
    }

    function map_currency(value) {
        return value
    }

    function map_exchange(value) {
        if (!value) return value
        return messages.oms['exchange_' + value.toLowerCase()] || (messages[value] ? messages[value].text : value)
    }

    function map_source(value) {
        if (!value) return value
        return messages.oms['source_' + value] || value
    }

    function setDefault(obj) {
        for (var p in obj) {
            if (defaultValue[p]) {
                for (var i = 0; i < defaultValue[p].length; i++) {
                    var item = defaultValue[p][i]
                    if (item.keys.indexOf(obj[p]) >= 0) {
                        obj[p] = item.value
                    }
                }
            } else {
                if (obj[p] == null) {
                    obj[p] = NA
                }
            }
        }
        return obj
    }

    function formatWithPattern(number, pattern) {
        var num
        if (typeof number === 'string') {
            num = number.replace(/,/g, '')
        } else num = number
        if (isNaN(num)) {
            if (isNaN(NA)) return NA
            else return formatWithPattern(NA, pattern)  // special requirement, if NA set to "0" and set format patter, the "0" display should follow the format pattern
        }
        var fmtarr = pattern ? pattern.split('.') : [''];
        var precisionLength = 0
        if (fmtarr.length > 0) {
            precisionLength = fmtarr[fmtarr.length - 1].length
        }
        var strarr = num ? Number(Number(num).toFixed(precisionLength)).toString().split('.') : ['0'];
        var retstr = '';

        var str = strarr[0];
        var fmt = fmtarr[0];
        var i = str.length - 1;
        var comma = false;
        for (var f = fmt.length - 1; f >= 0; f--) {
            switch (fmt.substr(f, 1)) {
                case '#':
                    if (i >= 0) retstr = str.substr(i--, 1) + retstr;
                    break;
                case '0':
                    if (i >= 0) retstr = str.substr(i--, 1) + retstr;
                    else retstr = '0' + retstr;
                    break;
                case ',':
                    comma = true;
                    retstr = ',' + retstr;
                    break;
            }
        }
        if (i >= 0) {
            if (comma) {
                var l = str.length;
                for (; i >= 0; i--) {
                    retstr = str.substr(i, 1) + retstr;
                    if (i > 0 && ((l - i) % 3) == 0) retstr = ',' + retstr;
                }
            }
            else retstr = str.substr(0, i + 1) + retstr;
        }

        retstr = retstr + '.';
        str = strarr.length > 1 ? strarr[1] : '';
        fmt = fmtarr.length > 1 ? fmtarr[1] : '';
        i = 0;
        for (var f = 0; f < fmt.length; f++) {
            switch (fmt.substr(f, 1)) {
                case '#':
                    if (i < str.length) retstr += str.substr(i++, 1);
                    break;
                case '0':
                    if (i < str.length) retstr += str.substr(i++, 1);
                    else retstr += '0';
                    break;
            }
        }
        return retstr.replace(/^,+/, '').replace(/^-,/, '-').replace(/\.$/, '');
    }

    var defaultValue = {
        bodQuantity: [{ keys: [null, ''], value: 0 }],
        costPrice: [{ keys: [null, ''], value: 0 }],
        marketValue: [{ keys: [null, ''], value: 0 }],
        globalMarketValue: [{ keys: [null, ''], value: 0 }],
        acceptValue: [{ keys: [null, ''], value: 0 }],
        unrealizedPL: [{ keys: [null, ''], value: 0 }],
        unrealizedPLRatio: [{ keys: [null, ''], value: 0 }],
        marginRatio: [{ keys: [null, ''], value: 0 }],
        totalBuy: [{ keys: [null, ''], value: 0 }],
        totalSell: [{ keys: [null, ''], value: 0 }],
        totalNet: [{ keys: [null, ''], value: 0 }],
        queueQuantity: [{ keys: [null, ''], value: 0 }],
    }

    exports.formatWithPattern = formatWithPattern
})