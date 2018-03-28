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

{ $Id: market_price.js,v 1.4 2016/10/27 08:41:17 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

/* no jQuery in this file as jQuery not support IE6 7 8
 * AAStocks java applet version only support IE 7 8
*/

window.onload = function () {
    setInterval(function () {
        MarketPrice_Copy()
    }, 300)

    var market_price_form = document.getElementById('market-price-form')
    if (market_price_form) {
        market_price_form.submit()
    }
}

function MarketPrice_Copy() {
    var value = window.status || window.defaultStatus || window.title
    if (value) {
        window.status = ''
        window.defaultStatus = ''
        var array = value.split(';')
        if (array.length >= 3) {
            var price = 0
            if (array[0].indexOf('T#') === 0) {
                symbol = array[0].substring(2, array[0].length)
                price = array[1]
            } else {
                var symbol = array[0].substring(array[0].indexOf(':') + 1, array[0].length)
                price = array[2]
            }
            MarketPrice_SymbolInput({ symbol: symbol, price: price })
        }
    }
}

window.addEventListener("message", receiveMessage, false)

function receiveMessage(event) {
    if (!event || !event.data) return
    var array = event.data.split('&')
    var obj = {}
    for (var i = 0; i < array.length; i++) {
        var kv = array[i].split('=')
        if (kv.length === 2) {
            if (kv[0] === 'stock') {
                obj.symbol = kv[1]
            } else if (kv[0] === 'price') {
                obj.price = kv[1]
            }
        }
    }
    MarketPrice_SymbolInput(obj)
}

function MarketPrice_SymbolInput(symbolObj) {
    if (!symbolObj || !symbolObj.symbol || !symbolObj.price) return
    if (window.opener) {
        if (typeof window.opener.TicketSymbol_Input === 'function') {
            window.opener.TicketSymbol_Input(symbolObj)
        }
    } else if (window.parent) {
        window.parent.TicketSymbol_Input(symbolObj)
    } else {
        if (typeof TicketSymbol_Input === 'function') {
            TicketSymbol_Input(symbolObj)
        }
    }
}