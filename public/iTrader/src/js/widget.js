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

{ $Id: widget.js,v 1.2 2016/10/27 08:41:17 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

$(function () {
    initialize(function (err) {
        if (!err) {
            SocketIO_Initialize()            
            translate()
            openLayer()
        }
    })
})

function openLayer() {
    $.get('/iTrader/panel/ticket', function (body) {
        layer.open({
            type: 1,
            title: messages.ticket_title.text,
            area: ['420px', '400px'],
            shade: 0,
            maxmin: true,
            offset: [170, 20],
            content: body,
            zIndex: 10,
            success: function (layero, index) {
                $('#ticket-panel .panel-heading').remove()
                setTimeout(function () {                    
                    layer.min(index)
                    OrderTicket_Initialize()
                    translate()
                }, 500)
            }
        })
    })
}

function GetMaxBuy(symbol, price) {
    var max_buy = 0
    if (symbol && price) {
        var balanceObj = AccountMgr.get(current.account, null)
        var productObj = ProductMgr.get(symbol)
        if (balanceObj && productObj) {
            var tradingLimit = balanceObj[initial_data.tradingLimit] || 0
            var lotSize = ProductMgr.getLotSize(symbol) || 0
            if (tradingLimit && lotSize) {
                var currencyObj = CurrencyMgr.get(productObj[tags.currency])
                if (currencyObj && currencyObj.ratio) {
                    tradingLimit = tradingLimit / currencyObj.ratio
                    max_buy = Math.floor(tradingLimit / price / lotSize) * lotSize
                }
            }
        }
    }
    return max_buy >= 0 ? max_buy : 0
}

function GetMaxSell(symbol) {
    var max_sell = 0
    var positions = PositionMgr.get({ symbol: symbol, account: current.account })
    if (positions && positions.length > 0) {
        max_sell = positions[0][tags.quantity] - positions[0].queueQuantity
    }
    return max_sell >= 0 ? max_sell : 0
}