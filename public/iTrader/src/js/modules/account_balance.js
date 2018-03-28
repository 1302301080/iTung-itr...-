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

{ $Id: account_balance.js,v 1.20 2018/02/27 05:27:02 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'account_balance'
    var container
    var inner
    var dropdown_group
    var setting
    var schema = []
    var acctMgr
    var curMgr
    var exchange_ratio = require('exchange-ratio')
    var util = require('util')
    var current_currency = null
    var currencyDrpdownObj = {}
    var bankBalanceFlag = true
    var hasInitializeMultiCurrenctCB = false
    exports.init = function (c, s, aMgr, cMgr) {
        container = c
        setting = s
        acctMgr = aMgr
        curMgr = cMgr
        if (!container || !(container instanceof jQuery)) return
        if (!setting) return
        if (!acctMgr || !curMgr) return
        schema = setting.schema
        draw()
        update()
        $('#nav_account').on('change', function (event, key) {
            resetDropdown()
            update()
        })

        AccountMgr.on(function (data) {
            resetDropdown()
            update()
            if (data.account_multi_currency_CB) {
                updateMultiCurrencyCB()
            }
        })
        PositionMgr.on(function () {
            update()
        })

        $(document).on('ticket-added', function (event, data) {
            if (data && data[tags.currency] && data[tags.currency] !== current_currency) {
                dropdown_group.select(data['23'])
            }
        })
        $('.icon-btn-bank-balance-reload').click(function () {
            if (!bankBalanceFlag) return
            $.get($.getRandomUrl('/iTrader/account/bankBalance'), function () { })
            bankBalanceFlag = false
            setTimeout(function () {
                bankBalanceFlag = true
            }, 1000)
        })

        // in QA's env, the multicurrencycb panel cannot display sometimes, in this case, set a timer to run it
        var tryTimes = 5
        var fn = function () {
            updateMultiCurrencyCB()
            tryTimes--
            if (tryTimes <= 0) clearInterval(timer)
        }
        var timer = setInterval(fn, 2000)
    }

    function draw() {
        var elementHeight = container.parents('.panel').height() - 90
        inner = $("<div>")
        dropdown_group = $("<div>", { class: "text-right", id: "account-currency-dropdown-group", style: "margin:-5px 0 5px 0" })
        var ul = $("<ul>", { class: "list-group", id: "account-banlance-ul", style: "position: relative; height:{0}px".format(elementHeight) })
        for (var i = 0; i < schema.length; i++) {
            var key = schema[i].key
            var i18n = schema[i].i18n || ('account_balance_header_' + key)
            if (key == 'bankBalance') {
                ul.append("<li class='list-group-item'><b><span data-i18n='" + i18n + "'></span><small><span class='btn btn-info label label-info icon-btn-bank-balance-reload'>" + messages.btn_reload.text + "</span></small></b><span class='pull-right text-primary account_balance_list' data-format='amount' data-tag='" + key + "'></span></li>")
            } else {
                if (schema[i].alias === 'CB') {
                    var li = $("<li id='multi-currency-cb' class='list-group-item' aria-expanded='true'><b ><span data-i18n='" + i18n + "'></span></b><span class='pull-right text-primary account_balance_list' data-format='amount' data-tag='" + key + "'></span></li>")
                    if (!isShowConsolidatedCB()) {
                        li.find('.account_balance_list').remove()
                    }
                } else {
                    var li = $("<li class='list-group-item'><b data-i18n='" + i18n + "'></b><span class='pull-right text-primary account_balance_list' data-format='amount' data-tag='" + key + "'></span></li>")
                }
                ul.append(li)
            }
        }
        ul.perfectScrollbar()
        inner.append(dropdown_group).append(ul)
        container.append(inner)
        container.translate()

        dropdown_group.on('change', function (event, value) {
            current.currency = value
            current_currency = value
            update()
        })
        setTimeout(function () {
            ul.perfectScrollbar('update')
        }, 3000)
    }

    function update() {
        acctMgr.updateAcctInfo()
        var account = acctMgr.current_account
        var balance
        var ratio = 1
        if (isConsolidatedBalanceMode()) {
            balance = acctMgr.get(account, null)
            var currencyObj = curMgr.get(current_currency)
            if (currencyObj && currencyObj.ratio) {
                ratio = currencyObj.ratio
            }
        } else if (isCNYMode() && current_currency === 'CNY') {
            balance = acctMgr.get(account + initial_data.CNYAcctSuffix, 'CNY')
        } else {
            balance = acctMgr.get(account, current_currency)
        }
        if (!balance) return
        util.HandleZeroShowNA(balance)
        $('.account_balance_list').each(function () {
            var tag = $(this).attr('data-tag')
            if (balance && balance[tag]) {
                if (typeof balance[tag] === 'string' && isNaN(balance[tag])) {
                    $(this).text(balance[tag])
                } else {
                    var value = balance[tag] / ratio
                    $(this).text(value || 0)
                }
            } else if (balance && isNaN(balance[tag])) {
                $(this).text(balance[tag])
            } else {
                $(this).text(0)
            }
        })
        inner.format()
    }

    function updateMultiCurrencyCB() {
        if (!isShowMultiCurrencyCB()) return
        var li = $('#multi-currency-cb')
        if (!hasInitializeMultiCurrenctCB) {
            li.click(function (e) {
                if ($(e.target).parent('div').hasClass('multi-cash-balance')) return
                if ($(this).attr('aria-expanded') == 'true') {
                    $(this).find('.multi-cash-balance').hide()
                    $(this).attr('aria-expanded', false)
                } else {
                    $(this).find('.multi-cash-balance').show()
                    $(this).attr('aria-expanded', true)
                }
            })
            hasInitializeMultiCurrenctCB = true
        }
        li.find('.multi-cash-balance').remove()
        var cbDiv = $("<div class='multi-cash-balance'>").append("<hr style='width: 100%;' />")
        for (var p in acctMgr.account_multi_currency_CB) {
            var value = $._format.amount(acctMgr.account_multi_currency_CB[p] || 0)
            cbDiv.append($("<p>").append("<span>{0}</span>".format(p)).append("<span class='pull-right'>{0}</span>".format(value)))
        }
        if (li.find('.fa-list').length <= 0) {
            li.find('b').prepend("<i class='fa fa-list icon-margin'></i>")
        }
        li.css('cursor', 'pointer')
        li.append(cbDiv)
        if (li.attr('aria-expanded') == 'false') {
            cbDiv.hide()
        }
    }

    function resetDropdown() {
        if (initial_data.views.trade.account_balance.disableCurrencyConversion) {
            current_currency = curMgr.base_currency
            $('#account-balance-remark').html(messages.account_balance_remark.html)
            return
        }
        var options = {
            name: {
                i18n: 'column_currency',
                value: 'currency'
            },
            data: []
        }
        if (current_currency) {
            options.data.push({ key: current_currency, value: current_currency })
        }
        var account = acctMgr.current_account
        if (curMgr.currencyMode === 'multi') {
            if (!acctMgr.account_balance_list) return
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
                var current_account_balance_list = _.filter(acctMgr.account_balance_list, function (a) {
                    return a.account == account
                })
                if (account == currencyDrpdownObj.account && current_account_balance_list.length == currencyDrpdownObj.count) return // no currency update
                for (var i = 0; i < current_account_balance_list.length; i++) {
                    var accountObj = current_account_balance_list[i]
                    if (util.IsNeedToHideGroupBalance(curMgr.currency_list) && !accountObj.currency) {
                        if (!current_currency) {
                            current_currency = curMgr.base_currency
                        }
                        continue
                    }
                    var c = accountObj.currency || "ALL"
                    if (!isExist(options.data, c)) {
                        options.data.push({ key: c, value: c === "ALL" ? "{0}({1})".format(messages.ALL.text, curMgr.base_currency) : c })
                    }
                }
            }
        } else {
            if (!curMgr.currency_list) return
            var count
            // CNY account map handling
            if (isCNYMode()) {
                options.data = [{ key: curMgr.base_currency, value: curMgr.base_currency },
                { key: 'CNY', value: 'CNY' }]
            }
            if (isCNYMode()) {
                count = 2
            } else {
                for (var i = 0; i < curMgr.currency_list.length; i++) {
                    var currency = curMgr.currency_list[i].currency
                    if (!isExist(options.data, currency)) {
                        options.data.push({ key: currency, value: currency })
                    }
                }
                count = curMgr.currency_list.length
            }
            if (account == currencyDrpdownObj.account && count == currencyDrpdownObj.count) return   // no currency update
            current_currency = curMgr.base_currency
        }
        currencyDrpdownObj = { account: account, count: options.data.length }
        options.data = sortByBaseCurrency(options.data)
        dropdown_group.CreateDrowdownGroup(options)
        setExchangeButton(dropdown_group)
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

    function sortByBaseCurrency(array) {
        if (!array || array.length <= 0) return array
        return array.sort(function (a, b) {
            if (a.key === current_currency) return -1
            if (b.key === current_currency) return 1
            if (a.key === "ALL") return -1
            if (b.key === "ALL") return 1
            if (a.key === curMgr.base_currency) return -1
            if (b.key === curMgr.base_currency) return 1
            return 1
        })
    }

    function isCNYMode() {
        if (initial_data && initial_data.CNYAcctSuffix) return true
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

    function isShowMultiCurrencyCB() {
        if (acctMgr.account_multi_currency_CB && !$.isEmptyObject(acctMgr.account_multi_currency_CB)) return true
        return false
    }

    function isShowConsolidatedCB() {
        return setting.showConsolidatedCB !== false
    }
})