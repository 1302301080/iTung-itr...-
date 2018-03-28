define(function (require, exports, module) {
    var name = 'fund_trade'
    var Ticket = require('ticket')
    var FundTicket = require('fund-ticket')
    var FundPosition = require('fund-position')
    var FundBook = require('fundbook')
    var dialog = require('dialog')
    var FullTrade = require('full-trade')
    var isMobile = require('mobile').GetIsMobile()
    var FUNDAMOUNTFORMAT = '#,##0.00######'  // for handle input amount case
    var FUNDUNITFORMAT = initial_data.format.fund_unit
    var container
    var fundList = {}   //in object, full symbol inf, by getSymbol function one by oneo
    var currentTab = 0   // 0: subscribe  1: redeem  2: switch
    var switchPanel
    var switchInTable
    var switchOutTable
    var switchInDatatable
    var switchOutDatatable
    var subscribeForm
    var redeemForm
    var fundBuyBtn
    var fundSellBtn
    var fundSubmitBtn
    var fundPositions
    var removeIcon = "<a href='javascript:void(0)'><i class='fa fa-lg fa-remove text-danger table-row-remove'></i></a>"
    var waitingInputSymbolCode
    var _csrf = $('input[name=_csrf]').val()
    var inputAmount = $("#input-amount")
    var inputSymbol = $('.symbol-code')

    var fundListSchema = [
        { name: 'symbol', key: '0', i18n: 'fund_symbol_code' },
        { name: 'symbol name', key: 'symbolName', i18n: 'fund_name' },
        { name: 'nav', key: 'nav', i18n: 'column_fund_nav', class: 'text-right' },
        { name: 'currency', key: '23', i18n: 'column_currency' },
        { name: 'risk', key: 'RPQLevel', i18n: 'column_risk_level', class: 'text-right' },
        { name: 'cies', key: 'CIESFlag', i18n: 'column_CIES' },
        { name: 'professional investor', key: 'PIFlag', i18n: 'column_professional_investor' },
        { name: 'derivative product', key: 'DerivativeFalg', i18n: 'column_derivative_product' },
        { name: 'offering document', key: 'offeringDocLink', i18n: 'column_offering_document_link' },
    ]
    var switchOutSchema = [
        { name: 'symbol', key: '0', i18n: 'fund_switch_out_symbol' },
        { name: 'symbol name', key: 'symbolName', i18n: 'fund_name', class: 'symbol-name', mobile: false },
        { name: 'unit', key: '4', i18n: 'fund_redeem_unit', class: 'redeem-unit overflow-visible', },
        { name: 'remove', key: 'removeIcon' },
    ]
    var switchInSchema = [
        { name: 'symbol', key: '0', i18n: 'fund_switch_in_symbol' },
        { name: 'symbol name', key: 'symbolName', i18n: 'fund_name', class: 'symbol-name', mobile: false },
        { name: 'allocation', key: 'allocation', i18n: 'fund_switch_in_allocation', class: 'subscription-amount', headClass: 'bubble-title', headTitle: messages.fund_msg_allocation.text },
        { name: 'remove', key: 'removeIcon' }
    ]

    if (initial_data.views.full_trade && initial_data.views.full_trade.fund && initial_data.views.full_trade.fund.listSchema) {
        fundListSchema = initial_data.views.full_trade.fund.listSchema
    }


    function init(c, s) {
        container = c
        FundPosition.init($('#tab-fund-position'), s)
        switchOutTable = $('#fund-switch-out-table')
        switchInTable = $('#fund-switch-in-table')
        subscribeForm = $('#fund-subscribe-form')
        redeemForm = $('#fund-redeem-form')
        fundBuyBtn = $('#fund-buy-btn')
        fundSellBtn = $('#fund-sell-btn')
        fundSubmitBtn = $('#fund-select-submit')
        switchPanel = $('#switch-panel')

        $('#fund-switch-panel').perfectScrollbar()
        initFundSwitch()
        initFundMarket()
        var switchDropdown = $('.switch-dropdown')
        switchDropdown.parent().addClass("redeem-unit overflow-visible")


        window.addEventListener('message', function (event) {
            if (event.data && event.data.name === 'copy-symbol') {
                if (event.data.type === 'sell') {
                    if (currentTab == 2) {
                        $("[href='#tab-fund-switch']").tab('show')

                    } else {
                        $("[href='#tab-fund-redeem']").tab('show')
                    }
                }
                if (waitingInputSymbolCode && waitingInputSymbolCode.length > 0) {
                    waitingInputSymbolCode.val(event.data.symbol).trigger('blur')
                } else {
                    if (currentTab == 2) {
                        if (event.data.type === 'sell') {
                            $("#fund-switch-out-table .symbol-code").val(event.data.symbol).trigger('blur')
                        } else {
                            addSymbol(switchInDatatable)
                            $("#fund-switch-in-table .symbol-code:last").val(event.data.symbol).trigger('blur')
                        }
                    } else {
                        $(".tab-pane.active .symbol-code").val(event.data.symbol).trigger('blur')
                    }
                }
            }
        }, false)

        inputAmount.InputFormat({
            format: function (value) {
                return $._format.pattern(value, FUNDAMOUNTFORMAT)
            }
        })
        $('#fund-switch-out-input').InputFormat({
            format: function (value) {
                return $._format.pattern(value, FUNDUNITFORMAT)
            }
        })
        $('#fund-switch-out-input').InputPercentage({
            data: [10, 20, 50, 100, 0],
            total: 0
        })
        $('#input-unit').InputFormat({
            format: function (value) {
                return $._format.pattern(value, FUNDUNITFORMAT)
            }
        })
        $('#input-unit').InputPercentage({
            data: [10, 20, 50, 100, 0],
            total: 0
        })
        redeemForm.find('#input-unit').click(function () {
            var symbol = redeemForm.find('.symbol-code').val()
            if (symbol) {
                if (fundPositions) {
                    for (var p in fundPositions) {
                        var slItem = fundPositions[p][0]
                        var x = slItem.indexOf('</i>')
                        if (x >= 0) {
                            slItem = slItem.substring(x + 4, slItem.length)
                        }
                        if (slItem == symbol) {
                            $(this).attr('data-total', fundPositions[p].availableQuantity || 0)
                        }
                    }
                }
            }
        })

        inputSymbol.on('input', function () {
            $(this).val($(this).val().toUpperCase())
        })
        inputSymbol.blur(function () {
            var symbol = $(this).val()
            addFundInfo(symbol)
        })
        container.find('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var href = $(e.target).attr('href')
            if (href == '#tab-fund-switch') {
                fundPositions = FundPosition.getAllPositions()
                $('#fund-switch-out-table .symbol-code').PositionDrawdownList(fundPositions)
                currentTab = 2
            } else if (href == '#tab-fund-redeem') {
                fundPositions = FundPosition.getAllPositions()
                $('#fund-reddem-input').PositionDrawdownList(fundPositions)
                currentTab = 1
            } else if (href == '#tab-fund-subscribe') {
                currentTab = 0
            }
        })

        inputSymbol.keypress(function (e) {
            if (e.keyCode == 13) {
                $(this).trigger('blur')
            }
        })


        fundBuyBtn.click(function (e) {
            var side = e.target.attributes['data-typeside'].nodeValue
            var symbol = subscribeForm.find('.symbol-code').val()
            var amount = subscribeForm.find('#input-amount').val()
            if (!symbol) {
                subscribeForm.find('.symbol-code').focus()
                return
            }
            if (!amount) {
                subscribeForm.find('#input-amount').focus()
                return
            }
            submitOrder(side)
        })
        fundSellBtn.click(function (e) {
            var side = e.target.attributes['data-typeside'].nodeValue
            var symbol = redeemForm.find('.symbol-code').val()
            var unit = redeemForm.find('#input-unit').val()
            if (!symbol) {
                redeemForm.find('.symbol-code').focus()
                return
            }
            if (!unit) {
                redeemForm.find('#input-unit').focus()
                return
            }
            submitOrder(side)
        })
        fundSubmitBtn.click(function () {
            var switchTable = $('#fund-switch-in-table')
            var tagElements = switchTable.find('input')
            var sum = 0
            for (var j = 0; j < tagElements.length; j++) {
                var value
                if ($(tagElements[j]).hasClass('fund-allocation')) {
                    value = $(tagElements[j]).val()
                    sum += Number(value)
                }
            }
            if (sum == 100) {
                switchConfirm()
            } else {
                var err = {}
                err.message = messages.fund_msg_allocation.text
                dialog.alertError(err)
            }
        })

        OrderMgr.on(function () {
            var symbol = $('#tab-fund-redeem').find('.symbol-code')
            symbol.focus()
        })

        $(document).translate()
    }

    function initFundMarket() {
        var fundMarketTable = $('#fund-market-table')
        var fundMarketDatatable = fundMarketTable.CreateDatatable({
            columnSchema: fundListSchema,
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

        var table_container = $(fundMarketDatatable.table().container())
        var buttons_container = fundMarketDatatable.buttons().container()
        buttons_container.addClass('pull-right')
        buttons_container.find('a span').remove()
        buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
        buttons_container.appendTo(table_container.find('.dataTables_filter label'))
        $('#fund-market-filter').appendTo($('.col-sm-6:eq(0)', table_container))

        setTimeout(function () {
            $.get('/iTrader/fund', function (data) {
                if (!data) return
                for (var i = 0; i < data.length; i++) {
                    var item = data[i]
                    if (!item || !item[0]) continue
                    item.DT_RowId = 'fund-' + item[0]
                    if (item[30]) {
                        item.symbolName += ' (' + item[30] + ')'
                    }
                    if (item[20] && ExchangeMgr.exchange_flag[item[20]]) {
                        item[0] = "<i class='flag-icon {0}' style='margin-right:5px;'></i>{1}".format(ExchangeMgr.exchange_flag[item[20]], item[0])
                    }
                    var offeringDocLink = ''
                    if (item.offeringDocLink) {
                        for (var p in item.offeringDocLink) {
                            offeringDocLink += "<a href='{0}' target='_blank'><i class='fa fa-link'></i>{1}</a>".format(item.offeringDocLink[p], messages.column_offering_document_link.text)
                        }
                        item.offeringDocLink = offeringDocLink
                    }
                    fundMarketDatatable.UpdateRowData(data[i])
                }
                fundMarketDatatable.draw()
            })
        }, 1000)

        // copy price
        fundMarketTable.click(function (e) {
            var td = $(e.target)
            var tdClassName = td.attr('class')
            if (tdClassName) {
                if (tdClassName.indexOf('copyprice') >= 0) {
                    var id = td.text()
                }
            }
            if (id) {
                window.postMessage({
                    name: 'copy-symbol',
                    exchange: 'FUND',
                    symbol: id,
                    act: currentTab
                }, '/')
            }
        })
    }

    function handleAfterSubmitCalc() {
        if (initial_data.ticket.clearAfterSubmit) {
            // resetForm()
        }
    }

    function submitOrder(sidebtn) {
        var side = sidebtn
        var data = ''
        if (side == '0') {
            var symbol = subscribeForm.find('.symbol-code').val()
            var amount = subscribeForm.find('#input-amount').val()
            data = 'symbol=' + symbol + '&fundAmountUnit=' + amount + '&_csrf={0}&side={1}'.format(_csrf, side)
        }
        if (side == '1') {
            var symbol = redeemForm.find('.symbol-code').val()
            var unit = redeemForm.find('#input-unit').val()
            data = 'symbol=' + symbol + '&fundAmountUnit=' + unit + '&_csrf={0}&side={1}'.format(_csrf, side)
        }
        FundTicket.popupFundDisclaimer(function (res) {
            if (res) {
                Ticket.submitCalcorder(data, {
                    confirmBoxTitle: messages.order_confirmation_fund_title.text,
                })
            } else {
                handleAfterSubmitCalc()
            }
        })
    }

    function addFundInfo(symbolCode) {
        if (!symbolCode) return
        getSymbol(symbolCode, function (productObj) {
            if (!IsOTCFund(productObj)) {
                productObj = null
            }
            var fundInfo = $('.tab-pane.active').find('.fund-info')
            fundInfo.empty()
            if (!productObj) {
                fundInfo.append($("<h4>", { text: messages.ticket_message_invalid_symbol.text }))
                return
            }
            var title = $("<h4>", { text: productObj.symbolName + (productObj[30] ? '(' + productObj[30] + ')' : '') })
            fundInfo.append(title).append(FullTrade.getProductProperties(productObj))
            if (!productObj) return
            var side = $('.active [href=#tab-fund-redeem]').length > 0 ? 1 : 0
            var info = FundTicket.getFundInfo(productObj, { side: side })
            var navTd = $("<td>").append($("<small>", { html: info.nav ? info.nav.name + "<b>" + info.nav.value + "</b>" : '' }))
            var minAmtTd = $("<td>").append($("<small>", { html: info.minAmt ? info.minAmt.name + "<b>" + info.minAmt.value + "</b>" : '' }))
            var txnTd = $("<td>").append($("<small>", { html: info.txn ? info.txn.name + "<b>" + info.txn.value + "</b>" : '' }))
            var minFeeAmtTd = $("<td>").append($("<small>", { html: info.minTxnAmt ? info.minTxnAmt.name + "<b>" + info.minTxnAmt.value + "</b>" : '' }))
            var maxSellTd = $("<td>").append($("<small>", { html: info.availableQuantity ? info.availableQuantity.name + "<b>" + info.availableQuantity.value + "</b>" : '' }))
            var minHoldingAmtTd = $("<td>").append($("<small>", { html: info.minHoldingUnit ? info.minHoldingUnit.name + "<b>" + info.minHoldingUnit.value + "</b>" : '' }))
            var trs = getInfoTable([navTd, minAmtTd, txnTd, minFeeAmtTd, minHoldingAmtTd, maxSellTd])
            var t = $("<table>", { class: "table table-condensed" })
            for (var i = 0; i < trs.length; i++) {
                t.append(trs[i])
            }
            fundInfo.append(t)
            fundInfo.translate()
        })
    }

    function getInfoTable(list) {
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

    function OutRow() {
        var rowOut = {
            DT_RowId: 'switch-out-row',
            0: "<div class='switch-dropdown'style='position:relative;'><input type='text' name='switchout' class='form-control input-sm symbol-code' autocomplete='off'></div>",
            symbolName: '',
            4: "<input type='text' name='switchout' id='fund-switch-out-input' class='form-control input-sm fund-unit' autocomplete='off'>",
        }
        switchOutDatatable.UpdateRowData(rowOut).draw()
    }

    function InRow(RowId) {
        RowId = RowId || 'x1'
        var rowIn = {
            DT_RowId: RowId,
            DT_RowClass: 'switc-in-row',
            0: "<div class='input-group input-group-sm'><input type='text' name='switchin' class='form-control input-sm symbol-code' autocomplete='off'><span class='input-group-addon'><a href='javascript:SearchProduct_Search(\"FUND\",\"0\")'><i class='fa fa-search text-muted'></i></span></div>",
            symbolName: '',
            allocation: "<input type='text' name='switchin' class='form-control input-sm fund-allocation' autocomplete='off'>",
            removeIcon: removeIcon,
        }
        switchInDatatable.UpdateRowData(rowIn).draw()
    }

    function addInRow() {
        var addIcon = "<a href='javascript:void(0)'><i class='fa fa-lg fa-plus-circle text-info table-row-add'></i></a>"
        $('.fund-switch-tableGroup').after(addIcon)
    }

    function initFundSwitch() {
        var columnDef
        if (!isMobile) {
            columnDef = [
                { "width": "25%", "targets": 0 },
                { "width": "45%", "targets": 1 },
                { "width": "25%", "targets": 2 },
                { "width": "5%", "targets": 3 },
            ]
        } else {
            columnDef = false
        }
        switchOutDatatable = switchOutTable.CreateDatatable({
            columnSchema: switchOutSchema,
            info: false,
            searching: false,
            ordering: false,
            paging: false,
            columnDefs: columnDef
        })
        switchInDatatable = switchInTable.CreateDatatable({
            columnSchema: switchInSchema,
            info: false,
            searching: false,
            ordering: false,
            paging: false,
            columnDefs: columnDef
        })
        InRow()
        OutRow()
        addInRow()
        switchInTable.click(function (e) {
            addSymbol(switchInDatatable)
            if ($(e.target).hasClass('table-row-remove')) {
                switchInDatatable.row($(e.target).parents('tr')).remove().draw()
            } else return
        })
        $('.table-row-add').click(function () {
            var DT_RowId = new Date().getMilliseconds()
            InRow(DT_RowId)

        })
        addSymbol(switchOutDatatable)
        addSymbol(switchInDatatable)
    }

    function addSymbol(datatable) {
        if (!datatable) return
        var tableContainer = $(datatable.table().container())
        var inputSymbolCode = tableContainer.find('.symbol-code')
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
        tableContainer.find('input').each(function () {
            FullTrade.setInputSizeInMobile($(this))
        })
    }

    function switchConfirm() {
        $("#fund-switch-message").text('')
        var data = $('#fund-switch-form').serialize()
        data = data.replace(/%2C/g, '')
        var message
        FundTicket.popupFundDisclaimer(function (res) {
            if (res) {
                Ticket.submitCalcorder(data, {
                    confirmBoxTitle: messages.order_confirmation_fund_title.text,
                    addOrder: function () {
                        showMessage({
                            title: messages.order_confirmation_fund_title.text,
                            buttonNameList: ['submit', 'close'],
                            message: getSwitchComfirmationContent(data) + getDiscolsureCheckBox(),
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

    function getSwitchComfirmationContent() {
        var switchDiv = $('<div>')
        var symbolData = $('#fund-switch-form .symbol-code').serialize()
        symbolData = symbolData.replace(/%2C/g, '')
        var arrSymbolData = symbolData.split('&')
        var fundSymbolList = []
        var fundSymbolOut = {}
        for (var i = 0; i < arrSymbolData.length; i++) {
            var num = arrSymbolData[i].indexOf("=")
            if (num > 0) {
                var name = arrSymbolData[i].substr(num + 1)
                var value = arrSymbolData[i].substring(0, num)
                if (value == 'switchout') {
                    fundSymbolOut[name] = value
                }
                fundSymbolList[name] = value
            }
        }
        var Redemption = $('#fund-switch-out-table').find('.fund-unit').val()
        var switchTable = $('#fund-switch-in-table')
        var tagElements = switchTable.find('input')
        var tableValueObj = {}
        for (var j = 0; j < tagElements.length; j++) {
            var name, value
            if ($(tagElements[j]).hasClass('symbol-code')) {
                name = $(tagElements[j]).val()
                value = $(tagElements[j]).parents('td').siblings('.subscription-amount').find('.fund-allocation').val()
                if (!tableValueObj[name]) {
                    tableValueObj[name] = Number(value)
                } else {
                    tableValueObj[name] += Number(value)
                }
            }
        }

        for (var p in fundSymbolList) {
            var orderObj = {}
            orderObj.switchType = fundSymbolList[p]
            orderObj.symbol = fundList[p][0] + '(' + fundList[p][30] + ')'
            orderObj.symbolName = fundList[p].symbolName
            orderObj.switchIn = tableValueObj[fundList[p][0]] || ''
            orderObj.txn = getTxnFeeRatio(fundList[p], 0)
            if (fundSymbolOut[p] == 'switchout') {
                var trSwitchType = $('<tr>').append('<td style="width:150px;" class="text-danger"><b>' + messages.fund_switchout_confirm.text + '</b></td>' + '<td>' + '' + '</td>')
                var trSymbol = $('<tr>').append('<td>' + messages.fund_switch_out_symbol.text + '</td>' + '<td style="font-weight: bold;">' + fundList[p][0] + '(' + fundList[p][30] + ')' + '</td>')
                var trFundName = $('<tr>').append('<td>' + messages.fund_name.text + '</td>' + '<td style="font-weight: bold;">' + fundList[p].symbolName + '</td>')
                var trCommission = $('<tr>').append('<td>' + messages.order_confirmation_redemption_unit.text + '</td>' + '<td style="font-weight: bold;">' + $._format.pattern(Redemption, FUNDUNITFORMAT) + '</td>')
                var trs = [trSwitchType, trSymbol, trFundName, trCommission]
                var t = $("<table>", { class: "table table-condensed", style: "border:1px solid #dddddd" })
                for (var i = 0; i < trs.length; i++) {
                    t.append(trs[i])
                }
                switchDiv.append(t)
            }
            if (orderObj.switchType == 'switchin') {
                var trSwitchType = $('<tr>').append('<td style="width:150px;" class="text-success"><b>' + messages.fund_switchin_confirm.text + '</b></td>' + '<td style="font-weight: bold;color: green;">' + tableValueObj[fundList[p][0]] + '%' + '</td>')
                var trSymbol = $('<tr>').append('<td>' + messages.fund_switch_in_symbol.text + '</td>' + '<td style="font-weight: bold;">' + orderObj.symbol + '</td>')
                var trFundName = $('<tr>').append('<td>' + messages.fund_name.text + '</td>' + '<td style="font-weight: bold;">' + orderObj.symbolName + '</td>')
                var trTransactionFee = $('<tr>').append('<td>' + messages.ticket_fund_transaction_fee.text + '</td>' + '<td style="font-weight: bold;" class="text-success">' + orderObj.txn + '</td>')
                var trs = [trSwitchType, trSymbol, trFundName]
                if (orderObj.txn) {
                    trs.push(trTransactionFee)
                }
                var t = $("<table>", { class: "table table-condensed", style: "border:1px solid #dddddd" })
                for (var i = 0; i < trs.length; i++) {
                    t.append(trs[i])
                }
                switchDiv.append(t)
            }

        }
        return switchDiv.html()
    }

    function getTxnFeeRatio(productObj, side) {
        if (!productObj) return null
        var prodFlag = productObj[3605]
        var transactionFeeRate = productObj[3407] || 0
        if (prodFlag & 16) {
            return messages.FreeTransactionFee.text
        }
        if (prodFlag & 32) {
            if (side == 0 && (prodFlag & 2)) {
                return $._format.percentage(transactionFeeRate, 2)
            } else if (side == 1 && (prodFlag & 4)) {
                return $._format.percentage(productObj[3606] || transactionFeeRate, 2)
            } else {
                return ''
            }
        }
        if (side == 0) return $._format.percentage(transactionFeeRate, 2)
        if (side == 1) return $._format.percentage(productObj[3606] || transactionFeeRate, 2)
        return ''
    }

    function getSwitchResult(errlist, successList) {
        var list = (errlist ? errlist : []).concat(successList ? successList : [])
        var html = $(FundBook.GetFundSwitchInfo(null, list, { iconType: 'enhance' }))
        return html.html()
    }

    function updateRow(tr) {
        if (!tr) return
        var trDiv = $('<tr>', { class: 'switchOutTr' })
        var symbolCode = $(tr).find('.symbol-code').val()
        var symbolName = $(tr).find('.symbol-name')
        if (symbolCode) {
            var fundPositionMap = {}
            if (fundPositions) {
                for (var p in fundPositions) {
                    var slItem = fundPositions[p][0]
                    var x = slItem.indexOf('</i>')
                    if (x >= 0) {
                        slItem = slItem.substring(x + 4, slItem.length)
                    }
                    fundPositionMap[slItem] = fundPositions[p].availableQuantity
                }
            }
            if (fundList[symbolCode]) {
                var data = fundList[symbolCode]
                var info = FundTicket.getFundInfo(data, { side: 1 })
                var navTd = $("<td>").append($("<small>", { html: info.nav ? info.nav.name + "<b>" + info.nav.value + "</b>" : '' }))
                if ($(tr).attr('id') === 'switch-out-row') {
                    var avaiqty = 0
                    if (fundPositionMap[symbolCode]) {
                        avaiqty = fundPositionMap[symbolCode]
                    }
                    $('#fund-switch-out-input').attr('data-total', avaiqty)
                    $('.switchOutTr').remove()
                    var maxSellTd = $("<td>").append($("<small>", { html: info.availableQuantity ? info.availableQuantity.name + "<b>" + info.availableQuantity.value + "</b>" : '' }))
                    var minHoldingAmtTd = $("<td>").append($("<small>", { html: info.minHoldingUnit ? info.minHoldingUnit.name + "<b>" + info.minHoldingUnit.value + "</b>" : '' }))
                    trDiv.append(navTd)
                    trDiv.append(minHoldingAmtTd)
                    trDiv.append(maxSellTd)
                    switchOutTable.append(trDiv)
                    symbolName.html(FullTrade.getFullSymbolName(data))
                } else {
                    var div = '<div>' + info.nav ? info.nav.name + "<b>" + info.nav.value + "</b>" : '' + '</div>'
                    symbolName.html(FullTrade.getFullSymbolName(data) + div)
                }
            } else {
                getSymbol(symbolCode, function (data) {
                    if (data) {
                        var info = FundTicket.getFundInfo(data, { side: 1 })
                        var navTd = $("<td>").append($("<small>", { html: info.nav ? info.nav.name + "<b>" + info.nav.value + "</b>" : '' }))
                        if ($(tr).attr('id') === 'switch-out-row') {
                            $('.switchOutTr').remove()
                            var avaiqty = 0
                            if (fundPositionMap[symbolCode]) {
                                avaiqty = fundPositionMap[symbolCode]
                            }
                            $('#fund-switch-out-input').attr('data-total', avaiqty)
                            var maxSellTd = $("<td>").append($("<small>", { html: info.availableQuantity ? info.availableQuantity.name + "<b>" + info.availableQuantity.value + "</b>" : '' }))
                            var minHoldingAmtTd = $("<td>").append($("<small>", { html: info.minHoldingUnit ? info.minHoldingUnit.name + "<b>" + info.minHoldingUnit.value + "</b>" : '' }))
                            trDiv.append(navTd)
                            trDiv.append(minHoldingAmtTd)
                            trDiv.append(maxSellTd)
                            switchOutTable.append(trDiv)
                            symbolName.html(FullTrade.getFullSymbolName(data))
                        } else {
                            var div = '<div>' + info.nav ? info.nav.name + "<b>" + info.nav.value + "</b>" : '' + '</div>'
                            symbolName.html(FullTrade.getFullSymbolName(data) + div)
                        }
                        fundList[symbolCode] = data
                    } else {
                        symbolName.text(messages.ticket_message_invalid_symbol.text)
                    }
                })
            }
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

    function getDiscolsureCheckBox() {
        var outDiv = $("<div>")
        var div = $("<div>", { "data-i18n": "order_confirmation_fund_disclosure" })
        outDiv.append(div)
        outDiv.translate()
        return outDiv.html()
    }

    $.fn.PositionDrawdownList = function (fundPositions) {
        if ($(this).attr('data-apply-popup')) return
        $(this).attr('data-apply-popup', true)
        var _that = $(this)
        var popupContainer
        function getDiv() {
            var fundDrawdowntable
            var dropdownContainer = $("<div>", { class: "dropdown-menu fund-dropdownDiv", style: "max-height:180px;overflow-x: hidden;padding:0; min-width:300px;" })
            var switchOutSymbolTable = $("<table>", { class: "table table-hover table-condensed", style: 'margin:0' })//white-space: normal;
            var fundHoldingList = []
            if (fundPositions) {
                for (var p in fundPositions) {
                    if (fundPositions[p].availableQuantity <= 0) continue
                    var holdObj = {}
                    var slItem = fundPositions[p][0]
                    holdObj.symbol = slItem
                    holdObj.symbolName = fundPositions[p].symbolName
                    holdObj.availableQuantity = fundPositions[p].availableQuantity
                    fundHoldingList.push(holdObj)
                }
            }
            if (fundHoldingList.length > 0) {
                for (var i in fundHoldingList) {
                    var tdSymbol = $("<td>", { html: fundHoldingList[i].symbol, "data-symbol": fundHoldingList[i].symbol })
                    var tdSymbolName = $("<td>" + fundHoldingList[i].symbolName + "</td>")
                    var tdAvaQuantity = $("<td data-value=" + fundHoldingList[i].availableQuantity + ">" + $._format.pattern(fundHoldingList[i].availableQuantity, FUNDUNITFORMAT) + "</td>")
                    var tr = $('<tr>', { style: "cursor:pointer" })
                    tr.append(tdSymbol)
                    tr.append(tdSymbolName)
                    tr.append(tdAvaQuantity)
                    fundDrawdowntable = switchOutSymbolTable.append(tr)
                }
                fundDrawdowntable
            } else {
                fundDrawdowntable = messages.ticket_fund_msg_symbolTable.text
            }
            dropdownContainer.append(fundDrawdowntable)
            return dropdownContainer
        }
        $(document).click(function () {
            if (popupContainer && popupContainer.length > 0) {
                popupContainer.remove()
                popupContainer.css({ 'border': '0' })
            }
        })
        $(this).mouseover(function(){
            $('.redeem-unit').removeAttr('title')
        })
        $('#switch-out-row').mouseover(function(){
            $('.redeem-unit').removeAttr('title')
        })
        $(this).on('click', function (e) {
            if (_that.nextAll().length > 0) return
            var div = getDiv()
            popupContainer = $("<div>", { class: "position-popup-div" })
            popupContainer.append(div)
            div.perfectScrollbar()
            div.css({ 'display': 'block' })
            div.css({ 'border': '1px solid #dddddd' })
            _that.after(popupContainer)
            popupContainer.find('table tr').click(function (e) {
                e.stopPropagation()
                var symbol = $(this).find('td').first().text()
                popupContainer.remove()
                div.css({ 'border': '0' })
                if (symbol) {
                    _that.val(symbol).trigger('blur')
                }
            })
            e.stopPropagation()
        }.bind(this))
    }

    exports.init = init
})