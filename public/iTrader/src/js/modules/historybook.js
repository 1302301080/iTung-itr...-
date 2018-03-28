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

{ $Id: historybook.js,v 1.10 2018/01/19 10:00:23 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'history_book'
    var orderbookType = 'order'
    var container
    var setting
    var datatableList = {}
    var currentDatatable
    // elements
    var history_form
    var tableList
    var queryBtn
    var types_dropdown
    var status_dropdown
    var days_dropdown
    var filterType
    var fundBook = require('fundbook')
    exports.init = function (c, s) {
        container = c
        setting = s
        if (!container || !container instanceof jQuery || container.length <= 0) return
        if (!setting || !setting.schema || setting.schema.length <= 0) return
        history_form = $('#order-history-form')
        queryBtn = $('#order-history-btn')
        types_dropdown = $('#order-history-types-dropdown-group')
        status_dropdown = $('#order-history-status-dropdown-group')
        days_dropdown = $('#order-history-days-dropdown-group')
        tableList = {
            order: container.find('#history-order-table'),
            fund: container.find('#history-fund-table'),
            cash: container.find('#history-cash-table')
        }

        queryBtn.click(function () {
            queryBtn.find('.btn-icon-spinner').removeClass('hidden')
            queryBtn.find('.btn-icon-search').addClass('hidden')
            queryBtn.attr('disabled', 'disabled')
            $.ajax({
                type: 'post',
                url: '/iTrader/order/history',
                data: getPostData(),
                success: function (data) {
                    processData(data)
                    resetButtons()
                    status_dropdown.find("li[style='display: none;'] a").trigger('click')
                },
                error: function (error) {
                    handleError(error)
                    resetButtons()
                }
            })
        })
        changeDatatable()
        initUI()
        container.translate()
    }


    function initUI() {
        var types_data = { name: { i18n: 'history_order_filter_type' }, data: [] }
        var status_data = { name: { i18n: 'history_order_filter_status' }, data: [{ key: 'ALL', value: messages.ALL.text }] }
        var days_data = { name: { i18n: 'history_order_filter_days' }, data: [] }
        var types = setting.filter.type
        var status = setting.filter.status
        var days = setting.filter.days
        if (types && types.length > 0) {
            for (var i = 0; i < types.length; i++) {
                types_data.data.push({ key: types[i], value: messages['history_type_' + types[i]].text })
            }
            types_dropdown.CreateDrowdownGroup(types_data)
        } else {
            types_dropdown.hide()
        }
        for (var i = 0; i < status.length; i++) {
            status_data.data.push({ key: status[i], value: $._map.status(status[i]) })
        }
        for (var j = 0; j < days.length; j++) {
            days_data.data.push({ key: days[j], value: days[j] + messages.history_order_filter_days_before.text })
        }

        status_dropdown.CreateDrowdownGroup(status_data)
        days_dropdown.CreateDrowdownGroup(days_data)

        status_dropdown.on('change', function (event, status) {
            var columns_dataSrc = currentDatatable.columns().dataSrc()
            if (columns_dataSrc.length > 0) {
                var index = columns_dataSrc.indexOf('5')
                if (index <= 0) return
                status = status === 'ALL' ? '' : $._map.status(status)
                currentDatatable.column(index).search(status).draw()
            }
        })
        types_dropdown.on('change', function (event, value) {
            orderbookType = value
            changeDatatable()
            container.find('.history-table-wrapper').addClass('hidden')
            $(currentDatatable.table().container()).parent('.history-table-wrapper').removeClass('hidden')
            queryBtn.trigger('click')
        })
    }

    function changeDatatable() {
        if (!setting || !setting.schema) return
        if (orderbookType == 'order' && !datatableList.order) {
            datatableList.order = tableList.order.CreateDatatable({
                columnSchema: setting.schema,
                columnHeaderPrefix: 'history_order_header_',
                buttons: [{ extend: 'print', className: 'btn-print' }]
            })
        } else if (orderbookType == 'cash' && !datatableList.cash) {
            datatableList.cash = tableList.cash.CreateDatatable({
                columnSchema: setting.cashSchema,
                columnHeaderPrefix: 'cashbook_header_',
                buttons: [{ extend: 'print', className: 'btn-print' }]
            })
        } else if (orderbookType == 'fund' && !datatableList.fund) {
            var schemList = []
            for (var i = 0; i < setting.fundSchema.length; i++) {
                var itemKey = setting.fundSchema[i].key
                if (itemKey != 'change' && itemKey != 'cancel') schemList.push(setting.fundSchema[i])
            }
            datatableList.fund = tableList.fund.CreateDatatable({
                columnSchema: schemList,
                columnHeaderPrefix: 'fundbook_header_',
                buttons: [{ extend: 'print', className: 'btn-print' }],
                aoColumnDefs: [
                    { className: "extra-row", "targets": 1 },
                ],
                getExtraRow: fundBook.GetFundSwitchInfo,
            })
        }
        currentDatatable = datatableList[orderbookType]
        extendTableUI(currentDatatable)
        container.translate()
    }

    function extendTableUI(datatable) {
        if (!datatable) return
        var table_container = $(datatable.table().container())
        var buttons_container = datatable.buttons().container()
        table_container.find('.dataTables_filter label input').attr('placeHolder', messages.datatables.sSearchPlaceHolder)
        buttons_container.addClass('pull-right')
        buttons_container.find('a span, a i').remove()
        buttons_container.find('a').append($("<i class='fa fa-lg fa-print text-muted'></i>"))
        buttons_container.appendTo(table_container.find('.dataTables_filter label'))
        $('#order-history-form').appendTo($('.col-sm-6:eq(0)', datatable.table().container()))
    }

    function resetButtons() {
        queryBtn.find('.btn-icon-spinner').addClass('hidden')
        queryBtn.find('.btn-icon-search').removeClass('hidden')
        queryBtn.removeAttr('disabled')
    }

    function processData(data) {
        if(!data || !data.data) return
        currentDatatable.clear()
        if (data.data.length > 0) {
            for (var i = 0; i < data.data.length; i++) {
                var orderObj = data.data[i]
                OrderMgr.parse(orderObj)
                orderObj.DT_RowId = 'orderhistory-' + orderObj[tags.orderNo]
                currentDatatable.UpdateRowData(orderObj)
            }
        }
        currentDatatable.draw()
    }

    function getPostData() {
        filterType = types_dropdown.find('span[data-key]').attr('data-key')
        if (!setting.filter.type || setting.filter.type.length <= 0) {
            filterType = 'ALL'
        }
        var filterDays = days_dropdown.find('span[data-key]').attr('data-key')
        return history_form.serialize() + '&days={0}&type={1}'.format(filterDays, filterType)
    }
})