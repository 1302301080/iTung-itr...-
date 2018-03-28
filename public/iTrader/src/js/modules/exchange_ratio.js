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

{ $Id: exchange_ratio.js,v 1.9 2017/08/02 08:42:25 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'exchange_ratio'
    var inner
    var curMgr
    var table
    function show(cMgr) {
        curMgr = cMgr
        if (!curMgr || !curMgr.currency_list) return
        return layer.open({
            type: 1,
            title: messages.exchange_ratio_title.text,
            area: ['400px', '420px'],
            shade: 0,
            content: getContent(),
            success: function (layero, index) {
            }
        })
    }

    function getContent() {
        table = $("<table>", { "class": "table table-bordered table-hover table-condensed table-striped" })
        inner = $("<body>").append($("<div>", { "class": "container-fluid", "style": "margin-top: 10px" })
            .append($("<div>", { "class": "row" })
                .append($("<div>", { "class": "col-md-12", "style": "overflow-x: auto;height: 300px" })
                    .append(table)))
            .append("<div class='row' style='margin-top:20px;'><div class='col-sm-12'><small class='text-danger'><i class='fa fa-exclamation-circle'></i>{0}</small></div></div>".format(messages.exchange_ratio_remind.text)))
        $("<thead>")
            .append($("<tr><th>{0}</th><th>{1}</th></tr>".format(messages.column_currency.text, messages.exchange_ratio_column.text)))
            .appendTo(table)
        var tbody = $("<tbody>")
            .appendTo(table)
        var currencyList = sortByCurrency(curMgr.currency_list)
        for (var i = 0; i < currencyList.length; i++) {
            var item = currencyList[i]
            if (item && item.currency) {
                var tr = $("<tr>")
                    .append($("<td>", { text: item.currency }))
                    .append($("<td>", { text: $._format.price(item.ratio, 6) }))
                tbody.append(tr)
            }
        }
        return inner.html()
    }

    function sortByCurrency(currencyList) {
        if (!currencyList || currencyList.length <= 0) return currencyList
        var baseCurrency = curMgr.base_currency
        return currencyList.sort(function (a, b) {
            if (a && a.currency == baseCurrency) return -1
            return 1
        })
    }

    exports.show = show
})