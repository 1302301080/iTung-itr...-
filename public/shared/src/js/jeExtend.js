/*!
{*******************************************************************}
{                                                                   }
{       eBroker Systems Javascript Component Library                }
{                                                                   }
{                                                                   }
{       Copyright(c) 2000-2017 eBroker Systems Ltd.                 }
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

{ $Id: jeExtend.js,v 1.14 2017/12/26 03:14:36 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

if (!Number.MIN_SAFE_INTEGER) {
    Number.MIN_SAFE_INTEGER = -9007199254740991
}

/* Global function ======================================================= */
ToNumber = function (str) {
    if (str) {
        if (typeof str === 'string') {
            return Number(str.replace(/,/g, ''))
        }
        if (!isNaN(str)) {
            return Number(str)
        }
    }
    return 0
}

ReplaceComma = function (str) {
    if (typeof str === 'string') {
        return str.replace(/,/g, '')
    }
    return str
}

IsArray = function (obj) {
    if (typeof (obj) === 'object' && obj !== null && obj.constructor === Array) {
        return true
    }
    return false
}

/* Javascript entension ======================================================= */
String.prototype.startWith = function (str) {
    var reg = new RegExp("^" + str);
    return reg.test(this);
}

String.prototype.endWith = function (str) {
    var reg = new RegExp(str + "$");
    return reg.test(this);
}

// format {0}, start as 0
String.prototype.format = function () {
    var str = this
    if (arguments.length > 0) {
        var array
        if (arguments[0] instanceof Array) {
            array = arguments[0]
        } else {
            array = arguments
        }
        for (var i = 0; i < array.length; i++) {
            var re = new RegExp('\\{' + i + '\\}', 'gm')
            str = str.replace(re, array[i])
        }
    }
    return str
}

// format %s1, start as 1
String.prototype.cformat = function () {
    var str = this
    if (arguments.length > 0) {
        var array
        if (arguments[0] instanceof Array) {
            array = arguments[0]
        } else {
            array = arguments
        }
        for (var i = 0; i < array.length; i++) {
            var re = new RegExp('%' + (i + 1) + '[s,d,n]', 'gm')
            str = str.replace(re, array[i])
        }
    }
    return str
}

/* Global configuration for third party component ======================================================= */
if (typeof layer === 'object' && typeof layer.config === 'function') {
    layer.config({
        path: '/stylesheets/layer/',
        skin: 'layer-custom'
    })
}

// jQuery extend
(function ($) {
    // override jQuery ajax function to prevent cache issues(304).
    var _ajax = $.ajax
    $.ajax = function (opt) {
        if (!opt) return
        if ((!opt.type || opt.type.toLowerCase() === 'get') && opt.url) {  // type = 'get' or type = undefined(load function)
            if (opt.url.indexOf('?') < 0) {
                opt.url += '?temp=' + (new Date()).getTime()
            } else {
                opt.url += '&temp=' + (new Date()).getTime()
            }
        }
        return _ajax(opt)
    }

    $.fn.translate = function (prefix) {
        var elements = $(this).find('[data-i18n]')
        elements.each(function () {
            var data_i18n = $(this).attr('data-i18n')
            if (data_i18n) {
                data_i18n = data_i18n.indexOf('.') >= 0 ? '.' + data_i18n : "['{0}']".format(data_i18n)
                var obj = eval("messages{0}{1}".format(prefix ? "['{0}']".format(prefix) : '', data_i18n))
                if (typeof (obj) === 'string') {
                    $(this).text(obj)
                } else if (typeof (obj) === 'object') {
                    for (var o in obj) {
                        if (o == 'text') {
                            $(this).text(obj[o])
                        } else if (o == 'html') {
                            $(this).html(obj[o])
                        } else {
                            $(this).attr(o, obj[o])
                        }
                    }
                }
            }
        })
    }

    $.fn.CreateDrowdownGroup = function (options) {
        // var example = {
        //     id: 'element-id',
        //     name: {
        //         i18n: 'column_currency',
        //         value: 'currency'
        //     },
        //     data: [
        //         { key: 'HKD', value: 'HKD' },
        //         { key: 'USD', value: 'USD' }
        //     ]
        // }
        if (!options || !options.data || options.data.length <= 0) return
        this.empty()
        var container = $('<div>', {
            'class': 'btn-group btn-group-xs',
            'id': options.id || ''
        })
        var leftBtn = $('<button>', {
            'type': 'button',
            'class': 'btn btn-success dropdown-toggle btn-group-label'
        }).append($('<span>', {
            'data-i18n': options.name.i18n || ''
        }).text(options.name.value || ''))
        var rightBtn = $('<button>', {
            'type': 'button',
            'class': 'btn btn-info dropdown-toggle',
        })
        var current_element = $('<span>', {
            'class': 'dropdown-group-text',
            'data-key': options.data[0].key || ''
        }).text(options.data[0].value || '')
        rightBtn.append(current_element)
        if (options.data.length > 1) {
            rightBtn.append($('<span>', { 'class': 'caret' }))
            rightBtn.attr('data-toggle', 'dropdown')
            rightBtn.attr('aria-haspopup', false)
            rightBtn.attr('aria-expanded', false)
        }
        var ul = $('<ul>', { 'class': 'dropdown-menu dropdown-group-list' })
        function getValue(key) {
            for (var i = 0; i < options.data.length; i++) {
                if (options.data[i].key === key) {
                    return options.data[i].value
                }
            }
            return key
        }
        function select(key) {
            var clickElement = ul.find('[data-key={0}]'.format(key))
            if (clickElement.length > 0) {
                ul.find('li').show()
                current_element.attr('data-key', key)
                current_element.text(clickElement.text())
                clickElement.parent().hide()
                container.trigger('change', key)
            }

        }
        for (var i = 0; i < options.data.length; i++) {
            var dataItem = options.data[i]
            var a_element = $("<a href='javascript:void(0)' data-key='" + dataItem.key + "'>" + dataItem.value + "</a>")
            var li_element = $("<li></li>").append(a_element)
            ul.append(li_element)
            if (dataItem.key === options.data[0].key) {
                li_element.hide()
            }
            a_element.click(function () {
                var key = $(this).attr('data-key')
                select(key)
            })
        }
        container.append(leftBtn).append(rightBtn).append(ul)
        if (typeof container.translate === 'function') {
            container.translate()
        }
        this.html(container)
        this.select = select
    }

    // auto upper case for input
    $.fn.InputAutoUpper = function (options) {
        this.on('input', function () {
            var value = this.val()
            if (value) {
                this.val(value.toUpperCase())
            }
        }.bind(this))
    }

    // auto format currency
    $.fn.InputFormat = function (options) {
        options = options || {}
        this.on('input', function () {
            var value = this.val()
            if (value) {
                if (value.indexOf('.') < 0) {
                    this.val($.number(value))
                } else {
                    // var integerPart = $.number(value.substring(0, value.indexOf('.')))
                    // var decimalPart = value.substring(value.indexOf('.'), value.length)
                    // this.val(integerPart + decimalPart)  // default format currency
                }
            }
        }.bind(this))
        if (typeof options.format === 'function') {
            this.on('blur', function () {
                if (!this.val()) return
                this.val(options.format(this.val()))
            }.bind(this))
        }
    }

    $.fn.InputPercentage = function (options) {
        // var sample = {
        //     data: [10, 20, 50, 100, 0],  // 0 means input
        //     total: 10000
        // }
        if (!options) return
        if ($(this).hasClass('dropdown-input-percentage')) return
        var data = options.data
        $(this).attr('data-total', options.total)
        var ul = $('<ul>', { class: "dropdown-menu" })
        for (var i = 0; i < data.length; i++) {
            if (data[i] < 0) continue
            if (data[i] != 0) {
                ul.append($('<li>').append($('<a>', { role: 'menuitem', href: 'javascript:void(0)', class: 'percentage-input', text: data[i] + '%', "data-percentage": data[i] })))
            } else {
                ul.append($('<li>').append($('<input>', { href: 'javascript:void(0)', class: 'form-control percentage-input', placeHolder: '%' })))
            }
        }
        $(this).attr('data-toggle', 'dropdown')
        $(this).parent().append($('<div>', { class: 'dropdown' }).append($(this)).append(ul))
        ul.find('li a').click(function (e) {
            var clickedElement = $(e.target)
            var total = $(this).attr('data-total')
            var percentage = clickedElement.attr('data-percentage')
            if (Number(percentage) == 100) {
                $(this).val($._format.pattern(total, '#,##0.########'))
            } else {
                $(this).val($.number((total * percentage / 100)))
            }
            $(this).focus()
        }.bind(this))
        ul.find("input").on('input', function (e) {
            var inputElement = $(e.target)
            var inputvalue = inputElement.val()
            if (!inputvalue) return
            if (isNaN(inputvalue) || Number(inputvalue) < 0 || Number(inputvalue) > 100) {
                $(this).val('')
                return
            } else {
                var total = $(this).attr('data-total')
                if (Number(inputvalue) == 100) {
                    $(this).val($._format.pattern(total, '#,##0.########'))
                } else {
                    $(this).val($.number((total * inputvalue / 100)))
                }
            }
        }.bind(this))
        ul.find("input").on('blur', function (e) {
            $(this).focus()
        }.bind(this))
        // $(this).InputFormat()
        $(this).addClass('dropdown-input-percentage')
    }

    $.getUrlParam = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)")
        var r = window.location.search.substr(1).match(reg)
        if (r != null) return unescape(r[2])
        return null
    }

    $.getRandomUrl = function (url) {
        var tmp = '&tmp='
        if (url) {
            if (url.indexOf('?') > 0) {
                tmp = '&tmp='
            } else {
                tmp = '?tmp='
            }
        }
        return (url || '') + tmp + (new Date).getTime()
    }

    // IE not support hide option, so must use a parent element to wrap it.
    $.fn.setOptionVisible = function (show) {
        if (show) {
            this.filter("span > option").unwrap()
        } else {
            this.filter(":not(span > option)").wrap("<span>").parent().hide()
        }
        return this
    }
})(jQuery)

window.onerror = function (msg, url, lineNo, columnNo, error) {
    $.post('/c', {
        msg: msg,
        url: url,
        lineNo: lineNo,
        columnNo: columnNo,
        error: error,
        ua: navigator.userAgent
    })
    return false
}