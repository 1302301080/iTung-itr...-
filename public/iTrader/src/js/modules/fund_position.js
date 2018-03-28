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

{ $Id: fund_position.js,v 1.7 2017/11/06 09:34:04 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'fund_position'
    var container
    var setting
    var table
    var datatable
    var positions
    exports.init = function (c, s) {
        container = c
        setting = s
        if (!container || !(container instanceof jQuery)) return
        if (!setting) return
        table = container.find('#fund-position-table')
        if (!table || table.length <= 0) return
        draw()
        table.click(function (e) {
            var target = $(e.target)
            if (target.hasClass('pointer') && target.get(0).tagName == 'TD') {
                window.postMessage({ name: 'copy-symbol', symbol: target.text(), type: 'sell' }, '/')
            }
        })

        PositionMgr.on(function (data) {
            if (!data || data.length <= 0) return
            for (var i = 0; i < data.length; i++) {
                var obj = data[i]
                if (IsOTCFund(obj)) {
                    var newObj = $.extend(false, {}, obj)
                    newObj.DT_RowId = 'fund-position-' + obj[0]
                    datatable.UpdateRowData(newObj)
                }
            }
            datatable.draw(false)
        })
    }

    function draw() {
        datatable = table.CreateDatatable({
            columnSchema: setting.full_trade.fund.schema,
            order: [0, 'asc'],
            aoColumnDefs: [
                { className: "pointer", "targets": [0] },
                { className: 'prevent-popup-detail', 'targets': [0, 1] }
            ],
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
        $(document).translate()
    }

    exports.getAllPositions = function () {
        var positions = []
        if (PositionMgr && PositionMgr.positions) {
            for (var p in PositionMgr.positions) {
                var item = PositionMgr.positions[p]
                if (IsOTCFund(item)) {
                    positions.push(item)
                }
            }
        }
        return positions
    }
})