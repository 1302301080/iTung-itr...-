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

{ $Id: cashbook.js,v 1.2 2017/05/24 04:32:40 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'cashbook'
    var container
    var table
    var datatable
    function init(c, options) {
        container = c
        if (!container || container.length <= 0) return
        if (container.find('table').length <= 0) return

        table = $(container.find('table')[0])
        datatable = table.CreateDatatable({
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
        var table_container = $(datatable.table().container())
        var buttons_container = datatable.buttons().container()
        buttons_container.addClass('pull-right')
        buttons_container.find('a span').remove()
        buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
        buttons_container.appendTo(table_container.find('.dataTables_filter label'))

        OrderMgr.on(function (data) {
            if (!data) return
            for (var i = 0; i < data.length; i++) {
                var orderObj = data[i]
                if (orderObj && orderObj[6]) {
                    if (orderObj.voucherType === 'cash') {
                        orderObj.DT_RowId = 'order-' + orderObj[6]
                        datatable.UpdateRowData(orderObj)
                    }
                }
            }
            datatable.draw()
        })
        container.translate()
    }

    exports.init = init
})