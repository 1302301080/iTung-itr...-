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

{ $Id: settlement.js,v 1.12 2018/01/19 10:00:22 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var settlement_form
var accountInfoList = {}
var bankDetailList = {}
var imageFile
var account
var element_method
var settlement_input_symbolCode
var payment_input
var swiftCode
var withBalance
var xQuantity
var scrip
var settlementWarningMessage
function Settlement_Initialize() {
    settlement_form = $('#settlement-form')
    settlement_input_symbolCode = $('.productCode')
    account = AccountMgr.current_account
    payment_input = $('[name=payment_input]')
    swiftCode = $('.cd-swift-code')
    withBalance = $('.with-balance')
    xQuantity = $('[name=x_quantity]')
    scrip = $('[name=scrip]')
    settlementWarningMessage = $('#settlement-warning-message')
    $.get('/iTrader/message/detail', function (options) {
        accountInfoList = options.accountInfoList
        bankDetailList = options.bankDetailList
        imageFile = options.imageFile
        if (!imageFile) {
            $('.visible-CD-CQE').remove()
            $('.visible-CDE').remove()
        }
        var acctObj = accountInfoList[account]
        for (var i in acctObj) {
            var acctName = acctObj[i][0]
            var acctID = acctObj[i][1]
            $('.cw-select-bank').append($('<option>', { 'value': acctName, text: acctName }))
        }
        for (var k in bankDetailList) {
            var bankData = bankDetailList[k]
            $('.cd-bank-name').append($('<option>', { 'value': bankData[0], text: bankData[0] }))
        }
        $('[name=payment_type]').change(function () {
            if ($(this).val() == 'DVP') {
                payment_input.removeAttr('readonly')
                payment_input.attr('required', 'required')
            } else {
                payment_input.attr('readOnly', 'readOnly')
                payment_input.removeAttr('required')
                $(this).parents('.has-error').removeClass('has-error')
                payment_input.val('')
            }
        })
        settlement_input_symbolCode.on('input', function () {
            $(this).val($(this).val().toUpperCase())
        })
        settlement_input_symbolCode.blur(function () {
            var instruction = $("input:radio[name='instruction']:checked").val()
            var selected_method = $("input:radio[name='method']:checked").val()
            var that = this
            $(that).val(applyProductRule($(that).val()))
            var code = $(that).val()
            $('.sd-productName').val('')
            $('.si-productName').val('')
            $('.si-holding').val('')
            $('.pw-productName').val('')
            $('.pw-holding').val('')
            $.get('/iTrader/product?symbol=' + code + '&ISINCode=1', function (result) {
                var data = result.data
                if (data) {
                    var productName = data['symbolName']
                    var symbol = data[0]
                    var holding = GetMaxSellSync(symbol)
                    $(that).val(symbol)
                    if (instruction == 'SD') {
                        $('.sd-productName').val(productName)
                    } else {
                        if (IsOTCBond(data) || IsOTCFund(data)) {
                            settlementWarningMessage.text(messages.settlement_product_warning.text)
                            return
                        }
                        if (selected_method == 'SI') {
                            $('.si-productName').val(productName)
                            $('.si-holding').val($._format.quantity(holding))
                        } else {
                            $('.pw-productName').val(productName)
                            $('.pw-holding').val($._format.quantity(holding))
                        }
                    }
                    settlementWarningMessage.text('')
                } else {
                    settlementWarningMessage.text(messages.settlement_product_warning.text)
                }
            })
        })
        $('.cw-currency').change(function () {
            var currency = $(this).find('option:selected').val()
            var acctObj = AccountMgr.get(account, currency)
            if (currency) {
                if (CurrencyMgr.currencyMode === 'multi' && acctObj[23] != currency) {
                    acctObj[700] = 0
                }
                if (acctObj[700] || acctObj[700] === 0) {
                    withBalance.text(currency + ' ' + $._format.amount(acctObj[700]))
                    withBalance.parents('.detail').removeClass('hidden')
                } else {
                    withBalance.parents('.detail').addClass('hidden')
                }
            }
        })

        $('.cd-currency').change(function () {
            var currency = $(this).find('option:selected').val()
            var acctObj = AccountMgr.get(account, currency)
            var cashBalanceTag = initial_data.keyTags.cashBalance
            var tradingLimitTag = initial_data.keyTags.tradingLimit
            if (CurrencyMgr.currencyMode === 'multi' && acctObj[23] != currency) {
                acctObj[cashBalanceTag] = 0
            }
            $('.cashBalance').text(currency + ' ' + $._format.amount(acctObj[cashBalanceTag]))
            $('.pur-stock').text(currency + ' ' + $._format.amount(acctObj[tradingLimitTag]))
            if (acctObj[1206] || acctObj[1206] === 0) {
                $('.pur-fullTrade').text(currency + ' ' + $._format.amount((acctObj[1206])))
                $('.pur-fullTrade').parents('.help-block').removeClass('hidden')
            } else {
                $('.pur-fullTrade').parents('.help-block').addClass('hidden')
            }
        })

        $('.cw-select-bank').change(function () {
            var acctName = $(this).find('option:selected').val()
            if (accountInfoList[account]) {
                var acctID = accountInfoList[account][acctName][1]
                $('.cw-bank-number').val(acctID)
            }
        })
        $('.cd-bank-name').change(function () {
            var bankAliasName = $(this).find('option:selected').val()
            var bankData = bankDetailList[bankAliasName]
            if (!bankData) return
            var bankName = ''
            var lang = $('html').attr('lang')
            if (lang == 'en-US') {
                bankName = bankData[4]
            } else if (lang == 'zh-CN') {
                bankName = bankData[5]
            } else {
                bankName = bankData[6]
            }
            $('.cd-alias-name').text(bankName)
            if (bankData[1]) {
                swiftCode.text(bankData[1])
                swiftCode.parent().removeClass('hidden')
            } else {
                swiftCode.parent().addClass('hidden')
            }
            $('.cd-ac-number').text(bankData[2])
            $('.cd-ac-name').text(bankData[3])
        })
        scrip.change(function () {
            if ($(this).val()) {
                xQuantity.attr('required', true)
            } else {
                xQuantity.attr('required', false)
            }
        })
        xQuantity.change(function () {
            if ($(this).val()) {
                scrip.attr('required', true)
            } else {
                scrip.attr('required', false)
            }
        })
    })
    $(".form-datetime").datepicker({
        format: "dd/mm/yyyy",
        autoclose: true,
        startDate: "today",
        todayHighlight: true,
    })
    $($('[name=instruction]')[0]).attr('checked', true)
    SettlementSelectChanged()

    $('[name=instruction]').change(function () {
        var selected_method = $("input:radio[name='method']:checked")
        if (selected_method && selected_method.length > 0) {
            selected_method.attr('checked', false)
        }
        SettlementSelectChanged()
    })

    $('[name=method]').change(function () {
        SettlementSelectChanged()
    })

    // $('.input-amount').each(function () {
    //     $(this).InputFormat({
    //         format: function (value) {
    //             return $._format.quantity(value)
    //         }
    //     })
    // })

    settlement_form.translate()
}

function applyProductRule(value) {
    if (initial_data.exchange_rule && initial_data.exchange_rule.SEHK) {
        var ruleObj = initial_data.exchange_rule.SEHK
        ruleObj.rule = ruleObj.rule || 'default'
        if (ruleObj.rule && exchangeRules[ruleObj.rule]) {
            value = exchangeRules[ruleObj.rule](value, ruleObj.options)
        }
    }
    return value
}

function SettlementSelectChanged() {
    settlementWarningMessage.text('')
    $('.settlement_method').each(function () {
        $(this).addClass('hidden')
    })
    $('.settlement_detail').each(function () {
        $(this).addClass('hidden')
    })
    $('.special_detail').each(function () {
        $(this).addClass('hidden')
    })
    var selected_instruction = $("input:radio[name='instruction']:checked")
    if (selected_instruction && selected_instruction.length > 0) {
        $('#settlement_method_' + selected_instruction.val()).removeClass('hidden')
        var selected_method = $("input:radio[name='method']:checked")
        if (selected_method && selected_method.length > 0) {
            element_method = $('#settlement_detail_' + selected_instruction.val() + '_' + selected_method.val())
            if ((!element_method || element_method.length <= 0)) {
                if (selected_method.val().indexOf('E') > -1 && selected_instruction.val() == 'CD') {
                    element_method = $('#settlement_detail_CDE')
                }
            }
            if (!element_method || element_method.length <= 0) {
                element_method = $('#settlement_detail_' + selected_instruction.val())
            }
            if (!element_method || element_method.length <= 0) {
                element_method = $('#settlement_detail_SD_SW_' + selected_method.val())
            }
            if (!element_method || element_method.length <= 0) {
                element_method = $('#settlement_detail_CD_CW')
            }
            if (!element_method || element_method.length <= 0) {
                element_method = $('#settlement_detail_SD_SW')
            }
            element_method.removeClass('hidden')
        }
        $('.cd-currency').trigger('change')
        $('.cw-select-bank').trigger('change')
        $('.cw-currency').trigger('change')
        $('.cd-bank-name').trigger('change')
        $($(element_method).find('.visible-' + selected_instruction.val() + '-' + selected_method.val())).removeClass('hidden')
    }
}

function fileChange(target) {
    if (!target.value) return
    var filetypes = [".jpg", ".jpeg", ".png"]
    var filepath = target.value
    settlementWarningMessage.text('')
    if (filepath) {
        var isnext = false
        var fileend = filepath.substring(filepath.indexOf("."))
        if (filetypes && filetypes.length > 0) {
            for (var i = 0; i < filetypes.length; i++) {
                if (filetypes[i].toUpperCase() == fileend.toUpperCase()) {
                    isnext = true
                    break
                }
            }
        }
        if (!isnext) {
            settlementWarningMessage.text(messages.settlement_file_check.text)
            target.value = ""
            return false
        }
    } else {
        return false
    }
}

function SettlementInstruction() {
    showMessage({
        title: messages.settlement_instruction_title.text,
        closeByBackdrop: false,
        load: {
            url: '/iTrader/message/settlement', callback: function () {
                Settlement_Initialize()
            }
        },
        buttonNameList: ['submit', 'reset', 'close'],
        callback: function (button, dialog) {
            if (button.name === 'submit') {
                var amount = element_method.find('[name=amount]').val().replace(/,/g, '')
                var scrip = element_method.find('[name=scrip]').val()
                var xQuantity = element_method.find('[name=x_quantity]').val()
                if (amount && scrip && xQuantity && amount != scrip * xQuantity) {
                    settlementWarningMessage.text(messages.settlement_SW_check.text)
                    return
                }
                settlementWarningMessage.text('')
                validateForm(settlement_form, {
                    submitHandler: function (form) {
                        var formData = new FormData(settlement_form[0])
                        formData.append('account', account)
                        dialog.close()
                        $.ajax({
                            type: 'post',
                            url: '/iTrader/message/settlement',
                            data: formData,
                            cache: false,
                            processData: false,
                            contentType: false,
                            success: function (result) {
                                if (result) {
                                    if (result.error) {
                                        handleError(result.error)
                                    } else {
                                        alertMessage({ message: messages.settlement_message_success.text + result.data.messageRefId })
                                    }
                                } else {
                                    handleError()
                                }
                            },
                            error: handleError
                        })
                    },
                    validClass: ''
                })
                if (settlement_form.valid()) {
                    if (button.text() === messages.btn_submit.text) {
                        button.text(messages.btn_sure.text)
                        $('#settlement-form .alert').removeClass('hidden')
                        $('#settlement-form :input').attr("disabled", "disabled")
                        var btn_1 = dialog.getButton('btn-reset')
                        if (btn_1 && btn_1.length > 0) {
                            btn_1.text(messages.btn_cancel.text)
                        }
                    } else if (button.text() === messages.btn_sure.text) {
                        $('#settlement-form .hidden').remove()
                        $('#settlement-form :input').removeAttr("disabled")
                        settlement_form.submit()

                        dialog.close()
                    }
                }
            }
            else if (button.name === 'reset') {
                if (button.text() === messages.btn_reset.text) {
                    document.getElementById("settlement-form").reset()
                    $('[name=instruction]').trigger('change')
                    $('[name=method]').trigger('change')
                    settlement_form.find('.has-success, .has-error').each(function () {
                        $(this).removeClass('has-success').removeClass('has-error')
                    })
                } else if (button.text() === messages.btn_cancel.text) {
                    $('#settlement-form .alert').addClass('hidden')
                    $('#settlement-form :input').removeAttr("disabled")
                    var btn_1 = dialog.getButton('btn-reset')
                    if (btn_1 && btn_1.length > 0) {
                        btn_1.text(messages.btn_reset.text)
                    }
                    var btn_2 = dialog.getButton('btn-submit')
                    if (btn_2 && btn_2.length > 0) {
                        btn_2.text(messages.btn_submit.text)
                    }
                }
            } else if (button.name === 'close') {
                dialog.close()
            }
        }
    })
}