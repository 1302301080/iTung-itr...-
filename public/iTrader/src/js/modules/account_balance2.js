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

{ $Id: account_balance2.js,v 1.13 2017/11/06 09:34:03 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'account_balance'
    var container
    var table1
    var table2
    var dropdown_group
    var inner
    var setting
    var acctMgr
    var curMgr
    var exchange_ratio = require('exchange-ratio')
    var util = require('util')
    var current_currency
    var currencyCount = 0
    var queryBankBalanceFlag = true
    exports.init = function (c, s, aMgr, cMgr) {
        container = c
        setting = s
        acctMgr = aMgr
        curMgr = cMgr
        if (!container || !container instanceof jQuery) return
        if (!setting) return
        if (!acctMgr || !curMgr) return
        draw()
        update()
        $('#nav_account').on('change', function (event, key) {
            draw(true)
            dropdown_group.select(current_currency)
            update()
        })

        acctMgr.on(function () {
            draw()
            update()
        })
        PositionMgr.on(function () {
            update()
        })

        $(document).on('ticket-added', function (event, data) {
            if (data && data[tags.currency] && data[tags.currency] !== current_currency) {
                current_currency = data[tags.currency]
                dropdown_group.select(current_currency)
                selectDropdownGroupButton()
                update()
            }
        })
    }

    function selectDropdownGroupButton(currency) {
        currency = currency || current_currency
        var hasCurrency = false
        if (!isConsolidatedBalanceMode()) {
            var list = dropdown_group.find('[data-key]')
            for (var i = 0; i < list.length; i++) {
                if ($(list[i]).attr('data-key') === currency) hasCurrency = true
            }
            if (!hasCurrency) {  // if selected currency not in the dropdown list, add dummy one.
                acctMgr.account_balance_list.push({
                    account: acctMgr.current_account,
                    base: curMgr.base_currency,
                    currency: currency,
                    data: { '23': currency },
                    isDummy: true
                })
                resetDropdown()
            }
        }
        dropdown_group.select(currency)
    }

    function draw(redraw) {
        if (!acctMgr || !acctMgr.account_balance_list || acctMgr.account_balance_list.length <= 0) return
        var validCurrencyCount = getAccountBalanceCount()
        if (!redraw && currencyCount === validCurrencyCount) return // prevent to redraw when currency no update
        currencyCount = validCurrencyCount

        if (inner && inner.length > 0) inner.remove()
        inner = $("<div>")
        var parentElementHeight = container.parents('.panel').height() - 70
        var height1 = parentElementHeight * 0.45
        var height2 = parentElementHeight * 0.5
        var tableContainer1 = $("<div>", {
            id: "account-balance-container1",
            style: "position: relative; height: {0}px".format(height1)
        })
        var tableContainer2 = $("<div>", {
            id: "account-balance-container2",
            style: "position: relative; height: {0}px".format(height2)
        })
        table1 = $("<table>", {
            border: "0",
            width: "100%"

        })
        table2 = $("<table>", {
            border: "0",
            width: "100%"
        })
        dropdown_group = $("<div>", {
            class: "text-right",
            id: "account-currency-dropdown-group",
            style: "margin:0px 0 5px 0"
        })
        tableContainer1.append(table1)
        tableContainer2.append(dropdown_group).append($("<div>", {
            id: "account-balance-table-container2",
            style: "position: relative; height: {0}px".format(height2 - 22)
        }).append(table2))

        var tr = $("<tr>").append($("<th>", {
            scrop: "col",
            class: 'account-balance-header'
        }))
        for (var i = 0; i < setting.mainSchema.length; i++) {
            var item = setting.mainSchema[i]
            tr.append($("<th>", {
                scrop: "col",
                "data-i18n": item.i18n || "",
                text: item.name,
                class: "text-right account-balance-header"
            }))
        }
        table1.append($("<tbody>").append(tr))
        var tbody = $("<tbody>")
        table1.append(tbody)
        var trList = []
        for (var i = 0; i < currencyCount; i++) {
            var acctObj = acctMgr.account_balance_list[i]
            if (acctObj.account !== acctMgr.current_account || !acctObj.currency) continue
            if (acctObj.isDummy) continue
            tr = $("<tr>").append($("<th>", {
                scrop: "row"
            }).append(getCurrencyLabel(acctObj.currency)))
            for (var j = 0; j < setting.mainSchema.length; j++) {
                var item = setting.mainSchema[j]
                tr.append($("<td>", {
                    "data-tag": item.key,
                    "data-currency": acctObj.currency,
                    class: "text-right text-primary"
                }))
            }
            trList.push(tr)
        }
        trList = sortByBaseCurrency(trList)
        for (var i = 0; i < trList.length; i++) {
            tbody.append(trList[i])
        }

        // table2
        tbody = $("<tbody>")
        for (var i = 0; i < setting.schema.length; i++) {
            var key = setting.schema[i].key
            var i18n = setting.schema[i].i18n || ('account_balance_header_' + key)
            var icon = $('<small>').append($("<span>", { class: "btn btn-info label label-info icon-btn-bank-balance-reload", text: messages.btn_reload.text }))
            var tr = $("<tr>")
            var th = $("<th>").append($('<span>', {
                scrop: "row",
                "data-i18n": i18n,
                text: setting.schema[i].name || ''
            }))
            var td = $("<td>", {
                class: 'text-right text-primary',
                "data-tag": key
            })
            if (key == 'bankBalance') {
                th.append(icon)
                tr.append(th).append(td)
            } else {
                tr.append(th).append(td)
            }
            tbody.append(tr)
        }
        table2.append(tbody)

        inner.append(tableContainer1).append($("<hr />")).append(tableContainer2).appendTo(container)
        current_currency = current_currency || 'ALL'
        resetDropdown()

        tableContainer1.perfectScrollbar()
        tableContainer2.find('#account-balance-table-container2').perfectScrollbar()
        setTimeout(function () {
            tableContainer1.perfectScrollbar('update')
            tableContainer2.find('#account-balance-table-container2').perfectScrollbar('update')
        }, 1000)
        container.find('td').css("padding", "4px").css("padding-right", "8px")
        container.translate()

        dropdown_group.on('change', function (event, value) {
            current.currency = value
            current_currency = value
            update()
        })
        $('.icon-btn-bank-balance-reload').click(function () {
            if (!queryBankBalanceFlag) return
            $.get($.getRandomUr('/iTrader/account/bankBalance'), function () { })
            queryBankBalanceFlag = false
            setTimeout(function () {
                queryBankBalanceFlag = true
            }, 1000)
        })
    }

    function update() {
        if (!table1 || !table2) return
        table1.find('td').each(function () {
            var currency = $(this).attr('data-currency')
            var key = $(this).attr('data-tag')
            if (currency && key) {
                var acctObj = acctMgr.get(acctMgr.current_account, currency)
                if (acctObj) {
                    $(this).text($._format.amount(acctObj[key]))
                }
            }
        })

        table2.find('td').each(function () {
            var key = $(this).attr('data-tag')
            if (key) {
                acctMgr.updateAcctInfo()
                var acctObj
                if (isConsolidatedBalanceMode()) {
                    acctObj = acctMgr.get(acctMgr.current_account, null)
                } else {
                    acctObj = acctMgr.get(acctMgr.current_account, current_currency)
                }
                if (acctObj) {
                    if (isNaN(acctObj[key])) {
                        $(this).text($._format.amount(acctObj[key]))
                    } else {
                        var currency = current_currency && current_currency !== 'ALL' ? current_currency : curMgr.base_currency
                        var value = acctObj[key] || 0
                        if (isConsolidatedBalanceMode()) {
                            var currencyObj = curMgr.get(currency)
                            if (currencyObj && currencyObj.ratio) {
                                value /= currencyObj.ratio
                            }
                        }
                        $(this).text($._format.amount(value || 0) + "({0})".format(currency))
                    }
                }
            }
        })
    }

    function getCurrencyLabel(currency) {
        return $("<span>", {
            class: "label label-info",
            style: "font-weight: normal; padding: 2px; width:30px",
            text: currency
        })
    }

    function sortByBaseCurrency(array) {
        if (!array || array.length <= 0) return array
        return array.sort(function (a, b) {
            if (typeof a.text === 'function') {
                if (a.text() === curMgr.base_currency) return -1
            } else {
                if (a.key === "ALL") return -1
                if (b.key === "ALL") return 1
                if (a.key === curMgr.base_currency) return -1
                return 1
            }
            return 1
        })
    }

    function resetDropdown() {
        var options = {
            name: {
                i18n: 'column_currency',
                value: 'currency'
            },
            data: []
        }
        if (curMgr.currencyMode === 'multi') {
            if (!acctMgr.account_balance_list) return
            current_currency = null
            if (isConsolidatedBalanceMode()) {
                for (var i = 0; i < curMgr.currency_list.length; i++) { // for loop all the currency when in consolidatedBalanceMode
                    var currencyObj = curMgr.currency_list[i]
                    if (!isExist(options.data, currencyObj.currency)) {
                        options.data.push({
                            key: currencyObj.currency,
                            value: currencyObj.currency
                        })
                    }
                }
            } else {
                for (var i = 0; i < acctMgr.account_balance_list.length; i++) {
                    var accountObj = acctMgr.account_balance_list[i]
                    if (accountObj.account == acctMgr.current_account) {
                        if (util.IsNeedToHideGroupBalance(curMgr.currency_list) && !accountObj.currency) {
                            if (current_currency == null) {
                                current_currency = curMgr.base_currency
                            }
                            continue
                        }
                        var c = accountObj.currency || "ALL"
                        if (!isExist(options.data, c)) {
                            options.data.push({
                                key: c,
                                value: c === "ALL" ? "{0}({1})".format(messages.ALL.text, curMgr.base_currency) : c
                            })
                        }
                    }
                }
            }
        }
        options.data = sortByBaseCurrency(options.data)
        dropdown_group.CreateDrowdownGroup(options)
        setExchangeButton(dropdown_group)
    }

    function setExchangeButton(group) {
        if (!group) return
        var button = $("<button>", {
            type: "button",
            class: "btn btn-primary"
        })
            .append($("<span>", {
                class: "fa fa-exchange"
            }))
        button.click(function () {
            exchange_ratio.show(curMgr)
        })
        group.find('button:last').after(button)
    }

    function isExist(list, currency) {
        if (list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i] && list[i].key === currency) return true
            }
        }
    }

    function isConsolidatedBalanceMode() {
        return curMgr.currencyMode === 'multi' && setting.consolidatedBalanceMode  // consolidated balance mode only work in multi currency mode
    }

    function getAccountBalanceCount() {
        var length = 0
        if (acctMgr && acctMgr.account_balance_list) {
            for (var i = 0; i < acctMgr.account_balance_list.length; i++) {
                if (!acctMgr.account_balance_list[i].isDummy) {
                    length++
                }
            }
        }
        return length
    }
})