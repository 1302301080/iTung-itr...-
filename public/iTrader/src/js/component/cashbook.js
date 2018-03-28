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

{ $Id: cashbook.js,v 1.9 2016/12/20 11:04:17 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var cashbook_panel
var cashbook_table
var cashbook_datatable
function CashBook_Initialize() {
    cashbook_panel = $('#cash-book-panel')
    if (cashbook_panel.length <= 0) return
    cashbook_table = $('#cash-book-table')
    if (cashbook_table.length <= 0) return

    var schema = initial_data.views.trade.cash_book.schema
    cashbook_datatable = cashbook_table.CreateDatatable({
        columnSchema: initial_data.views.trade.cash_book.schema,
        columnHeaderPrefix: 'cashbook_header_',
        order: [1, 'desc'],
        buttons: [
            {
                extend: 'print',
                className: 'btn-print'
            }
        ]
    })
    var table_container = $(cashbook_datatable.table().container())
    var buttons_container = cashbook_datatable.buttons().container()
    buttons_container.addClass('pull-right')
    buttons_container.find('a span').remove()
    buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
    buttons_container.appendTo(table_container.find('.dataTables_filter label'))

    $(document).on('orders', function (event, data) {
        if (!data || !data.orders) return
        _(data.orders).forEach(function (orderObj) {
            if (orderObj.voucherType === 'cash') {
                CashBookTable_Add(orderObj)
            }
        })
        cashbook_datatable.draw()
    })
}

function CashBookTable_Add(orderObj) {
    if (cashbook_datatable.length > 0) return
    if (typeof (orderObj) !== 'object' || !orderObj[tags.orderNo]) return
    var orderNo = orderObj[tags.orderNo]
    orderObj.DT_RowId = 'order-' + orderNo
    orderObj.datetime = GetDatetimeFromOrder(orderObj) || orderObj[tags.time]
    cashbook_datatable.UpdateRowData(orderObj)
}