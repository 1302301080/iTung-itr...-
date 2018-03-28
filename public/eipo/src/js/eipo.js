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

{ $Id: eipo.js,v 1.2 2017/06/14 04:23:42 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


define(function (require, exports, module) {
    require('datatables')
    var dialog = require('dialog')
    var eipo_application = require('eipo-application')
    var symbolList = {}
    var orderList = {}
    var AccountExploer = require('eipo-accountExploer')
    var utility = require('eipo-utility')
    var format = require('format')
    var socketClient = require('eipo-socket')
    var isAcctLogin = $('#login-type').val() == '1'

    var ipoListTable = $('#ipo-list-table')
    var ipoListDataTable
    var appListTable = $('#application-list-table')
    var appListDataTable
    var language = $('html').attr('lang')
    var configData
    var ipoFilterDropdownGroup
    var appFilterDropdownGroup

    $.get('/eipo/message/config', function (data) {
        configData = data
        AccountExploer.init(configData)
        var configFormat = configData.format
        initializeUI()
        socketClient.subscribeIPOS(function (data) {
            for (var i = 0; i < data.length; i++) {
                var symbolObj = data[i]
                var code = symbolObj[0]
                if (!code) return
                symbolObj.DT_RowId = 'symbol-{0}-{1}'.format(code, symbolObj[1599])
                symbolObj[1507] = utility.getMarginRatio(symbolObj[1507], configFormat.price, true)

                symbolObj.applyAction = "<i class='fa fa-check fa-lg btn-apply text-success pointer' title='{0}'></i>".format(messages.eipo["btn-apply"].text)
                utility.convertIPOData(symbolObj, configData.schema.ipo, configFormat)
                ipoListDataTable.UpdateRowData(symbolObj)
                symbolList[code] = symbolObj
            }
            ipoListDataTable.draw()
            checkIpoEnable()
        })

        socketClient.subscribeApplications(function (data) {
            for (var i = 0; i < data.length; i++) {
                var orderObj = data[i]
                var orderNo = orderObj[6]
                if (!orderNo) return
                orderObj.DT_RowId = 'order-' + orderNo
                orderObj.changeAction = "<i class='fa fa-edit fa-lg btn-change text-success pointer' title='{0}' data-order='{1}'></i>".format(messages.eipo["btn-change"].text, orderObj['6'])
                orderObj.cancelAction = "<i class='fa fa-remove fa-lg btn-cancel text-danger pointer' title='{0}' data-order='{1}'></i>".format(messages.eipo["btn-cancel"].text, orderObj['6'])
                getRemark(orderObj)
                utility.convertIPOData(orderObj, configData.schema.application, configFormat)
                appListDataTable.UpdateRowData(orderObj)
                orderList[orderNo] = orderObj
            }
            appListDataTable.draw()
            checkIpoEnable()
            checkChangeCancelAble()
        })

        ipoListTable.click(function (e) {
            if (!$(e.target).hasClass('btn-apply') || $(e.target).attr('disabled')) return
            var targetTrId = $(e.target).parent().parent().attr('id')
            if (!targetTrId) return
            var symbolCode = targetTrId.substring(7, targetTrId.indexOf('-', 7))
            var announceCode = targetTrId.substring(targetTrId.indexOf('-', 7) + 1)
            if (isAcctLogin && configData.disclaimer && configData.disclaimer.url) {
                utility.popupDisclaimer({
                    url: configData.disclaimer.url,
                    multi_language: configData.disclaimer.url,
                    title: messages.eipo['ipo-disclaimer-title'].text,
                    callback: function (button, dialog) {
                        var btnID = button.attr('id')
                        if (btnID === 'btn-agree') {
                            popupApply(symbolCode, announceCode)
                        }
                        dialog.close()
                        return
                    }
                })
            } else {
                popupApply(symbolCode, announceCode)
            }
        })

        appListTable.click(function (e) {
            if ($(e.target).attr('disabled')) return
            if ($(e.target).hasClass('btn-cancel')) {
                popupCancel($(e.target).attr('data-order'))
            } else if ($(e.target).hasClass('btn-change')) {
                popupChange($(e.target).attr('data-order'))
            }
        })

        utility.handleAcctUserUI()
        popupAccountExploer()
        // setInterval(function () {  // check ipo status by interval
        //     checkIpoEnable()
        //     checkChangeCancelAble()
        // }, 1000)
    })

    function preProcessSchema(schema) {
        if (schema && schema.length > 0) {
            for (var i = 0; i < schema.length; i++) {
                var obj = schema[i]
                if (obj && obj.entitlement) {
                    if (!configData.entitlement || configData.entitlement.indexOf(obj.entitlement) < 0) {
                        schema.splice(i, 1)
                    }
                }
            }
        }
    }

    function initializeUI() {
        if (!configData) return
        ipoFilterDropdownGroup = $('#ipo-filter-group')
        appFilterDropdownGroup = $('#ipo-app-filter-group')
        preProcessSchema(configData.schema.ipo)
        preProcessSchema(configData.schema.application)
        var ipoSymboIndex = utility.getIndexByKey('0', configData.schema.ipo, 0)
        var ipoSymbolNameIndex = utility.getIndexByKey('symbolName', configData.schema.ipo)
        var ipoStatusIndex = utility.getIndexByKey('5', configData.schema.ipo)
        var applyBtnIndex = utility.getIndexByKey('applyAction', configData.schema.ipo, -1)
        var sortList = []
        if (ipoStatusIndex >= 0) {
            sortList.push([ipoStatusIndex, language === 'zh-CN' ? 'asc' : 'desc'])
        }
        if (ipoSymboIndex >= 0) {
            sortList.push([ipoSymboIndex, 'asc'])
        }
        ipoListDataTable = ipoListTable.CreateDatatable({
            columnSchema: configData.schema.ipo,
            order: sortList,
            aoColumnDefs: [
                { "bSortable": false, "aTargets": [applyBtnIndex] },
                { "className": "extra-tooltip pointer", "targets": [ipoSymboIndex] },
                { "className": "ipo-symbol-name", "targets": [ipoSymbolNameIndex] }
            ],
            textTagMapping: false,
            i18nPrefix: 'eipo',
        })
        var table_container = $(ipoListDataTable.table().container())
        table_container.find('.dataTables_filter').appendTo($('#ipo-list-table-search-box-container'))

        // ipo filter
        var ipoFilterOptions = {
            name: { i18n: 'ipo-book-filter-status' }, data: [
                { key: 'ALL', value: messages.ALL.text },
                { key: 'open', value: messages.eipo["ipo-status-open"].text },
                { key: 'close', value: messages.eipo["ipo-status-close"].text }
            ]
        }
        ipoFilterDropdownGroup.CreateDrowdownGroup(ipoFilterOptions)
        var ipoStatusIndex = utility.getIndexByKey('5', configData.schema.ipo)
        ipoFilterDropdownGroup.on('change', function (event, key) {
            key = key === 'ALL' ? '' : messages.eipo["ipo-status-" + key].text
            ipoListDataTable.column(ipoStatusIndex).search(key, false, false, false).draw(false)
        })

        var changeBtnIndex = utility.getIndexByKey('changeAction', configData.schema.application, -1)
        var cancelBtnIndex = utility.getIndexByKey('cancelAction', configData.schema.application, -1)
        var orderNoIndex = utility.getIndexByKey('6', configData.schema.application)
        appListDataTable = appListTable.CreateDatatable({
            columnSchema: configData.schema.application,
            order: orderNoIndex >= 0 ? [orderNoIndex, 'desc'] : [],
            aoColumnDefs: [
                { "bSortable": false, "aTargets": [changeBtnIndex, cancelBtnIndex] },
                { className: "extra-tooltip pointer", "targets": [orderNoIndex] }
            ],
            textTagMapping: false,
            i18nPrefix: 'eipo',
        })
        table_container = $(appListDataTable.table().container())
        table_container.find('.dataTables_filter').appendTo($('#ipo-app-table-search-box-container'))

        //order book filter       
        var appFilterOptions = {
            name: { i18n: 'ipo-book-filter-status' }, data: [
                { key: 'ALL', value: messages.ALL.text },
                { key: '1', value: messages.eipo.status_1.text },
                { key: '2', value: messages.eipo.status_2.text },
                { key: '3', value: messages.eipo.status_3.text },
                { key: '4', value: messages.eipo.status_4.text },
                { key: '5', value: messages.eipo.status_5.text },
                { key: '-1', value: messages.eipo["status_-1"].text }
            ]
        }
        appFilterDropdownGroup.CreateDrowdownGroup(appFilterOptions)
        var appStatusIndex = utility.getIndexByKey('5', configData.schema.application)
        appFilterDropdownGroup.on('change', function (event, key) {
            key = key === 'ALL' ? '' : messages.eipo["status_" + key].text
            appListDataTable.column(appStatusIndex).search(key, false, false, false).draw(false)
        })

        utility.upperCaseInput()
        $('#eipo-container').translate('eipo')
        setTimeout(function () {
            $('.loaders').remove()
            $('body').removeClass('loader-container')
            $($('.hide')[0]).removeClass('hide')
        }, 1000)
    }

    function checkIpoEnable(row) {
        var fn = function (row) {
            var enable = false
            var hasApplied = false
            var data = row.data()
            if (data && data._raw) {
                if (data && data._raw[5] && data._raw[1502]) {
                    if (moment(data._raw[1502], 'YYYY-MM-DD').add(moment.duration(configData.deadlineClosing)) > moment()) {
                        enable = true
                        if (isAcctLogin && orderList) {
                            for (var p in orderList) {
                                if (!orderList[p]) continue
                                if (orderList[p][0] == data[0]) {
                                    if (orderList[p]._raw[5] != '-1') {
                                        hasApplied = true
                                    }
                                }
                            }
                        }
                    }
                }
                if (enable && !hasApplied) {
                    $(row.node()).find('td .btn-apply').removeAttr('disabled')
                        .addClass('pointer').addClass('text-success').removeClass('text-muted')
                } else {
                    $(row.node()).find('td .btn-apply').attr('disabled', 'disabled')
                        .removeClass('pointer').removeClass('text-success').addClass('text-muted')
                }
                data.enable = enable
                data.hasApplied = hasApplied
            }
        }
        if (row) {
            fn(row)
        } else {
            var rows = ipoListDataTable.rows()
            if (rows && rows[0]) {
                for (var i = 0; i < rows[0].length; i++) {
                    var row = ipoListDataTable.row(rows[0][i])
                    fn(row)
                }
            }
        }
    }

    function checkChangeCancelAble(row) {
        var fn = function (row) {
            if (!row || !row.data()) return
            var changeable = true
            var cancelable = true
            var data = row.data()
            if (!data || !data._raw) return
            var symbol = data['0']
            var status = data._raw[5]
            if (status != '1' && status != '6' && status != '7') {
                changeable = false
                cancelable = false
            } else if (!symbolList[symbol] || !symbolList[symbol].enable || (isAcctLogin && !symbolList[symbol].hasApplied)) {
                changeable = false
                cancelable = false
            }
            if (isAcctLogin) {
                if (!configData.allowClientChange) changeable = false
                if (!configData.allowClientCancel) cancelable = false
            }
            if (changeable) {
                $(row.node()).find('td .btn-change').removeAttr('disabled')
                    .addClass('pointer').addClass('text-success').removeClass('text-muted')
            } else {
                $(row.node()).find('td .btn-change').attr('disabled', 'disabled')
                    .removeClass('pointer').removeClass('text-success').addClass('text-muted')
            }
            if (cancelable) {
                $(row.node()).find('td .btn-cancel').removeAttr('disabled')
                    .addClass('pointer').addClass('text-danger').removeClass('text-muted')
            } else {
                $(row.node()).find('td .btn-cancel').attr('disabled', 'disabled')
                    .removeClass('pointer').removeClass('text-danger').addClass('text-muted')
            }
        }
        if (row) {
            fn(row)
        } else {
            var rows = appListDataTable.rows()
            if (rows && rows[0] && rows[0].length > 0) {
                for (var i = 0; i < rows[0].length; i++) {
                    var row = appListDataTable.row([i])
                    fn(row)
                }
            }
        }
    }

    function popupAccountExploer() {
        $('#account-exploer-btn').click(function () {
            AccountExploer.popup({
                callback: function (account) {
                    filter_account.val(account)
                }
            })
        })
    }

    function popupApply(symbolCode, announceCode) {
        if (!symbolCode || !announceCode) return
        dialog.showMessage({
            title: messages.eipo["ipo-apply-popup-title"].text,
            buttonNameList: ['submit', 'close'],
            load: {
                url: '/eipo/apply?symbol={0}&announce={1}'.format(symbolCode, announceCode),
                callback: function (dialog) {
                    eipo_application.initApplicationForm({
                        container: dialog.getModalBody(),
                        configData: configData,
                        symbolCode: symbolCode,
                        announceCode: announceCode
                    })
                }
            },
            callback: function (button, dialog) {
                if (!button || !dialog) return
                var btnID = button.attr('id')
                if (btnID === 'btn-submit') {
                    eipo_application.add(function (err, data) {
                        dialog.close()
                        if (err) {
                            utility.popupInformation(err)
                        } else {
                            utility.popupInformation({ message: messages.eipo["message-apply-success"].text })
                        }
                    })
                } else {
                    dialog.close()
                }
            }
        })
    }

    function popupChange(orderNo) {
        if (!orderNo) return
        dialog.showMessage({
            title: messages.eipo["ipo-change-popup-title"].text,
            buttonNameList: ['submit', 'close'],
            load: {
                url: '/eipo/change?orderNo=' + orderNo,
                callback: function (dialog) {
                    eipo_application.initChangeOrderForm({
                        container: dialog.getModalBody(),
                        configData: configData,
                    })
                }
            },
            callback: function (button, dialog) {
                var btnID = button.attr('id')
                if (btnID === 'btn-submit') {
                    eipo_application.change(function (err, data) {
                        dialog.close()
                        if (err) {
                            utility.popupInformation(err)
                        } else {
                            utility.popupInformation({ message: messages.eipo["message-change-success"].text })
                        }
                    })
                } else {
                    dialog.close()
                }
            }
        })
    }

    function popupCancel(orderNo) {
        if (!orderNo) return
        dialog.showMessage({
            title: messages.eipo["ipo-cancel-popup-title"].text,
            buttonNameList: ['submit', 'close'],
            load: {
                url: '/eipo/cancel?orderNo=' + orderNo,
                callback: function (dialog) {
                    eipo_application.initCancelOrderForm({
                        container: dialog.getModalBody(),
                        configData: configData
                    })
                }
            },
            callback: function (button, dialog) {
                var btnID = button.attr('id')
                if (btnID === 'btn-submit') {
                    eipo_application.cancel(function (err, data) {
                        dialog.close()
                        if (err) {
                            utility.popupInformation(err)
                        } else {
                            utility.popupInformation({ message: messages.eipo["message-cancel-success"].text })
                        }
                    })
                } else {
                    dialog.close()
                }
            }
        })
    }

    function getRemark(data) {
        if (!data) return
        var remark = ''
        var marginEnable = data['1505'] == '0' ? false : true
        var marginRate = Number(data['1506'])
        if (marginEnable && marginRate > 0 && data['3'] && data['1601']) {
            var ratio = data['1601'] / data['3']
            remark = '{0}: {1};'.format(messages.eipo["column-loan-ratio"].text, utility.getMarginRatio(ratio, configData.format.price, true))
        }
        var orderStatus = data['5']
        if (orderStatus == 6) {
            remark += messages.eipo["ipo-remark-waiting-change"].text + ';'
        } else if (orderStatus == 7) {
            remark += messages.eipo["ipo-remark-waiting-cancel"].text + ';'
        }
        data['25'] = remark + (data['25'] || '')
    }
})
