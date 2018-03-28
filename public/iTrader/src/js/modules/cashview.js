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

{ $Id: cashview.js,v 1.11 2018/01/11 00:58:07 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'cashview'
    var isInitialized = false
    var container
    var inner
    var setting
    var schema
    var acctMgr
    var curMgr
    var table  // jQuery object
    var datatable   // jQuery datatables object
    var nonMultipleField = ['exchangeRatio']
    var highlightRow = ['cashview-group', 'cashview-total', 'cashview-equal']
    var currencyTag = '23'
    var params = { account: '', currency: '', equalCurrency: '' }
    var exchange_ratio = require('exchange-ratio')
    const util = require('util')
    exports.init = function (c, s, aMgr, cMgr) {
        if (!c || !(c instanceof jQuery)) return
        if (!s || s.enable == false || !s.schema || s.schema.length <= 0) return
        if (!aMgr || !cMgr) return
        container = c
        setting = s
        schema = s.schema
        acctMgr = aMgr
        curMgr = cMgr
        var t
        acctMgr.on(function () {
            if (!t) {
                t = setTimeout(function () {
                    if (curMgr.currencyMode !== 'multi') return
                    draw(schema)
                    initializeDatatable()
                    resetDatatable()
                    inner.translate()
                    resetDatatable()
                    isInitialized = true
                }, 500)
            } else if (isInitialized) {
                resetDatatable()
            }
        })

        // for handle position update to trigger table update
        var needUpdateTable = false
        PositionMgr.on(function () {
            if (isInitialized) {
                needUpdateTable = true
            }
        })
        setInterval(function () {
            if (needUpdateTable) {
                resetDatatable()
            }
        }, 1000)
    }

    function draw() {
        function fn(id, i18n, data) {
            var div = $("<div>")
            if (!id || !i18n || !data || data.length <= 0) return div
            var options = {
                id: id,
                name: {
                    i18n: i18n,
                    name: i18n
                },
                data: []
            }
            for (var i = 0; i < data.length; i++) {
                options.data.push({ key: data[i], value: data[i] === 'ALL' ? messages.ALL.text : data[i] })
            }
            div.CreateDrowdownGroup(options)
            div.children('div').css("margin-right", "8px")
            return div
        }
        var accountList = acctMgr.account_list || []
        var currencyTotalList = []
        var currencyList = {}
        for (var i = 0; i < curMgr.currency_list.length; i++) {
            if (curMgr.currency_list[i].currency) {
                currencyTotalList.push(curMgr.currency_list[i].currency)
            }
        }
        for (var j = 0; j < acctMgr.account_balance_list.length; j++) {
            var item = acctMgr.account_balance_list[j]
            if (item.account && item.currency) {
                if (!currencyList[item.account]) {
                    currencyList[item.account] = ['ALL']
                }
                currencyList[item.account].push(item.currency)
            }
        }

        table = $('<table>', { 'class': 'table table-bordered table-hover table-condensed table-striped' })
            .append($('<thead>'))
            .append($('<tbody>'))
        var dg_select_account = fn('cashview-select-account', 'column_account', (accountList.length > 1 ? accountList : []))
        var dg_select_currency = fn('cashview-select-currency', 'column_currency', currencyList[accountList[0]])
        var dg_select_equal_currency = fn('cashview-select-equal-currency', 'cashview_equal_currency', currencyTotalList)
        inner = $('<div>', { 'class': 'row' })
        container.append(inner)
        var col = $('<div>', { 'class': 'col-md-12' })
        inner.append(col)
        col.append(dg_select_account.children())
            .append(dg_select_currency.children())
            .append(dg_select_equal_currency.children())
            .append(table)
        params.account = accountList.length > 0 ? accountList[0] : ''
        params.currency = currencyList[params.account] ? currencyList[params.account][0] : curMgr.base_currency
        params.equalCurrency = currencyTotalList[0]
        $('#cashview-select-account').on('change', function (event, key) {
            params.account = key
            params.currency = "ALL"
            $('#cashview-select-currency').replaceWith(fn('cashview-select-currency', 'column_currency', currencyList[key]).children())
            $('#cashview-select-currency').on('change', function (event, key) {
                params.currency = key
                resetDatatable()
            })
            resetDatatable()
        })
        $('#cashview-select-currency').on('change', function (event, key) {
            params.currency = key
            resetDatatable()
        })
        $('#cashview-select-equal-currency').on('change', function (event, key) {
            params.equalCurrency = key
            resetDatatable()
        })
        setExchangeButton($('#cashview-select-currency'))
    }

    function initializeDatatable() {
        datatable = table.CreateDatatable({
            columnSchema: schema,
            // scrollX: true,
            columnHeaderPrefix: 'cashview_header_',
            searching: false,
            paging: false,
            info: false,
            ordering: false
        })
    }

    function resetDatatable() {
        acctMgr.updateAcctInfo()
        datatable.clear().draw()
        var account = params.account
        var currency = params.currency
        var equalCurrency = params.equalCurrency
        var currencyTypeList = [[], [], []] //convertible, group, unconvertible
        var firstAccountObj
        for (var i = 0; i < acctMgr.account_balance_list.length; i++) {
            var accountObj = acctMgr.account_balance_list[i]
            if (!accountObj.account) continue
            if (account && accountObj.account != account) continue
            if (currency && currency != 'ALL' && currency != accountObj.currency) continue
            var rowData
            if (accountObj.currency == null && currency === 'ALL') {
                rowData = convertData(accountObj, equalCurrency)
                rowData.DT_RowId = name + '-group'
                rowData['23'] = '{0}({1})'.format(messages.cashview_group_column.text, equalCurrency)
                currencyTypeList[1].push(rowData)
            } else {
                firstAccountObj = firstAccountObj || accountObj
                rowData = convertData(accountObj)
                var currencyObj = curMgr.get(accountObj.currency)
                if (currencyObj) {
                    if (currencyObj.isConvertible) {
                        currencyTypeList[0].push(rowData)
                    } else {
                        currencyTypeList[2].push(rowData)
                    }
                }
            }
            rowData.exchangeRatio = getExchangeRatio(accountObj.currency, equalCurrency)
        }
        // sorting
        sortByBaseCurrency(currencyTypeList[0])
        sortByBaseCurrency(currencyTypeList[2])

        var totalRowObj = convertData()

        for (var j = 0; j < currencyTypeList.length; j++) {
            for (var k = 0; k < currencyTypeList[j].length; k++) {
                var data = currencyTypeList[j][k]
                if (!data) continue
                if (j === 0 || j === 2) {
                    for (var p in data) {
                        if (isNaN(data[p]) || nonMultipleField.indexOf(p) >= 0) continue
                        totalRowObj[p] = totalRowObj[p] || 0
                        totalRowObj[p] += Number(data[p] * (data.exchangeRatio || 1))
                    }
                }
                // if (j === 1 && currencyTypeList[0].length <= 0) continue  // filter group
                if (j === 1) continue  // no need to show group record [1.0.10]
                util.HandleZeroShowNA(data)
                datatable.UpdateRowData(data)
            }
        }
        if (currency === 'ALL') {
            totalRowObj.DT_RowId = name + '-total'
            totalRowObj.exchangeRatio = ''
            totalRowObj['23'] = '{0}({1})'.format(messages.cashview_total_column.text, equalCurrency)
            handleCahsAccountData(totalRowObj, account)
            util.HandleZeroShowNA(totalRowObj)
            datatable.UpdateRowData(totalRowObj)
        } else if (firstAccountObj && currency !== equalCurrency) {
            var equalRowObj = convertData(firstAccountObj, equalCurrency)
            equalRowObj.DT_RowId = name + '-equal'
            equalRowObj.exchangeRatio = ''
            equalRowObj['23'] = '{0}({1})'.format(messages.cashview_equal_column.text, equalCurrency)
            handleCahsAccountData(equalRowObj, account)
            util.HandleZeroShowNA(equalRowObj)
            datatable.UpdateRowData(equalRowObj)
        }
        datatable.draw()
        hightLightRow()
    }

    function convertData(obj, equalCurrency) {
        var rowData
        if (obj && obj.data) {
            rowData = { DT_RowId: name + '-' + obj.account + '-' + obj.currency }
            for (var i = 0; i < schema.length; i++) {
                rowData[schema[i].key] = obj.data[schema[i].key]
            }
        } else {
            rowData = {}
            for (var i = 0; i < schema.length; i++) {
                rowData[schema[i].key] = 0
            }
        }
        if (equalCurrency) {
            var currency = obj.currency || curMgr.base_currency
            var currencyObj = curMgr.get(currency)
            var equalCurrencyObj = curMgr.get(equalCurrency)
            if (currencyObj && currencyObj.ratio && equalCurrencyObj && equalCurrencyObj.ratio) {
                for (var p in rowData) {
                    if (nonMultipleField.indexOf(p) >= 0) continue
                    var value = rowData[p] * (currencyObj.ratio / equalCurrencyObj.ratio)
                    rowData[p] = value
                }
            }
        }
        return rowData
    }

    function handleCahsAccountData(obj, account) {
        if (!obj || !account) return
        if (!IsMarginAccount(account)) {
            obj.acceptValue = Number.NaN
            // obj[tags.marginCall] = Number.NaN  // v1.0.15
        }
    }

    function getExchangeRatio(currency, equalCurrency) {
        if (currency && equalCurrency) {
            var currencyObj = curMgr.get(currency)
            var equalCurrencyObj = curMgr.get(equalCurrency)
            if (currencyObj && currencyObj.ratio && equalCurrencyObj && equalCurrencyObj.ratio) {
                return currencyObj.ratio / equalCurrencyObj.ratio
            }
        }
        return ''
    }

    function hightLightRow() {
        table.find('tr').each(function () {
            var id = $(this).attr('id')
            if (highlightRow.indexOf(id) >= 0) {
                $(this).addClass('active')
            }
        })
    }

    function sortByBaseCurrency(array) {
        if (!array || array.length <= 0) return array
        return array.sort(function (a, b) {
            if (a[currencyTag] === curMgr.base_currency) return -1
            return 1
        })
    }

    function setExchangeButton(group) {
        if (!group) return
        var button = $("<button>", { type: "button", class: "btn btn-primary" })
            .append($("<span>", { class: "fa fa-exchange" }))
        button.click(function () {
            exchange_ratio.show(curMgr)
        })
        group.find('button:last').after(button)
    }
})