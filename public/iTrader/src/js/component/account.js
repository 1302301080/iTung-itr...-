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

{ $Id: account.js,v 1.7 2016/10/27 08:41:17 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var account_balance_panel
var account_currency_dropdown

function AccountBalance_Initialize() {
    account_balance_panel = $('#account-panel')
    account_currency_dropdown = $('#account-currency-dropdown-group')
    if (account_balance_panel.length <= 0) return
    var schema = initial_data.views.trade.account_balance.schema
    for (var i = 0; i < schema.length; i++) {
        var key = schema[i].key
        var i18n = schema[i].i18n || ('account_balance_header_' + key)
        $('#account-banlance-ul').append("<li class='list-group-item'><b data-i18n='" + i18n + "'></b><span class='pull-right text-danger account_balance_list' data-format='amount' data-tag='" + key + "'></span></li>")
    }

    $('#nav_account').on('change', function (event, key) {
        AccountBalance_Update()
    })

    $(document).on('account-update', function (event, data) {
        AccountBalance_Update()
        AccountCurrencyDropdownGroup_Reset()
    })

    $(document).on('currency', function (event, data) {
        current.currency = CurrencyMgr.base_currency
        AccountCurrencyDropdownGroup_Reset()
    })

    account_currency_dropdown.on('change', function (event, value) {
        current.currency = value
        AccountBalance_Update()
    })
}

function AccountBalance_Update() {
    var balance = AccountMgr.get(current.account, current.currency)
    var i = 0
    $('.account_balance_list').each(function () {
        var tag = $(this).attr('data-tag')
        if (balance && balance[tag]) {
            $(this).text(balance[tag])
        } else {
            $(this).text(0)
        }
        i++
    })
    account_balance_panel.format()
}

function AccountCurrencyDropdownGroup_Reset() {
    var options = {
        name: {
            i18n: 'column_currency',
            value: 'currency'
        },
        data: []
    }
    if (current.currency) {
        options.data.push({ key: current.currency, value: current.currency })
    }
    if (CurrencyMgr.currencyMode === 'multi') {
        if (!AccountMgr.account_balance_list) return
        for (var i = 0; i < AccountMgr.account_balance_list.length; i++) {
            var currencyObj = AccountMgr.account_balance_list[i]
            if (currencyObj.account == AccountMgr.current_account && currencyObj.currency) {  // filter object without currency
                var c = currencyObj.currency
                var index = _.findIndex(options.data, function (o) {
                    return o.key == c
                })
                if (index >= 0) continue
                options.data.push({ key: c, value: c })
            }
        }
    } else {
        for (var i = 0; i < CurrencyMgr.currency_list.length; i++) {
            var currency = CurrencyMgr.currency_list[i].currency
            var index = _.findIndex(options.data, function (o) {
                return o.key == currency
            })
            if (index >= 0) continue
            options.data.push({ key: currency, value: currency })
        }
    }
    account_currency_dropdown.CreateDrowdownGroup(options)
}
