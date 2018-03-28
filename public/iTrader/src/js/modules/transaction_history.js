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

{ $Id: transaction_history.js,v 1.2 2016/12/20 11:04:18 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    require('datatables')
    var name = 'transaction_history'
    var settings
    var transactionHistoryForm
    var transHistoryTable
    var transHistoryDatatable
    var actionDropdown
    var startDate
    var endDate
    var queryBtn
    var datasource = {}

    function init() {
        settings = initial_data.views.trade.transaction_history
        transactionHistoryForm = $('#transaction-history-form')
        transHistoryTable = $('#transaction-history-table')
        actionDropdown = $('#transaction-history-action-dropdown-group')
        startDate = $('#transaction-history-start-date')
        endDate = $('#transaction-history-end-date')
        queryBtn = $('#transaction-history-btn')

        transHistoryDatatable = transHistoryTable.CreateDatatable({
            columnSchema: settings.schema,
            order: [0, 'desc'],
            buttons: [
                {
                    extend: 'print',
                    className: 'btn-print'
                }
            ]
        })
        var table_container = $(transHistoryDatatable.table().container())
        var buttons_container = transHistoryDatatable.buttons().container()
        buttons_container.addClass('pull-right')
        buttons_container.find('a span').remove()
        buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
        buttons_container.appendTo(table_container.find('.dataTables_filter label'))
        $('#transaction-history-form').appendTo($('.col-sm-6:eq(0)', table_container))

        var actions_data = {
            name: { i18n: 'transaction_history_action' }, data: [
                { key: '0', value: messages.ALL.text },
                { key: '1', value: messages.transaction_history_client_trade.text },
                { key: '2', value: messages.transaction_history_stock_voucher.text },
                { key: '3', value: messages.transaction_history_money_voucher.text },
            ]
        }
        actionDropdown.CreateDrowdownGroup(actions_data)

        var dateFormat = settings.dateFormat || 'yyyy/mm/dd'
        var daysBeforeToday = -(settings.daysBeforeToday || 30)

        startDate.val(moment().add(daysBeforeToday, 'days').format(dateFormat.toUpperCase()))
        endDate.val(moment().format(dateFormat.toUpperCase()))

        startDate.datepicker({
            todayHighlight: true,
            autoclose: true,
            format: dateFormat.toLowerCase(),
        })

        endDate.datepicker({
            todayHighlight: true,
            autoclose: true,
            format: dateFormat.toLowerCase()
        })
        startDate.change(function () { datasource = {} })
        endDate.change(function () { datasource = {} })
        queryHandle()
        $(document).translate()
    }

    function processData(data) {
        if (data && data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                var orderObj = data[i]
                var type = orderObj['457']
                if (type == 'gettrade') {
                    orderObj['11'] = messages.oms['trans_side_' + (orderObj['11'] == '1' ? '1' : '0')]
                } else if (type == 'getmoneyvoucher') {
                    orderObj['11'] = messages.oms['trans_side_' + (orderObj['11'] == '1' ? '2' : '3')]
                } else if (type == 'getstockvoucher') {
                    orderObj['11'] = messages.oms['trans_side_' + (orderObj['11'] == '1' ? '5' : '4')]
                }
            }
        }
        return data
    }

    function draw(data) {
        transHistoryDatatable.clear()
        if (data && data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                data[i].DT_RowId = 'transaction-history-' + i
                transHistoryDatatable.UpdateRowData(data[i])
            }
        }
        transHistoryDatatable.draw()
    }

    function queryHandle() {
        queryBtn.click(function () {
            if (!startDate.val() || !endDate.val()) return
            queryBtn.find('.btn-icon-spinner').removeClass('hidden')
            queryBtn.find('.btn-icon-search').addClass('hidden')
            queryBtn.attr('disabled', 'disabled')
            $.ajax({
                type: 'post',
                url: '/iTrader/transaction/history',
                data: getPostData(),
                success: function (data) {
                    if (data) {
                        if (data.data) draw(processData(data.data))
                        else if (data.error) handleError(data.error)
                    }
                    resetButtons()
                },
                error: function (error) {
                    handleError(error)
                    resetButtons()
                }
            })
        })
    }

    function getPostData() {
        var action = actionDropdown.find('span[data-key]').attr('data-key')
        return transactionHistoryForm.serialize() + '&action=' + action
    }

    function resetButtons() {
        queryBtn.find('.btn-icon-spinner').addClass('hidden')
        queryBtn.find('.btn-icon-search').removeClass('hidden')
        queryBtn.removeAttr('disabled')
    }

    exports.init = init
})