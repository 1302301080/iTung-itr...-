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

{ $Id: price.js,v 1.5 2018/01/19 10:00:24 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var price_productObj
    var container
    var inputSymbolCode

    function init(c) {
        container = c
        if (!container || container.length <= 0) return
        inputSymbolCode = $('#price-symbol-code')
        update()

        $('.copyprice').click(function () {
            if (price_productObj) {
                var price = $(this).find('[data-format=price]').text()
                if (isNaN(price)) price = 0
                var symbolObj = {
                    name: 'copy-symbol',
                    exchange: price_productObj[20],
                    symbol: price_productObj[0],
                    price: price
                }
                window.postMessage(symbolObj, '/')
            }
        })

        $('#price-refresh').click(function () {
            update()
        })

        inputSymbolCode.keypress(function (event) {
            if (event.keyCode == 13) {
                event.cancelBubble = true
                event.returnValue = false
                update()
                return false
            }
            return true
        })

        var frequency = 5
        if (initial_data && initial_data.update_frequency && initial_data.update_frequency.product > 0) {
            frequency = initial_data.update_frequency.product
        }
        setInterval(function () {
            update()
        }, frequency * 1000)

        $(document).on('ticket-added', function (event, data) {
            inputSymbolCode.val(data[tags.symbol])
            update()
        })
        container.translate()
    }

    function update() {
        var symbol = inputSymbolCode.val()
        if (!symbol) return
        $.get('/iTrader/product?symbol=' + symbol, function (result) {
            var productObj = result.data
            var symbol = inputSymbolCode.val()
            var exchanges = initial_data.views.trade.price.exchanges
            if (productObj && symbol === productObj[0] && exchanges.indexOf(productObj[20]) >= 0) {
                price_productObj = productObj
                $('#price-update-time').text(moment().format('MM/DD/YYYY HH:mm:ss'))
                container.find('[data-tag]').each(function () {
                    $(this).text(productObj[$(this).attr('data-tag')] || '--')
                    if ($(this).attr('data-tag') === 'symbolName') {
                        $(this).attr('title', productObj[$(this).attr('data-tag')] || '')
                    }
                })
                container.format()
                container.find('[data-format=price]').each(function () {
                    $(this).text(getDisplayPrice($(this).text(), 'market', productObj))
                })
            } else {
                reset()
            }
        })
    }

    function reset() {
        price_productObj = null
        $('#price-update-time').text('--')
        container.find('[data-tag]').each(function () {
            if ($(this).attr('data-tag') === 'symbolName') {
                $(this).text(messages.ticket_message_invalid_symbol.text)
                $(this).attr('title', '')
            } else {
                $(this).text('--')
            }
        })
    }

    exports.init = init
})