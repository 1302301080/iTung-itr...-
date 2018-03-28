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

{ $Id: application.js,v 1.1 2016/12/20 11:04:18 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


define(function (require, exports, module) {
    require('datatables')
    var AccountExploer = require('eipo-accountExploer')
    var utility = require('eipo-utility')
    var format = require('format')
    var socketClient = require('eipo-socket')

    var language = $('html').attr('lang')
    var configData

    var ipoInfoTable
    var ipoqtyAmountTable
    var symbolCode
    var announceCode
    var inputAccount
    var selectQtyElement
    var checkboxMarginRatio
    var inputMarginRatio
    var errorMessage

    var loginType
    var loginId
    var marginRate

    var changeNewQty

    function init() {
        ipoInfoTable = $('#ipo-info-table')
        ipoqtyAmountTable = $('#ipo-qty-amount-table')
        symbolCode = $('#ipo-symbol-code').val()
        announceCode = $('#ipo-announce-code').val()
        selectQtyElement = $('#ipo-select-quantity')
        checkboxMarginRatio = $('#ipo-checkbox-margin-ratio')
        inputMarginRatio = $('#ipo-input-margin-ratio')
        errorMessage = $('#ipo-error-message')

        loginType = $('#login-type').val()
        loginId = $('#ipo-login-id').val()

        $('[data-format=date]').each(function () {
            var text = moment($(this).text(), 'YYYY-MM-DD').format(configData.format.date)
            $(this).text(text)
        })

        $('#app-account-exploer-btn').click(function () {
            AccountExploer.popup({
                callback: function (account) {
                    inputAccount.val(account)
                }
            })
        })
    }

    function initApplicationForm(options) {
        options = options || {}
        configData = options.configData
        AccountExploer.init(configData)
        $.get('/eipo/data/ipo?symbol={0}&announce={1}'.format(options.symbolCode, options.announceCode), function (data) {
            if (data) {
                init()
                var remainLoanAmount = data['1514']
                var marginEnable = data['1505'] == '0' ? false : true
                marginRate = Number(data['1506'])
                utility.convertIPOData(data, configData.schema.ipo, configData.format)
                var keyList = ['0', 'symbolName', '24', '1506', 'offerPrice', '23', '1502', '1503', '1513', '1504']
                for (var i = 0; i < keyList.length; i++) {
                    var schemaObj = getSchemaObjByKey(keyList[i])
                    var i18n = ''
                    var text = data[keyList[i]]
                    if (i === 3) {
                        i18n = 'column-max-loan-ratio'
                        if (marginEnable) {
                            text = utility.getMarginRatio(1 - Number(text), configData.decimal, true) || 0
                        } else {
                            text = messages.NotApplicableValue.text
                        }
                    }
                    if (schemaObj) {
                        i18n = schemaObj.i18n
                    }
                    ipoInfoTable.append($("<tr>").append($("<td>", { "data-i18n": i18n, "style": "width:140px;" }))
                        .append($("<td>", { text: text, title: keyList[i] === 'symbolName' ? text : '' })))
                }

                if (data['74']) {
                    var qtyAmtList = data['74'].split(',')
                    for (var i = 0; i < qtyAmtList.length; i++) {
                        var kv = qtyAmtList[i].split('=')
                        if (kv.length === 2) {
                            var qty = format.formatWithPattern(kv[0], configData.format.decimal)
                            selectQtyElement.append("<option>{0}</option>".format(kv[0]))
                            var amount = format.formatWithPattern(kv[1], configData.format.price)
                            ipoqtyAmountTable.append($("<tr>").append($("<td>", { text: qty, class: 'click-qty pointer' })).append($("<td>", { text: amount })))
                        }
                    }
                }
            }

            if (remainLoanAmount && remainLoanAmount > 0) {
                $('#ipo-margin-ratio-group').removeClass('hidden')
                if (marginEnable && marginRate > 0 && marginRate < 1) {
                    inputMarginRatio.val(utility.getMarginRatio(1 - marginRate, configData.decimal))
                } else {
                    checkboxMarginRatio.attr('disabled', 'disabled')
                    inputMarginRatio.attr('disabled', 'disabled').val(messages.NotApplicableValue.text)
                }
            }
            var prospectus = data['1509']
            var prospectusCN = data['1510']
            if (prospectus && $.trim(prospectus)) {
                prospectus = prospectus.indexOf('http') == 0 ? prospectus : 'http://' + prospectus
                $('#ipo-prospectus').append($("<a>", { "href": prospectus, "target": "_blank", style: "margin-left:10px;text-decoration:underline", "text": messages.eipo["ipo-prospectus"].text }))
                    .append()
            }
            if (prospectusCN && $.trim(prospectusCN)) {
                prospectusCN = prospectusCN.indexOf('http') == 0 ? prospectusCN : 'http://' + prospectusCN
                $('#ipo-prospectus').append($("<a>", { "href": prospectusCN, "target": "_blank", style: "margin-left:10px;text-decoration:underline", "text": messages.eipo["ipo-prospectus-cn"].text }))
            }

            if (loginType === '1') {
                inputAccount = $('#ipo-acct-input-account')
                inputAccount.val(loginId)
                inputAccount.attr('disabled', 'disabled')
            } else {
                inputAccount = $('#ipo-user-input-account')
            }
            utility.handleAcctUserUI()
            utility.upperCaseInput()
            $('.scrollbar').perfectScrollbar()

            $('.click-qty').click(function () {
                var qty = $(this).text().replace(/,/g, '')
                if (!isNaN(qty)) {
                    selectQtyElement.val(qty)
                    calc()
                }
            })

            selectQtyElement.change(function (e) {
                calc()
            })

            checkboxMarginRatio.change(function () {
                if (this.checked) {
                    inputMarginRatio.removeAttr('disabled')
                } else {
                    inputMarginRatio.attr('disabled', 'disabled')
                }
                calc()
            })

            inputMarginRatio.change(function () {
                calc()
            })

            inputMarginRatio.keypress(function (e) {
                if (e.keyCode == 13) {
                    calc()
                    e.stopPropagation()
                }
            })

            inputAccount.change(function() {
                calc()
            })

            options.container.translate('eipo')
            options.container.format()
            calc()
        })
    }

    function initChangeOrderForm(options) {
        options = options || {}
        configData = options.configData
        init()
        selectQtyElement.change(function (e) {
            calc()
        })
        options.container.translate('eipo')
        options.container.format()
    }

    function initCancelOrderForm(options) {
        options = options || {}
        configData = options.configData
        init()
        options.container.translate('eipo')
        options.container.format()
    }

    function calc() {
        if (!selectQtyElement) return
        var checkResult = check()
        if (checkResult) {
            errorMessage.text(checkResult)
            return
        }
        errorMessage.text('')
        var formData = getFormData()
        if (!formData.account || !formData.quantity) return  // must input field
        $('.calc-info').text('')
        var qty = selectQtyElement.val()
        if (!isNaN(qty)) {
            changeNewQty = qty
            calcOrder(function (err, data) {
                handleCalcOrder(err, data)
            })
        }
    }

    function getFormData() {
        return {
            symbol: symbolCode,
            announceCode: announceCode,
            account: inputAccount ? inputAccount.val() : $('#change-order-account').text(),
            quantity: selectQtyElement.val(),
            marginRate: checkboxMarginRatio.is(':checked') ? inputMarginRatio.val() : '',
            orderNo: $('#ipo-orderNo').text(),
            newQuantity: changeNewQty,
            _csrf: $('[name=_csrf]').val()
        }
    }

    function getSchemaObjByKey(key) {
        for (var i = 0; i < configData.schema.ipo.length; i++) {
            if (configData.schema.ipo[i].key == key) {
                return configData.schema.ipo[i]
            }
        }
    }

    function calcOrder(callback) {
        callback = callback || function () { }
        $.ajax({
            type: 'post',
            url: '/eipo/calc',
            data: getFormData(),
            success: function (data) {
                if (data) {
                    if (!data.err) {
                        var o = data.data
                        var cashAmount = o['3'] - o['1601'] + o['1602']
                        callback(null, {
                            requiredAmount: format.formatWithPattern(o['3'], configData.format.price),
                            cashAmount: format.formatWithPattern(cashAmount, configData.format.price),
                            loanAmount: format.formatWithPattern(o['1601'], configData.format.price),
                            estimatedInterest: format.formatWithPattern(o['1602'], configData.format.price)
                        })
                    } else {
                        callback(data.err)
                    }
                }
            },
            error: function (err) {
                utility.alertError(utility.getErrorMessage(err))
            }
        })
    }

    function addOrder(callback) {
        var checkResult = check()
        if (checkResult) {
            errorMessage.text(checkResult)
            return
        }
        var formData = getFormData()
        if (!formData.account || !formData.quantity) return
        $.ajax({
            type: 'post',
            url: '/eipo/apply',
            data: getFormData(),
            success: function (data) {
                if (data && data.err) {
                    callback(data, null)
                } else {
                    callback(null, data)
                }
            },
            error: function (err) {
                callback(err, null)
            }
        })
    }

    function changeOrder(callback) {
        if (isNaN(selectQtyElement.val())) return
        $.ajax({
            type: 'post',
            url: '/eipo/change',
            data: getFormData(),
            success: function (data) {
                if (data && data.err) {
                    callback(data, null)
                } else {
                    callback(null, data)
                }
            },
            error: function (err) {
                callback(err, null)
            }
        })
    }

    function cancelOrder(callback) {
        $.ajax({
            type: 'post',
            url: '/eipo/cancel',
            data: getFormData(),
            success: function (data) {
                if (data && data.err) {
                    callback(data, null)
                } else {
                    callback(null, data)
                }
            },
            error: function (err) {
                callback(err, data)
            }
        })
    }

    function handleCalcOrder(err, data) {
        errorMessage.text('')
        if (err) {
            errorMessage.text(utility.getErrorMessage(err))
        } else if (data) {
            $('#ipo-total-required-amount').text(data.requiredAmount)
            $('#ipo-cash-amount').text(data.cashAmount)
            $('#ipo-loan-amount').text(data.loanAmount)
            $('#ipo-estimated-interest').text(data.estimatedInterest)
        }
    }

    function check() {
        if (!inputMarginRatio.attr('disabled')) {
            var ratio = Number(inputMarginRatio.val())
            if (ratio < 0 || (100 - ratio) < marginRate * 100) {
                return messages.error.IncorrectMargin
            }
        }
    }

    exports.initApplicationForm = initApplicationForm
    exports.initChangeOrderForm = initChangeOrderForm
    exports.initCancelOrderForm = initCancelOrderForm
    exports.calc = calcOrder
    exports.add = addOrder
    exports.change = changeOrder
    exports.cancel = cancelOrder
})
