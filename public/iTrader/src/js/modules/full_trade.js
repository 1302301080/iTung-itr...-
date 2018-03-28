/*!
{*******************************************************************}
{                                                                   }
{       eBroker Systems Javascript Component Library                }
{                                                                   }
{                                                                   }
{       Copyright(c) 2000-2017 eBroker Systems Ltd.                 }
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

{ $Id: full_trade.js,v 1.8 2017/12/26 03:14:36 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var isMobile = require('mobile').GetIsMobile()
    var removeIcon = "<a href='javascript:void(0)'><i class='fa fa-lg fa-remove text-danger table-row-remove'></i></a>"

    function getSelectComfirmation() {
        var table = $('.tab-pane.active').find('.pending-submit-table')
        var newTable = $(table).clone()
        var side = $(newTable).attr('side')
        var tr = $(newTable).find('tr')
        for (var i = 1; i < tr.length; i++) {
            var input = $(tr[i]).find('input')
            input.each(function () {
                $(this).parent().addClass('text-right')
                $(this).parent().removeClass('full-trade-input')
                $(this).parent().html('<span >{0}</span>'.format($(this).val()))
            })
        }
        $(newTable).find('tr').each(function () {
            $($(this).find('td,th')[0]).remove()
            var title = $($(this).find('td,th')[1]).text()
            if (!isMobile) {
                $($(this).find('td,th')[1]).remove()
            }
            $($(this).find('td,th')[0]).attr('title', title).removeClass('pointer')
            if (side == 1) {
                $(this).find('td:last,th:last').remove()
            }
        })
        var div1 = $('<small>').append($('<div>'))
        div1.append(newTable)
        var div = $('<div>').append(div1)
        return div.html()
    }

    function createTable(data, columns, options) {
        if (!columns) return
        var side = (options ? options.side : 0) || 0
        var table = $("<table>", { class: "table table-bordered table-condensed " + (side == 0 ? 'table-green' : 'table-red') })
        var tr = $("<tr>")
        for (var i = 0; i < columns.length; i++) {
            tr.append($("<th>", { "html": columns[i].text || '', "data-key": columns[i].key || '' }))
        }
        table.append($("<thead>").append(tr))

        if (data && data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                var item = data[i]
                if (!item[0]) continue
                var tr = $("<tr>", { "data-symbol": item[0] })
                for (var j = 0; j < columns.length; j++) {
                    var c = columns[j]
                    if (c.type === 'input') {
                        tr.append($("<td>", { class: c.class || '' }).append($("<input>", { "data-key": c.key, "class": "form-control input-sm text-right", "value": item[c.key] || "" })))
                    } else if (c.type === 'icon') {
                        tr.append($("<td>", { "style": "text-align:center;" }).append(removeIcon))
                        tr.find('.fa-remove').click(function () {
                            $(this).parents('tr').remove()
                        })
                    } else {
                        var title = ''
                        if (c.key === 'symbolName' || c.key === '25') {
                            title = item[c.key]
                        }
                        tr.append($("<td>", { "data-key": c.key, "class": c.class, "html": item[c.key] || "", "title": title }))
                    }
                }
                table.append(tr)
            }
        }

        return $("<div>").append($("<small>").append(table))
    }

    function addNewPendSymbol(data, columns, options) {
        if (!columns) return
        options = options || {}
        var table = $('.tab-pane.active').find('.pending-submit-table')
        if (table.find('thead').length <= 0) {
            var tr = $("<tr>")
            for (var i = 0; i < columns.length; i++) {
                tr.append($("<th>", { "html": columns[i].text || '', "data-key": columns[i].key || '' }))
            }
            table.append($("<thead>").append(tr))
        }
        if (options.clear) {
            table.find('tbody tr').remove()
        }
        if (!data) return
        for (var i = 0; i < data.length; i++) {
            var item = data[i]
            if (!item[0]) continue
            var tr
            var trs = table.find('tr[data-symbol={0}]'.format(item[0]))
            if (trs.length > 0) {
                tr = $(trs[0])
                var elements = tr.find('[data-key]')
                for (var k = 0; k < elements.length; k++) {
                    var value = item[$(elements[k]).attr('data-key')] || ''
                    $(elements[k]).html(value).val(value)
                }
            } else {
                tr = $("<tr>", { "data-symbol": item[0] })
                for (var j = 0; j < columns.length; j++) {
                    var c = columns[j]
                    if (c.type === 'input') {
                        var isDisabled = false
                        if (c.key == 3 && item[c.key] === '0.00') {
                            isDisabled = true
                        }
                        tr.append($("<td>", { class: c.class || '' }).append($("<input>", { "data-key": c.key, "class": "form-control input-sm text-right", "value": item[c.key] || "", disabled: isDisabled })))
                    } else if (c.type === 'icon') {
                        tr.append($("<td>", { "style": "text-align:center;" }).append(removeIcon))
                        tr.find('.fa-remove').click(function () {
                            $(this).parents('tr').remove()
                        })
                    } else {
                        var title = ''
                        if (c.key === 'symbolName' || c.key === '25') {
                            title = $(item[c.key]).text()
                        }
                        tr.append($("<td>", { "data-key": c.key, "class": c.class, "html": item[c.key] || "", "title": title }))
                    }
                }
                if (typeof options.newRowHandler === 'function') {
                    options.newRowHandler(tr)
                }
                table.append(tr)
            }
        }
    }

    function getDiscolsureCheckBox(type) {
        if (!type) return ''
        var disclosure
        if (type == '10' && initial_data.views.full_trade.fund.disclosure) {
            disclosure = 'order_confirmation_fund_disclosure'
        } else if (type == '6' && initial_data.views.full_trade.bond.disclosure) {
            disclosure = 'order_confirmation_bond_disclosure'
        } else return ''
        var label = $('<label>').append($('<input>', { type: 'checkbox', 'required-accept-disclosure': false })).append($('<span>', { 'data-i18n': disclosure }))
        var div1 = $('<div>', { class: 'checkbox fullTrade_checkbox' })
        div1.append(label)
        var div = $('<div>').append(div1)
        $(div1).translate()
        return div.html()
    }

    function checkboxAction() {
        var submitBtn = $('[required-accept-disclosure]').parents('.modal-content').find('#btn-submit')
        submitBtn.attr('disabled', true)
        $('[required-accept-disclosure]').click(function () {
            var isChecked = $(this).get(0).checked
            submitBtn.attr('disabled', !isChecked)
        })
    }

    function setInputSizeInMobile(element) {
        if (!isMobile) return
        element.removeClass('form-control')
        element.width = '100px'
    }

    function getInfo(list) {
        if (!list) return
        var trs = [$("<tr>")]
        for (var i = 0; i < list.length; i++) {
            var last = $(trs[trs.length - 1])
            if (last.find('td').length < 3) {
                if (list[i].text()) {
                    last.append(list[i])
                }
            } else {
                var tr = $("<tr>")
                if (list[i].text()) {
                    tr.append(list[i])
                }
                trs.push(tr)
            }
        }
        return trs
    }

    function getProductProperties(productObj) {
        if (!productObj) return ''
        var propertiesRow = $("<p>").append($("<i>", { text: productObj[23], class: "highlight-tag highlight-tag-sm", style: "cursor: help;", "title": messages.column_currency.text }))
        if (productObj[3409]) {
            propertiesRow.append($("<i>", { text: "Risk " + productObj[3409], class: "highlight-tag highlight-tag-sm", style: "cursor: help;margin-left: 10px;", "data-i18n": "tag_RPQ", "title": messages.tag_RPQ.title, }))
        }
        if (productObj[3602] == 'Y') {
            propertiesRow.append($("<i>", { text: "CIES", class: "highlight-tag highlight-tag-sm", style: "cursor: help;margin-left: 10px;", "data-i18n": "tag_CIES", "title": messages.tag_CIES.title, }))
        }
        if (productObj[3603] == 1) {
            propertiesRow.append($("<i>", { text: "PI", class: "highlight-tag highlight-tag-sm", style: "cursor: help;margin-left: 10px;", "data-i18n": "tag_professional_investor", "title": messages.tag_professional_investor.title, }))
        }
        if (productObj[3605] & 1024) {
            propertiesRow.append($("<i>", { text: "D", class: "highlight-tag highlight-tag-sm", style: "cursor: help;margin-left: 10px;", "data-i18n": "tag_derivative_product", "title": messages.tag_derivative_product.title, }))
        }
        return propertiesRow
    }

    function getFullSymbolName(productObj) {
        if (!productObj) return
        var div = $("<div>").append($("<div>", { text: productObj.symbolName || '' }))
        div.append(getProductProperties(productObj))
        return div.html()
    }

    exports.addNewPendSymbol = addNewPendSymbol
    exports.createTable = createTable
    exports.getSelectComfirmation = getSelectComfirmation
    exports.getDiscolsureCheckBox = getDiscolsureCheckBox
    exports.checkboxAction = checkboxAction
    exports.setInputSizeInMobile = setInputSizeInMobile
    exports.getInfo = getInfo
    exports.getFullSymbolName = getFullSymbolName
    exports.getProductProperties = getProductProperties
})
