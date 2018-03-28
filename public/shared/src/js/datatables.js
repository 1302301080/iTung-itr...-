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

{ $Id: datatables.js,v 1.11 2017/08/02 08:42:26 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


define(function (require, exports, module) {
    var isMobile = require('mobile').GetIsMobile()
    function CreateDatatable(table, options) {
        if (!table || table.length <= 0) return
        options = options || {}
        if (options.columnSchema) {
            AppendDataHeader(table, options)
        }
        var tableOptions = {
            language: options.language || messages.datatables,
            // scrollX: typeof options.scrollX === 'undefined' ? false : options.scrollX,
            // scrollX: true,
            // fixedHeader: false,
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
            columnHeaderPrefix: options.columnHeaderPrefix,
            openRowColumnIndex: options.openRowColumnIndex,    // click this column will open an extra new row
        }
        if (options.dom) {
            tableOptions.dom = options.dom
        }
        if (options.scrollY) {
            tableOptions.scrollY = options.scrollY
            scrollCollapse = options.scrollCollapse ? options.scrollCollapse : false
        }
        if (options.scrollX) {
            tableOptions.scrollX = options.scrollX
            scrollCollapse = options.scrollCollapse ? options.scrollCollapse : false
        }
        if (isMobile) {
            tableOptions.searching = false
            tableOptions.info = false
            tableOptions.buttons = null
            tableOptions.pagingType = 'simple_numbers'
            tableOptions.pagingInput = false
        }
        var datatable = table.DataTable(tableOptions).on('draw.dt', function () {
            table.find('[extra-row-open=true]').each(function () {
                $(this).find('i').removeClass('fa-minus-circle').addClass('fa-plus-circle')
                $(this).attr('extra-row-open', false)
            })
            table.format()
        })
        if (tableOptions.searching) {
            UpdateDataTableSearchBox($(datatable.table().container()))
        }
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
                showSubRow(row, options)
                showDetailInMobile(row, options)
                if (!isMobile) {
                    showTooltips(row, options)
                    $(row.node()).find('td').on("mouseenter", function () {
                        if (this.offsetWidth < this.scrollWidth) {
                            $(this).attr('title', $(this).text());
                        } else {
                            $(this).removeAttr("title");
                        }
                    })
                }
                return row
            }
        }
        datatable.HandleDataColumns = HandleDataColumns
        return datatable
    }

    function HandleDataColumns(datatable, row, options) {
        options = options || {}
        if (options.columnSchema) {
            var index = -1
            for (var i = 0; i < options.columnSchema.length; i++) {
                var column = options.columnSchema[i]
                if (column.tooltip) continue
                if (isMobile && column.mobile === false) continue
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
            if (isMobile && options.columnSchema[i].mobile === false) continue
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
                var item = options.columnSchema[i]
                if (isMobile && item.mobile === false) continue
                if (item.tooltip) continue
                var i18n = item.i18n || options.columnHeaderPrefix + item.key
                var th = $("<th>").append($("<span>", { "data-i18n": i18n, class: item.headClass || '', title: item.headTitle }))
                tr.append(th)
            }
        }
        table.find('thead').append(tr)
    }

    function showDetailInMobile(row, options) {
        if (!row || !row.node()) return
        if (!row.isNewRow) return
        if (!isMobile) return
        $(row.node()).click(function (e) {
            if ($(e.target).parents('td').hasClass('prevent-popup-detail')) return
            if ($(e.target).parents('table').hasClass('prevent-popup-detail')) return
            var ul = $('<ul>', { class: 'list-group' })
            for (var i = 0; i < options.columnSchema.length; i++) {
                var column = options.columnSchema[i]
                var key = column.key
                var data = row.data()
                var newPositionObj = $.extend(true, {}, data)
                if (newPositionObj[key] && newPositionObj[key].toString().indexOf('<') === 0) continue
                var i18n = column.i18n || options.columnHeaderPrefix + column.key
                if (messages[i18n]) {
                    ul.append($('<li>', { class: 'list-group-item' })
                        .append($('<b>', { text: messages[i18n].text, class: 'content-overflow-hidden-30' })).append($('<span>', { class: 'text-primary pull-right content-overflow-hidden-60', text: newPositionObj[key], 'data-format': column['format'] })))
                }
            }
            if (ul.find('li').length <= 0) return
            var detailUI = $('<div>').append(ul)
            showMessage({
                title: messages.dialog_detail_title.text,
                message: detailUI,
                onshow: function (dialog) {
                    detailUI.translate()
                    detailUI.format()
                },
                buttonNameList: ['close'],
                callback: function (button, dialog) {
                    if (button.name === 'close') {
                        dialog.close()
                    }
                }
            })
        })
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
                        var messageSection = options.i18nPrefix ? messages[options.i18nPrefix] : messages
                        var keyName = messageSection[columnObj.i18n] ? messageSection[columnObj.i18n].text : ''
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

    function showSubRow(row, options) {
        if (!row || !row.node()) return
        if (typeof options.getExtraRow !== 'function') return
        $(row.node()).find('.extra-row').each(function () {
            var html = options.getExtraRow(row)
            if (html) {
                $(this).addClass('pointer')
                $(this).attr('extra-row-open', false)
                var i = $(this).find('i')
                if (i.length <= 0) $(this).prepend("<i class='fa fa-plus-circle text-info'></i>")
            }
        })
        if (!row.isNewRow) return
        $(row.node()).find('.extra-row').click(function () {
            var html = options.getExtraRow(row)
            if (html) {
                var isOpen = $(this).attr('extra-row-open') === 'true' ? true : false
                if (isOpen) {
                    $(row.node()).next().remove()
                    $(this).find('i').removeClass('fa-minus-circle').addClass('fa-plus-circle')
                } else {
                    $(this).find('i').removeClass('fa-plus-circle').addClass('fa-minus-circle')
                    var node = $(row.node())
                    var columnLength = node.find('td').length
                    var tr = $("<tr>").append($("<td>", { colspan: columnLength }).append(html))
                    $(row.node()).after(tr)
                }
                $(this).attr('extra-row-open', !isOpen)
            }
        })
    }

    function UpdateDataTableSearchBox(container) {
        if (!container || container.length <= 0) return
        container.find('.dataTables_filter label input').attr('placeHolder', messages.datatables.sSearchPlaceHolder)
    }

    $.fn.CreateDatatable = function (options) {
        return CreateDatatable($(this), options)
    }
})