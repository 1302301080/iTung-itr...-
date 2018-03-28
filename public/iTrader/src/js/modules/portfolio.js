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

{ $Id: portfolio.js,v 1.9 2017/12/26 03:14:36 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var options = {}
    var container
    var table
    var datatable
    var portfolio_exchange_dropdown
    var util = require('util')

    var filter_exchange

    function init(c, opt) {
        container = c
        options = opt || { defaultMarket: 'ALL' }
        if (typeof options.disableTooltip === 'undefined') {
            options.disableTooltip = false
        }
        filter_exchange = options.defaultMarket === 'ALL' ? '' : options.defaultMarket
        if (!container || container.length <= 0) return
        if (container.find('table').length <= 0) return

        table = $(container.find('table')[0])
        portfolio_exchange_dropdown = $('#portfolio-dropdown-group')
        var schema = options.schema || initial_data.views.trade.portfolio.schema
        var tempSchema = []
        for (var i = 0; i < schema.length; i++) {
            tempSchema.push(schema[i])
        }
        tempSchema.push({ key: 'hide_exchange' })
        tempSchema.push({ key: 'hide_account' })
        datatable = table.CreateDatatable({
            columnSchema: tempSchema,
            columnHeaderPrefix: 'portfolio_header_',
            pageLength: 7,
            columnDefs: [
                { className: "copyprice" + (options.disableTooltip ? '' : ' portfolio-extra'), "targets": [0] }
            ]
        })
        var columnsLength = datatable.columns()[0].length
        datatable.column(columnsLength - 1).visible(false)
        datatable.column(columnsLength - 2).visible(false)

        var table_container = $(datatable.table().container())
        var buttons_container = datatable.buttons().container()
        table_container.find('.dataTables_filter label').addClass('search-box').appendTo($('#portfolio-search'))


        buttons_container.addClass('pull-right')
        buttons_container.find('a span').remove()
        buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
        buttons_container.appendTo(table_container.find('.dataTables_filter label'))


        $('#nav_account').on('change', function () {
            reset()
        })

        portfolio_exchange_dropdown.on('change', function (event, value) {
            filter_exchange = value === 'ALL' ? '' : value
            reset()
        })

        PositionMgr.on(function (data) {
            if (!data || data.length <= 0) return
            for (var i = 0; i < data.length; i++) {
                update(data[i])
            }
            datatable.draw(false)
        })

        ExchangeMgr.on(function () {
            resetDropdownGroup(options)
        })

        table.on('click', function (e) {
            if ($(e.target).hasClass('copyprice')) {
                var rowId = '#' + $(e.target).parent('tr').attr('id')
                var row = datatable.row(rowId)
                if (row && typeof row.data === 'function') {
                    var rowData = datatable.row(rowId).data()
                    if (!rowData || !rowData._raw) return
                    window.postMessage({
                        name: 'copy-symbol',
                        exchange: rowData._raw[20],
                        symbol: rowData._raw[0],
                        type: 'sell',
                        quantity: GetMaxSellSync(rowData._raw[0])
                    }, '/')
                }
            }
        })
        container.translate()
    }

    function update(positionObj) {
        if (!positionObj || !positionObj._raw) return
        var positionRaw = positionObj._raw
        if (AccountMgr.current_account && positionRaw[10] !== AccountMgr.current_account) return
        if (filter_exchange && positionRaw[20] !== filter_exchange) return
        var symbol = positionRaw[0]
        var account = positionRaw[10]
        var exchange = positionRaw[20]
        positionObj.DT_RowId = 'position-' + account + '-' + symbol
        if (exchange && ExchangeMgr.exchange_flag[exchange]) {
            positionObj[0] = "<i class='flag-icon {0}' style='margin-right:5px;'></i>{1}".format(ExchangeMgr.exchange_flag[exchange], symbol)
        }

        util.HandleZeroShowNA(positionObj)
        var row = datatable.UpdateRowData(positionObj, {
            IsRemove: function (data) {
                return data[tags.quantity] == 0 || data.voucherType === 'cash'
            }
        })
        if (!row || !row.isNewRow) return
        $(row.node()).find('.portfolio-extra').each(function () {
            if ($(this).attr('data-toggle') === 'tooltip') return
            $(this).attr('data-toggle', 'tooltip').attr('data-placement', 'right')
            var that = this
            $(this).tooltip({
                html: true, container: 'body', trigger: 'hover', title: function () {
                    var row = datatable.row('#' + $(that).parent('tr').attr('id'))
                    if (row && row.data()) {
                        return hint(row.data())
                    }
                }
            })
        })
    }

    function resetDropdownGroup(opt) {
        // options.defaultMarket
        var options = { name: { i18n: 'portfolio_market' }, data: [{ key: opt.defaultMarket, value: opt.defaultMarket == 'ALL' ? messages.ALL.text : $._map.exchange(opt.defaultMarket) }] }
        if (options.data[0].key != 'ALL') {
            options.data.push({ key: 'ALL', value: messages.ALL.text })
        }
        for (var i = 0; i < ExchangeMgr.exchanges.length; i++) {
            var e = ExchangeMgr.exchanges[i]
            if (e == opt.defaultMarket) continue
            options.data.push({ key: e, value: $._map.exchange(e) })
        }
        portfolio_exchange_dropdown.CreateDrowdownGroup(options)
    }

    function reset() {
        datatable.clear()
        var positions = PositionMgr.get({ account: AccountMgr.current_account, exchange: filter_exchange })
        for (var i = 0; i < positions.length; i++) {
            update(positions[i])
        }
        datatable.draw()
    }

    function hint(positionObj) {
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
                if (typeof itemValue === 'undefined' || itemValue == null) itemValue = ''
                row.append("<td style='text-align:left; padding-right:20px; word-break: keep-all;white-space:nowrap;'>{0}</td>".format(message))
                row.append("<td style='text-align:left; word-break: keep-all;white-space:nowrap;' data-format='{0}'>{1}</td>".format(tooltipItem['format'], itemValue))
                div.append(row)
            }
        }
        div.format()
        return div.html()
    }
    exports.init = init
})