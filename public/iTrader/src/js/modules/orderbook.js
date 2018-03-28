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

{ $Id: orderbook.js,v 1.11 2018/02/27 05:27:02 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'orderbook'
    var container
    var options
    var table
    var datatable
    var Ticket = require('ticket')
    var isMobile = require('mobile').GetIsMobile()
    var util = require('util')

    var orderbook_exchange_dropdown
    var filter_exchange
    var exchange_list = []
    var exchange_list_changed_flag = true
    var orders = {}
    exports.init = function (c, options) {
        container = c
        options = options || { defaultMarket: 'ALL' }
        filter_exchange = options.defaultMarket
        exchange_list.push(filter_exchange)
        if (filter_exchange != 'ALL') {
            exchange_list.push('ALL')
        }

        if (container.length <= 0) return
        table = $('#orderbook-table')
        if (table.length <= 0) return
        var schema = initial_data.views.trade.order_book.schema
        var tempSchema = []
        for (var i = 0; i < schema.length; i++) {
            tempSchema.push(schema[i])
        }
        tempSchema.push({ key: 'hide_exchange' })
        datatable = table.CreateDatatable({
            columnSchema: tempSchema,
            columnHeaderPrefix: 'orderbook_header_',
            order: [3, 'desc'],
            aoColumnDefs: [
                { "bSortable": false, "aTargets": [0, 1] },
                { className: "pointer", "targets": [3] },
                { className: 'prevent-popup-detail', "targets": [0, 1] }
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
        var columnsLength = datatable.columns()[0].length
        datatable.column(columnsLength - 1).visible(false)

        var table_container = $(datatable.table().container())
        var buttons_container = datatable.buttons().container()
        buttons_container.addClass('pull-right')
        buttons_container.find('a span').remove()
        buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
        buttons_container.appendTo(table_container.find('.dataTables_filter label'))
        $('#orderbook-filter').appendTo($('.col-sm-6:eq(0)', table_container))
        orderbook_exchange_dropdown = $('#orderbook-exchange-dropdown-group')

        OrderMgr.on(function (data) {
            if (!data) return
            for (var i = 0; i < data.length; i++) {
                var orderObj = data[i]
                if (util.IsOrderInPriceQuoteStage(orderObj)) continue
                if (orderObj.voucherType !== 'cash' && !IsOTCFund(orderObj)) {
                    orders[orderObj[6]] = orderObj
                    update(orderObj)
                }
            }
            datatable.draw(false)
            resetExchangeDropdownGroup()
        })

        // initialize status filter dropdown
        var orderbook_status_dropdown = $('#orderbook-status-dropdown-group')
        var status_data = { name: { i18n: 'history_order_filter_status' }, data: [{ key: 'ALL', value: messages.ALL.text }] }
        var status = initial_data.views.trade.order_book.filter.status
        for (var i = 0; i < status.length; i++) {
            status_data.data.push({ key: status[i], value: $._map.status(status[i]) })
        }
        orderbook_status_dropdown.CreateDrowdownGroup(status_data)

        // initialize exchange filter dropdown
        orderbook_exchange_dropdown.on('change', function (event, key) {
            filter_exchange = key
            datatable.clear()
            for (var o in orders) {
                update(orders[o])
            }
            datatable.draw()
        })
        resetExchangeDropdownGroup()

        var orderbook_columns_dataSrc = datatable.columns().dataSrc()
        if (orderbook_columns_dataSrc.length > 0) {
            var index = orderbook_columns_dataSrc.indexOf('5')
            if (index >= 0) {
                orderbook_status_dropdown.on('change', function (event, status) {
                    status = status === 'ALL' ? '' : $._map.status(status)
                    datatable.column(index).search(status).draw()
                })
            }
        }

        table.on('click', function (event) {
            var target = $(event.target)
            var action = target.attr('action')
            var orderNo = target.parents('tr').attr('id')
            if (orderNo && orderNo.length > 6) {
                if (action === 'change') {
                    Ticket.changeOrder(orderNo.substring(6))
                } else if (action === 'cancel') {
                    Ticket.cancelOrder(orderNo.substring(6))
                }
            }
        })
        container.translate()
    }

    function resetExchangeDropdownGroup() {
        if (!exchange_list_changed_flag) return
        orderbook_exchange_dropdown.empty()
        var exchangeDropdownGroupOptions = { name: { i18n: 'column_market' }, data: [{ key: filter_exchange, value: getExchangeValue(filter_exchange) }] }
        for (var i = 0; i < exchange_list.length; i++) {
            var e = exchange_list[i]
            if (e == filter_exchange) continue
            exchangeDropdownGroupOptions.data.push({ key: e, value: getExchangeValue(e) })
        }
        orderbook_exchange_dropdown.CreateDrowdownGroup(exchangeDropdownGroupOptions)
        exchange_list_changed_flag = false
    }

    function getExchangeValue(exchange) {
        if (!exchange) return ''
        if (exchange === 'ALL') return messages.ALL.text
        return $._map.exchange(exchange)
    }

    function update(orderObj) {
        if (!table || table.length <= 0) return
        if (typeof (orderObj) !== 'object' || !orderObj[6]) return
        var orderNo = orderObj[6]
        var exchange = orderObj[20]
        if (filter_exchange != 'ALL' && filter_exchange != exchange) return
        if (exchange_list.indexOf(exchange) < 0) {
            exchange_list.push(exchange)
            exchange_list_changed_flag = true
        }
        orderObj.DT_RowId = 'order-' + orderNo
        isBulkChildOrder(orderObj)
        var changeable = isChangeable(orderObj)
        var cancelable = isCancelable(orderObj)
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
        var row = datatable.UpdateRowData(orderObj)
        util.ApplyColor(row)
        if (initial_data.views.trade.order_book.trade_detail && row && row.isNewRow) {
            applyTradeDetail(row)
        }
    }

    function applyTradeDetail(row) {
        if (!row || !row.data()) return
        $(row.node()).find('.pointer').click(function () {
            if (isMobile) return
            var orderObj = row.data()
            if (!orderObj || !orderObj[6]) return
            var side = 0
            if (orderObj._raw && orderObj._raw[11] == 1) side = 1
            showMessage({
                title: messages.order_detail_title.text + orderObj[tags.account],
                type: side == '0' ? BootstrapDialog.TYPE_SUCCESS : BootstrapDialog.TYPE_DANGER,
                load: {
                    url: '/iTrader/order/get?orderNo=' + orderObj[6], callback: function (dialog) {
                        $('#order-detail-datetime').text(orderObj.datetime)
                        $('#order-detail-side').text(orderObj[11])
                        $('#order-detail-status').text(orderObj[5])
                        util.FormatOrderInfo(orderObj[0], dialog.$modal, function (symbolObj) {
                            if (Number($('#order-detail-avgPrice').text()) == 0) {
                                $('#order-detail-avgPrice').text(0)
                            }
                            addTradeDetail(orderObj, symbolObj)
                        })
                    }
                }
            })
        })
    }

    function addTradeDetail(orderObj, symbolObj) {
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
            var newTradeObj = $.extend({}, orderObj.trades[p])
            if (typeof newTradeObj.originalTradePrice !== 'undefined' || newTradeObj.originalTradePrice !== '') {
                newTradeObj[3] = newTradeObj.originalTradePrice
            }
            newTradeObj[3] = getDisplayPrice(newTradeObj[3], 'order', orderObj)
            // newTradeObj.DT_RowId = 'trade-' + newTradeObj[tags.tranNo]  // special transNo (e.g. BMFTS_T173048:96) will have issues. jQuery id attribute not support some character.
            order_detail_datatable.UpdateRowData(newTradeObj)
        }
        order_detail_datatable.draw()
        order_detail_table.format()
        order_detail_table.translate()
        order_detail_table.removeClass('hidden')
    }

    function isChangeable(orderObj) {
        if (!orderObj || !orderObj._raw) return
        if (orderObj.isBulkChildOrder) return false
        if (util.IsPriceQuoteOrder(orderObj)) return false
        var changeRule = initial_data.views.trade.order_book.change
        if (!changeRule) return
        var status = orderObj._raw[5]
        var operatorFlag = orderObj._raw[400]
        if (changeRule.status.indexOf(status) >= 0 && (changeRule.channel.indexOf(operatorFlag) >= 0 || changeRule.channel.indexOf('*') >= 0)) {
            return changeRule.changeable
        } else {
            return !changeRule.changeable
        }
    }

    function isCancelable(orderObj) {
        if (!orderObj || !orderObj._raw) return
        if (orderObj.isBulkChildOrder) return false
        var cancelRule = initial_data.views.trade.order_book.cancel
        if (!cancelRule) return
        var status = orderObj._raw[5]
        var operatorFlag = orderObj._raw[400]
        if (cancelRule.status.indexOf(status) >= 0 && (cancelRule.channel.indexOf(operatorFlag) >= 0 || cancelRule.channel.indexOf('*') >= 0)) {
            return cancelRule.cancelable
        } else {
            return !cancelRule.cancelable
        }
    }

    function isBulkChildOrder(orderObj) {
        if (!orderObj || !orderObj._raw) return
        var raw = orderObj._raw
        if (raw["489"] && (raw["489"] & 32768)) {
            orderObj.isBulkChildOrder = true
            var remark = raw["25"] || ''
            if (remark.indexOf(messages.remark_bulk_order.text) < 0) {
                remark = messages.remark_bulk_order.text + remark
            }
            orderObj["25"] = remark
        }
    }
})