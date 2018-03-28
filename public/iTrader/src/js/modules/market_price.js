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

{ $Id: market_price.js,v 1.2 2016/12/14 03:48:33 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    window.onload = function () {
        setInterval(function () {
            var value = window.status || window.defaultStatus || window.title
            if (value) {
                window.status = ''
                window.defaultStatus = ''
                window.title = ''
                processPrice(value)
            }
        }, 300)

        var market_price_form = document.getElementById('market-price-form')
        if (market_price_form) {
            market_price_form.submit()
        }
    }
    window.addEventListener("message", function (e) {
        processPrice(e.data)
    }, false)

    function processPrice(data) {
        if (!data) return
        var array = data.split(';')
        var symbol
        var price
        if (data.indexOf('T#') === 0) {   // AAStocks java applet version
            if (array.length >= 2) {
                symbol = array[0].substring(2, array[0].length)
                price = array[1]
            }
        } else if (data.indexOf('SP:') >= 0) {  // MegaHub, TSCI and ETNET(please note that data maybe with double quotation marks)
            if (array.length >= 3) {
                symbol = array[0].substring(array[0].indexOf(':') + 1, array[0].length)
                price = array[2]
            }
        } else {   // AAStocks HTML5 version
            array = data.split('&')
            for (var i = 0; i < array.length; i++) {
                var kv = array[i].split('=')
                if (kv.length === 2) {
                    if (kv[0] === 'stock') {
                        symbol = kv[1]
                    } else if (kv[0] === 'price') {
                        price = kv[1]
                    }
                }
            }
        }
        if (symbol && price) {
            copyPrice({ symbol: symbol, price: price })
        }
    }

    function copyPrice(symbolObj) {
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
})