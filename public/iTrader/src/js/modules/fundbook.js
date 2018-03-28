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

{ $Id: fundbook.js,v 1.15 2017/11/06 09:34:04 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'fund_book'
    var container
    var setting
    var table
    var datatable
    var ticket = require('ticket')
    var util = require('util')
    var isMobile = require('mobile').GetIsMobile()
    exports.init = function (c, s) {
        container = c
        setting = s
        if (!container || !(container instanceof jQuery)) return
        if (!setting || !setting.schema || setting.schema.length <= 0) return
        table = container.find('#fund-book-table')
        if (!table || table.length <= 0) return
        draw()

        OrderMgr.on(function (data) {
            if (!data || data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    var order = data[i]
                    if (IsOTCFund(order)) {
                        update(order)
                    }
                }
                datatable.draw(false)
            }
        })
    }

    function draw() {
        var extraRowIndex = -1
        var k = 0
        for (var i = 0; i < setting.schema.length; i++) {
            if (isMobile && setting.schema[i].mobile == false) {
                k++
            }
            if (setting.schema[i].key == 6) {
                extraRowIndex = i - k
            }
        }
        datatable = table.CreateDatatable({
            columnSchema: setting.schema,
            columnHeaderPrefix: 'fundbook_header_',
            order: [2, 'desc'],
            aoColumnDefs: [
                { "bSortable": false, "aTargets": [0, 1] },
                { className: "extra-row", "targets": [extraRowIndex] },
                { className: 'prevent-popup-detail', "targets": [0, 1, 2,] }
            ],
            buttons: [
                {
                    extend: 'print',
                    className: 'btn-print'
                }
            ],
            getExtraRow: getSwitchInfo
        })
        var table_container = $(datatable.table().container())
        var buttons_container = datatable.buttons().container()
        buttons_container.addClass('pull-right')
        buttons_container.find('a span').remove()
        buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
        buttons_container.appendTo(table_container.find('.dataTables_filter label'))
        $(document).translate()
        table.on('click', function (event) {
            var target = $(event.target)
            var action = target.attr('action')
            var tr = target.parents('tr')
            var orderNo = tr.attr('id')
            var row = datatable.row(tr)
            if (orderNo && orderNo.length > 12) {
                if (action === 'change') {
                    ticket.changeOrder(orderNo.substring(11))
                } else if (action === 'cancel') {
                    if (row.data().switchID) {
                        cancelOrder(row)
                    } else {
                        ticket.cancelOrder(orderNo.substring(11))
                    }
                }
            }
        })
    }

    function cancelOrder(row) {
        var orderNo = []
        showMessage({
            title: messages.ticket_order_cancel_confirmation_title.text + AccountMgr.current_account,
            buttonNameList: ['submit', 'close'],
            message: getFundSwitchCancelConfirmation(row),
            callback: function (button, dialog) {
                if (button.name === 'close') {
                    dialog.close()
                } else if (button.name === 'submit') {
                    var data = row.data()
                    var _csrf = $('input[name=_csrf]').val()
                    for (var key in data.FundSwitchOrderList) {
                        orderNo.push(data.FundSwitchOrderList[key].orderNo)
                    }
                    var dataString = '_csrf=' + _csrf + '&orderNo=' + data[6] + '&cmd=cancel'
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
            },
        })
    }

    function update(orderObj) {
        if (typeof (orderObj) !== 'object' || !orderObj[tags.orderNo]) return
        orderObj.DT_RowId = 'fund-order-' + orderObj._id
        var changeable = orderObj._raw[5] == 1 && !orderObj.switchID
        var cancelable = orderObj._raw[5] == 1
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
    }

    function getFundSwitchCancelConfirmation(row) {
        var html = $(getSwitchInfo(row))
        html.find('table').css('margin-bottom', '20px')
        html.attr('class', 'col-sm-12')
        return html.html()
    }

    /**
     * 
     * @param {Object} row, the row object(groud record) in fund book, must specify row or FundSwitchOrderList
     * @param {Array} FundSwitchOrderList, fund switch order list, must specify row or FundSwitchOrderList
     * @param {Object} options, support iconType, posiable value "normal"(default), "none"(no icon, always in confirm box) and "enhance"(result icons, success or failed) 
     */
    function getSwitchInfo(row, FundSwitchOrderList, options) {
        if (!row && !FundSwitchOrderList) return ''
        options = options || {}
        if (!FundSwitchOrderList) {
            var data = row.data()
            if (data) {
                FundSwitchOrderList = data.FundSwitchOrderList
            }
        }
        if (!FundSwitchOrderList) return ''
        var rowList = []
        var outer = $("<div>")
        var div = $("<div>", { class: "col-sm-offset-2 col-sm-8" }).appendTo(outer)
        var small = $("<small>").appendTo(div)
        var t = $("<table>", { class: "table table-bordered table-condensed", style: "margin-bottom: 0" }).appendTo(small)
        t.append($("<tr>").append($("<th>", { "data-i18n": "fund_switch_out_symbol", "class": "th-red" }))
            .append($("<th>", { "data-i18n": "fund_redeem_unit", "class": "th-red" }))
            .append($("<th>", { "data-i18n": "column_currency", "class": "th-red" }))
            .append($("<th>", { "class": "table-division", "style": "vertical-align: middle;text-align: center;padding: 0px; background-color:#ECF0F1;" })
                .append("<i class='fa fa-2x fa-arrow-circle-right text-success'></i>"))
            .append($("<th>", { "data-i18n": "fund_switch_in_symbol", "class": "th-green" }))
            .append($("<th>", { "data-i18n": "fund_switch_in_allocation", "class": "th-green" }))
            .append($("<th>", { "data-i18n": "column_currency", "class": "th-green" })))

        var orderStatus = 1
        var inList = []
        var outList = []
        for (var p in FundSwitchOrderList) {
            var obj = FundSwitchOrderList[p]
            if (obj[11] == 0) {
                inList.push(obj)
            } else {
                outList.push(obj)
            }
            if (obj._isErrorOrder || obj[5] == -1 || obj[5] == 4) {
                orderStatus = -1
            }
        }
        var maxLength = inList.length > outList.length ? inList.length : outList.length
        for (var i = 0; i < maxLength; i++) {
            if (outList.length > i) {
                rowList.push(outList[i])
            } else {
                rowList.push(false)
            }
            if (inList.length > i) {
                rowList.push(inList[i])
            } else {
                rowList.push(false)
            }
        }
        for (var i = 0; i < rowList.length; i = i + 2) {
            var inItem = rowList[i] || {}
            var outItem = rowList[i + 1] || {}
            var inItemIcon = ''
            var outItemIcon = ''
            if (options.iconType !== 'none') {
                if (inItem._isErrorOrder) {
                    inItemIcon = "<i class='fa fa-times-circle text-danger' style='margin-right:5px;' title='{0}'></i>".format((getErrorMessage(inItem) || '').replace("<br />", ""))
                } else if (inItem[0]) {
                    if (orderStatus == -1) {
                        inItemIcon = "<i class='fa fa-check-circle text-muted' style='margin-right:5px;'></i>"
                    } else {
                        inItemIcon = "<i class='fa fa-check-circle text-success' style='margin-right:5px;'></i>"

                    }
                }
                if (outItem._isErrorOrder) {
                    outItemIcon = "<i class='fa fa-times-circle text-danger' style='margin-right:5px;' title='{0}'></i>".format((getErrorMessage(outItem) || '').replace("<br />", ""))
                } else if (outItem[0]) {
                    if (orderStatus == -1) {
                        outItemIcon = "<i class='fa fa-check-circle text-muted' style='margin-right:5px;'></i>"
                    } else {
                        outItemIcon = "<i class='fa fa-check-circle text-success' style='margin-right:5px;'></i>"
                    }
                }
            }
            t.append($("<tr>").append($("<td>", { html: inItemIcon + (inItem[0] || ''), title: inItem.symbolName || '' })
                .append($("<td>", { text: inItem[4] || '', "data-format": '-' + initial_data.format.fund_unit, class: "text-right" }))
                .append($("<td>", { text: inItem[23] || '', }))
                .append($("<td>", { html: outItemIcon + (outItem[0] || ''), title: outItem.symbolName || '' }))
                .append($("<td>", { text: outItem.allocation || '', class: "text-right" }))
                .append($("<td>", { text: outItem[23] || '', }))))
        }
        t.find('.table-division').attr('rowspan', maxLength + 1).css('padding', '5px')
        outer.translate()
        outer.format()
        return outer.html()
    }

    exports.GetFundSwitchInfo = getSwitchInfo
})