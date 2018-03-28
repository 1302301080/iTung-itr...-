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

{ $Id: price.js,v 1.12 2017/08/17 04:35:54 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var price_panel
var price_productObj
var price_lastSymbol

$(document).on('initialized', function () {
    price_panel = $('#price-panel')
    Price_Update({})

    $('.copyprice').click(function () {
        if (price_productObj) {
            var symbolObj = {
                name: 'copy-symbol',
                exchange: price_productObj[tags.exchange],
                symbol: price_productObj[tags.symbol],
                price: $(this).find('[data-format=price]').text()
            }
            window.postMessage(symbolObj, '/')
        }
    })

    $('#price-refresh').click(function () {
        var symbol = $('#price-symbol-code').val()
        if (symbol) {
            refresh('product', [symbol])
            if (price_productObj) {
                $('#price-update-time').text(moment().format('MM/DD/YYYY HH:mm:ss'))
            }
        } else {
            Price_Reset()
        }
    })
})

$(document).on('ticket-added', function (event, data) {
    $('#price-symbol-code').val(data[tags.symbol])
    Price_SubscribeProduct()
})

$(document).on('products', function (event, data) {
    if (!data || !data.products) return
    for (var i = 0; i < data.products.length; i++) {
        if (data.products[i][tags.symbol] === $('#price-symbol-code').val()) {
            Price_Update(data.products[i])
        }
    }
})

function Price_SubscribeProduct() {
    var code = $('#price-symbol-code').val()
    if (code === price_lastSymbol) return
    if (price_lastSymbol) {
        GetProduct(price_lastSymbol, { flag: -1 })  // unsubscribe last product        
    }
    price_lastSymbol = code
    Price_Update()
    GetProduct(code, { flag: 1 }, function (productObj) {
        if (!productObj || productObj[tags.symbol] !== $('#price-symbol-code').val()) return false
        Price_Update(productObj)
    })
}

function PriceSymbol_KeyPress(event) {
    if (event.keyCode == 13) {
        event.cancelBubble = true
        event.returnValue = false
        Price_SubscribeProduct()
        return false
    }
    return true
}

function Price_Update(productObj) {
    if (!price_panel || price_panel.length <= 0) return
    var exchanges = initial_data.views.trade.price.exchanges
    var symbol = $('#price-symbol-code').val()
    if (productObj && symbol === productObj[tags.symbol] && exchanges.indexOf(productObj[tags.exchange]) >= 0) {
        price_productObj = productObj
        $('#price-update-time').text(moment().format('MM/DD/YYYY HH:mm:ss'))
        price_panel.find('[data-tag]').each(function () {
            $(this).text(productObj[$(this).attr('data-tag')] || '--')
            if ($(this).attr('data-tag') === 'symbolName') {
                $(this).attr('title', productObj[$(this).attr('data-tag')] || '')
            }
        })
        price_panel.format()
        price_panel.find('[data-format=price]').each(function () {
            $(this).text(getDisplayPrice($(this).text(), 'market', productObj))
        })
    } else {
        Price_Reset()
    }
}

function Price_Reset() {
    price_productObj = null
    $('#price-update-time').text('--')
    price_panel.find('[data-tag]').each(function () {
        if ($(this).attr('data-tag') === 'symbolName') {
            $(this).text(messages.ticket_message_invalid_symbol.text)
            $(this).attr('title', '')
        } else {
            $(this).text('--')
        }
    })
}