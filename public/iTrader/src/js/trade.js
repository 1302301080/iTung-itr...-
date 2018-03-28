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

{ $Id: trade.js,v 1.21 2017/11/29 10:42:28 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

$(function () {
    initialize(function (err) {
        seajs.use(["format", "socket-v2", "datatables", 'notification'], function (f, s, d, n) {
            if (!err) {
                if (initial_data.popupRejectedOrder) {
                    seajs.use('reject-order-notification', function (n) {
                        n.init()
                    })
                }

                seajs.use(['ticket', 'portfolio'], function (ticket, portfolio) {
                    portfolio.init($('#portfolio-panel'))
                })
                var account_balance_section = initial_data.views.trade.account_balance
                if (account_balance_section && account_balance_section.mainSchema && account_balance_section.mainSchema.length >= 0) {
                    seajs.use("account-balance2", function (ab) {
                        ab.init($('#account-balance-panel'), initial_data.views.trade.account_balance, AccountMgr, CurrencyMgr)
                    })
                } else {
                    seajs.use("account-balance", function (ab) {
                        ab.init($('#account-balance-panel'), initial_data.views.trade.account_balance, AccountMgr, CurrencyMgr)
                    })
                }

                initComponnent('orderbook', 'order-book-panel')
                initComponnent('cashbook', 'cash-book-panel')
                initComponnent('historybook', 'history-order-book-panel', initial_data.views.trade.history_order)
                initComponnent('transaction-history', 'transaction-history-panel')
                initComponnent('fundbook', 'fund-book-panel', initial_data.views.trade.fund_book)
                initComponnent('eStatement', 'estatement-panel')
                initComponnent('settlement')
                initComponnent('price-quote', 'price-quote-panel')
                initComponnent('price', 'price-panel')

                seajs.use('mobile', function (mo) {
                    mo.init()
                })

                SearchProduct_Initialize()
                $(document).translate()
                AdjustUI()
                s.init()
                $(document).trigger('initialized')
            }
        })
    })
})

function initComponnent(name, id, options) {
    if (!name) return
    var panel = $('#' + id)
    if (panel && panel.length > 0) {
        seajs.use(name, function (obj) {
            if (typeof obj.init === 'function') {
                obj.init(panel, options)
            }
        })
    } else {
        seajs.use(name)
    }
}

function AdjustUI() {
    for (var i = 0; i < 10; i++) {
        var row_name = '.index-row-' + i
        if ($(row_name).length > 0) {
            $(row_name).find('.panel').each(function () {
                $(this).height(380)
            })
        } else {
            break
        }
    }
}

function TicketSymbol_Input(symbolObj) {
    seajs.use('ticket', function (t) {
        t.inputSymbol(symbolObj)
    })
}