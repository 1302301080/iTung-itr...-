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

{ $Id: orderbook.js,v 1.15 2017/01/24 10:27:47 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var orderbook_panel
var orderbook_table
var orderbook_datatable
function OrderBook_Initialize() {
    orderbook_panel = $('#order-book-panel')
    if (orderbook_panel.length <= 0) return
    orderbook_table = $('#orderbook-table')
    if (orderbook_table.length <= 0) return

    var schema = initial_data.views.trade.order_book.schema
    orderbook_datatable = orderbook_table.CreateDatatable({
        columnSchema: initial_data.views.trade.order_book.schema,
        columnHeaderPrefix: 'orderbook_header_',
        order: [3, 'desc'],
        aoColumnDefs: [
            { "bSortable": false, "aTargets": [0, 1] },
            { className: "pointer", "targets": [3] }
        ],
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
        ]
    })
    var table_container = $(orderbook_datatable.table().container())
    var buttons_container = orderbook_datatable.buttons().container()
    buttons_container.addClass('pull-right')
    buttons_container.find('a span').remove()
    buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
    buttons_container.appendTo(table_container.find('.dataTables_filter label'))
    $('#orderbook-filter').appendTo($('.col-sm-6:eq(0)', table_container))

    $(document).on('orders', function (event, data) {
        if (!data || !data.orders) return
        _(data.orders).forEach(function (orderObj) {
            if (orderObj.voucherType !== 'cash' && !IsOTCFund(orderObj)) {
                OrderBookTable_Add(orderObj)
            }
        })
        orderbook_datatable.draw(false)
    })

    var orderbook_status_dropdown = $('#orderbook-status-dropdown-group')
    var status_data = { name: { i18n: 'history_order_filter_status' }, data: [{ key: 'ALL', value: messages.ALL.text }] }
    var status = initial_data.views.trade.order_book.filter.status
    for (var i = 0; i < status.length; i++) {
        status_data.data.push({ key: status[i], value: $._map.status(status[i]) })
    }
    orderbook_status_dropdown.CreateDrowdownGroup(status_data)

    var orderbook_columns_dataSrc = orderbook_datatable.columns().dataSrc()
    if (orderbook_columns_dataSrc.length > 0) {
        var index = orderbook_columns_dataSrc.indexOf('status_text')
        if (index <= 0) return
        orderbook_status_dropdown.on('change', function (event, status) {
            status = status === 'ALL' ? '' : $._map.status(status)
            orderbook_datatable.column(index).search(status).draw()
        })
    }

    orderbook_table.on('click', function (event) {
        var target = $(event.target)
        var action = target.attr('action')
        var orderNo = target.parents('tr').attr('id')
        if (orderNo && orderNo.length > 6) {
            if (action === 'change') {
                seajs.use('ticket', function (t) {
                    t.changeOrder(orderNo.substring(6))
                })
            } else if (action === 'cancel') {
                seajs.use('ticket', function (t) {
                    t.cancelOrder(orderNo.substring(6))
                })
            }
        }
    })
}

function OrderBookTable_Add(orderObj) {
    if (!orderbook_table || orderbook_table.length <= 0) return
    if (typeof (orderObj) !== 'object' || !orderObj[tags.orderNo]) return
    var orderNo = orderObj[tags.orderNo]
    orderObj.DT_RowId = 'order-' + orderNo
    OrderBook_IsBulkChildOrder(orderObj)
    var changeable = OrderBook_IsChangeable(orderObj)
    var cancelable = OrderBook_IsCancelable(orderObj)
    if (changeable) {
        orderObj.change = "<a href='javascript:void(0);'><i class='fa fa-edit fa-lg text-success' title='{0}' action='change'></i></a>".format(messages.orderbook_change.text)
    } else {
        orderObj.change = "<i class='fa fa-edit fa-lg text-muted' title='{0}'></i>".format(messages.orderbook_change.text)
    }
    if (cancelable) {
        orderObj.cancel = "<a href='javascript:void(0);'><i class='fa fa-remove fa-lg text-danger' title='{0}' action='cancel'></i></a>".format(messages.orderbook_cancel.text)
    } else {
        orderObj.cancel = "<i class='fa fa-remove fa-lg text-muted' title='{0}'></i>".format(messages.orderbook_cancel.text)
    }
    var row = orderbook_datatable.UpdateRowData(orderObj)

    OrderBookColorSchema_Apply(row)

    if (initial_data.views.trade.order_book.trade_detail && row && row.isNewRow) {
        OrderBookDetail_Apply(row)
    }
}

function OrderBookColorSchema_Apply(row) {
    if (!row || !row.data()) return
    var colorSchema = initial_data.views.trade.order_book.color_schema
    if (!colorSchema || colorSchema.length <= 0) return
    var status = row.data()[tags.status]
    var side = row.data()[tags.side]
    for (var i = 0; i < colorSchema.length; i++) {
        var schemaStatus = colorSchema[i].status
        var schemaSide = colorSchema[i].side
        if (typeof (schemaStatus) !== 'undefined') {
            if (status != schemaStatus) continue
        }
        if (typeof (schemaSide) !== 'undefined') {
            if (side != schemaSide) continue
        }
        if (colorSchema[i].class) {
            $(row.node()).addClass(colorSchema[i].class)
        }
        if (colorSchema[i].color) {
            $(row.node()).css('color', colorSchema[i].color)
        }
        if (colorSchema[i].background) {
            $(row.node()).css('background-color', colorSchema[i].background)
        }
    }
}

function OrderBookDetail_Apply(row) {
    if (!row || !row.data()) return
    $(row.node()).find('.pointer').click(function () {
        var orderNo = row.data()[tags.orderNo]
        if (!orderNo) return
        var orderObj = OrderMgr.get(orderNo)
        if (!orderObj) return
        showMessage({
            title: messages.order_detail_title.text + orderObj[tags.account],
            type: orderObj[tags.side] == '0' ? BootstrapDialog.TYPE_SUCCESS : BootstrapDialog.TYPE_DANGER,
            load: {
                url: '/iTrader/order/get?orderNo=' + orderNo + '&tempNo=' + new Date().getTime(), callback: function (dialog) {
                    OrderBookTradeDetail_Add(orderObj)
                    dialog.$modal.format()
                    dialog.$modal.translate()
                    $('#order-detail-datetime').text(orderObj.datetime)
                    $('#order-detail-price').text(orderObj[tags.price])
                    $('#order-detail-avgPrice').text(orderObj[tags.price2])
                    $('#order-detail-side').text(orderObj.side_text)
                    $('#order-detail-status').text(orderObj.status_text)
                }
            }
        })
    })
}

function OrderBookTradeDetail_Add(orderObj) {
    if (!orderObj || !orderObj.trades || $.isEmptyObject(orderObj.trades)) return
    var order_detail_table = $('#order-detail-table')
    var order_detail_datatable = order_detail_table.CreateDatatable({
        columnSchema: initial_data.views.trade.order_book.trade_schema,
        columnHeaderPrefix: 'trade_detail_header_',
        paging: false,
        ordering: false,
        info: false,
        searching: false,
        autoWidth: true,
    })
    for (var p in orderObj.trades) {
        var tradeObj = orderObj.trades[p]
        tradeObj.DT_RowId = 'trade-' + tradeObj[tags.tranNo]
        order_detail_datatable.UpdateRowData(tradeObj)
    }
    order_detail_datatable.draw()
    order_detail_table.format()
    order_detail_table.removeClass('hidden')
}

function OrderBook_IsChangeable(orderObj) {
    if (!orderObj) return
    if (orderObj.isBulkChildOrder) return false
    var changeRule = initial_data.views.trade.order_book.change
    if (!changeRule) return
    var status = orderObj[tags.status]
    var operatorFlag = orderObj[tags.operatorFlag]

    if (changeRule.status.indexOf(status) >= 0 && (changeRule.channel.indexOf(operatorFlag) >= 0 || changeRule.channel.indexOf('*') >= 0)) {
        return changeRule.changeable
    } else {
        return !changeRule.changeable
    }
}

function OrderBook_IsCancelable(orderObj) {
    if (!orderObj) return
    if (orderObj.isBulkChildOrder) return false
    var cancelRule = initial_data.views.trade.order_book.cancel
    if (!cancelRule) return
    var status = orderObj[tags.status]
    var operatorFlag = orderObj[tags.operatorFlag]
    if (cancelRule.status.indexOf(status) >= 0 && (cancelRule.channel.indexOf(operatorFlag) >= 0 || cancelRule.channel.indexOf('*') >= 0)) {
        return cancelRule.cancelable
    } else {
        return !cancelRule.cancelable
    }
}

function OrderBook_IsBulkChildOrder(orderObj) {
    if (!orderObj) return
    if (orderObj["489"] && (orderObj["489"] & 32768)) {
        orderObj.isBulkChildOrder = true
        var remark = orderObj["25"] || ''
        if(remark.indexOf(messages.remark_bulk_order.text) < 0) {
            remark = messages.remark_bulk_order.text + remark
        }
        orderObj["25"] = remark
    }
}