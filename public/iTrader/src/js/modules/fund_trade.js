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

{ $Id: fund_trade.js,v 1.15 2018/01/19 10:00:23 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'fund_trade'
    var Ticket = require('ticket')
    var FundTicket = require('fund-ticket')
    var FundPosition = require('fund-position')
    var FundBook = require('fundbook')
    var FullTrade = require('full-trade')
    var isMobile = require('mobile').GetIsMobile()
    var FUNDAMOUNTFORMAT = '#,##0.00######'  // for handle input amount case
    var FUNDUNITFORMAT = initial_data.format.fund_unit
    var fundAlert
    var switchStep
    var container
    var fundList = {}   //in object, full symbol inf, by getSymbol function one by oneo
    var fundData   // in array, simple symbol info
    var currentTab = 0   // 0: subscribe  1: redeem  2: switch
    var currentTradeContainer
    var switchInTable
    var switchOutTable
    var switchInDatatable
    var switchOutDatatable
    var fundListDatatable
    var subscribeForm
    var redeemForm
    var fundSubmitBtn
    var addIcon = "<a href='javascript:void(0)'><i class='fa fa-lg fa-plus-circle text-info table-row-add'></i></a>"
    var removeIcon = "<a href='javascript:void(0)'><i class='fa fa-lg fa-remove text-danger table-row-remove'></i></a>"
    var hasProductBack   // input invalid symbol, then input valid symbol, fund info change twice
    var waitingInputSymbolCode
    var _csrf = $('input[name=_csrf]').val()
    var inputAmount = $("#input-amount")
    var inputUnit = $("#input-unit")
    var inputSymbol = $('.symbol-code')
    var switchInSchema = [
        { name: '#', key: 'rowIndex' },
        { name: 'symbol', key: '0', i18n: 'fund_switch_in_symbol' },
        { name: 'symbol name', key: 'symbolName', i18n: 'fund_name', class: 'symbol-name', mobile: false },
        { name: 'currency', key: '23', class: "symbol-currency", i18n: 'column_currency' },
        { name: 'temp', key: '', i18n: '', class: '' },
        { name: 'allocation', key: 'allocation', i18n: 'fund_switch_in_allocation', class: 'subscription-amount', headClass: 'bubble-title', headTitle: messages.fund_msg_allocation.text },
        { name: 'remove', key: 'removeIcon' }
    ]
    var switchOutSchema = [
        { name: '#', key: 'rowIndex' },
        { name: 'symbol', key: '0', i18n: 'fund_switch_out_symbol' },
        { name: 'symbol name', key: 'symbolName', i18n: 'fund_name', class: 'symbol-name', mobile: false },
        { name: 'currency', key: '23', class: "symbol-currency", i18n: 'column_currency' },
        { name: 'available unit', key: 'availableUnit', i18n: 'column_available_unit', class: 'available-unit' },
        { name: 'unit', key: '4', i18n: 'fund_redeem_unit', class: 'redeem-unit overflow-visible', },
        { name: 'remove', key: 'removeIcon' }
    ]

    var fundListSchema = [
        { name: '#', key: 'rowIndex', class: 'prevent-popup-detail' },
        { name: 'symbol', key: '0', i18n: 'fund_symbol_code' },
        { name: 'symbol name', key: 'symbolName', i18n: 'fund_name' },
        { name: 'nav', key: 'nav', i18n: 'column_fund_nav', class: 'text-right' },
        { name: 'currency', key: '23', i18n: 'column_currency' },
        { name: 'risk', key: 'RPQLevel', i18n: 'column_risk_level', class: 'text-right' },
        { name: 'cies', key: 'CIESFlag', i18n: 'column_CIES' },
        { name: 'position', key: 'availableQuantity', i18n: 'column_available_unit', class: 'text-right' }
    ]
    if (initial_data.views.full_trade && initial_data.views.full_trade.fund && initial_data.views.full_trade.fund.listSchema) {
        fundListSchema = initial_data.views.full_trade.fund.listSchema
    }

    var pendFundSubSchema = [
        { name: 'remove', key: 'remove', type: 'icon', class: 'text-center pointer' },
        { name: 'symbol', key: '0', text: messages.fund_symbol_code.text, class: 'pointer' },
        { name: 'symbol name', key: 'symbolName', text: messages.fund_name.text, mobile: false },
        { name: 'input amount', key: 'amount', type: 'input', text: messages.column_subscription_amount.text, class: 'text-right full-trade-input' },
        { name: 'currency', key: '23', text: messages.column_currency.text },
    ]

    var pendFundRemSchema = [
        { name: 'remove', key: 'remove', type: 'icon', class: 'text-center pointer' },
        { name: 'symbol', key: '0', text: messages.fund_symbol_code.text, class: 'pointer' },
        { name: 'symbol name', key: 'symbolName', text: messages.fund_name.text, mobile: false },
        { name: 'input unit', key: 'unit', type: 'input', text: messages.fund_redeem_unit.text, class: 'text-right full-trade-input' },
        { name: 'currency', key: '23', text: messages.column_currency.text },
    ]

    var confirmFundSubSchema = [
        { name: 'symbol', key: '0', text: messages.fund_symbol_code.text },
        { name: 'symbol name', key: 'symbolName', text: messages.fund_name.text, mobile: false },
        { name: 'input amount', key: 'amount', text: messages.column_subscription_amount.text, class: 'text-right' },
        { name: 'currency', key: '23', text: messages.column_currency.text },
    ]

    var confirmFundRemSchema = [
        { name: 'symbol', key: '0', text: messages.fund_symbol_code.text },
        { name: 'symbol name', key: 'symbolName', text: messages.fund_name.text, mobile: false },
        { name: 'input unit', key: 'unit', text: messages.fund_redeem_unit.text, class: 'text-right' },
        { name: 'currency', key: '23', text: messages.column_currency.text },
    ]

    var resultFundSubSchema = [
        { name: 'symbol', key: '0', text: messages.fund_symbol_code.text },
        { name: 'symbol name', key: 'symbolName', text: messages.fund_name.text, mobile: false },
        { name: 'input amount', key: 'amount', text: messages.column_subscription_amount.text, class: 'text-right' },
        { name: 'currency', key: '23', text: messages.column_currency.text },
        { name: 'remark', key: '25', text: messages.column_remark.text }
    ]

    var resultFundRemSchema = [
        { name: 'symbol', key: '0', text: messages.fund_symbol_code.text },
        { name: 'symbol name', key: 'symbolName', text: messages.fund_name.text, mobile: false },
        { name: 'input unit', key: 'unit', text: messages.fund_redeem_unit.text, class: 'text-right' },
        { name: 'currency', key: '23', text: messages.column_currency.text },
        { name: 'remark', key: '25', text: messages.column_remark.text }
    ]

    $(document).on('page', function (event, data) {
        if (data === 'shown' && fundListDatatable) {
            fundListDatatable.draw()
        }
    })

    function init(c, s) {
        LoadDisclosurePage()
        container = c
        FundPosition.init($('#tab-fund-position'), s)

        // switch fund
        switchInTable = $('#fund-switch-in-table')
        switchOutTable = $('#fund-switch-out-table')
        subscribeForm = $('#fund-subscribe-form')
        redeemForm = $('#fund-redeem-form')
        fundSubmitBtn = $('#fund-select-submit')
        fundAlert = $('.alert-info')
        currentTradeContainer = $('.tab-pane.active')
        initFundSubscribe()
        initFundRedeem()
        initFundSwitch()
        intiFundTable()

        window.addEventListener('message', function (event) {
            if (event.data && event.data.name === 'copy-symbol') {
                if (event.data.type === 'sell') {
                    $("[href='#tab-fund-redeem']").tab('show')
                }
                if (waitingInputSymbolCode && waitingInputSymbolCode.length > 0) {
                    waitingInputSymbolCode.val(event.data.symbol).trigger('blur')
                } else {
                    $(".tab-pane.active .symbol-code").val(event.data.symbol).trigger('blur')
                }
            }
        }, false)

        inputAmount.InputFormat({
            format: function (value) {
                return $._format.pattern(value, FUNDAMOUNTFORMAT)
            }
        })
        inputUnit.InputFormat({
            format: function (value) {
                return $._format.pattern(value, FUNDUNITFORMAT)
            }
        })
        inputUnit.InputPercentage({
            data: [10, 20, 50, 100, 0],
            total: 0
        })
        inputSymbol.on('input', function () {
            $(this).val($(this).val().toUpperCase())
        })
        inputSymbol.blur(function () {
            hasProductBack = false
            var symbol = $(this).val()
            addFundInfo(symbol)
            if (currentTab == 0) {
                inputAmount.focus()
            } else if (currentTab == 1) {
                inputUnit.focus()
                currentTradeContainer.find('.dropdown-input-percentage').attr('data-total', GetMaxSellSync(symbol) || 0)
            }
        })
        inputSymbol.keypress(function (e) {
            if (e.keyCode == 13) {
                $(this).trigger('blur')
            }
        })
        $('#fund-disclosure-accept-btn').on('click', function () {
            getFundData(function (data) {
                showFundTable(data)
            })
            var step = Number($(this).parents('[data-id]').attr('data-id')) + 1
            choseStep(step)
        })

        $('#search-fund-btn').click(function () {
            var symbol = $('#fund-search').val().toLowerCase().trim()
            searchSymbol(symbol)
        })
        $('#fund-search').keypress(function (e) {
            var symbol = $('#fund-search').val().toLowerCase().trim()
            if (e.keyCode == 13) {
                searchSymbol(symbol)
            }
        })
        container.find('#fund-trade-panel a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var href = $(e.target).attr('href')
            if (href == '#tab-fund-switch') {
                currentTab = 2
                fundSubmitBtn.attr('class', 'btn btn-sm btn-info pull-right')
                appendHoldingFundToSwitchPage()
                currentTradeContainer = $('.tab-pane.active')
            } else if (href == '#tab-fund-redeem') {
                currentTab = 1
                fundSubmitBtn.attr('class', 'btn btn-sm btn-danger pull-right')
                currentTradeContainer = $('.tab-pane.active')
            } else if (href == '#tab-fund-subscribe') {
                currentTab = 0
                fundSubmitBtn.attr('class', 'btn btn-sm btn-success pull-right')
                currentTradeContainer = $('.tab-pane.active')
            }
        })
        container.find('input:radio[name="fund-order-action"]').change(function () {
            fundAlert.addClass('hidden')
            container.find('.selected-fund-list').empty().addClass('hidden')
            container.find('.selected-fund-label').addClass('hidden')
            var value = $(this).val()
            if (value === 'subscribe') {
                container.find('.selected-subscribe-fund-list').removeClass('hidden')
                showFundTable(fundData)
            } else if (value === 'redeem') {
                container.find('.selected-redeem-fund-list').removeClass('hidden')
                showFundTable(fundData, { hasPosition: true })
            } else {
                container.find('.selected-switch-fund-list').removeClass('hidden')
                container.find('.selected-fund-label').removeClass('hidden')
                showFundTable(fundData, { hasPosition: true })
                fundAlert.text(messages.fund_switchout_select.text)
                fundAlert.removeClass('hidden')
                switchStep = 0
            }
        })

        fundSubmitBtn.click(function () {
            var tr = currentTradeContainer.find('.pending-submit-table tr')
            if (tr.length > 0) {
                if (tr.length <= 1) return
                for (var i = 1; i < tr.length; i++) {
                    var input = $(tr[i]).find('input')
                    for (var n = 0; n < input.length; n++) {
                        var value = $(input[n]).val()
                        if (!value || Number(value) == 0) {
                            $(input[n]).val('')
                            $(input[n]).focus()
                            return
                        }
                    }
                }
                submitOrder()
            } else {
                switchConfirm()
            }
        })

        OrderMgr.on(function () {
            $('#fund-switch-out-table .symbol-code').trigger('blur')
        })
        nextBtnClickHandler()
        $(document).translate()
    }

    function handleAfterSubmitCalc() {
        if (initial_data.ticket.clearAfterSubmit) {
            resetForm()
        }
    }

    function submitOrder() {
        var table = currentTradeContainer.find('.pending-submit-table')
        var side = currentTradeContainer.find('input[name=side]').val()
        var tr = table.find('tr')
        var data = ''
        var disclaimer = ''
        for (var i = 1; i < tr.length; i++) {
            var td = $(tr[i]).find('td')
            if (td.length < 3) continue
            var symbol = $(td[1]).text()
            var qty = $($(td[3]).find('input')).val()
            if (side == 0) {
                data += 'symbol={0}&price={1}&quantity={2}&'.format(symbol, qty, 1)
            } else {
                data += 'symbol={0}&price={1}&quantity={2}&'.format(symbol, 1, qty)
            }
        }
        data += '_csrf={0}&type=multi&side={1}'.format(_csrf, side)
        var orderType = 10
        if ($('#fund-disclosure-panel').length > 0) {
            disclaimer = FullTrade.getDiscolsureCheckBox(orderType)
        }
        FundTicket.popupFundDisclaimer(function (res) {
            if (res) {
                Ticket.submitCalcorder(data, {
                    confirmBoxTitle: messages.order_confirmation_fund_title.text,
                    addOrder: function () {
                        showMessage({
                            title: messages.order_confirmation_fund_title.text,
                            buttonNameList: ['submit', 'close'],
                            message: getOrderConfirmContent() + disclaimer,
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

    function resetForm() {

    }

    function searchSymbol(query) {
        if (query) {
            showFundTable(fundData, { query: query })
        } else {
            showFundTable(fundData)
        }
        $('.selected-fund-list [data-symbol]').each(function () {
            var symbolNo = $(this).attr('data-symbol')
            $('#fund-table input[data-symbol={0}]'.format(symbolNo)).attr('checked', true)
        })
    }

    function LoadDisclosurePage() {
        $.get('/iTrader/fund/disclaimer?type=disclosure', function (data) {
            var url
            if (data && data.url) {
                url = getMultiLanguageURL(data)
                initStepBar(url)
                $('#fund-disclosure-panel').attr('data-id', '1')
                $('#fund-list-panel').attr('data-id', '2')
                $('#fund-trade-panel').attr('data-id', '3')
                $.get(url, function (data) {
                    $('#fund-disclosure-content-div').html(data)
                })
            } else {
                $('#fund-list-panel').attr('data-id', '1')
                $('#fund-trade-panel').attr('data-id', '2')
                $('#fund-list-panel').removeClass('hidden')
                initStepBar(url)
            }
            $('[step]').click(function (e) {
                var step = $(e.target).attr('step')
                if (!step) return
                if ($('[step={0}]'.format(step)).hasClass('todo')) return
                choseStep(step)
            })
        })
    }

    function initStepBar(disclosure) {
        var data
        if (disclosure) {
            data = ['fund_step_disclosure', 'fund_step_select_fund', 'fund_step_trade_fund']
        } else {
            data = ['fund_step_select_fund', 'fund_step_trade_fund']
        }
        if (data) {
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
                $('.fund-workFlow').append(div1).translate()
            }
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

    function getFundData(callback) {
        if (fundData) return callback(fundData)
        $.get('/iTrader/fund', function (data) {
            fundData = data
            callback(data)
        })
    }

    function nextBtnClickHandler() {
        $('#fund-next-btn').click(function () {
            var type = container.find('input[name="fund-order-action"]:checked ').val()
            var step = Number($(this).parents('[data-id]').attr('data-id')) + 1
            if (type === 'subscribe') {
                $('[href=#tab-fund-subscribe]').tab('show')
                choseStep(step)
                var selectedList = getSelectedSymbol(container.find('.selected-subscribe-fund-list'))
                if (!selectedList || selectedList.length <= 0) return
                FullTrade.addNewPendSymbol(selectedList, pendFundSubSchema, { newRowHandler: newPendRowHandler, clear: true })
            } else if (type === 'redeem') {
                $('[href=#tab-fund-redeem]').tab('show')
                choseStep(step)
                var selectedList = getSelectedSymbol(container.find('.selected-redeem-fund-list'))
                if (!selectedList || selectedList.length <= 0) return
                FullTrade.addNewPendSymbol(selectedList, pendFundRemSchema, { newRowHandler: newPendRowHandler, clear: true })
            } else {
                if (!switchStep) {
                    fundAlert.text(messages.fund_switchin_select.text)
                    fundAlert.removeClass('hidden')
                    showFundTable(fundData)
                    switchStep = 1
                } else {
                    choseStep(step)
                    $('[href=#tab-fund-switch]').tab('show')
                    selectSwitch()
                }
            }
        })
    }

    function getSelectedSymbol(div) {
        if (!div) return
        var symbolList = []
        div.find('[data-symbol]').each(function () {
            var symbol = $(this).attr('data-symbol')
            var symbolObj = getSimpleSymbolSync(symbol) || {}
            symbolList.push({
                0: symbol,
                23: symbolObj[23],
                symbolName: FullTrade.getFullSymbolName(symbolObj)
            })
        })
        return symbolList
    }

    function selectSwitch() {
        var switchOutList = $('.selected-switch-out-fund-list a[data-symbol]')
        var switchInList = $('.selected-switch-in-fund-list a[data-symbol]')
        switchInDatatable.rows().remove().draw()
        switchOutDatatable.rows().remove().draw()
        addRow(switchInDatatable, { isLastRow: true, type: 'in' })
        addRow(switchOutDatatable, { isLastRow: true, type: 'out' })
        setTimeout(function () {
            switchInList.each(function () {
                var symbol = $(this).attr('data-symbol')
                addRow(switchInDatatable, { isLastRow: true, type: 'in' })
                switchInTable.find('input[name=switchin].symbol-code').each(function () {
                    if (!$(this).val()) {
                        $(this).val(symbol).trigger('blur')
                    }
                })
            })
            switchOutList.each(function () {
                var symbol = $(this).attr('data-symbol')
                addRow(switchOutDatatable, { isLastRow: true, type: 'out' })
                switchOutTable.find('input[name=switchout].symbol-code').each(function () {
                    if (!$(this).val()) {
                        $(this).val(symbol).trigger('blur')
                    }
                })
            })
        }, 100)
    }

    function selectSymbol(symbol, check) {
        if (!symbol) return
        fundAlert.addClass('hidden')
        var type = $('input:radio[name="fund-order-action"]:checked').val()
        var aItem = $('<a>', { class: 'symbol-code-tag', text: symbol, 'data-symbol': symbol }).append($('<i>', { class: 'fa fa-times icon-btn-x' }))
        var listDiv
        if (type === 'subscribe') {
            listDiv = $('.selected-subscribe-fund-list')
        } else if (type === 'redeem') {
            listDiv = $('.selected-redeem-fund-list')
        } else {
            if (!switchStep) {
                listDiv = $('.selected-switch-out-fund-list')
            } else {
                listDiv = $('.selected-switch-in-fund-list')
            }
        }
        if (listDiv) {
            listDiv.removeClass('hidden')
            if (check) {
                if (listDiv.find('[data-symbol=' + symbol + ']').length <= 0) {
                    listDiv.append(aItem)
                }
            } else {
                listDiv.find('[data-symbol=' + symbol + ']').remove()
            }
        }
        getSymbol(symbol, function (data) {
            if (data && data.symbolName) {
                aItem.attr('title', data.symbolName)
            }
        })
        aItem.find('i').click(function () {
            var symbolNo = $(this).parent().attr('data-symbol')
            if (!switchStep) {
                $('#fund-table input[data-symbol={0}]'.format(symbolNo)).attr('checked', false)
            }
            $(this).parent().remove()
        })
    }

    function showFundTable(data, options) {
        if (!data) return
        options = options || {}
        fundListDatatable.clear()
        for (var i = 0; i < data.length; i++) {
            var item = data[i]
            if (!item || !item[0]) continue
            var symbol = item[0].toLowerCase()
            var availableQuantity = GetMaxSellSync(item[0])
            var symbolName = item.symbolName.toLowerCase()
            if (options.query && symbol.indexOf(options.query) < 0 && symbolName.indexOf(options.query) < 0) continue
            if (options.hasPosition && Number(availableQuantity) <= 0) continue
            item.rowIndex = "<input type='checkbox' data-symbol='{0}' data-symbolName = '{1}'>".format(item[0], symbolName)
            item.availableQuantity = $._format.pattern(availableQuantity, FUNDUNITFORMAT)
            fundListDatatable.UpdateRowData(data[i])
        }
        fundListDatatable.draw()
        $('#fund-table input').change(function () {
            selectSymbol($(this).attr('data-symbol'), $(this).get(0).checked)
        })
    }

    function addFundInfo(symbolCode) {
        if (!symbolCode) return
        getSymbol(symbolCode, function (productObj) {
            if (hasProductBack) return
            hasProductBack = true
            if (!IsOTCFund(productObj)) {
                productObj = null
            }
            var fundInfo = currentTradeContainer.find('.fund-info')
            fundInfo.empty()
            if (!productObj) {
                fundInfo.append($("<h4>", { text: messages.ticket_message_invalid_symbol.text }))
                return
            }
            var title = $("<h4>", { text: productObj.symbolName })
            if (productObj["3409"]) {
                title.append($("<i>", { text: "Risk " + productObj["3409"], class: "highlight-tag highlight-tag-sm", style: "margin-left: 10px;" }))
            }
            if (productObj["3602"] == 'Y') {
                title.append($("<i>", { text: "CIES", class: "highlight-tag highlight-tag-sm", style: "margin-left: 10px;" }))
            }
            fundInfo.append(title)
            if (!productObj) return
            var side = $('.active [href=#tab-fund-redeem]').length > 0 ? 1 : 0
            var info = FundTicket.getFundInfo(productObj, { side: side })
            var navTd = $("<td>").append($("<small>", { text: info.nav ? info.nav.name + info.nav.value : '' }))
            var curTd = $("<td>").append($("<small>", { text: info.currency ? info.currency.name + info.currency.value : '' }))
            var minAmtTd = $("<td>").append($("<small>", { text: info.minAmt ? info.minAmt.name + info.minAmt.value : '' }))
            var txnTd = $("<td>").append($("<small>", { text: info.txn ? info.txn.name + info.txn.value : '' }))
            var minFeeAmtTd = $("<td>").append($("<small>", { text: info.minTxnAmt ? info.minTxnAmt.name + info.minTxnAmt.value : '' }))
            var maxSellTd = $("<td>").append($("<small>", { text: info.availableQuantity ? info.availableQuantity.name + info.availableQuantity.value : '' }))
            var trs = FullTrade.getInfo([navTd, curTd, minAmtTd, txnTd, minFeeAmtTd, maxSellTd])
            var t = $("<table>", { class: "table table-condensed" })
            for (var i = 0; i < trs.length; i++) {
                t.append(trs[i])
            }
            fundInfo.append(t)
        })
    }

    function intiFundTable() {
        fundListDatatable = $('#fund-table').CreateDatatable({
            columnSchema: fundListSchema,
            searching: false,
            paging: false,
            scrollY: isMobile ? false : '400px',
            scrollCollapse: true,
            order: [1, 'asc'],
            aoColumnDefs: [
                { "bSortable": false, "aTargets": [0] }
            ]
        })
    }

    function initFundSubscribe() {
        subscribeForm.find('.btn-submit').click(function () {
            var symbol = currentTradeContainer.find('.symbol-code').val()
            if (symbol && getSimpleSymbolSync(symbol)) {
                var symbolObj = getSimpleSymbolSync(symbol)
                FullTrade.addNewPendSymbol([{
                    0: symbolObj[0],
                    23: symbolObj[23],
                    symbolName: FullTrade.getFullSymbolName(symbolObj),
                    amount: inputAmount.val()
                }], pendFundSubSchema, { newRowHandler: newPendRowHandler })
            }
        })
    }

    function initFundRedeem() {
        redeemForm.find('.btn-submit').click(function () {
            var symbol = currentTradeContainer.find('.symbol-code').val()
            if (symbol && getSimpleSymbolSync(symbol)) {
                var symbolObj = getSimpleSymbolSync(symbol)
                FullTrade.addNewPendSymbol([{
                    0: symbolObj[0],
                    23: symbolObj[23],
                    symbolName: FullTrade.getFullSymbolName(symbolObj),
                    unit: inputUnit.val()
                }], pendFundRemSchema, { newRowHandler: newPendRowHandler })
            }
        })
    }

    function newPendRowHandler(tr) {
        if (!tr || tr.length <= 0) return
        var inputSymbol = currentTradeContainer.find('.symbol-code')
        if (!inputSymbol.val()) {
            inputSymbol.val(tr.attr('data-symbol')).trigger('blur')
        }
        tr.find('[data-key=0]').click(function () {
            inputSymbol.val($(this).parents('tr').attr('data-symbol')).trigger('blur')
        })
        tr.find('[data-key=amount]').InputFormat({
            format: function (value) {
                return $._format.pattern(value, FUNDAMOUNTFORMAT)
            }
        })
        tr.find('[data-key=unit]').InputFormat({
            format: function (value) {
                return $._format.pattern(value, FUNDUNITFORMAT)
            }
        })
    }

    function initFundSwitch() {
        var columnDef
        if (!isMobile) {
            columnDef = [
                { "width": "3%", "targets": 0 },
                { "width": "20%", "targets": 1 },
                { "width": "41%", "targets": 2 },
                { "width": "5%", "targets": 3 },
                { "width": "15%", "targets": 4 },
                { "width": "15%", "targets": 5 },
                { "width": "3%", "targets": 6 },
            ]
        } else {
            columnDef = false
        }
        switchInDatatable = switchInTable.CreateDatatable({
            columnSchema: switchInSchema,
            info: false,
            searching: false,
            ordering: false,
            paging: false,
            columnDefs: columnDef
        })
        switchOutDatatable = switchOutTable.CreateDatatable({
            columnSchema: switchOutSchema,
            info: false,
            searching: false,
            ordering: false,
            paging: false,
            columnDefs: columnDef
        })

        addRow(switchInDatatable, { isLastRow: true, type: 'in' })
        addRow(switchInDatatable, { isLastRow: true, type: 'in' })
        addRow(switchOutDatatable, { isLastRow: true, type: 'out' })
        addRow(switchOutDatatable, { isLastRow: true, type: 'out' })

        switchOutTable.click(function (e) {
            if ($(e.target).hasClass('table-row-add')) {
                addRow(switchOutDatatable, { isLastRow: true, type: 'out' })
            }
            else if ($(e.target).hasClass('table-row-remove')) {
                switchOutDatatable.row($(e.target).parents('tr')).remove().draw()
            } else return
            updateTableIndex(switchOutDatatable)
        })
        switchInTable.click(function (e) {
            if ($(e.target).hasClass('table-row-add')) {
                addRow(switchInDatatable, { isLastRow: true, type: 'in' })
            } else if ($(e.target).hasClass('table-row-remove')) {
                switchInDatatable.row($(e.target).parents('tr')).remove().draw()
            } else return
            updateTableIndex(switchInDatatable)
        })
        $(switchInTable.find('thead td')[0]).text('#')
        $(switchOutTable.find('thead td')[0]).text('#')
    }

    function switchConfirm() {
        if (!fundSwitchChecking()) return
        $("#fund-switch-message").text('')
        var data = $('#fund-switch-form').serialize()
        data = data.replace(/%2C/g, '')
        var orderType = 10
        var message
        FundTicket.popupFundDisclaimer(function (res) {
            if (res) {
                Ticket.submitCalcorder(data, {
                    confirmBoxTitle: messages.order_confirmation_fund_title.text,
                    addOrder: function () {
                        showMessage({
                            title: messages.order_confirmation_fund_title.text,
                            buttonNameList: ['submit', 'close'],
                            message: getSwitchComfirmationContent() + FullTrade.getDiscolsureCheckBox(orderType),
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
                                            var titleMsg = messages.order_confirmation_order_submitted_message.text
                                            var isSuccess = true
                                            if (result.error) {
                                                titleMsg = messages.fund_switch_failed.text
                                                isSuccess = false
                                            }
                                            message = getSwitchResult(result.error, result.data)
                                            alertMessage({
                                                title: messages.dialog_information_title.text + ' - ' + titleMsg,
                                                message: message,
                                                type: isSuccess ? BootstrapDialog.TYPE_SUCCESS : BootstrapDialog.TYPE_DANGER
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

    function addRow(datatable, options) {
        if (!datatable || !options) return
        if (options.isLastRow) {
            var rowLength = datatable.rows()[0].length
            if (rowLength > 0) {
                var lastRow = datatable.row(rowLength - 1)
                var lastData = lastRow.data()
                lastData.rowIndex = rowLength
                lastData["0"] = getElement('symbol', options)
                lastData.allocation = getElement('allocation')
                lastData["4"] = getElement('unit')
                lastData.removeIcon = removeIcon
                lastRow.data(lastData)
            }
            var obj = { "rowIndex": addIcon }
            datatable.UpdateRowData(obj)
        }
        datatable.draw()
        var tableContainer = $(datatable.table().container())
        var inputSymbolCode = tableContainer.find('.symbol-code:last')
        inputSymbolCode.focus()
        inputSymbolCode.keypress(function (e) {
            if (e.keyCode == 13) {
                updateRow($(e.target).parents('tr'))
            }
        })
        inputSymbolCode.on('input', function () {
            $(this).val($(this).val().toUpperCase())
        })
        inputSymbolCode.blur(function (e) {
            updateRow($(e.target).parents('tr'))
        })
        inputSymbolCode.parent().find('.input-group-addon').click(function () {
            waitingInputSymbolCode = null
            waitingInputSymbolCode = $($(this).parent().find('.symbol-code'))
        })
        tableContainer.find('.redeem-unit:last').keypress(function (e) {
            if (e.keyCode == 13) {
                addRow(datatable, { isLastRow: true, type: 'out' })
            }
        })
        tableContainer.find('input').each(function () {
            FullTrade.setInputSizeInMobile($(this))
        })
        tableContainer.find('.subscription-amount:last').keypress(function (e) {
            if (e.keyCode == 13) {
                addRow(datatable, { isLastRow: true, type: 'in' })
            }
        })
        $('.switchout-unit').each(function () {
            $(this).InputPercentage({
                data: [10, 20, 50, 100, 0],
                total: 0
            })
            $(this).InputFormat({
                format: function (value) {
                    return $._format.pattern(value, FUNDUNITFORMAT)
                }
            })
        })
        if (options.defaultSymbol) {
            inputSymbolCode.val(options.defaultSymbol).trigger('blur')
        }
    }

    function updateTableIndex(datatable) {
        if (!datatable) return
        for (var i = 0; i < datatable.rows()[0].length - 1; i++) {
            var node = datatable.row(i).node()
            $(node).find('td:first').text(i + 1)
        }
    }

    function getElement(type, options) {
        if (type === 'symbol') {
            if (options && options.type === 'in') {
                return "<div class='input-group input-group-sm'><input type='text' name='switchin' class='form-control input-sm symbol-code'><span class='input-group-addon'><a href='javascript:SearchProduct_Search(\"FUND\",\"0\")'><i class='fa fa-search text-muted'></i></span></div>"
            } else {
                return "<div class='input-group input-group-sm'><input type='text' name='switchout' class='form-control input-sm symbol-code'></div>"
            }
        } else if (type === 'unit') {
            return "<input type='text' name='switchout' class='form-control input-sm switchout-unit'>"
        } else if (type === 'allocation') {
            return "<input type='text' name='switchin' class='form-control input-sm fund-allocation'>"
        }
    }

    function updateRow(tr) {
        if (!tr) return
        var symbolCode = $(tr).find('.symbol-code').val()
        var symbolName = $(tr).find('.symbol-name')
        var unit = $(tr).find('.available-unit')
        var curColumn = $(tr).find('.symbol-currency')
        unit.text('')
        if (symbolCode) {
            if (fundList[symbolCode]) {
                var data = fundList[symbolCode]
                symbolName.html(FullTrade.getFullSymbolName(data))
                curColumn.text(data[23])
            } else {
                getSymbol(symbolCode, function (data) {
                    if (data) {
                        fundList[symbolCode] = data
                        symbolName.html(FullTrade.getFullSymbolName(data))
                        curColumn.text(data[23])
                    } else {
                        symbolName.text(messages.ticket_message_invalid_symbol.text)
                    }
                })
            }
            var availableUnit = GetMaxSellSync(symbolCode)
            unit.text(availableUnit ? $._format.pattern(availableUnit, FUNDUNITFORMAT) : 0)
            $(tr).find('.dropdown-input-percentage').attr('data-total', availableUnit)
        }
    }

    function getSymbol(symbolCode, callback) {
        if (symbolCode) {
            if (fundList[symbolCode]) {
                callback(fundList[symbolCode])
            } else {
                $.get('/iTrader/product?symbol=' + symbolCode, function (result) {
                    var data = result.data
                    if (data) {
                        fundList[symbolCode] = data
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
        if (symbolCode && fundData) {
            for (var i = 0; i < fundData.length; i++) {
                if (fundData[i][0] === symbolCode) return fundData[i]
            }
        }
    }


    function fundSwitchChecking() {
        var result = true
        container.find('tr').removeClass('danger')
        var elements = container.find('#fund-switch-form table tr input')
        var allocation = 0
        for (var i = 0; i < elements.length; i++) {
            var e = $(elements[i])
            if (e.hasClass('percentage-input')) continue
            if (!e.val()) {
                e.parents('tr').addClass('danger')
                result = false
            }
            if (e.hasClass('symbol-code')) {
                if (!fundList[e.val()]) {
                    e.parents('tr').addClass('danger')
                    result = false
                }
            } else if (e.hasClass('fund-allocation')) {
                allocation += Number(e.val())
            }
        }
        if (allocation != 100) {
            $("#fund-switch-message").text(messages.fund_msg_allocation.text)
            result = false
        }
        return result
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
                    amount: $(rows[i]).find('[data-key=amount]').val(),
                    unit: $(rows[i]).find('[data-key=unit]').val(),
                    symbolName: symbolObj.symbolName,
                })
            }
        }
        var columns = currentTab == 1 ? confirmFundRemSchema : confirmFundSubSchema
        var div = FullTrade.createTable(data, columns, { side: currentTab == 1 ? 1 : 0 })
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
                var errMsg = (getErrorMessage(item) || '').replace("<br />", "")
                item[25] = errMsg
                icon = "<i class='fa fa-times-circle text-danger' style='margin-right:5px;' title='{0}'></i>".format(errMsg)
            }
            item[0] = icon + item[0]
            item[23] = item[23] || symbolObj[23] || ''
            item.amount = $._format.amount(item[3] || 0)
            item.unit = $._format.pattern(item[4] || 0, FUNDUNITFORMAT)
            item.symbolName = symbolObj.symbolName || ''
            if (item[11] == 1 || item[11] == 5) {
                orderSide = 1
            }
        }
        var columns = orderSide == 1 ? resultFundRemSchema : resultFundSubSchema
        var div = FullTrade.createTable(list, columns, { side: orderSide })
        if (div) {
            div.find('table').addClass('dialog-table')
            return div.html()
        }
        return ''
    }

    function getSwitchComfirmationContent() {
        var fundSwitchOrderList = []
        var outTrs = switchOutTable.find('tr')
        for (var i = 1; i < outTrs.length - 1; i++) {
            var tr = $(outTrs[i])
            fundSwitchOrderList.push({
                0: tr.find('.symbol-code').val(),
                symbolName: tr.find('.symbol-name').text(),
                23: tr.find('.symbol-currency').text(),
                4: tr.find('.redeem-unit input').val(),
                11: 1
            })
        }
        var inTrs = switchInTable.find('tr')
        for (var j = 1; j < inTrs.length - 1; j++) {
            var tr = $(inTrs[j])
            fundSwitchOrderList.push({
                0: tr.find('.symbol-code').val(),
                symbolName: tr.find('.symbol-name').text(),
                23: tr.find('.symbol-currency').text(),
                allocation: tr.find('.fund-allocation').val(),
                11: 0
            })
        }
        var html = $(FundBook.GetFundSwitchInfo(null, fundSwitchOrderList, { iconType: 'none' }))
        html.find('table').css('margin-bottom', '20px')
        html.attr('class', 'col-sm-12')
        return html.html()
    }

    function getSwitchResult(errlist, successList) {
        var list = (errlist ? errlist : []).concat(successList ? successList : [])
        var html = $(FundBook.GetFundSwitchInfo(null, list, { iconType: 'enhance' }))
        return html.html()
    }

    function appendHoldingFundToSwitchPage() {
        var p = $('#fund-switch-holding-panel').empty()
        var sl = []
        setInterval(function () {
            var positions = FundPosition.getAllPositions()
            var positionArray = []
            if (positions) {
                for (var i in positions) {
                    positionArray.push(positions[i][0])
                }
                if (sl && positionArray.sort().toString() == sl.sort().toString()) {
                    return
                } else {
                    sl = []
                    for (var i = 0; i < positions.length; i++) {
                        if (GetMaxSellSync(positions[i][0]) > 0) {
                            sl.push(positions[i][0])
                        }
                    }
                }
            } else {
                return
            }
            p.empty()
            var divC = $("<div>", { style: "word-wrap: break-word;" })
            if (sl.length > 0) {
                divC.append("<small><span>{0}</span></small>".format(messages.fund_switch_out_symbol_list_header.text))
            } else {
                divC.append("<label>{0}</label>".format(messages.fund_switch_out_no_record.text))
            }
            for (var i = 0; i < sl.length; i++) {
                var item = $("<a class='symbol-code-tag' data-symbol='{0}'>{0}</a>".format(sl[i]))
                item.click(function () {
                    var clickSymbol = $(this).text()
                    var inputs = $(".tab-pane.active .symbol-code[name=switchout]")
                    for (var j = 0; j < inputs.length; j++) {
                        var input = $(inputs[j])
                        if (input.val() === clickSymbol) return
                        if (!input.val()) {
                            input.val(clickSymbol).trigger('blur')
                            return
                        }
                    }
                    addRow(switchOutDatatable, { isLastRow: true, type: 'out', defaultSymbol: clickSymbol })
                })
                divC.append(item)
            }
            p.append(divC)
        }, 1000)
    }

    exports.init = init
    exports.addRow = addRow
})