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

{ $Id: bond_ticket.js,v 1.14 2018/02/27 05:27:02 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'bond-ticket'

    // elements
    var inputBondPrice = $('#ticket-bond-price')
    var inputNominalValue = $('#ticket-PAR-value')
    var BONDQUANTITYFORMAT = initial_data.format.bond_unit

    function init(ticketConfig) {
        $(document).on('ticket-added', function (event, productObj) {
            if (productObj && productObj[tags.productType] == 6) {
                var symbolCurrency = productObj[tags.currency] || ''
                $('#ticket-bond-min-purchase-amount').text($._format.pattern(productObj[3401], BONDQUANTITYFORMAT) + '({0})'.format(symbolCurrency))
                $('#ticket-bond-incremental-amount').text($._format.pattern(productObj[3402], BONDQUANTITYFORMAT) + '({0})'.format(symbolCurrency))
                $('#ticket-bond-coupon-rate').text($._format.percentage(productObj[3403], 2))
                $('#ticket-bond-settlement-date').text(moment(productObj[540], 'YYYYMMDD').format('YYYY/MM/DD'))
                $('#ticket-bond-pre-coupon-date').text(moment(productObj[3404], 'YYYYMMDD').format('YYYY/MM/DD'))
                $('#ticket-bond-transaction-fee').text($._format.percentage(productObj[3407], 2))

                if (inputBondPrice.length > 0) {
                    inputBondPrice.focus()
                    var inputBondPricePH = inputBondPrice.attr('placeHolder')
                    var pIndex = inputBondPricePH.indexOf('(%)')
                    var displayRatio = productObj[1504]
                    if (displayRatio && displayRatio != '1') {
                        if (pIndex < 0)
                            inputBondPrice.attr('placeHolder', inputBondPricePH + '(%)')
                    } else {
                        if (pIndex >= 0) {
                            inputBondPrice.attr('placeHolder', inputBondPricePH.replace('(%)', ''))
                        }
                    }
                    $('#ticket-bond-display-ratio').val(displayRatio)
                    inputBondPrice.focus()
                }
                inputNominalValue.InputFormat()
            }
        })
    }

    function clear() {
        $('.bond-info').text('')
        inputBondPrice.val('')
        inputNominalValue.val('')
    }

    function getBondInfo(productObj, options) {
        if (!productObj) return
        options = options || {}
        var info = {}
        var side = options.side || 0
        var symbolCurrency = productObj[tags.currency]
        // var feeCurrency = CurMgr.base_currency
        var currency = productObj['23'] || ''
        var prodFlag = productObj['3605']
        var transactionFeeRate = productObj[3407] || ''
        var transactionFeeAmount = productObj[3408] || ''


        var transactionFeeRateSell = productObj[3407] || ''
        var transactionFeeAmountSell = productObj[3408] || ''
            if (productObj[3606]) {
                transactionFeeRateSell = productObj[3606]
            }
            if (productObj[3607]) {
                transactionFeeAmountSell = productObj[3607]
            }

        var sDate = productObj['540'] || ''
        var preCouDate = productObj['3404'] || ''
        var cPFrequency = productObj['3609'] || ''  // Semi-Annual
        var cRate = ''
        if (productObj['3403']) {
            cRate = $._format.pattern(productObj['3403'] * 100, '#,##0.########') + '%'
        }
        var lastPrice = ''
        if (productObj[3]) {
            lastPrice = $._format.pattern(productObj[3] * (productObj[1504] || 1), '#,##0.00######')
        }
        var currencyLabel = '({0})'.format(symbolCurrency)
        info.price = { name: messages.column_price.text + ': ', value: lastPrice + currencyLabel }
        info.currency = { name: messages.orderbook_header_23.text + ': ', value: currency }
        info.cRate = { name: messages.ticket_bond_coupon_rate.text, value: cRate || '' }
        info.cPFrequency = { name: messages.ticket_bond_coupon_payment_frequency.text, value: cPFrequency || '' }
        info.txn = { name: messages.ticket_bond_transaction_fee.text, value: $._format.percentage(transactionFeeRate, 2) }
        info.minTxnAmount = { name: messages.ticket_bond_min_transaction_fee_amount.text, value: $._format.amount(transactionFeeAmount) + currencyLabel }
        info.txnSell = { name: messages.ticket_bond_transaction_feeSell.text, value: $._format.percentage(transactionFeeRateSell, 2) }
        info.minTxnAmountSell = { name: messages.ticket_bond_min_transaction_fee_amountSell.text, value: $._format.amount(transactionFeeAmountSell) + currencyLabel }
        
        
        info.minAmt = { name: messages.ticket_bond_min_purchase_amount.text, value: $._format.pattern(productObj[3401], BONDQUANTITYFORMAT) + currencyLabel }
        info.incrementalAmt = { name: messages.ticket_bond_incremental_amount.text, value: $._format.pattern(productObj[3402], BONDQUANTITYFORMAT) + currencyLabel }
        info.sDate = { name: messages.ticket_bond_settlement_date.text, value: sDate || '' }
        info.preCouDate = { name: messages.ticket_bond_pre_coupon_date.text, value: preCouDate || '' }
        if (prodFlag & 16) {
            info.txn.value = messages.FreeTransactionFee.text
            info.minTxnAmount = messages.FreeTransactionFee.text
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
            info.availableQuantity = { name: messages.ticket_bond_available_quantity.text, value: $._format.pattern(GetMaxSellSync(productObj[0]), BONDQUANTITYFORMAT) }
        }
        return info
    }

    function popupBondDisclaimer(callback) {
        $.get('/iTrader/bond/disclaimer', function (data) {
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
    exports.getBondInfo = getBondInfo
    exports.popupBondDisclaimer = popupBondDisclaimer
})