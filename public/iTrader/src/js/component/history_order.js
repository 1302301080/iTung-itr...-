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

{ $Id: history_order.js,v 1.13 2017/05/22 09:28:53 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var history_orderbook_panel
var history_orderbook_table
var history_orderbook_datatable
var history_orderbook_btn
var history_days = ''
var history_status_column_index = -1
var history_status_dropdown
var history_days_dropdown
function HistoryOrderBook_Initialize() {
    history_orderbook_panel = $('#history-order-book-panel')
    if (history_orderbook_panel.length <= 0) return
    history_orderbook_table = $('#history-orderbook-table')
    history_orderbook_btn = $('#order-history-btn')
    history_status_dropdown = $('#order-history-status-dropdown-group')
    history_days_dropdown = $('#order-history-days-dropdown-group')

    var schema = initial_data.views.trade.history_order.schema
    history_orderbook_datatable = CreateDatatable(history_orderbook_table, {
        columnSchema: initial_data.views.trade.history_order.schema,
        columnHeaderPrefix: 'history_order_header_',
        buttons: [
            {
                extend: 'print',
                className: 'btn-print'
            }
        ]
    })
    var table_container = $(history_orderbook_datatable.table().container())
    var buttons_container = history_orderbook_datatable.buttons().container()
    UpdateDataTableSearchBox(table_container)
    buttons_container.addClass('pull-right')
    buttons_container.find('a span').remove()
    buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
    buttons_container.appendTo(table_container.find('.dataTables_filter label'))
    $('#order-history-form').appendTo($('.col-sm-6:eq(0)', history_orderbook_datatable.table().container()))

    history_orderbook_btn.click(function () {
        history_orderbook_btn.find('.btn-icon-spinner').removeClass('hidden')
        history_orderbook_btn.find('.btn-icon-search').addClass('hidden')
        history_orderbook_btn.attr('disabled', 'disabled')
        $.ajax({
            type: 'post',
            url: '/iTrader/order/history',
            data: $('#order-history-form').serialize() + '&days=' + history_days,
            success: function (data) {
                HistoryOrderBook_Process(data)
                HistoryOrderBookBtn_Reset()
            },
            error: function (error) {
                handleError(error)
                HistoryOrderBookBtn_Reset()
            }
        })
    })

    var status_data = { name: { i18n: 'history_order_filter_status' }, data: [{ key: 'ALL', value: messages.ALL.text }] }
    var days_data = { name: { i18n: 'history_order_filter_days' }, data: [] }
    var status = initial_data.views.trade.history_order.filter.status
    var days = initial_data.views.trade.history_order.filter.days
    for (var i = 0; i < status.length; i++) {
        status_data.data.push({ key: status[i], value: $._map.status(status[i]) })
    }
    for (var j = 0; j < days.length; j++) {
        days_data.data.push({ key: days[j], value: days[j] + messages.history_order_filter_days_before.text })
    }
    history_status_dropdown.CreateDrowdownGroup(status_data)
    history_days_dropdown.CreateDrowdownGroup(days_data)

    var history_columns_dataSrc = history_orderbook_datatable.columns().dataSrc()
    if (history_columns_dataSrc.length > 0) {
        var index = history_columns_dataSrc.indexOf('status_text')
        if (index <= 0) return
        history_status_dropdown.on('change', function (event, status) {
            status = status === 'ALL' ? '' : $._map.status(status)
            history_orderbook_datatable.column(index).search(status).draw()
        })
    }
    history_days_dropdown.on('change', function (event, days) {
        history_days = days
    })
}

function HistoryOrderBook_Process(data) {
    history_orderbook_datatable.clear()
    if (_.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
            var orderObj = data[i]
            orderObj.status_text = $._map.status(orderObj[tags.status])
            orderObj.side_text = $._map.side(orderObj[tags.side])
            orderObj.source_text = $._map.source(orderObj[tags.operatorFlag])
            orderObj.datetime = GetDatetimeFromOrder(orderObj) || orderObj[tags.time]
            orderObj[tags.price] = $._format.price(orderObj[tags.price], SpreadMgr.getSpreadPrecision(orderObj[tags.symbol], orderObj[tags.price]))
            orderObj[tags.price2] = $._format.price(orderObj[tags.price2], SpreadMgr.getSpreadPrecision(orderObj[tags.symbol], orderObj[tags.price2]) + 1)
            orderObj.DT_RowId = 'orderhistory-' + orderObj[tags.orderNo]
            history_orderbook_datatable.UpdateRowData(orderObj)
        }
    }
    history_orderbook_datatable.draw()
}

function HistoryOrderBookBtn_Reset() {
    history_orderbook_btn.find('.btn-icon-spinner').addClass('hidden')
    history_orderbook_btn.find('.btn-icon-search').removeClass('hidden')
    history_orderbook_btn.removeAttr('disabled')
}