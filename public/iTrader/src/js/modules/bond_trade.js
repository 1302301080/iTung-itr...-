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

{ $Id: bond_trade.js,v 1.10 2018/01/19 10:00:23 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    require('datatables')
    var BondPosition = require('bond-position')
    var Ticket = require('ticket')
    var BbondTicket = require('bond-ticket')
    var FullTrade = require('full-trade')
    var isMobile = require('mobile').GetIsMobile()
    var BONDQUANTITYFORMAT = initial_data.format.bond_unit
    var bondBuyForm
    var bondSellForm
    var ticketTable
    var bondListDatatable
    var container
    var bondList = {}  // in object, full symbol info, by getSymbol function one by one
    var bondData  // in array, simple symbol info
    var currentTab = 0  // 0: buy  1: sell
    var currentTradeContainer
    var hasProductBack
    var bondSubmitBtn
    var _csrf = $('input[name=_csrf]').val()
    var inputSymbol = $('.symbol-code')

    var bondListSchema = [
        { name: '#', key: 'rowIndex', class: 'prevent-popup-detail' },
        { name: 'symbol', key: '0', i18n: 'bond_symbol_code' },
        { name: 'symbol name', key: 'symbolName', i18n: 'bond_name' },
        { name: 'currency', key: '23', i18n: 'column_currency' },
        { name: 'couponRate', key: 'couponRate', i18n: 'column_coupon_rate', class: 'text-right' },
        { name: 'risk', key: 'RPQLevel', i18n: 'column_risk_level', class: 'text-right' },
        { name: 'cies', key: 'CIESFlag', i18n: 'column_CIES' },
        { name: 'available quantity', key: 'availableQuantity', i18n: 'column_available_quantity', class: 'text-right' }
    ]
    if (initial_data.views.full_trade && initial_data.views.full_trade.bond && initial_data.views.full_trade.bond.listSchema) {
        bondListSchema = initial_data.views.full_trade.bond.listSchema
    }

    var pendBondColumn = [
        { name: 'remove', key: 'remove', type: 'icon', 'class': 'text-center pointer' },
        { name: 'symbol', key: '0', text: messages.bond_symbol_code.text, class: 'pointer' },
        { name: 'symbol name', key: 'symbolName', text: messages.bond_name.text, mobile: false },
        { name: 'price', key: '3', type: 'input', text: messages.bond_priceRate.text, class: 'text-right full-trade-input' },
        { name: 'quantity', key: '4', type: 'input', text: messages.bond_PAR.text, class: 'text-right full-trade-input' },
        { name: 'currency', key: '23', text: messages.column_currency.text },
    ]

    var confirmBondColumn = [
        { name: 'symbol', key: '0', text: messages.bond_symbol_code.text, class: 'pointer' },
        { name: 'symbol name', key: 'symbolName', text: messages.bond_name.text, mobile: false },
        { name: 'price', key: '3', text: messages.bond_priceRate.text, class: 'text-right' },
        { name: 'quantity', key: '4', text: messages.bond_PAR.text, class: 'text-right' },
        { name: 'currency', key: '23', text: messages.column_currency.text },
    ]

    var resultBondColumn = [
        { name: 'symbol', key: '0', text: messages.bond_symbol_code.text, class: 'pointer' },
        { name: 'symbol name', key: 'symbolName', text: messages.bond_name.text, mobile: false },
        { name: 'price', key: '3', text: messages.bond_priceRate.text, class: 'text-right' },
        { name: 'quantity', key: '4', text: messages.bond_PAR.text, class: 'text-right' },
        { name: 'currency', key: '23', text: messages.column_currency.text },
        { name: 'remark', key: '25', text: messages.column_remark.text }
    ]


    $(document).on('page', function (event, data) {
        if (data === 'shown' && bondListDatatable) {
            bondListDatatable.draw()
        }
    })
    function init(c, s) {
        LoadDisclosurePage()
        container = c
        BondPosition.init($('#tab-bond-position'), s)
        bondBuyForm = $('#bond-buy-form')
        bondSellForm = $('#bond-sell-form')
        bondSubmitBtn = $('#bond-select-submit')

        initBondBuy()
        initBondSell()
        initBondTable()

        window.addEventListener('message', function (event) {
            if (event.data && event.data.name === 'copy-symbol') {
                if (event.data.type === 'sell') {
                    $("[href='#tab-bond-sell']").tab('show')
                }
                $(".tab-pane.active .symbol-code").val(event.data.symbol).trigger('blur')
            }
        }, false)
        $('.bond-input-quantity').each(function () {
            $(this)
            $(this).InputFormat({
                format: function (value) {
                    return $._format.pattern(value, BONDQUANTITYFORMAT)
                }
            })
        })
        $('.bond-input-quantity-sell').InputPercentage({
            data: [10, 20, 50, 100, 0],
            total: 0
        })
        inputSymbol.on('input', function () {
            $(this).val($(this).val().toUpperCase())
        })
        inputSymbol.blur(function () {
            hasProductBack = false
            var symbol = $(this).val()
            addBondInfo(symbol)
            $(this).parents('form').find('.bond-input-quantity-sell').attr('data-total', GetMaxSellSync(symbol))
            $(this).parents('form').find('.bond-input-price').focus()
        })
        inputSymbol.keypress(function (e) {
            if (e.keyCode == 13) {
                $(this).trigger('blur')
            }
        })
        $('#bond-disclosure-accept-btn').on('click', function () {
            getBondData(function (data) {
                showBondTable(data)
            })
            var step = Number($(this).parents('[data-id]').attr('data-id')) + 1
            choseStep(step)
        })
        $('[step]').click(function () {
            var step = $(this).attr('step')
            if ($('[step={0}]'.format(step)).hasClass('todo')) return
            choseStep(step)
        })
        $('#search-bond-btn').click(function () {
            var symbol = $('#bond-search').val().toLowerCase().trim()
            searchSymbol(symbol)
        })
        $('#bond-search').keypress(function (e) {
            var symbol = $('#bond-search').val().toLowerCase().trim()
            if (e.keyCode == 13) {
                searchSymbol(symbol)
            }
        })
        bondSubmitBtn.click(function () {
            var value = $('.symbol-code').val
            var tr = $($('.tab-pane.active')[0]).find('.pending-submit-table tr')
            if (tr.length <= 1) return
            for (var i = 1; i < tr.length; i++) {
                var input = $(tr[i]).find('input')
                for (var n = 0; n < input.length; n++) {
                    var value = $(input[n]).val()
                    if (!value || input.attr('disabled') !== "disabled") {
                        $(input[n]).val('')
                        $(input[n]).focus()
                        return
                    }
                }
            }
            submitOrder()
        })

        currentTradeContainer = $('.tab-pane.active')
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var href = $(e.target).attr('href')
            if (href == '#tab-bond-sell') {
                currentTab = 1
                bondSubmitBtn.attr('class', 'btn btn-sm btn-danger pull-right')
            } else {
                currentTab = 0
                bondSubmitBtn.attr('class', 'btn btn-sm btn-success pull-right')
            }
            currentTradeContainer = $('.tab-pane.active')
        })

        $('input:radio[name="bond-order-action"]').change(function (e) {
            var selectedBondList = $(".selected-bond-list")
            selectedBondList.empty()
            $('#bond-table input').attr('checked', false)

            if ($(e.target).attr('value') == 'sell') {
                showBondTable(bondData, { hasPosition: true })
            } else {
                showBondTable(bondData)
            }
        })

        $('#bond-next-btn').click(function () {
            var type = container.find('input[name="bond-order-action"]:checked ').val()
            if (type == 'sell') {
                $('[href=#tab-bond-sell]').tab('show')
            } else {
                $('[href=#tab-bond-buy]').tab('show')
            }
            var symbolList = []
            var elements = $(".selected-bond-list [data-symbol]")
            for (var i = 0; i < elements.length; i++) {
                var e = $(elements[i])
                var symbol = e.attr('data-symbol')
                var symbolObj = getSimpleSymbolSync(symbol) || {}
                symbolList.push({
                    0: symbol,
                    3: isPriceQuote('BOND') ? '0.00' : undefined,
                    23: symbolObj[23],
                    symbolName: FullTrade.getFullSymbolName(symbolObj)
                })
            }
            var step = Number($(this).parents('[data-id]').attr('data-id')) + 1
            FullTrade.addNewPendSymbol(symbolList, pendBondColumn, { newRowHandler: newPendRowHandler, clear: true })
            choseStep(step)
        })

        container.find('.btn-submit').click(function () {
            var symbol = currentTradeContainer.find('.symbol-code').val()
            if (symbol && getSimpleSymbolSync(symbol)) {
                var symbolObj = getSimpleSymbolSync(symbol)
                FullTrade.addNewPendSymbol([{
                    0: symbolObj[0],
                    3: currentTradeContainer.find('.bond-input-price').val(),
                    4: currentTradeContainer.find('.bond-input-quantity').val(),
                    23: symbolObj[23],
                    symbolName: FullTrade.getFullSymbolName(symbolObj)
                }], pendBondColumn, { newRowHandler: newPendRowHandler })
            }
        })

        ExchangeMgr.on(function () {
            if (isPriceQuote('BOND')) {
                container.find('.bond-input-price').attr('disabled', 'disabled').val('0.00')
            }
        })

        $(document).translate()
    }

    function newPendRowHandler(tr) {
        var inputSymbol = currentTradeContainer.find('.symbol-code')
        if (!inputSymbol.val()) {
            inputSymbol.val(tr.attr('data-symbol')).trigger('blur')
        }
        tr.find('[data-key=0]').click(function () {
            inputSymbol.val($(this).parents('tr').attr('data-symbol')).trigger('blur')
        })
        tr.find('[data-key=4]').InputFormat({
            format: function (value) {
                return $._format.pattern(value, BONDQUANTITYFORMAT)
            }
        })
    }

    function submitOrder() {
        var tab = $('.tab-pane.active')
        var table = tab.find('.pending-submit-table')
        var side = tab.find('input[name=side]').val()
        var tr = table.find('tr')
        var data = ''
        var disclosureCheckBox = ''
        for (var i = 1; i < tr.length; i++) {
            var td = $(tr[i]).find('td')
            var symbol = $(td[1]).text()
            var price = $($(td[3]).find('input')).val()
            var amount = $($(td[4]).find('input')).val()
            data += 'symbol=' + symbol + '&price=' + price + '&quantity=' + amount + '&'
        }
        data = data + '_csrf=' + _csrf + '&type=multi' + '&side=' + side + '&productType=bond' + '&cmd=add'
        var orderType = 10
        if ($('#bond-disclosure-panel').length > 0) {
            disclosureCheckBox = FullTrade.getDiscolsureCheckBox(orderType)
        }
        BbondTicket.popupBondDisclaimer(function (res) {
            if (res) {
                Ticket.submitCalcorder(data, {
                    confirmBoxTitle: messages.order_confirmation_bond_title.text,
                    addOrder: function () {
                        showMessage({
                            title: messages.order_confirmation_bond_title.text,
                            buttonNameList: ['submit', 'close'],
                            message: getOrderConfirmContent() + disclosureCheckBox,
                            onshown: function () {
                                FullTrade.checkboxAction()
                            },
                            callback: function (button, dialog) {
                                var btnID = button.attr('id')
                                if (btnID === 'btn-submit') {
                                    $.ajax({
                                        type: 'post',
                                        url: '/iTrader/order/submit',
                                        data: data,
                                        success: function (result) {
                                            alertMessage({
                                                title: messages.dialog_information_title.text,
                                                message: getOrderResultContent(result)
                                            })
                                        },
                                    })
                                }
                                dialog.close()
                                handleAfterSubmitCalc()
                            }
                        })
                    }
                })
            } else {
                handleAfterSubmitCalc()
            }
        })
    }

    function handleAfterSubmitCalc() {
        if (initial_data.ticket.clearAfterSubmit) {
            resetForm()
        }
    }

    function resetForm() {
    }

    function initStepBar(disclosure) {
        var data = ['bond_step_disclosure', 'bond_step_select_bond', 'bond_step_trade_bond']
        if (!disclosure) {
            data = ['bond_step_select_bond', 'bond_step_trade_bond']
        }
        for (var i = 0; i < data.length; i++) {
            var div1 = $('<div>', { class: 'wrap' })
            var div2
            if (i == 0) {
                div2 = $('<div>', { class: 'current', step: i + 1 })
            } else {
                div2 = $('<div>', { class: 'todo', step: i + 1 })
            }
            div2.append($('<label>').append($('<span>', { class: 'round', text: i + 1 })).append($('<span>', { 'data-i18n': data[i] })))
                .append($('<i>', { class: 'triangle-right-bg' }))
                .append($('<i>', { class: 'triangle-right' }))
            div1.append(div2)
            $('.bond-workFlow').append(div1).translate()
        }
    }

    function choseStep(step) {
        for (var i = 1; i <= $('[step]').length; i++) {
            var divIndex = '[data-id ={0}]'.format(i)
            var index = '[step={0}]'.format(i)
            if (i != step) {
                if (i < step) {
                    $(index).attr('class', 'finished')
                } else {
                    $(index).attr('class', 'todo')
                }
                $(divIndex).addClass('hidden')
            } else {
                $(divIndex).removeClass('hidden')
                $(index).attr('class', 'current')
            }
            if ($(index).hasClass('finished')) {
                $(index).find('.round').html("<i class='sui-icon icon-pc-right'></i>")
            } else {
                $(index).find('.round').html("<i>{0}</i>".format(i))
            }
        }
    }

    function initBondTable() {
        ticketTable = $('#bond-table')
        bondListDatatable = ticketTable.CreateDatatable({
            columnSchema: bondListSchema,
            searching: false,
            paging: false,
            scrollCollapse: true,
            scrollY: isMobile ? false : '400px',
            order: [1, 'asc'],
            aoColumnDefs: [
                { "bSortable": false, "aTargets": [0] }
            ]
        })
    }

    function getBondData(callback) {
        if (bondData) return callback(bondData)
        $.get('/iTrader/Bond', function (data) {
            bondData = data
            callback(data)
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
            item.rowIndex = "<input type='checkbox' data-symbol='{0}' data-symbolName = '{1}'>".format(item[0], symbolName)
            item.availableQuantity = $._format.pattern(availableQuantity, BONDQUANTITYFORMAT)
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
        $('#bond-table input').change(function () {
            if ($(this).get(0).checked) {
                var symbolNo = $(this).attr('data-symbol')
                var symbolName = $(this).attr('data-symbolName')
                var aItem = $('<a>', { class: 'symbol-code-tag', text: symbolNo, title: symbolName, 'data-symbol': symbolNo }).append($('<i>', { class: 'fa fa-times icon-btn-x' }))
                $('.selected-bond-list').append(aItem)
                aItem.find('i').click(function () {
                    var symbolNo = $(this).parent().attr('data-symbol')
                    $('#bond-table input[data-symbol={0}]'.format(symbolNo)).attr('checked', false)
                    $(this).parent().remove()
                })
            } else {
                var symbolNo = $(this).attr('data-symbol')
                $('.selected-bond-list a[data-symbol={0}]'.format(symbolNo)).remove()
            }
        })
    }

    function initBondBuy() {
        validateForm(bondBuyForm, {
            submitHandler: function (form) {
                var symbolCode = $(form).find('.symbol-code').val()
                if (!symbolCode || !bondList[symbolCode]) return
                BbondTicket.popupBondDisclaimer(function (res) {
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
                BbondTicket.popupBondDisclaimer(function (res) {
                    if (res) {
                        Ticket.addNewPendSymbol($(form).serialize() + '&account=' + AccountMgr.current_account)
                    }
                })
            }
        })
    }

    function searchSymbol(query) {
        if (query) {
            showBondTable(bondData, { query: query })
        } else {
            showBondTable(bondData)
        }
        $('.selected-bond-list [data-symbol]').each(function () {
            var symbolNo = $(this).attr('data-symbol')
            $('#bond-table input[data-symbol={0}]'.format(symbolNo)).attr('checked', true)
        })
    }

    function LoadDisclosurePage() {
        $.get('/iTrader/bond/disclaimer?type=disclosure&temp=' + new Date().getTime(), function (data) {
            var url
            if (data && data.url) {
                url = getMultiLanguageURL(data)
                $('#bond-disclosure-panel').attr('data-id', '1')
                $('#bond-list-panel').attr('data-id', '2')
                $('#bond-trade-panel').attr('data-id', '3')
                initStepBar(url)
                $.get(url, function (data) {
                    $('#bond-disclosure-content-div').html(data)
                })
            } else {
                $('#bond-list-panel').attr('data-id', '1')
                $('#bond-trade-panel').attr('data-id', '2')
                $('#bond-list-panel').removeClass('hidden')
                initStepBar(url)
            }
            $('[step]').click(function () {
                var step = $(this).attr('step')
                if ($('[step={0}]'.format(step)).hasClass('todo')) return
                choseStep(step)
            })
        })
    }

    function addBondInfo(symbolCode) {
        if (!symbolCode) return
        getSymbol(symbolCode, function (productObj) {
            if (hasProductBack) return
            hasProductBack = true
            if (!IsOTCBond(productObj)) {
                productObj = null
            }
            var array = []
            var bondInfo = $('.tab-pane.active').find('.bond-info')
            bondInfo.empty()
            if (!productObj) {
                bondInfo.append($("<h4>", { text: messages.ticket_message_invalid_symbol.text }))
                return
            }
            var title = $("<h4>", { text: productObj.symbolName })
            if (productObj["3409"]) {
                title.append($("<i>", { text: "Risk " + productObj["3409"], class: "highlight-tag", style: "margin-left: 10px;" }))
            } if (productObj["3602"] == 'Y') {
                title.append($("<i>", { text: "CIES ", class: "highlight-tag", style: "margin-left: 10px;" }))
            }
            bondInfo.append(title)
            var side = $('.active [href=#tab-bond-sell]').length > 0 ? 1 : 0
            var info = BbondTicket.getBondInfo(productObj, { side: side })
            var priceTd = $("<td>").append($("<small>", { text: info.price ? info.price.name + info.price.value : '' }))
            var curTd = $("<td>").append($("<small>", { text: info.currency ? info.currency.name + info.currency.value : '' }))
            var couRt = $("<td>").append($("<small>", { text: info.cRate ? info.cRate.name + info.cRate.value : '' }))
            var minAmt = $("<td>").append($("<small>", { text: info.minAmt ? info.minAmt.name + info.minAmt.value : '' }))
            var incAmt = $("<td>").append($("<small>", { text: info.incrementalAmt ? info.incrementalAmt.name + info.incrementalAmt.value : '' }))
            var setDate = $("<td>").append($("<small>", { text: info.sDate ? info.sDate.name + (info.sDate.value ? moment(info.sDate.value, 'YYYYMMDD').format('YYYY/MM/DD') : '') : '' }))
            var preCouDate = $("<td>").append($("<small>", { text: info.preCouDate ? info.preCouDate.name + (info.preCouDate.value ? moment(info.preCouDate.value, 'YYYYMMDD').format('YYYY/MM/DD') : '') : '' }))
            var transFee = $("<td>").append($("<small>", { text: info.txn ? info.txn.name + $._format.percentage(info.txn.value, 2) : '' }))
            var minTransFeeAmount = $("<td>").append($("<small>", { text: info.minTxnAmount ? info.minTxnAmount.name + $._format.amount(info.minTxnAmount.value) : '' }))
            var maxSellTd = $("<td>").append($("<small>", { text: info.availableQuantity ? info.availableQuantity.name + info.availableQuantity.value : '' }))
            var trs = FullTrade.getInfo([priceTd, curTd, couRt, minAmt, incAmt, setDate, preCouDate, transFee, minTransFeeAmount, maxSellTd])
            var t = $('<table>', { class: "table table-condensed" })
            for (var i = 0; i < trs.length; i++) {
                t.append(trs[i])
            }
            bondInfo.append(t)
        })
    }

    function getOrderConfirmContent() {
        var data = []
        var rows = currentTradeContainer.find('.pending-submit-table tr[data-symbol]')
        for (var i = 0; i < rows.length; i++) {
            var symbol = $(rows[i]).attr('data-symbol')
            if (symbol) {
                var symbolObj = getSimpleSymbolSync(symbol)
                data.push({
                    0: symbol,
                    23: symbolObj[23],
                    3: $(rows[i]).find('[data-key=3]').val(),
                    4: $(rows[i]).find('[data-key=4]').val(),
                    symbolName: symbolObj.symbolName,
                })
            }
        }
        var div = FullTrade.createTable(data, confirmBondColumn, { side: currentTab == 1 ? 1 : 0 })
        if (div) {
            div.find('table').addClass('dialog-table')
            return div.html()
        }
        return ''
    }

    function getOrderResultContent(data) {
        if (!data) return
        var list = (IsArray(data.error) ? data.error : []).concat(IsArray(data.data) ? data.data : [])
        var orderSide = 0
        for (var i = 0; i < list.length; i++) {
            var item = list[i]
            var symbolObj = getSimpleSymbolSync(item[0]) || {}
            var icon = "<i class='fa fa-check-circle text-success' style='margin-right:5px;'></i>"
            if (item._isErrorOrder) {
                icon = "<i class='fa fa-times-circle text-danger' style='margin-right:5px;' title='{0}'></i>".format((getErrorMessage(item) || '').replace("<br />", ""))
            }
            item[0] = icon + item[0]
            item[23] = item[23] || symbolObj[23] || ''
            item[3] = $._format.pattern(item[3] * (symbolObj[1504] || 1), '#,##0.00######')
            item[4] = $._format.pattern(item[4], BONDQUANTITYFORMAT)
            item.symbolName = symbolObj.symbolName || ''
            if (item[11] == 1 || item[11] == 5) {
                orderSide = 1
            }
        }
        var div = FullTrade.createTable(list, resultBondColumn, { side: orderSide })
        if (div) {
            div.find('table').addClass('dialog-table')
            return div.html()
        }
        return ''
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

    function getSimpleSymbolSync(symbolCode) {
        if (symbolCode && bondData) {
            for (var i = 0; i < bondData.length; i++) {
                if (bondData[i][0] === symbolCode) return bondData[i]
            }
        }
    }

    function isPriceQuote(exchange) {
        if (exchange) {
            for (var p in ExchangeMgr.exchange_isPriceQuote) {
                if (p === exchange && ExchangeMgr.exchange_isPriceQuote[p]) return true
            }
        }
    }


    exports.init = init
})

