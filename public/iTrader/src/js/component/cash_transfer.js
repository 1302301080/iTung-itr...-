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

{ $Id: cash_transfer.js,v 1.8 2017/05/22 09:28:53 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var cash_transfer_form
function CashTransferChanged() {
    var accountData = AccountMgr.get($('#cash-transfer-account-out').val(), $('#cash-transfer-currency').val())
    $('#cash-transfer-available-amount').text('')
    $('#cash-transfer-available-amount').text($._format.amount(accountData ? accountData[tags.cashBalance] : 0))
    cash_transfer_form.translate()
}

function InitializeCashTransfer() {
    cash_transfer_form = $('#cash-transfer-form')
    $('#cash-transfer-currency').change(function () {
        CashTransferChanged()
    })
    $('#cash-transfer-account-out').change(function () {
        CashTransferChanged()
    })
}

function TransferCash() {
    showMessage({
        title: messages.cash_transfer_title.text,
        load: {
            url: '/iTrader/account/transfer', callback: function () {
                InitializeCashTransfer()
                CashTransferChanged()
            }
        },
        buttonNameList: ['submit', 'reset'],
        callback: function (button, dialog) {
            if (button.name === 'submit') {
                validateForm(cash_transfer_form, {
                    submitHandler: function (form) {
                        $.ajax({
                            type: 'post',
                            url: '/iTrader/account/transfer',
                            data: cash_transfer_form.serialize(),
                            success: function (result) {
                                if (result.error) {
                                    handleError(result.error)
                                } else {
                                    alertMessage({ message: messages.cash_transfer_success_message.text })
                                }
                            },
                            error: handleError
                        })
                    },
                    validClass: ''
                })
                if (cash_transfer_form.valid()) {
                    if (button.text() === messages.btn_submit.text) {
                        button.text(messages.btn_sure.text)
                        $('#cash-transfer-form .alert').removeClass('hidden')
                        $('#cash-transfer-form :input').attr("disabled", "disabled")
                        var btn_1 = dialog.getButton('btn-reset')
                        if (btn_1 && btn_1.length > 0) {
                            btn_1.text(messages.btn_cancel.text)
                        }
                    } else if (button.text() === messages.btn_sure.text) {
                        $('#cash-transfer-form .hidden').remove()
                        $('#cash-transfer-form :input').removeAttr("disabled")
                        cash_transfer_form.submit()
                        dialog.close()
                    }
                }
            } else if (button.name === 'reset') {
                if (button.text() === messages.btn_reset.text) {
                    document.getElementById("cash-transfer-form").reset()
                    cash_transfer_form.find('.has-success, .has-error').each(function () {
                        $(this).removeClass('has-success').removeClass('has-error')
                    })
                } else if (button.text() === messages.btn_cancel.text) {
                    $('#cash-transfer-form .alert').addClass('hidden')
                    $('#cash-transfer-form :input').removeAttr("disabled")
                    button.text(messages.btn_reset.text)
                    var btn_2 = dialog.getButton('btn-submit')
                    if (btn_2 && btn_2.length > 0) {
                        btn_2.text(messages.btn_submit.text)
                    }
                }
            }
        }
    })
}