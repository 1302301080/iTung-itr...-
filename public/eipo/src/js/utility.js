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

{ $Id: utility.js,v 1.2 2017/06/14 04:23:42 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {

    var dialog = require('dialog')

    $.fn.ellipsisText = function () {
        $(this).each(function () {
            var copyThis = $(this.cloneNode(true)).hide().css({
                'position': 'absolute',
                'width': 'auto',
                'overflow': 'visible'
            })
            $(this).after(copyThis);
            if (copyThis.width() > $(this).width()) {
                $(this).text($(this).text().substring(0, $(this).html().length - 4));
                $(this).html($(this).html() + '…');
                copyThis.remove()
                wordLimit()
            } else {
                copyThis.remove()
                return
            }
        })
    }

    /* eipo */
    var format = require('format')
    var language = $('html').attr('lang')
    function convertIPOData(obj, schema, configFormat) {
        if (language && language.indexOf('en') != 0) {
            obj.symbolName = obj['36']
        } else {
            obj.symbolName = obj['21']
        }
        obj.offerPrice = format.formatWithPattern(obj['32'], configFormat.price) + '~' + format.formatWithPattern(obj['37'], configFormat.price)
        if (obj[6]) {
            obj[5] = messages.eipo["status_" + obj[5]].text
        } else {
            obj['5'] = obj['5'] == 0 ? messages.eipo["ipo-status-close"].text : messages.eipo["ipo-status-open"].text
        }
        if (obj && schema) {
            var dateKeys = ['1500', '1501', '1502', '1503', '1504', '1513', '1600']
            for (var i = 0; i < schema.length; i++) {
                var schemaObj = schema[i]
                if (schemaObj.key) {
                    if (schemaObj.format) {
                        obj[schemaObj.key] = format.formatWithPattern(obj[schemaObj.key], schemaObj.format)
                    }
                    if (dateKeys.indexOf(schemaObj.key) >= 0 && obj[schemaObj.key]) {
                        obj[schemaObj.key] = moment(obj[schemaObj.key], 'YYYY-MM-DD').format(configFormat.date)
                    }
                }
            }
        }
    }

    function getMarginRatio(value, decimalFormat, withPercentage) {
        if (!value || isNaN(value)) return
        value = Number(value) * 100
        if (decimalFormat) {
            return format.formatWithPattern(value, decimalFormat) + (withPercentage ? '%' : '')
        } else {
            return value.toFixed(2) + (withPercentage ? '%' : '')
        }
    }

    function handleAcctUserUI() {
        var loginType = $('#login-type').val()
        if (loginType == '0') {
            $('.acct-visible').addClass('hidden')
            $('.user-visible').removeClass('hidden')
        } else {
            $('.user-visible').addClass('hidden')
            $('.acct-visible').removeClass('hidden')
        }
    }

    function getErrorMessage(err) {
        var errMsg
        if (err) {
            if (typeof (err) === 'string') {
                errMsg = messages.error[err] || err
            } else if (typeof (err) === 'object') {
                var minorCode = err.minorCode || err['464']
                var errorCode = err.errorCode || err['39']
                var errorMsg = err.errorMsg || err.freeText || err['25']
                errMsg = messages.error[minorCode] || messages.error[errorCode] || errorMsg
                if (!errMsg) {
                    if (err.status) {
                        if (err.status == 401) {
                            navigate()
                        } else if (err.status == 403) {
                            if (err.responseJSON && err.responseJSON.errorCode) {
                                errMsg = messages.error[err.responseJSON.errorCode]
                            }
                            errMsg = errMsg || err.statusText
                        } else if (err.status == 503) {
                            errMsg = messages.error.I_10002
                        } else if (err.statusText) {
                            errMsg = err.statusText
                        } else {
                            errMsg = messages.error.I_10004
                        }
                    }
                }
            }
        }
        return errMsg || messages.error.I_10004
    }

    function alertError(err) {
        dialog.alertError({
            message: typeof err === 'object' ? getErrorMessage(err) : err
        })
    }

    function alertInfo(message) {
        dialog.alertMessage({ message: message })
    }

    function popupInformation(obj) {
        if (!obj) return
        if (obj.err) {
            alertError(obj.err)
        } else if (obj.message) {
            alertInfo(obj.message)
        }
    }

    function popupDisclaimer(options) {
        if (options) {
            var url = options.multi_language ? getMultiLanguageURL(options.url) : options.url
            showMessage({
                title: options.title,
                message: $('<div></div>').load(url),
                buttonNameList: ['agree', 'reject'],
                onshow: function (dialog) {
                    dialog.getModalBody().css('max-height', '500px')
                },
                callback: options.callback
            })
        }
    }

    function getIndexByKey(key, list, defaultValue) {
        if (key && list) {
            var index = -1
            for (var i = 0; i < list.length; i++) {
                if (!list[i].tooltip) {
                    index++
                    if (list[i].key == key) return index
                }
            }
        }
        return defaultValue || -1
    }

    function upperCaseInput() {
        $('.uppercase-field').on('input', function () {
            $(this).val($(this).val().toUpperCase())
        })
    }

    exports.convertIPOData = convertIPOData
    exports.getMarginRatio = getMarginRatio
    exports.handleAcctUserUI = handleAcctUserUI
    exports.getErrorMessage = getErrorMessage
    exports.alertError = alertError
    exports.alertInfo = alertInfo
    exports.popupDisclaimer = popupDisclaimer
    exports.popupInformation = popupInformation
    exports.getIndexByKey = getIndexByKey
    exports.upperCaseInput = upperCaseInput
})
