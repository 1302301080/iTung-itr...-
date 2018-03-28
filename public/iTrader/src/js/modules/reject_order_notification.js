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

{ $Id: reject_order_notification.js,v 1.1 2017/12/26 03:14:36 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

/* reject order handling
The reject reason get from OMSTag#25 in order image, and no need to handle multi-language: 
1.	Pop-up form: 
When UI is refreshed triggered by timer or by clicking some Buttons (including click “Refresh” button, place order, change order, cancel order, search on orderBook, search on orderHistory…), iwTrader will check which orders’ status are changed from non-rejected to rejected, then pop up a form to show reject reason for these orders in a Gridview (sorted by rejected time by descending order, in other word, the last rejected order so far will be shown as the first row on Gridview). And per rejected order is only shown one time in reject reason popup form. Please pay attention to that iwTrader will not pop up reject reason for those orders that are rejected before iwTrader is logined. Introduce a setting “PopupRejectReason” to turn on or turn off this feature. 
*/

define(function (require, exports, module) {
    var orderInitialized = false
    var lastReceivedOrderTime = null
    var isDialogPopup = false
    var orderList = {}
    function init() {
        OrderMgr.on(function (data) {
            if (lastReceivedOrderTime && ((new Date()).getTime - lastReceivedOrderTime > 1000)) orderInitialized = true
            lastReceivedOrderTime = (new Date()).getTime()
            if (!data) return
            for (var i = 0; i < data.length; i++) {
                var orderObj = data[i]
                if (orderObj && orderObj._raw && orderObj._raw[5] == -1) {
                    if (!orderList[orderObj._raw[6]]) {
                        orderList[orderObj._raw[6]] = {
                            "6": orderObj._raw[6],
                            "25": orderObj._raw[25],
                            "modifiedDatetime": orderObj.modifiedDatetime,
                            "unread": orderInitialized ? true : false,
                            "DT_RowId": 'order-reject-' + orderObj._raw[6]
                        }
                    } else {
                        orderList[orderObj._raw[6]][25] = orderObj._raw[25]
                    }
                }
            }
        })

        $(document).click(function () {
            check()
        })
        setInterval(function () {
            check()
        }, 10 * 1000)

        setTimeout(function () {
            orderInitialized = true
        }, 5000)
    }

    function check() {
        if (!orderList) return
        for (var p in orderList) {
            if (orderList[p].unread) {
                popup()
                return
            }
        }
    }

    function popup() {
        if (isDialogPopup) return   // do not popup duplicate dialog
        isDialogPopup = true
        showMessage({
            title: messages.dialog_reject_order_reason_title.text,
            message: getTable(),
            buttonNameList: ['close'],
            callback: function (button, dialog) {
                if (button.name === 'close') {
                    dialog.close()
                }
            },
            onshown: function () {
                var array = []
                for (var p in orderList) {
                    array.push(orderList[p])
                }
                array = array.sort(function (a, b) {
                    if (a.unread && !b.unread) return -1
                    if (b.unread && !a.unread) return 1
                    if (a.modifiedDatetime > b.modifiedDatetime) return -1
                    return 1
                })
                var table = $('#reject-order-table')
                table.CreateDatatable({
                    columnSchema: [
                        { key: 'modifiedDatetime', i18n: 'column_datetime' },
                        { key: '6', i18n: 'column_order_no' },
                        { key: '25', i18n: 'column_remark' },
                    ],
                    order: [],
                    data: array,
                    searching: false
                })
                table.translate()
                table.find('tr').each(function () {
                    var id = $(this).attr('id')
                    for (var p in orderList) {
                        if (('order-reject-' + orderList[p][6]) === id && orderList[p].unread) {
                            $(this).addClass('text-danger')
                            break
                        }
                    }
                })
            },
            onhidden: function () {
                isDialogPopup = false
                for (var p in orderList) {
                    orderList[p].unread = false
                }
            }
        })
    }

    function getTable() {
        var container = $("<div></div>")
        var table = $("<table>", { id: "reject-order-table", class: "table table-bordered table-hover table-condensed table-striped" })
        var thead = $("<thead></thead>")
        var tbody = $("<tbody>")

        // for (var i = 0; i < array.length; i++) {
        //     var item = array[i]
        //     tbody.append($("<tr>", { class: item.unread ? 'text-danger' : '' })
        //         .append($("<td>", { text: item.modifiedDatetime }))
        //         .append($("<td>", { text: item[6] }))
        //         .append($("<td>", { text: item[25] })))
        // }
        container.append(table.append(thead).append(tbody))
        container.translate()
        return container.html()
    }

    exports.init = init
})