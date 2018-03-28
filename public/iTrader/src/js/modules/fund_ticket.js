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

{ $Id: fund_ticket.js,v 1.16 2018/01/19 10:00:23 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'fund-ticket'
    var inputAmountUnit = $('#ticket-fund-amount-unit')
    var fundSideBtn = $('#ticket-btn-fund-side')
    var AcctMgr = AccountMgr
    var CurMgr = CurrencyMgr
    var side = '0'
    var fundTicketMinSubAmount = $('#ticket-fund-min-subscription-amount')
    var FUNDUNITFORMAT = initial_data.format.fund_unit
    function init() {
        $(document).on('ticket-added', function (event, productObj) {
            if (productObj && productObj[tags.productType] == 10) {
                $('#ticket-side').val(side)
                var info = getFundInfo(productObj, { side: side })
                $('#ticket-fund-nav').text(info.nav.value)
                if (side == 0) {
                    fundTicketMinSubAmount.text(info.minAmt.value)
                    fundTicketMinSubAmount.parent().removeClass('hidden')
                } else {
                    fundTicketMinSubAmount.parent().addClass('hidden')
                }
                var txn = $('#ticket-fund-transaction-fee')
                var minTxnAmt = $('#ticket-fund-min-transaction-fee-amount')
                if (info.txn) {
                    txn.text(info.txn.value)
                    txn.parent('div').removeClass('hidden')
                } else {
                    txn.parent('div').addClass('hidden')
                }
                if (info.minTxnAmt) {
                    minTxnAmt.text(info.minTxnAmt.value)
                    minTxnAmt.parent('div').removeClass('hidden')
                } else {
                    minTxnAmt.parent('div').addClass('hidden')
                }

                inputAmountUnit.focus()
                inputAmountUnit.InputFormat()
            }
        })

        $('[name=ticket-fund-radio-side]').change(function () {
            side = $(this).val()
            $('#ticket-side').val(side)
            var fundSideBtn = $('#ticket-btn-fund-side')
            fundSideBtn.val(side)
            if (side == 0) {
                fundSideBtn.text(messages.ticket_subscribe.text)
                fundSideBtn.removeClass('btn-danger').addClass('btn-success')
                inputAmountUnit.attr('placeHolder', messages.fund_subscription_amount.placeHolder)
            } else {
                fundSideBtn.text(messages.ticket_redeem.text)
                fundSideBtn.addClass('btn-danger').removeClass('btn-success')
                inputAmountUnit.attr('placeHolder', messages.ticket_fund_unit.placeHolder)
            }
            $('#ticket-input-symbol-code').trigger('blur')
        })
    }

    function clear() {
        $('.fund-info').text('')
        inputAmountUnit.val('')
    }

    function getFundInfo(productObj, options) {
        if (!productObj) return
        options = options || {}
        var info = {}
        var buysellTransaction
        var side = options.side || 0
        var symbolCurrency = productObj[tags.currency]
        var feeCurrency = CurMgr.base_currency
        var currency = productObj['23'] || ''
        var prodFlag = productObj['3605']
        var transactionFeeRate = productObj['3407'] || ''
        var minTransFeeAmount = productObj['3408'] || ''
        if (side == 1) {
            if (productObj[3606]) {
                transactionFeeRate = productObj[3606]
            }
            if (productObj[3607]) {
                minTransFeeAmount = productObj[3607]
            }
        }
        var navInfo = ''
        if (productObj['31']) {
            navInfo = productObj['31']
            if (productObj['3608']) {
                navInfo += ' ({0})'.format(moment(productObj[3608], 'YYYYMMDD').format('YYYY/MM/DD'))
            }
        }
        info.currency = { name: messages.column_currency.text + ': ', value: currency }
        info.nav = { name: messages.ticket_fund_nav.text, value: navInfo }
        info.txn = { name: messages.ticket_fund_transaction_fee.text, value: $._format.percentage(transactionFeeRate, 2) }
        info.minAmt = { name: messages.ticket_fund_min_subscription_amount.text, value: $._format.amount(productObj['3401'] || '') + '({0})'.format(symbolCurrency) }
        info.minTxnAmt = { name: messages.ticket_fund_min_transaction_fee_amount.text, value: $._format.amount(minTransFeeAmount) + '({0})'.format(feeCurrency) }
        if (prodFlag & 16) {
            info.txn.value = messages.FreeTransactionFee.text
            info.minTxnAmt.value = messages.FreeTransactionFee.text
        } else if (prodFlag & 32) {
            if (side == 0 && !(prodFlag & 2)) {
                delete (info.txn)
                delete (info.minTxnAmt)
            } else if (side == 1 && (!(prodFlag & 4))) {
                delete (info.txn)
                delete (info.minTxnAmt)
            }
        }
        if (side == 1) {
            delete (info.minAmt)
            info.availableQuantity = { name: messages.ticket_fund_available_unit.text, value: $._format.pattern(GetMaxSellSync(productObj[0]), initial_data.format.fund_unit) + '({0})'.format(symbolCurrency) }

            var minHoldingUnit
            if (productObj[3611] && productObj[3611] > 0 && productObj[31] && productObj[31] > 0) {
                minHoldingUnit = Math.ceil(productObj[3611] / (productObj[31] * 0.95))
            }
            info.minHoldingUnit = { name: messages.ticket_fund_min_holding_unit.text, value: typeof minHoldingUnit === 'undefined' ? messages.NotApplicableValue.text : $._format.pattern(minHoldingUnit, FUNDUNITFORMAT) }
        }
        return info
    }

    function popupFundDisclaimer(callback) {
        $.get('/iTrader/fund/disclaimer?type=disclosure', function (data) {
            if (data && data.url) {
                showMessage({
                    title: messages.dialog_disclosure_title.text,
                    buttonNameList: ['agree', 'reject'],
                    load: { url: getMultiLanguageURL(data) },
                    callback: function (button, dialog) {
                        var btnID = button.attr('id')
                        if (btnID === 'btn-reject') {
                            callback(false)
                            callback = null
                        } else if (btnID === 'btn-agree') {
                            callback(true)
                            callback = null
                        }
                        dialog.close()
                    },
                    onshow: function (dialog) {
                        dialog.getModalBody().css('max-height', '450px')
                    },
                    onhide: function () {
                        if (callback) callback(false)
                    }
                })
            } else {
                callback(true)
            }
        })
    }

    exports.init = init
    exports.clear = clear
    exports.getFundInfo = getFundInfo
    exports.popupFundDisclaimer = popupFundDisclaimer
})