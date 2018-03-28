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

{ $Id: price_quote.js,v 1.9 2018/02/28 03:51:00 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    require('datatables')
    var container
    var datatable
    var table
    var util = require('util')

    function init(c) {
        if (!c) return
        container = c
        table = c.find('table')
        if (table.length <= 0) return
        datatable = table.CreateDatatable({
            columnSchema: initial_data.views.trade.price_quote_book.schema,
            columnHeaderPrefix: 'orderbook_header_',
            order: [3, 'desc'],
            aoColumnDefs: [
                { "bSortable": false, "aTargets": [0, 1] },
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
        var table_container = $(datatable.table().container())
        var buttons_container = datatable.buttons().container()
        buttons_container.addClass('pull-right')
        buttons_container.find('a span').remove()
        buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
        buttons_container.appendTo(table_container.find('.dataTables_filter label'))
        $('#pricequote-filter').appendTo($('.col-sm-6:eq(0)', table_container))

        OrderMgr.on(function (data) {
            if (!data || data.length <= 0) return
            for (var i = 0; i < data.length; i++) {
                var orderObj = data[i]
                if (util.IsPriceQuoteOrder(orderObj)) {
                    update(orderObj)
                }
            }
            datatable.draw(false)
        })


        var pricequote_status_data = {
            name: { i18n: 'pricequote_status' }, data: [
                { key: 'ALL', value: messages.ALL.text },
                { key: 'quote_1', value: messages.oms.status_quote_1 },
                { key: 'quote_2', value: messages.oms.status_quote_2 },
                { key: 'quote_3', value: messages.oms.status_quote_3 },
            ]
        }
        var status = initial_data.views.trade.order_book.filter.status
        var pricequote_status_dropdown = $('#pricequote-status-dropdown-group')
        pricequote_status_dropdown.CreateDrowdownGroup(pricequote_status_data)

        var pricequote_columns_dataSrc = datatable.columns().dataSrc()
        if (pricequote_columns_dataSrc.length > 0) {
            var index = pricequote_columns_dataSrc.indexOf('5')
            if (index >= 0) {
                pricequote_status_dropdown.on('change', function (event, status) {
                    status = status === 'ALL' ? '' : $._map.status(status)
                    datatable.column(index).search(status).draw()
                })
            }
        }

        table.on('click', function (event) {
            var target = $(event.target)
            var action = target.attr('action')
            var tr = target.parents('tr')
            var row = datatable.row(tr)
            var data = row.data()
            if (action === 'agree') {
                agreeOrder(data)
            } else if (action === 'cancel') {
                disagreeOrder(data)
            }
        })
        container.translate()
    }

    function agreeOrder(data) {
        if (!data) return
        var orderNo = data[6]
        var order = OrderMgr.get(orderNo)
        if (!order) return
        showMessage({
            title: messages.price_quote_agree_confirmation_title.text + AccountMgr.current_account,
            type: BootstrapDialog.TYPE_SUCCESS,
            load: {
                url: '/iTrader/order/pricequote/comfirm?orderNo=' + orderNo, callback: function (dialog) {
                    current.symbol = $('#cancel-confirmation-symbol').text()
                    dialog.$modal.format()
                    dialog.$modal.translate()
                    dialog.$modal.find('[data-format=price]').each(function () {
                        $(this).text(getDisplayPrice($(this).text(), 'order', order))
                    })
                }
            },
            buttonNameList: ['submit', 'close'],
            callback: function (button, dialog) {
                if (button.name === 'close') {
                    dialog.close()
                } else if (button.name === 'submit') {
                    var _csrf = $('input[name=_csrf]').val()
                    var dataString = '_csrf=' + _csrf + '&orderNo=' + orderNo + '&cmd=change'
                    $.ajax({
                        type: 'post',
                        url: '/iTrader/order/submit',
                        data: dataString,
                        success: function (data) {
                            if (!data) {
                                handleError(data)
                            } else {
                                alertMessage({
                                    title: messages.dialog_information_title.text,
                                    message: messages.order_confirmation_order_submitted_message.text
                                })
                            }
                        },
                        error: handleError
                    })
                    dialog.close()
                }
            }

        })
    }

    function disagreeOrder(data) {
        if (!data) return
        var orderNo = data[6]
        var order = OrderMgr.get(orderNo)
        if (!order) return
        showMessage({
            title: messages.price_quote_cancel_confirmation_title.text + order[tags.account],
            type: BootstrapDialog.TYPE_DANGER,
            load: {
                url: '/iTrader/order/cancel?orderNo=' + orderNo + '&tempNo=' + new Date().getTime(), callback: function (dialog) {
                    current.symbol = $('#cancel-confirmation-symbol').text()
                    dialog.$modal.format()
                    dialog.$modal.translate()
                    dialog.$modal.find('[data-format=price]').each(function () {
                        $(this).text(getDisplayPrice($(this).text(), 'order', order))
                    })
                }
            },
            buttonNameList: ['submit', 'close'],
            callback: function (button, dialog) {
                if (button.name === 'close') {
                    dialog.close()
                } else if (button.name === 'submit') {
                    var _csrf = $('input[name=_csrf]').val()
                    var dataString = '_csrf=' + _csrf + '&orderNo=' + orderNo + '&cmd=cancel'
                    $.ajax({
                        type: 'post',
                        url: '/iTrader/order/submit',
                        data: dataString,
                        success: function (data) {
                            if (!data) {
                                handleError(data)
                            } else {
                                alertMessage({
                                    title: messages.dialog_information_title.text,
                                    message: messages.order_confirmation_order_cancel_submitted_message.text
                                })
                            }
                        },
                        error: handleError
                    })
                    dialog.close()
                }
            }
        })
    }

    function update(orderObj) {
        if (!table || table.length <= 0) return
        var row = datatable.row()
        if (typeof (orderObj) !== 'object' || !orderObj[tags.orderNo]) return
        orderObj.DT_RowId = 'price-quote-order-' + orderObj._id
        isBulkChildOrder(orderObj)
        var status = orderObj._raw[5]
        var qstate = orderObj._raw[487].QState
        var hasManualFlag = (orderObj._raw[40] & 32) > 0
        if (qstate && hasManualFlag && status == 1) {
            orderObj[5] = $._map.status('quote_' + qstate)
        }
        var agreeable = isAgreeable(orderObj)
        var cancelable = isCancelable(orderObj)
        if (agreeable) {
            orderObj.agree = "<a href='javascript:void(0);'><i class='fa fa-check fa-lg text-success' title='{0}' action='agree'></i></a>".format(messages.price_quote_agree.text)
        } else {
            orderObj.agree = "<i class='fa fa-check fa-lg text-muted' title='{0}'></i>".format(messages.price_quote_agree.text)
        }
        if (cancelable) {
            orderObj.cancel = "<a href='javascript:void(0);'><i class='fa fa-remove fa-lg text-danger' title='{0}' action='cancel'></i></a>".format(messages.price_quote_cancel.text)
        } else {
            orderObj.cancel = "<i class='fa fa-remove fa-lg text-muted' title='{0}'></i>".format(messages.price_quote_cancel.text)
        }
        var row = datatable.UpdateRowData(orderObj, {
            IsRemove: function (data) {
                return !util.IsOrderInPriceQuoteStage(data)
            }
        })
        util.ApplyColor(row)
        var rows = datatable.rows()
        var noticNum = 0
        for (var i = 0; i < rows[0].length; i++) {
            var data = datatable.row(i).data()
            if (isAgreeable(data)) {
                noticNum++
            }
        }
        if (noticNum) {
            $('#tab-price_quote_book').addClass('tab-message-notice')
            $('#tab-price_quote_book').text(noticNum)
        } else {
            $('#tab-price_quote_book').removeClass('tab-message-notice')
            $('#tab-price_quote_book').text('')
        }
    }

    function isCancelable(orderObj) {
        if (!orderObj || !orderObj._raw) return
        if (IsOutstandingStatus(orderObj._raw[5])) {
            return true
        } else {
            return false
        }
    }

    function isAgreeable(orderObj) {
        if (!orderObj || !orderObj._raw) return
        if (orderObj._raw[5] == 1 && orderObj._raw[487].QState == 3 && (orderObj._raw[40] & 32) != 0) {
            return true
        } else {
            return false
        }
    }

    function isBulkChildOrder(orderObj) {
        if (!orderObj) return
        if (orderObj["489"] && (orderObj["489"] & 32768)) {
            orderObj.isBulkChildOrder = true
            var remark = orderObj["25"] || ''
            if (remark.indexOf(messages.remark_bulk_order.text) < 0) {
                remark = messages.remark_bulk_order.text + remark
            }
            orderObj["25"] = remark
        }
    }

    exports.init = init
})