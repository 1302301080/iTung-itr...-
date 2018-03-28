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

{ $Id: portfolio.js,v 1.19 2017/05/22 09:28:53 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var portfolio_panel
var portfolio_table
var portfolio_datatable
var portfolio_current_exchange
var portfolio_exchange_dropdown

function Portfolio_Initialize() {
    portfolio_panel = $('#portfolio-panel')
    if (portfolio_panel.length <= 0) return
    portfolio_exchange_dropdown = $('#portfolio-dropdown-group')
    portfolio_table = $('#portfolio-table')
    var schema = initial_data.views.trade.portfolio.schema
    var tempSchema = []
    for (var i = 0; i < schema.length; i++) {
        tempSchema.push(schema[i])
    }
    tempSchema.push({ key: 'hide_exchange' })
    tempSchema.push({ key: 'hide_account' })
    portfolio_datatable = portfolio_table.CreateDatatable({
        columnSchema: tempSchema,
        columnHeaderPrefix: 'portfolio_header_',
        pageLength: 7,
        columnDefs: [
            { className: "copyprice portfolio-extra", "targets": [0] }
        ]
    })
    var columnsLength = portfolio_datatable.columns()[0].length
    portfolio_datatable.column(columnsLength - 1).visible(false)
    portfolio_datatable.column(columnsLength - 2).visible(false)

    var table_container = $(portfolio_datatable.table().container())
    var buttons_container = portfolio_datatable.buttons().container()
    table_container.find('.dataTables_filter label').addClass('search-box').appendTo($('#portfolio-search'))


    buttons_container.addClass('pull-right')
    buttons_container.find('a span').remove()
    buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
    buttons_container.appendTo(table_container.find('.dataTables_filter label'))


    $('#nav_account').on('change', function (event, key) {
        portfolio_datatable.clear()
        var positions = PositionMgr.get({ account: key })
        for(var i = 0; i < positions.length;i++) {
            PortfolioTable_Add(positions[i])
        }
        PortfolioTable_Filter()
    })

    $(document).on('exchange', function (event, data) {
        PortfolioExchangeDropdownGroup_Reset()
    })

    portfolio_exchange_dropdown.on('change', function (event, value) {
        portfolio_current_exchange = value === 'ALL' ? '' : value
        PortfolioTable_Filter()
    })

    PositionMgr.on(function (data) {
        if (!data || data.length <= 0) return
        for (var i = 0; i < data.length; i++) {
            console.log(data[i])
            PortfolioTable_Add(data[i])
        }
        PortfolioTable_Filter()
    })

    $(document).on('position-quantity-update', function (event, data) {
        if (!data) return
        PortfolioTable_Add(data)
        PortfolioTable_Filter()
    })

    $(document).on('products', function (event, data) {
        if (!data || !data.products) return
        var redraw = false
        for (var i = 0; i < data.products.length; i++) {
            var productObj = data.products[i]
            var positions = PositionMgr.get({ symbol: productObj[tags.symbol], account: AccountMgr.current_account })
            if (!positions || positions.length <= 0) continue
            redraw = true
            for (var j = 0; j < positions.length; j++) {
                PositionMgr.calc(positions[j], productObj)
                PortfolioTable_Add(positions[j])
            }
        }
        if (redraw) {
            PortfolioTable_Filter()
        }
    })

    $(document).on('margin', function (event, data) {
        if (!data) return
        var symbol = data[tags.symbol]
        var account = data[tags.account]
        if (!symbol || !account) return
        var productObj = ProductMgr.get(symbol)
        if (productObj) {
            var positions = PositionMgr.get({ symbol: symbol, account: account })
            if (positions && positions.length > 0) {
                for (var i = 0; i < positions.length; i++) {
                    PositionMgr.calc(positions[i], productObj)
                    PortfolioTable_Add(positions[i])
                }
                PortfolioTable_Filter()
            }
        }
    })
}

function PortfolioTable_Add(positionObj) {
    if (!positionObj) return
    var account = positionObj[4]
    if (account !== AccountMgr.current_account) return
    var positionViewObj = Portfolio_GetPositionObj(positionObj)
    if ($('#portfolio-panel').length <= 0 || !positionViewObj) return

    var symbol = positionObj[tags.symbol]
    var exchange = positionObj[tags.exchange]
    positionViewObj.DT_RowId = 'position-' + account + '-' + symbol
    positionViewObj.hide_exchange = '#' + (exchange || '') + '#'
    positionViewObj.hide_account = '#' + (account || '') + '#'

    var displayRatio = positionObj['1504'] || 1
    var costPrice = positionObj.costPrice * displayRatio
    positionViewObj.costPrice = $._format.price(costPrice, ProductMgr.getSpreadPrecision(symbol, costPrice) + 1)

    var row = portfolio_datatable.UpdateRowData(positionViewObj, {
        IsRemove: function (data) {
            return data[tags.quantity] == 0
        }
    })
    if (!row || !row.isNewRow) return
    $(row.node()).find('.copyprice').click(function () {
        var clickPosition = PositionMgr.get({ symbol: $(this).text(), account: AccountMgr.current_account })
        if (clickPosition && clickPosition.length > 0) {
            var symbolObj = {
                name: 'copy-symbol',
                exchange: clickPosition[0][tags.exchange],
                symbol: clickPosition[0][tags.symbol],
                quantity: GetMaxSell($(this).text())
            }
            window.postMessage(symbolObj, '/')
        }
    })
    $(row.node()).find('.portfolio-extra').each(function () {
        if ($(this).attr('data-toggle') === 'tooltip') return
        $(this).attr('data-toggle', 'tooltip').attr('data-placement', 'right')
        var that = this
        $(this).tooltip({
            html: true, container: 'body', trigger: 'hover', title: function () {
                var row = portfolio_datatable.row('#' + $(that).parent('tr').attr('id'))
                if (row && row.data()) {
                    return PortfolioTable_Hint(row.data())
                }
            }
        })
    })
}

function PortfolioExchangeDropdownGroup_Reset() {
    var options = { name: { i18n: 'portfolio_market' }, data: [{ key: 'ALL', value: messages.ALL.text }] }
    for (var i = 0; i < ExchangeMgr.exchanges.length; i++) {
        var e = ExchangeMgr.exchanges[i]
        options.data.push({ key: e, value: $._map.exchange(e) })
    }
    portfolio_exchange_dropdown.CreateDrowdownGroup(options)
}

function PortfolioTable_Filter() {
    var exchange = portfolio_current_exchange ? '#' + portfolio_current_exchange + '#' : ''
    var columnLength = portfolio_datatable.columns()[0].length
    portfolio_datatable.column(0).nodes().to$().each(function () {
        if ($(this).find('i').length <= 0) {
            var flag = $("<i class='flag-icon'></i>")
            var productObj = ProductMgr.get($(this).text())
            var exchange = productObj ? productObj[tags.exchange] : '' || ''
            flag.addClass((ExchangeMgr.exchange_flag[exchange] || ''))
            $(this).prepend(flag)
        }
    })
    portfolio_datatable.column(columnLength - 2).search(exchange, false, false, false).draw(false)
}

function PortfolioTable_Hint(positionObj) {
    if (!positionObj) return
    var div = $("<table class='portfolio-hint'></table>")
    if (initial_data.views.trade.portfolio.tooltip) {
        for (var i = 0; i < initial_data.views.trade.portfolio.tooltip.length; i++) {
            var tooltipItem = initial_data.views.trade.portfolio.tooltip[i]
            if (!tooltipItem || !tooltipItem.key) continue
            var row = $("<tr></tr>")
            var i18n = tooltipItem.i18n || ('portfolio_hint_' + tooltipItem.key)
            var message = messages[i18n] ? messages[i18n].text : 0
            var itemValue = positionObj[tooltipItem.key]
            row.append("<td style='text-align:left; padding-right:20px; word-break: keep-all;white-space:nowrap;'>{0}</td>".format(message))
            row.append("<td style='text-align:left; word-break: keep-all;white-space:nowrap;' data-format='{0}'>{1}</td>".format(tooltipItem['format'], itemValue))
            row.format()
            div.append(row)
        }
    }
    div.format()
    return div.html()
}

function Portfolio_GetPositionObj(positionObj) {
    if (!positionObj) return
    var obj = {}
    var array = initial_data.views.trade.portfolio.schema.concat(initial_data.views.trade.portfolio.tooltip)
    for (var i = 0; i < array.length; i++) {
        var item = array[i]
        var value = positionObj[item.key]
        obj[item.key] = typeof value === 'undefined' ? null : value
    }
    $._setDefault(obj)
    return obj
}