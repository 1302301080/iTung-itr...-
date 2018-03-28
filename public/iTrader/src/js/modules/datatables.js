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

{ $Id: datatables.js,v 1.1 2016/12/09 08:49:38 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


define(function (require, exports, module) {
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
            columns: options.columns || (options.columnSchema ? ConvertToDataColumns(options) : null),
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
                HandleDataRows(data, options)
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

                HandleDataColumns(datatable, row, options)
                showTooltips(row, options)
                return row
            }
        }
        datatable.UpdateDataTableSearchBox = UpdateDataTableSearchBox
        return datatable
    }

    function HandleDataColumns(datatable, row, options) {
        options = options || {}
        if (options.columnSchema) {
            var index = -1
            for (var i = 0; i < options.columnSchema.length; i++) {
                var column = options.columnSchema[i]
                if (column.tooltip) continue
                index++
                var cell = $(datatable.cell(row.selector.rows, index).node())
                if (cell) {
                    if (column['format']) {
                        cell.attr('data-format', column['format'])
                    }
                    if (column['class']) {
                        cell.addClass(column['class'])
                    }
                }
            }
        }
    }

    function HandleDataRows(dataObj, options) {
        options = options || {}
        if (options.columnSchema) {
            for (var i = 0; i < options.columnSchema.length; i++) {
                var column = options.columnSchema[i]
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

    function ConvertToDataColumns(options) {
        if (!options || !options.columnSchema) return []
        var data_columns = []
        for (var i = 0; i < options.columnSchema.length; i++) {
            if (options.columnSchema[i].tooltip) continue  // display as tooltips, skip add to columns
            var key = options.columnSchema[i].key.toString()
            data_columns.push({ data: key })
        }
        return data_columns
    }

    function AppendDataHeader(table, options) {
        if (table.find('thead').length <= 0)
            table.append('<thead></thead>')
        var tr = $('<tr></tr>')
        options = options || {}
        if (options.columnSchema) {
            for (var i = 0; i < options.columnSchema.length; i++) {
                if (options.columnSchema[i].tooltip) continue
                var i18n = options.columnSchema[i].i18n || options.columnHeaderPrefix + options.columnSchema[i].key
                tr.append("<td data-i18n='" + i18n + "'></td>")
            }
        }
        table.find('thead').append(tr)
    }

    function UpdateDataTableSearchBox(container) {
        if (!container || container.length <= 0) return
        container.find('.dataTables_filter label input').attr('placeHolder', messages.datatables.sSearchPlaceHolder)
    }

    function showTooltips(row, options) {
        if (!row || !row.node()) return
        $(row.node()).find('.extra-tooltip').each(function () {
            if ($(this).attr('data-toggle') === 'tooltip') return
            $(this).attr('data-toggle', 'tooltip').attr('data-placement', 'right')
            $(this).tooltip({
                html: true, container: 'body', title: function () {
                    var data = row.data()
                    var div = $("<table>")
                    for (var i = 0; i < options.columnSchema.length; i++) {
                        var columnObj = options.columnSchema[i]
                        if (!columnObj.tooltip) continue
                        var tr = $("<tr>")
                        var keyName = messages[columnObj.i18n] ? messages[columnObj.i18n].text : ''
                        var value = data[columnObj.key] || (typeof columnObj.default != 'undefined' ? columnObj.default : '')
                        tr.append("<td style='text-align:left; padding-right:20px; word-break: keep-all;white-space:nowrap;'>{0}</td>".format(keyName))
                        tr.append("<td style='text-align:left; word-break: keep-all;white-space:nowrap;' data-format='{0}'>{1}</td>".format(columnObj['format'], value))
                        div.append(tr)
                    }
                    div.format()
                    return div.html()
                }
            })
        })
    }

    $.fn.CreateDatatable = function (options) {
        return CreateDatatable($(this), options)
    }
    exports.CreateDatatable = CreateDatatable
})
