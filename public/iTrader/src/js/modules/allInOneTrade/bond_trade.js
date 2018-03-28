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

{ $Id: bond_trade.js,v 1.5 2018/02/27 05:27:02 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/
define(function (require, exports, module) {
    require('datatables')
    var BondPosition = require('bond-position')
    var Ticket = require('ticket')
    var BbondTicket = require('bond-ticket')
    var FullTrade = require('full-trade')
    var BONDQUANTITYFORMAT = initial_data.format.bond_unit
    var bondBuyForm
    var bondSellForm
    var bondListDatatable
    var container
    var bondList = {}  // in object, full symbol info, by getSymbol function one by one
    var bondData  // in array, simple symbol info
    var hasProductBack
    var bondBuySubmitBtn
    var bondSellSubmitBtn
    var _csrf = $('input[name=_csrf]').val()
    var inputSymbol = $('.symbol-code')

    var bondDailyList = [
        { name: 'symbol', key: '0', i18n: 'bond_symbol_code' },
        { name: 'symbol name', key: 'symbolName', i18n: 'bond_name' },
        { name: 'currency', key: '23', i18n: 'column_currency' },
        { name: 'preClose', key: '31', i18n: 'column_pre_close', class: 'text-right' },
        { name: 'couponRate', key: 'couponRate', i18n: 'column_coupon_rate' },
        { name: 'risk', key: 'RPQLevel', i18n: 'column_risk_level', class: 'text-right' },
        { name: 'cies', key: 'CIESFlag', i18n: 'column_CIES' },
        { name: 'professional investor', key: 'PIFlag', i18n: 'column_professional_investor' },
    ]

    $(document).on('page', function (event, data) {
        if (data === 'shown' && bondListDatatable) {
            bondListDatatable.draw()
        }
    })
    function init(c, s) {
        container = c
        BondPosition.init($('#tab-bond-position'), s)
        bondBuyForm = $('#bond-buy-form')
        bondSellForm = $('#bond-sell-form')
        bondBuySubmitBtn = $('#bond-buy-submit')
        bondSellSubmitBtn = $('#bond-sell-submit')

        initBondDaily()
        initBondBuy()
        initBondSell()

        $('.bond-input-quantity').each(function () {
            $(this)
            $(this).InputFormat({
                format: function (value) {
                    return $._format.pattern(value, BONDQUANTITYFORMAT)
                }
            })
        })
        inputSymbol.on('input', function () {
            $(this).val($(this).val().toUpperCase())
        })
        inputSymbol.blur(function () {
            hasProductBack = false
            var symbol = $(this).val()
            addBondInfo(symbol)
            $(this).parents('form').find('.bond-input-quantity').focus()
        })
        inputSymbol.keypress(function (e) {
            if (e.keyCode == 13) {
                $(this).trigger('blur')
            }
        })

        setTimeout(function () {
            getBondData(function (data) {
                showBondTable(data)
            })
        }, 1000)

        bondBuySubmitBtn.click(function (e) {
            var side = e.target.attributes['data-typeside'].nodeValue
            var formline = $('.form-trade')
            var symbol = formline.find('.symbol-code').val()
            var amount = formline.find('.bond-input-quantity').val()
            if (!symbol) {
                formline.find('.symbol-code').focus()
                return
            }
            if (!amount) {
                formline.find('.bond-input-quantity').focus()
                return
            }
            submitOrder(side)
        })
        bondSellSubmitBtn.click(function (e) {
            var side = e.target.attributes['data-typeside'].nodeValue
            var formline = $('.form-trade')
            var symbol = formline.find('.symbol-code').val()
            var amount = formline.find('.bond-input-quantity').val()
            if (!symbol) {
                formline.find('.symbol-code').focus()
                return
            }
            if (!amount) {
                formline.find('.bond-input-quantity').focus()
                return
            }
            submitOrder(side)
        })
        $(document).translate()
    }

    function addBondInfo(symbolCode) {
        if (!symbolCode) return
        getSymbol(symbolCode, function (productObj) {
            if (hasProductBack) return
            hasProductBack = true
            if (!IsOTCBond(productObj)) {
                productObj = null
            }
            // var array = []
            var bondInfo = $('.bond-info')
            bondInfo.empty()
            if (!productObj) {
                bondInfo.append($("<h4>", { text: messages.ticket_message_invalid_symbol.text }))
                return
            }
            var title = $("<h4>", { text: productObj.symbolName })
            var titleTig = $('<p>').append(title)
            if (productObj["3409"]) {
                titleTig.append($("<i>", { text: "Risk " + productObj["3409"], class: "highlight-tag", title: messages.tag_RPQ.title, style: "cursor: help;" }))
            } if (productObj["3602"] == 'Y') {
                titleTig.append($("<i>", { text: "CIES ", class: "highlight-tag", title: messages.tag_CIES.title, style: "margin-left: 10px; cursor: help;" }))
            } if (productObj['3603'] == '1') {
                titleTig.append($("<i>", { text: "PI ", class: "highlight-tag", title: messages.tag_professional_investor.title, style: "margin-left: 10px; cursor: help;" }))
            }
            bondInfo.append(titleTig)
            var side = $('.active [href=#tab-bond-sell]').length > 0 ? 1 : 0
            var info = BbondTicket.getBondInfo(productObj, { side: side })
            var priceTd = $("<td>").append($("<small>", { text: info.price ? info.price.name + info.price.value : '' }))
            var curTd = $("<td>").append($("<small>", { text: info.currency ? info.currency.name + info.currency.value : '' }))
            var couRt = $("<td>").append($("<small>", { text: info.cRate ? info.cRate.name + info.cRate.value : '' }))
            var couPF = $("<td>").append($("<small>", { text: info.cPFrequency ? info.cPFrequency.name + info.cPFrequency.value : '' }))
            var miniInitSubAmount = $("<td>").append($("<small>", { text: info.miniInitSubAmount ? info.miniInitSubAmount.name + info.miniInitSubAmount.value : '' }))
            var miniHoldingAmount = $("<td>").append($("<small>", { text: info.miniHoldingAmount ? info.miniHoldingAmount.name + info.miniHoldingAmount.value : '' }))
            var minAmt = $("<td>").append($("<small>", { text: info.minAmt ? info.minAmt.name + info.minAmt.value : '' }))
            var incAmt = $("<td>").append($("<small>", { text: info.incrementalAmt ? info.incrementalAmt.name + info.incrementalAmt.value : '' }))
            var setDate = $("<td>").append($("<small>", { text: info.sDate ? info.sDate.name + (info.sDate.value ? moment(info.sDate.value, 'YYYYMMDD').format('YYYY/MM/DD') : '') : '' }))
            var preCouDate = $("<td>").append($("<small>", { text: info.preCouDate ? info.preCouDate.name + (info.preCouDate.value ? moment(info.preCouDate.value, 'YYYYMMDD').format('YYYY/MM/DD') : '') : '' }))
            var transFee = $("<td>").append($("<small>", { text: info.txn ? info.txn.name + $._format.percentage(info.txn.value, 2) : '' }))
            var minTransFeeAmount = $("<td>").append($("<small>", { text: info.minTxnAmount ? info.minTxnAmount.name + info.minTxnAmount.value : '' }))
            var transFeeSell = $("<td>").append($("<small>", { text: info.txnSell ? info.txnSell.name + $._format.percentage(info.txnSell.value, 2) : '' }))
            var minTransFeeAmountSell = $("<td>").append($("<small>", { text: info.minTxnAmountSell ? info.minTxnAmountSell.name + info.minTxnAmountSell.value : '' }))


            var maxSellTd = $("<td>").append($("<small>", { text: info.availableQuantity ? info.availableQuantity.name + info.availableQuantity.value : '' }))
            var trs = getInfo([priceTd, curTd, couRt, couPF, minAmt, incAmt, setDate, preCouDate, transFee, minTransFeeAmount, transFeeSell, minTransFeeAmountSell, maxSellTd, miniInitSubAmount, miniHoldingAmount])
            var t = $('<table>', { class: "table table-condensed" })
            for (var i = 0; i < trs.length; i++) {
                t.append(trs[i])
            }
            bondInfo.append(t)
        })
    }


    function showBondTable(data, options) {
        if (!data) return
        options = options || {}
        bondListDatatable.clear()
        for (var i = 0; i < data.length; i++) {
            if (!data || !data[0]) continue
            var item = data[i]
            var symbol = item[0].toLowerCase()
            var availableQuantity = GetMaxSellSync(item[0])
            var symbolName = item.symbolName.toLowerCase()
            if (options.query && symbol.indexOf(options.query) < 0 && symbolName.indexOf(options.query) < 0) continue
            if (options.hasPosition && Number(availableQuantity) <= 0) continue
            if (typeof item.oriCouponRate === 'undefined') {
                item.oriCouponRate = item.couponRate
            }
            if (item.oriCouponRate) {
                item.couponRate = $._format.pattern(item.oriCouponRate * 100, '#,##0.########') + '%'
            }
            bondListDatatable.UpdateRowData(data[i])
        }
        bondListDatatable.draw()
        $(document).translate()
        $('#daily-quote-table tbody').find('.copyprice').click(function (e) {
            var symbol = e.target.innerText
            $("#ticket-input-symbol-code").val(symbol).trigger('blur')
        })
    }
    function initBondDaily() {
        var bindDailyTable = $('#daily-quote-table')
        bondListDatatable = bindDailyTable.CreateDatatable({
            columnSchema: bondDailyList,
            searching: true,
            order: [0, 'asc'],
            buttons: [
                {
                    extend: 'print',
                    exportOptions: {
                        columns: function (idx, data, node) {
                            return idx > 1
                        },
                    },
                    className: 'btn-print'
                }
            ],
            columnDefs: [
                { className: "copyprice", "targets": [0] }
            ]
        })
        bindDailyTable.on( 'click', 'td' ,function (e) {
            if ( $(this).hasClass('copyprice') ) {
                var symbol = e.currentTarget.innerText
                $("#ticket-input-symbol-code").val(symbol).trigger('blur')
            }
        } )
        var table_container = $(bondListDatatable.table().container())
        var buttons_container = bondListDatatable.buttons().container()
        buttons_container.addClass('pull-right')
        buttons_container.find('a span').remove()
        buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
        buttons_container.appendTo(table_container.find('.dataTables_filter label'))
    }

    function getBondData(callback) {
        if (bondData) return callback(bondData)
        $.get('/iTrader/Bond?dailyBondList=1', function (data) {
            bondData = data
            callback(data)
        })
    }

    function showBondTable(data, options) {
        if (!data) return
        options = options || {}
        bondListDatatable.clear()
        for (var i = 0; i < data.length; i++) {
            var item = data[i]
            if (!item || !item[0]) continue
            item.DT_RowId = 'bond-' + item[0]
            if (item[30]) {
                item.symbolName += ' (' + item[30] + ')'
            }
            if (item[20] && ExchangeMgr.exchange_flag[item[20]]) {
                item[0] = "<i class='flag-icon {0}' style='margin-right:5px;'></i>{1}".format(ExchangeMgr.exchange_flag[item[20]], item[0])
            }
            if (item.offeringDocLink) {
                item.offeringDocLink = "<a href='{0}' target='_blank'><i class='fa fa-link'></i>{1}</a>".format(item.offeringDocLink, messages.column_offering_document_link.text)
            }
            if (typeof item.oriCouponRate === 'undefined') {
                item.oriCouponRate = item.couponRate
            }
            if (item.oriCouponRate) {
                item.couponRate = $._format.pattern(item.oriCouponRate * 100, '#,##0.########') + '%'
            }
            bondListDatatable.UpdateRowData(data[i])
        }
        bondListDatatable.draw()
        $(document).translate()
    }

    function getSymbol(symbolCode, callback) {
        if (symbolCode) {
            if (bondList[symbolCode]) {
                callback(bondList[symbolCode])
            } else {
                $.get('/iTrader/product?symbol=' + symbolCode, function (result) {
                    var data = result.data
                    if (data) {
                        bondList[symbolCode] = data
                        callback(data)
                    } else {
                        callback()
                    }
                })
            }
        } else {
            callback()
        }
    }

    function getInfo(list) {
        if (!list) return
        var trs = [$("<tr>")]
        for (var i = 0; i < list.length; i++) {
            var last = $(trs[trs.length - 1])
            if (last.find('td').length < 3) {
                if (list[i].text()) {
                    last.append(list[i])
                }
            } else {
                var tr = $("<tr>")
                if (list[i].text()) {
                    tr.append(list[i])
                }
                trs.push(tr)
            }
        }
        if (tr && list.length % 3 !== 0) {   // append empty td element
            for (var i = 0; i < 3 - (list.length % 3); i++) {
                tr.append("<td></td>")
            }
        }
        return trs
    }

    function initBondBuy() {
        validateForm(bondBuyForm, {
            submitHandler: function (form) {
                var symbolCode = $(form).find('.symbol-code').val()
                if (!symbolCode || !bondList[symbolCode]) return
                popupBondDisclaimer(function (res) {
                    if (res) {
                        Ticket.submitCalcorder($(form).serialize() + '&account=' + AccountMgr.current_account, {
                            confirmBoxTitle: messages.order_confirmation_bond_title.text,
                        })
                    }
                })
            }
        })
    }

    function initBondSell() {
        validateForm(bondSellForm, {
            submitHandler: function (form) {
                var symbolCode = $(form).find('.symbol-code').val()
                if (!symbolCode || !bondList[symbolCode]) return
                popupBondDisclaimer(function (res) {
                    if (res) {
                        Ticket.addNewPendSymbol($(form).serialize() + '&account=' + AccountMgr.current_account)
                    }
                })
            }
        })
    }

    function submitOrder(btnside) {
        var formline = $('.form-trade')
        // var side = formline.find('input[name=side]').val()
        var side = btnside
        var data = ''
        var disclosureCheckBox = ''
        var symbol = formline.find('.symbol-code').val()
        var amount = formline.find('.bond-input-quantity').val()
        data = 'symbol=' + symbol + '&quantity=' + amount + '&_csrf=' + _csrf + '&side=' + side
        var orderType = 10
        if ($('#bond-disclosure-panel').length > 0) {
            disclosureCheckBox = FullTrade.getDiscolsureCheckBox(orderType)
        }
        popupBondDisclaimer(function (res) {
            if (res) {
                Ticket.submitCalcorder(data, {
                    confirmBoxTitle: messages.order_confirmation_bond_title.text,
                })
            } else {
                handleAfterSubmitCalc()
            }
        })
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

    function handleAfterSubmitCalc() {
        if (initial_data.ticket.clearAfterSubmit) {
            resetForm()
        }
    }

    exports.init = init
})

