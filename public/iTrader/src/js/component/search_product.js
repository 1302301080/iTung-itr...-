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

{ $Id: search_product.js,v 1.14 2017/12/15 10:08:45 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var search_product_panel
var search_product_table
var search_product_datatable
var search_product_dialog

function SearchProduct_Initialize() {
    search_product_panel = $('#search-product-panel')
    if (search_product_panel.length <= 0) return
    search_product_table = $('#search-product-table')
    SearchProductDt_Initialize()
    $('#search-product-btn').click(function () {
        search_product_datatable.ajax.reload()
    })
    $('#search-product-exchange,#search-product-product').change(function () {
        search_product_datatable.ajax.reload()
    })
    search_product_panel.format()
    search_product_panel.translate()
}

function SearchProduct_KeyPress(event) {
    if (event.keyCode == 13) {
        event.cancelBubble = true
        event.returnValue = false
        if (search_product_datatable) {
            search_product_datatable.ajax.reload()
        }
        return false
    }
    return true
}

function SearchProductDt_Initialize() {
    search_product_datatable = search_product_table.CreateDatatable({
        columnSchema: initial_data.views.search_product.schema,
        columnHeaderPrefix: 'search_product_header_',
        serverSide: true,
        processing: true,
        searching: false,
        lengthChange: false,
        order: [],
        dom: 'tr<"col-sm-12 text-center"ip>',
        columnDefs: [
            { className: "copyprice", "targets": [0] },
            { className: 'showTooltip', "targets": [1] }
        ],
        ajax: {
            type: 'post',
            url: '/iTrader/product/search',
            data: function (d) {
                var formDataArray = $('#search-product-form').serializeArray()
                var formData = {}
                for (var i = 0; i < formDataArray.length; i++) {
                    formData[formDataArray[i].name] = formDataArray[i].value
                }
                return $.extend({}, d, formData)
            },
            cache: false,
            dataType: 'json',
        }
    })
    search_product_datatable.on('draw.dt', function () {
        var rows = search_product_datatable.rows()[0]
        for (var i = 0; i < rows.length; i++) {
            var row = search_product_datatable.row(i)
            search_product_datatable.HandleDataColumns(search_product_datatable, row, { columnSchema: initial_data.views.search_product.schema })
        }
        search_product_panel.find('.copyprice').click(function () {
            SearchProduct_Select($(this).text())
        })
        search_product_panel.find('.showTooltip').each(function () {
            $(this).attr('title', $(this).text())
        })
        search_product_panel.find('#search-product-table_paginate').css('text-align', 'center')
        search_product_panel.format()
        search_product_panel.translate()
    })
}

function SearchProduct_Select(symbol) {
    var data = search_product_datatable.data()
    var productObj
    for (var i = 0; i < data.length; i++) {
        if (data[i][tags.symbol] === symbol) {
            productObj = { symbol: symbol, exchange: data[i][tags.exchange] }
            break
        }
    }
    if (productObj) {
        productObj.name = 'copy-symbol'
        if (window.opener && typeof window.opener.postMessage === 'function') {
            window.opener.postMessage(productObj, '/')
            window.close()
        } else {
            window.postMessage(productObj, '/')
            if (search_product_dialog) {
                search_product_dialog.close()
                search_product_dialog = null
            }
        }
    }
}

function SearchProduct_Search(exchange, productType, options) {
    var type = options ? options.type : ''
    showMessage({
        title: messages.search_product_title.text,
        load: {
            url: '/iTrader/product/search?action=popup' + '&productType=' + (productType || '') + '&exchanges=' + (exchange || '') + '&type=' + type, callback: function (dialog) {
                search_product_dialog = dialog
                SearchProduct_Initialize()
            }
        }
    })
}