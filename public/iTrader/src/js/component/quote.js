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

{ $Id: quote.js,v 1.2 2016/10/27 08:41:18 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var quote_panel

function InitializeQuote() {
    quote_panel = $('#quote_panel')
    if (quote_panel.length <= 0) return
    var cssClass
    for (var i = 0; i < initial_data.quote.columns.length; i++) {
        var column = initial_data.quote.columns[i]
        if (column.name.indexOf('ask') >= 0) {
            cssClass = 'text-right text-danger'
        } else {
            cssClass = 'text-right text-success'
        }
        var tr = $("<tr></tr>");
        var td_header = $("<td class='col-sm-4' data-i18n='quote_header_" + i + "'></td>")
        var td_size = $("<td data-format='quantity' data-tag='" + column.size_tag + "'class='" + cssClass + "'></td>")
        var td_price = $("<td><span data-event='ClickPrice' data-tag='" + column.price_tag + "' class='pointer " + cssClass + "' data-format='currency'></span></td>")
        tr.append(td_header).append(td_price).append(td_size)
        $('#quote_tbody').append(tr)
    }
}

function CalclateQuotePrice(product) {
    if (product) {
        if (product[initial_data.tags.bid1]) {
            var lastBid = initial_data.tags.bid1
            for (var i = 81; i < 91; i++) {
                product[i] = product[i] || Number(product[lastBid]) - getSpread(product, product[lastBid])
                lastBid = i.toString()
            }
        }
        if (product[initial_data.tags.ask1]) {
            var lastAsk = initial_data.tags.ask1
            for (var i = 91; i < 101; i++) {
                product[i] = product[i] || Number(product[lastAsk]) + getSpread(product, product[lastAsk])
                lastAsk = i.toString()
            }
        }
    }
}

function UpdateQuote(product) {
    if (quote_panel.length <= 0) return
    if (!ticket_input_SymbolCode.val()) return
    if (!product) {
        quote_panel.find('[data-tag]').each(function () {
            $(this).text('')
        })
    } else {
        CalclateQuotePrice(product)
        quote_panel.find('[data-tag]').each(function () {
            var tag = $(this).attr('data-tag')
            var dataFormat = $(this).attr('data-format')
            if (tag && product[tag]) {
                if (dataFormat === 'currency') {
                    $(this).text(f_currency(product[tag]))
                } else if (dataFormat === 'quantity') {
                    $(this).text(f_quantity(product[tag]))
                }
            }
        })
    }
}