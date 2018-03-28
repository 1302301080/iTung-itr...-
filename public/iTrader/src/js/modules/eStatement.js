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

{ $Id: eStatement.js,v 1.5 2017/05/22 09:28:53 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    require('datatables')
    var container
    var eStatementTable = $('#estatement-table')
    var eStatementTypeDropdown = $('#estatement-type')
    var eStatementPeriodDropdown = $('#estatement-period')
    var queryBtn = $('#eStatement_btn')
    var eStatementDatatable
    var initial_data

    function getFileName() {
        var period = eStatementPeriodDropdown.find('span[data-key]').attr('data-key')
        var selectType = eStatementTypeDropdown.find('span[data-key]').attr('data-key')
        $.get('/iTrader/estatement/files?&period=' + period + '&selectType=' + selectType, function (data) {
            drawStatementTable(data)
            resetButtons()
        })
    }

    function resetButtons() {
        queryBtn.find('.btn-icon-spinner').addClass('hidden')
        queryBtn.find('.btn-icon-search').removeClass('hidden')
        queryBtn.removeAttr('disabled')
    }
    function init(c) {
        container = c
        if (!container || container.length <= 0) return
        $.get('/iTrader/initialize', function (data) {
            initial_data = data

            var eStatement_type_data = {
                name: { i18n: 'eStatement_type' }, data: [
                    { key: '0', value: messages.eStatement_type_daily.text },
                    { key: '1', value: messages.eStatement_type_monthly.text },
                ]
            }

            var eStatement_period_daily_data = {
                name: { i18n: 'eStatement_period' }, data: []
            }
            for (var i = 0; i < initial_data.views.eStatement.periods.daily.length; i++) {
                var item = initial_data.views.eStatement.periods.daily[i]
                eStatement_period_daily_data.data.push({ key: item, value: messages['eStatement_period_daily_' + item].text })
            }

            var eStatement_period_monthly_data = {
                name: { i18n: 'eStatement_period' }, data: []
            }
            for (var j = 0; j < initial_data.views.eStatement.periods.monthly.length; j++) {
                var item = initial_data.views.eStatement.periods.monthly[j]
                eStatement_period_monthly_data.data.push({ key: item, value: messages['eStatement_period_monthly_' + item].text })
            }

            eStatementDatatable = eStatementTable.CreateDatatable({
                searching: false,
                columnSchema: [
                    { name: 'acct', key: 'account', class: 'text-left', i18n: 'column_account' },
                    { name: 'period', key: 'date', class: 'text-left', i18n: 'eStatement_date' },
                    { name: 'subject', key: 'filename', class: 'text-left', i18n: 'eStatement_subject' }
                ],
                order: [1, 'desc']
            })

            eStatementTypeDropdown.CreateDrowdownGroup(eStatement_type_data)
            eStatementPeriodDropdown.CreateDrowdownGroup(eStatement_period_daily_data)

            eStatementTypeDropdown.on('change', function (event, status) {
                var type = eStatementTypeDropdown.find('span[data-key]').attr('data-key')
                if (type == 0) {
                    eStatementPeriodDropdown.CreateDrowdownGroup(eStatement_period_daily_data)
                } else {
                    eStatementPeriodDropdown.CreateDrowdownGroup(eStatement_period_monthly_data)
                }
            })
            queryBtn.click(function () {
                queryBtn.find('.btn-icon-spinner').removeClass('hidden')
                queryBtn.find('.btn-icon-search').addClass('hidden')
                queryBtn.attr('disabled', 'disabled')
                getFileName()
            })
            $(document).translate()
        })
    }

    function drawStatementTable(data) {
        eStatementDatatable.clear()
        if (!data) return
        for (var i = 0; i < data.length; i++) {
            data[i].filename = "<a href='{0}' target='_blank'>{1}</a><span class='text-muted'><i class='fa fa-file-pdf-o icon-left-margin'></i></span>".format(data[i].link, data[i].filename)
            eStatementDatatable.UpdateRowData(data[i])
        }
        eStatementDatatable.draw()
    }

    exports.init = init
})
