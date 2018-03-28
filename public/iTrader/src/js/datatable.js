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

{ $Id: datatable.js,v 1.10 2017/05/22 09:28:53 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

function CreateDatatable(table, options) {
    if (!table || table.length <= 0) return
    options = options || {}
    if (options.columnSchema) {
        AppendDataHeader(table, options)
    }
    var tableOptions = {
        language: options.language || messages.datatables,
        scrollX: typeof options.scrollX === 'undefined' ? false : options.scrollX,
        // scrollCollapse: typeof options.scrollCollapse === 'undefined' ? false : options.scrollCollapse,
        paging: typeof (options.paging) === 'undefined' ? true : options.paging,
        lengthChange: typeof (options.lengthChange) === 'undefined' ? false : options.lengthChange,
        searching: typeof (options.searching) === 'undefined' ? true : options.searching,
        ordering: typeof (options.ordering) === 'undefined' ? true : options.ordering,
        info: typeof (options.info) === 'undefined' ? true : options.info,
        autoWidth: typeof (options.autoWidth) === 'undefined' ? false : options.autoWidth,
        columns: options.columns || (options.columnSchema ? ConvertToDataColumns(options.columnSchema) : null),
        order: options.order,
        rowId: options.rowId || 'DT_RowId',
        columnDefs: options.columnDefs,
        aoColumnDefs: options.aoColumnDefs,
        pageLength: options.pageLength,
        data: options.data,
        buttons: options.buttons,
        serverSide: options.serverSide,
        processing: options.processing,
        ajax: options.ajax,
        pagingType: options.pagingType || 'simple_numbers',
        pagingInput: options.pagingInput || true,
        columnSchema: options.columnSchema,   // custom field
        columnHeaderPrefix: options.columnHeaderPrefix
    }
    if (options.dom) {
        tableOptions.dom = options.dom
    }
    var datatable = table.DataTable(tableOptions).on('draw.dt', function () {
        table.format()
    })
    datatable.UpdateRowData = function (data, opt) {
        if (options.columnSchema) {
            // pre process data
            HandleDataRows(data, { schema: options.columnSchema })
            var datatableApi = datatable.row('#' + data.DT_RowId)
            var row
            if (opt && opt.IsRemove) {
                if (opt.IsRemove(data)) {
                    if (datatableApi && typeof datatableApi.remove === 'function') datatableApi.remove()
                    return
                }
            }
            if (datatableApi && datatableApi.length > 0) {
                row = datatableApi.row(datatableApi[0])
                row.isNewRow = false
                row.data(data)
            } else {
                row = datatable.row.add(data)
                row.isNewRow = true
            }

            HandleDataColumns(datatable, row, { schema: options.columnSchema })
            return row
        }
    }
    return datatable
}

function HandleDataColumns(datatable, row, options) {
    options = options || {}
    if (options.schema) {
        for (var i = 0; i < options.schema.length; i++) {
            var column = options.schema[i]
            var cell = $(datatable.cell(row.selector.rows, i).node())
            if (column['format']) {
                cell.attr('data-format', column['format'])
            }
            if (column['class']) {
                cell.addClass(column['class'])
            }
        }
    }
}

function HandleDataRows(dataObj, options) {
    options = options || {}
    if (options.schema) {
        for (var i = 0; i < options.schema.length; i++) {
            var column = options.schema[i]
            var key = column.key.toString()
            if (typeof (dataObj[key]) === 'undefined') {
                if (typeof (column.default) !== 'undefined') {
                    dataObj[key] = column.default
                } else {
                    dataObj[key] = null
                }
            }
        }
    }
}

function ConvertToDataColumns(columns) {
    var data_columns = []
    for (var i = 0; i < columns.length; i++) {
        var key = columns[i].key.toString()
        data_columns.push({ data: key })
    }
    return data_columns
}

function AppendDataHeader(table, options) {
    var tr = $('<tr></tr>')
    options = options || {}
    if (options.columnSchema) {
        for (var i = 0; i < options.columnSchema.length; i++) {
            var i18n = options.columnSchema[i].i18n || options.columnHeaderPrefix + options.columnSchema[i].key
            tr.append("<td data-i18n='" + i18n + "'></td>")
        }
    }
    if (table.find('thead').length <= 0) table.append($('<thead>'))
    table.find('thead').append(tr)
}

function UpdateDataTableSymbolInfo(datatable, productObj) {
    if (productObj && productObj[tags.symbol]) {
        for (var i = 0; i < datatable.rows().data().length; i++) {
            var rowData = datatable.row(i).data()
            if (rowData[tags.symbol] === productObj[tags.symbol]) {
                if (!rowData[tags.name]) {
                    rowData[tags.name] = productObj[tags.name] || ''
                }
                if (!rowData[tags.currency]) {
                    rowData[tags.currency] = productObj[tags.currency] || ''
                }
                datatable.row(i).data(rowData)
            }
        }
        $(datatable.table().node()).format()
    }
}

function UpdateDataTableSearchBox(container) {
    if (!container || container.length <= 0) return
    container.find('.dataTables_filter label input').attr('placeHolder', messages.datatables.sSearchPlaceHolder)
}