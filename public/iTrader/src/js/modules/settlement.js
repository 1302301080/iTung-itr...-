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

{ $Id: settlement.js,v 1.4 2017/06/14 04:23:43 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    require('datatables')
    var dialog = require('dialog')
    var settlementTable = $('#settlement_table')
    var settlementTypeDropdown = $('#settlement_type')
    var settlementPeriodDropdown = $('#settlement_period')
    var settlementStatusDropdown = $('#settlement_status')
    var queryBtn = $('#settlement_btn')
    var settlementDatatable
    init()
    queryBtn.click(function () {
        queryBtn.find('.btn-icon-spinner').removeClass('hidden')
        queryBtn.find('.btn-icon-search').addClass('hidden')
        queryBtn.attr('disabled', 'disabled')
        fiterData()
    })
    extendTableUI(settlementDatatable)
    $(document).translate()

    function fiterData() {
        var period = settlementPeriodDropdown.find('span[data-key]').attr('data-key')
        $.ajax({
            url: '/iTrader/message/settlemetTable',
            method: 'GET',
            data: { account: AccountMgr.current_account, period: period },
            success: function (data) {
                if (data) {
                    drawSettlementTable(data)
                }
                settlementTypeDropdown.find("li[style='display: none;'] a").trigger('click')
                settlementStatusDropdown.find("li[style='display: none;'] a").trigger('click')
                resetButtons()
            },
            error: function () {
                resetButtons()
            }
        })
    }

    function resetButtons() {
        queryBtn.find('.btn-icon-spinner').addClass('hidden')
        queryBtn.find('.btn-icon-search').removeClass('hidden')
        queryBtn.removeAttr('disabled')
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
        $('#settlement-instruction-form').appendTo($('.col-sm-6:eq(0)', datatable.table().container()))
    }

    function drawSettlementTable(data) {
        if (!data) return
        settlementDatatable.clear()
        if (!data) return
        for (var i = 0; i < data.length; i++) {
            if (data[i]['status'] || data[i]['status'] === 0) {
                data[i]['status'] = $._map.status('settlement_instruction_' + data[i]['status'])
            }
            if (data[i][158]) {
                data[i][158] = messages['settlement_instruction_' + data[i][158]].text
            }
            data[i][163] = "<span class='text-muted pointer settlement-subject' msgID={0}>{1}</span>".format(data[i][160], data[i][163])
            var row = settlementDatatable.UpdateRowData(data[i])
            if (data[i]['detail']['BankSlip'] == 1) {
                $(row.node()).find('.settlement-subject').parent().append($('<a>', { href: '/iTrader/message/settlement/image?name={0}_BankSlip_{1}'.format(data[i][161], data[i][160]), target: "_blank" })
                    .append($('<i>', { class: 'fa fa-file-image-o icon-left-margin pointer', title: messages.settlement_CD_bankSlip.text })))
            }
            if (data[i]['detail']['Cheque'] == 1) {
                $(row.node()).find('.settlement-subject').parent().append($('<a>', { href: '/iTrader/message/settlement/image?name={0}_Cheque_{1}'.format(data[i][161], data[i][160]), target: "_blank" })
                    .append($('<i>', { class: 'fa fa-picture-o  icon-left-margin pointer', title: messages.settlement_CD_cheque.text })))
            }
            $(row.node()).find('.settlement-subject').click(function () {
                var msgID = $(this).attr('msgID')
                dialog.showMessage({
                    title: messages.dialog_detail_title.text,
                    load: {
                        url: '/iTrader/message/settlement/detail?account=' + AccountMgr.current_account + '&msgID=' + msgID, callback: function () {
                        },
                    },
                    buttonNameList: ['close'],
                    callback: function (button, dialog) {
                        if (button.name === 'close') {
                            dialog.close()
                        }
                    }
                })
            })
        }
        settlementDatatable.draw()
    }

    function init() {
        settlementDatatable = settlementTable.CreateDatatable({
            searching: true,
            columnSchema: initial_data.views.settlement.schema,
            order: [0, 'desc'],
            buttons: [{ extend: 'print', className: 'btn-print' }]
        })

        var settlement_message_type = {
            name: { i18n: 'settlement_message_type' }, data: [
                { key: 'ALL', value: messages.settlement_instruction_all_type.text },
                { key: 'CD', value: messages.settlement_instruction_CD.text },
                { key: 'CW', value: messages.settlement_instruction_CW.text },
                { key: 'SD', value: messages.settlement_instruction_SD.text },
                { key: 'SW', value: messages.settlement_instruction_SW.text },
            ]
        }

        var settlement_period_data = {
            name: { i18n: 'settlement_arrival_date' }, data: [
            ]
        }
        if (initial_data.views.settlement.periods) {
            for (var i = 0; i < initial_data.views.settlement.periods.length; i++) {
                var item = initial_data.views.settlement.periods[i]
                settlement_period_data.data.push({ key: item, value: messages['settlement_period_' + item].text })
            }
        }

        var settlement_status_data = {
            name: { i18n: 'settlement_status' }, data: [
                { key: 'ALL', value: messages.ALL.text },
                { key: '0', value: messages.oms.status_settlement_instruction_0 },
                { key: '1', value: messages.oms.status_settlement_instruction_1 },
                { key: '2', value: messages.oms.status_settlement_instruction_2 },
                { key: '-1', value: messages.oms['status_settlement_instruction_-1'] },
            ]
        }

        settlementTypeDropdown.CreateDrowdownGroup(settlement_message_type)
        settlementPeriodDropdown.CreateDrowdownGroup(settlement_period_data)
        settlementStatusDropdown.CreateDrowdownGroup(settlement_status_data)
    }
    settlementStatusDropdown.on('change', function (event, status) {
        var columns_dataSrc = settlementDatatable.columns().dataSrc()
        if (columns_dataSrc.length > 0) {
            var index = columns_dataSrc.indexOf('status')
            if (index <= 0) return
            status = status === 'ALL' ? '' : $._map.status('settlement_instruction_' + status)
            settlementDatatable.column(index).search(status).draw()
        }
    })

    settlementTypeDropdown.on('change', function (event, type) {
        var columns_dataSrc = settlementDatatable.columns().dataSrc()
        if (columns_dataSrc.length > 0) {
            var index = columns_dataSrc.indexOf('158')
            if (index <= 0) return
            type = type === 'ALL' ? '' : messages['settlement_instruction_' + type].text
            settlementDatatable.column(index).search(type).draw()

        }
    })
})