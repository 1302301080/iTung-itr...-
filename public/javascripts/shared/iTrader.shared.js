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

{ $Id: dialog.js,v 1.2 2018/03/09 10:16:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    function showMessage(options) {
        if (typeof (options) !== 'object') return
        BootstrapDialog.show({
            title: options.title,
            message: options.message || (options.load ? messages.Loading.text : ''),
            closable: typeof (options.closable) === 'undefined' ? true : options.closable,
            closeByBackdrop: typeof (options.closeByBackdrop) === 'undefined' ? true : options.closeByBackdrop,
            closeByKeyboard: typeof (options.closeByKeyboard) === 'undefined' ? true : options.closeByKeyboard,
            type: options.type || BootstrapDialog.TYPE_INFO,
            buttons: getDialogButton(options.buttonNameList, options.callback),
            onshow: options.onshow,
            onshown: onshown,
            onhide: options.onhide,
            onhidden: options.onhidden
        })

        function onshown(dialog) {
            if (options.load) {
                dialog.getModalBody().load(options.load.url, options.load.data, function () {
                    if (typeof options.load.callback === 'function') {
                        options.load.callback(dialog)
                    }
                })
            }
            if (options.onshown) {
                options.onshown(dialog)
            }
            var inputs = dialog.$modal.find('input[type=text], input[type=password]')
            if (inputs.length > 0) {
                $(inputs[0]).focus().select()
            }
            if (options.callback) {
                dialog.$modal.keypress(function (event) {
                    if (event.keyCode == 13) {
                        event.cancelBubble = true
                        event.returnValue = false
                        var focusElements = $(":focus")
                        if (focusElements && focusElements.length > 0 && focusElements[0].tagName == 'DIV') {
                            dialog.$modal.off('keypress')  // trigger submit one time when focus on the dialog
                            options.callback({ name: 'submit' }, dialog)
                        } else {
                            options.callback({ name: 'submit' }, dialog)
                        }
                        return false
                    }
                })
            }
        }
    }

    function alertMessage(options) {
        BootstrapDialog.show({
            title: options.title || messages.dialog_information_title.text,
            message: options.message,
            type: options.type || BootstrapDialog.TYPE_INFO,
            buttons: [{
                label: messages.btn_close.text,
                cssClass: 'btn-info btn-sm',
                action: function (dialog) {
                    if (options && options.onclose) {
                        options.onclose(dialog)
                    } else {
                        dialog.close()
                    }
                }
            }],
            onshow: options.onshow,
            onshow: function (dialog) {
                dialog.getModalBody().css('max-height', '450px')
                if (options.onshown) {
                    options.onshown(dialog)
                }
            },
            onhide: options.onhide,
            onhidden: options.onhidden
        })
    }

    function alertError(options) {
        options = options || {}
        BootstrapDialog.show({
            title: options.title || messages.dialog_error_title.text,
            message: options.message,
            type: options.type || BootstrapDialog.TYPE_DANGER,
            buttons: options.buttons || [{
                label: messages.btn_close.text,
                cssClass: 'btn-danger btn-sm',
                action: function (dialog) {
                    dialog.close()
                }
            }],
            onhide: options.onhide,
            onhidden: options.onhidden
        })
    }

    function getDialogButton(array, callback) {
        if (!array) return
        var buttons = []
        for (var i = 0; i < array.length; i++) {
            var button = {}
            switch (array[i]) {
                case 'submit':
                    button.id = 'btn-submit'
                    button.label = messages.btn_submit.text
                    button.cssClass = 'btn-info btn-sm'
                    button.action = function (dialog) {
                        this.name = 'submit'
                        callback(this, dialog)
                    }
                    break
                case 'cancel':
                    button.id = 'btn-cancel'
                    button.label = messages.btn_cancel.text
                    button.cssClass = 'btn-default btn-sm'
                    button.action = function (dialog) {
                        this.name = 'cancel'
                        callback(this, dialog)
                    }
                    break
                case 'close':
                    button.id = 'btn-close'
                    button.label = messages.btn_close.text
                    button.cssClass = 'btn-default btn-sm'
                    button.action = function (dialog) {
                        this.name = 'close'
                        callback(this, dialog)
                    }
                    break
                case 'sure':
                    button.id = 'btn-sure'
                    button.label = messages.btn_sure.text
                    button.cssClass = 'btn-info btn-sm'
                    button.action = function (dialog) {
                        this.name = 'sure'
                        callback(this, dialog)
                    }
                    break
                case 'reset':
                    button.id = 'btn-reset'
                    button.label = messages.btn_reset.text
                    button.cssClass = 'btn-default btn-sm'
                    button.action = function (dialog) {
                        this.name = 'reset'
                        callback(this, dialog)
                    }
                    break
                case 'agree':
                    button.id = 'btn-agree'
                    button.label = messages.btn_agree.text
                    button.cssClass = 'btn-info btn-sm'
                    button.action = function (dialog) {
                        this.name = 'agree'
                        callback(this, dialog)
                    }
                    break
                case 'reject':
                    button.id = 'btn-reject'
                    button.label = messages.btn_reject.text
                    button.cssClass = 'btn-danger btn-sm'
                    button.action = function (dialog) {
                        this.name = 'reject'
                        callback(this, dialog)
                    }
                    break
                case 'relogin':
                    button.id = 'btn-relogin'
                    button.label = messages.btn_relogin.text
                    button.cssClass = 'btn-info btn-sm'
                    button.action = function (dialog) {
                        this.name = 'relogin'
                        callback(this, dialog)
                    }
                    break
                case 'resend':
                    button.id = 'btn-resend'
                    button.label = messages.btn_resend.text
                    button.cssClass = 'btn-info btn-sm'
                    button.action = function (dialog) {
                        this.name = 'resend'
                        callback(this, dialog)
                    }
                    break
                default:
                    break
            }
            if (button.id) {
                buttons.push(button)
            }
        }
        return buttons
    }

    exports.showMessage = showMessage
    exports.alertMessage = alertMessage
    exports.alertError = alertError
})
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

{ $Id: format.js,v 1.8 2017/12/26 03:14:36 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var NA = (messages && messages.NotApplicableValue) ? (messages.NotApplicableValue.text || 'N/A') : 'N/A'
    var FormatSetting = typeof initial_data === 'undefined' ? {} : (initial_data.format || {})

    $(function () {
        $.fn.format = function () {
            format({ container: $(this) })
        }
        $.extend({
            _setDefault: setDefault,
            _map: {
                side: map_orderSide,
                status: map_orderStatus,
                productType: map_productType,
                currency: map_currency,
                exchange: map_exchange,
                source: map_source
            },
            _format: {
                price: f_price,
                amount: f_amount,
                quantity: f_quantity,
                percentage: f_percentage,
                pattern: formatWithPattern
            },
            _notApplicabel: NA
        })
    })

    function format(options) {
        options = options || {}
        format_value('[data-format^=price]', f_price, options)
        format_value('[data-format^=amount]', f_amount, options)
        format_value('[data-format^=quantity]', f_quantity, options)
        format_value('[data-format^=percentage]', f_percentage, options)
        format_value('[data-format=side]', map_orderSide, options)
        format_value('[data-format=status]', map_orderStatus, options)
        format_value('[data-format=product_type]', map_productType, options)
        format_value('[data-format=currency]', map_currency, options)
        format_value('[data-format=exchange]', map_exchange, options)
        format_value('[data-format^=-]', formatWithPattern, options)
    }

    function format_value(pattern, method, options) {
        options = options || {}
        var elements = options.container instanceof jQuery ? options.container.find(pattern) : $(pattern)
        elements.each(function () {
            var value = $(this).text()
            var attr = $(this).attr('data-format')
            var pattern
            if (attr.indexOf('-') == 0) {
                pattern = attr.substring(1)
            }
            var index = attr.indexOf('@')
            var precision = index > 0 && attr.length > index ? attr.substring(index + 1) : 0
            if (value.length > 0) {
                $(this).text(method($.trim(value), pattern || Number(precision)))
            } else {
                value = $(this).val()
                if (value.length > 0) {
                    $(this).val(method($.trim(value), pattern || Number(precision)))
                }
            }
            if (options) {
                if (options.once) {
                    $(this).removeAttr('data-format')
                }
            }
        })
    }

    function f_amount(value, precision) {
        if (FormatSetting.amount) {
            return formatWithPattern(value, FormatSetting.amount)
        }
        value = ReplaceComma(value)
        if (isNaN(value)) return NA
        if (typeof ($.number) === 'undefined') return value
        return $.number(value, precision || 2)
    }

    function f_price(value, precision) {
        if (FormatSetting.price) {
            return formatWithPattern(value, FormatSetting.price)
        }
        if (isNaN(precision)) {  // precision maybe an format pattern
            return formatWithPattern(value, precision)
        }
        value = ReplaceComma(value)
        if (isNaN(value)) return NA
        if (typeof ($.number) === 'undefined') return value
        precision = precision || 3
        return $.number(value, precision)
    }

    function f_quantity(value, precision) {
        if (FormatSetting.quantity) {
            return formatWithPattern(value, FormatSetting.quantity)
        }
        value = ReplaceComma(value)
        if (isNaN(value)) return NA
        if (typeof ($.number) === 'undefined') return value
        if (value % 1 === 0) {
            return $.number(value)
        } else {
            return $.number(value, precision || 2)
        }
    }

    function f_percentage(value, precision) {
        if (typeof value === 'string') {
            if (value.indexOf('%') === value.length - 1) {
                value = value.replace(/%/g, '')
                if (!isNaN(value)) {
                    value = String((value / 100))
                }
            }
        }
        value = ReplaceComma(value)
        if (isNaN(value)) return NA
        if (FormatSetting.percentage) {
            var res = formatWithPattern(value * 100, FormatSetting.percentage)
            if (res && res != NA)
                return res + '%'
            return res
        }
        if (typeof ($.number) === 'undefined') return value
        if (isNaN(Number(value))) return value
        precision = precision || 0
        return $.number((Number(value) * 100), precision) + '%'
    }

    function map_orderSide(value) {
        var side = messages.oms['side_' + value]
        return side || value
    }

    function map_orderStatus(value) {
        var status = messages.oms['status_' + value]
        return status || value
    }

    function map_productType(value) {
        var productType = messages.oms['product_type_' + value]
        return productType || value
    }

    function map_currency(value) {
        return value
    }

    function map_exchange(value) {
        if (!value) return value
        return messages.oms['exchange_' + value.toLowerCase()] || (messages[value] ? messages[value].text : value)
    }

    function map_source(value) {
        if (!value) return value
        return messages.oms['source_' + value] || value
    }

    function setDefault(obj) {
        for (var p in obj) {
            if (defaultValue[p]) {
                for (var i = 0; i < defaultValue[p].length; i++) {
                    var item = defaultValue[p][i]
                    if (item.keys.indexOf(obj[p]) >= 0) {
                        obj[p] = item.value
                    }
                }
            } else {
                if (obj[p] == null) {
                    obj[p] = NA
                }
            }
        }
        return obj
    }

    function formatWithPattern(number, pattern) {
        var num
        if (typeof number === 'string') {
            num = number.replace(/,/g, '')
        } else num = number
        if (isNaN(num)) {
            if (isNaN(NA)) return NA
            else return formatWithPattern(NA, pattern)  // special requirement, if NA set to "0" and set format patter, the "0" display should follow the format pattern
        }
        var fmtarr = pattern ? pattern.split('.') : [''];
        var precisionLength = 0
        if (fmtarr.length > 0) {
            precisionLength = fmtarr[fmtarr.length - 1].length
        }
        var strarr = num ? Number(Number(num).toFixed(precisionLength)).toString().split('.') : ['0'];
        var retstr = '';

        var str = strarr[0];
        var fmt = fmtarr[0];
        var i = str.length - 1;
        var comma = false;
        for (var f = fmt.length - 1; f >= 0; f--) {
            switch (fmt.substr(f, 1)) {
                case '#':
                    if (i >= 0) retstr = str.substr(i--, 1) + retstr;
                    break;
                case '0':
                    if (i >= 0) retstr = str.substr(i--, 1) + retstr;
                    else retstr = '0' + retstr;
                    break;
                case ',':
                    comma = true;
                    retstr = ',' + retstr;
                    break;
            }
        }
        if (i >= 0) {
            if (comma) {
                var l = str.length;
                for (; i >= 0; i--) {
                    retstr = str.substr(i, 1) + retstr;
                    if (i > 0 && ((l - i) % 3) == 0) retstr = ',' + retstr;
                }
            }
            else retstr = str.substr(0, i + 1) + retstr;
        }

        retstr = retstr + '.';
        str = strarr.length > 1 ? strarr[1] : '';
        fmt = fmtarr.length > 1 ? fmtarr[1] : '';
        i = 0;
        for (var f = 0; f < fmt.length; f++) {
            switch (fmt.substr(f, 1)) {
                case '#':
                    if (i < str.length) retstr += str.substr(i++, 1);
                    break;
                case '0':
                    if (i < str.length) retstr += str.substr(i++, 1);
                    else retstr += '0';
                    break;
            }
        }
        return retstr.replace(/^,+/, '').replace(/^-,/, '-').replace(/\.$/, '');
    }

    var defaultValue = {
        bodQuantity: [{ keys: [null, ''], value: 0 }],
        costPrice: [{ keys: [null, ''], value: 0 }],
        marketValue: [{ keys: [null, ''], value: 0 }],
        globalMarketValue: [{ keys: [null, ''], value: 0 }],
        acceptValue: [{ keys: [null, ''], value: 0 }],
        unrealizedPL: [{ keys: [null, ''], value: 0 }],
        unrealizedPLRatio: [{ keys: [null, ''], value: 0 }],
        marginRatio: [{ keys: [null, ''], value: 0 }],
        totalBuy: [{ keys: [null, ''], value: 0 }],
        totalSell: [{ keys: [null, ''], value: 0 }],
        totalNet: [{ keys: [null, ''], value: 0 }],
        queueQuantity: [{ keys: [null, ''], value: 0 }],
    }

    exports.formatWithPattern = formatWithPattern
})
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

{ $Id: jeExtend.js,v 1.14 2017/12/26 03:14:36 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

if (!Number.MIN_SAFE_INTEGER) {
    Number.MIN_SAFE_INTEGER = -9007199254740991
}

/* Global function ======================================================= */
ToNumber = function (str) {
    if (str) {
        if (typeof str === 'string') {
            return Number(str.replace(/,/g, ''))
        }
        if (!isNaN(str)) {
            return Number(str)
        }
    }
    return 0
}

ReplaceComma = function (str) {
    if (typeof str === 'string') {
        return str.replace(/,/g, '')
    }
    return str
}

IsArray = function (obj) {
    if (typeof (obj) === 'object' && obj !== null && obj.constructor === Array) {
        return true
    }
    return false
}

/* Javascript entension ======================================================= */
String.prototype.startWith = function (str) {
    var reg = new RegExp("^" + str);
    return reg.test(this);
}

String.prototype.endWith = function (str) {
    var reg = new RegExp(str + "$");
    return reg.test(this);
}

// format {0}, start as 0
String.prototype.format = function () {
    var str = this
    if (arguments.length > 0) {
        var array
        if (arguments[0] instanceof Array) {
            array = arguments[0]
        } else {
            array = arguments
        }
        for (var i = 0; i < array.length; i++) {
            var re = new RegExp('\\{' + i + '\\}', 'gm')
            str = str.replace(re, array[i])
        }
    }
    return str
}

// format %s1, start as 1
String.prototype.cformat = function () {
    var str = this
    if (arguments.length > 0) {
        var array
        if (arguments[0] instanceof Array) {
            array = arguments[0]
        } else {
            array = arguments
        }
        for (var i = 0; i < array.length; i++) {
            var re = new RegExp('%' + (i + 1) + '[s,d,n]', 'gm')
            str = str.replace(re, array[i])
        }
    }
    return str
}

/* Global configuration for third party component ======================================================= */
if (typeof layer === 'object' && typeof layer.config === 'function') {
    layer.config({
        path: '/stylesheets/layer/',
        skin: 'layer-custom'
    })
}

// jQuery extend
(function ($) {
    // override jQuery ajax function to prevent cache issues(304).
    var _ajax = $.ajax
    $.ajax = function (opt) {
        if (!opt) return
        if ((!opt.type || opt.type.toLowerCase() === 'get') && opt.url) {  // type = 'get' or type = undefined(load function)
            if (opt.url.indexOf('?') < 0) {
                opt.url += '?temp=' + (new Date()).getTime()
            } else {
                opt.url += '&temp=' + (new Date()).getTime()
            }
        }
        return _ajax(opt)
    }

    $.fn.translate = function (prefix) {
        var elements = $(this).find('[data-i18n]')
        elements.each(function () {
            var data_i18n = $(this).attr('data-i18n')
            if (data_i18n) {
                data_i18n = data_i18n.indexOf('.') >= 0 ? '.' + data_i18n : "['{0}']".format(data_i18n)
                var obj = eval("messages{0}{1}".format(prefix ? "['{0}']".format(prefix) : '', data_i18n))
                if (typeof (obj) === 'string') {
                    $(this).text(obj)
                } else if (typeof (obj) === 'object') {
                    for (var o in obj) {
                        if (o == 'text') {
                            $(this).text(obj[o])
                        } else if (o == 'html') {
                            $(this).html(obj[o])
                        } else {
                            $(this).attr(o, obj[o])
                        }
                    }
                }
            }
        })
    }

    $.fn.CreateDrowdownGroup = function (options) {
        // var example = {
        //     id: 'element-id',
        //     name: {
        //         i18n: 'column_currency',
        //         value: 'currency'
        //     },
        //     data: [
        //         { key: 'HKD', value: 'HKD' },
        //         { key: 'USD', value: 'USD' }
        //     ]
        // }
        if (!options || !options.data || options.data.length <= 0) return
        this.empty()
        var container = $('<div>', {
            'class': 'btn-group btn-group-xs',
            'id': options.id || ''
        })
        var leftBtn = $('<button>', {
            'type': 'button',
            'class': 'btn btn-success dropdown-toggle btn-group-label'
        }).append($('<span>', {
            'data-i18n': options.name.i18n || ''
        }).text(options.name.value || ''))
        var rightBtn = $('<button>', {
            'type': 'button',
            'class': 'btn btn-info dropdown-toggle',
        })
        var current_element = $('<span>', {
            'class': 'dropdown-group-text',
            'data-key': options.data[0].key || ''
        }).text(options.data[0].value || '')
        rightBtn.append(current_element)
        if (options.data.length > 1) {
            rightBtn.append($('<span>', { 'class': 'caret' }))
            rightBtn.attr('data-toggle', 'dropdown')
            rightBtn.attr('aria-haspopup', false)
            rightBtn.attr('aria-expanded', false)
        }
        var ul = $('<ul>', { 'class': 'dropdown-menu dropdown-group-list' })
        function getValue(key) {
            for (var i = 0; i < options.data.length; i++) {
                if (options.data[i].key === key) {
                    return options.data[i].value
                }
            }
            return key
        }
        function select(key) {
            var clickElement = ul.find('[data-key={0}]'.format(key))
            if (clickElement.length > 0) {
                ul.find('li').show()
                current_element.attr('data-key', key)
                current_element.text(clickElement.text())
                clickElement.parent().hide()
                container.trigger('change', key)
            }

        }
        for (var i = 0; i < options.data.length; i++) {
            var dataItem = options.data[i]
            var a_element = $("<a href='javascript:void(0)' data-key='" + dataItem.key + "'>" + dataItem.value + "</a>")
            var li_element = $("<li></li>").append(a_element)
            ul.append(li_element)
            if (dataItem.key === options.data[0].key) {
                li_element.hide()
            }
            a_element.click(function () {
                var key = $(this).attr('data-key')
                select(key)
            })
        }
        container.append(leftBtn).append(rightBtn).append(ul)
        if (typeof container.translate === 'function') {
            container.translate()
        }
        this.html(container)
        this.select = select
    }

    // auto upper case for input
    $.fn.InputAutoUpper = function (options) {
        this.on('input', function () {
            var value = this.val()
            if (value) {
                this.val(value.toUpperCase())
            }
        }.bind(this))
    }

    // auto format currency
    $.fn.InputFormat = function (options) {
        options = options || {}
        this.on('input', function () {
            var value = this.val()
            if (value) {
                if (value.indexOf('.') < 0) {
                    this.val($.number(value))
                } else {
                    // var integerPart = $.number(value.substring(0, value.indexOf('.')))
                    // var decimalPart = value.substring(value.indexOf('.'), value.length)
                    // this.val(integerPart + decimalPart)  // default format currency
                }
            }
        }.bind(this))
        if (typeof options.format === 'function') {
            this.on('blur', function () {
                if (!this.val()) return
                this.val(options.format(this.val()))
            }.bind(this))
        }
    }

    $.fn.InputPercentage = function (options) {
        // var sample = {
        //     data: [10, 20, 50, 100, 0],  // 0 means input
        //     total: 10000
        // }
        if (!options) return
        if ($(this).hasClass('dropdown-input-percentage')) return
        var data = options.data
        $(this).attr('data-total', options.total)
        var ul = $('<ul>', { class: "dropdown-menu" })
        for (var i = 0; i < data.length; i++) {
            if (data[i] < 0) continue
            if (data[i] != 0) {
                ul.append($('<li>').append($('<a>', { role: 'menuitem', href: 'javascript:void(0)', class: 'percentage-input', text: data[i] + '%', "data-percentage": data[i] })))
            } else {
                ul.append($('<li>').append($('<input>', { href: 'javascript:void(0)', class: 'form-control percentage-input', placeHolder: '%' })))
            }
        }
        $(this).attr('data-toggle', 'dropdown')
        $(this).parent().append($('<div>', { class: 'dropdown' }).append($(this)).append(ul))
        ul.find('li a').click(function (e) {
            var clickedElement = $(e.target)
            var total = $(this).attr('data-total')
            var percentage = clickedElement.attr('data-percentage')
            if (Number(percentage) == 100) {
                $(this).val($._format.pattern(total, '#,##0.########'))
            } else {
                $(this).val($.number((total * percentage / 100)))
            }
            $(this).focus()
        }.bind(this))
        ul.find("input").on('input', function (e) {
            var inputElement = $(e.target)
            var inputvalue = inputElement.val()
            if (!inputvalue) return
            if (isNaN(inputvalue) || Number(inputvalue) < 0 || Number(inputvalue) > 100) {
                $(this).val('')
                return
            } else {
                var total = $(this).attr('data-total')
                if (Number(inputvalue) == 100) {
                    $(this).val($._format.pattern(total, '#,##0.########'))
                } else {
                    $(this).val($.number((total * inputvalue / 100)))
                }
            }
        }.bind(this))
        ul.find("input").on('blur', function (e) {
            $(this).focus()
        }.bind(this))
        // $(this).InputFormat()
        $(this).addClass('dropdown-input-percentage')
    }

    $.getUrlParam = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)")
        var r = window.location.search.substr(1).match(reg)
        if (r != null) return unescape(r[2])
        return null
    }

    $.getRandomUrl = function (url) {
        var tmp = '&tmp='
        if (url) {
            if (url.indexOf('?') > 0) {
                tmp = '&tmp='
            } else {
                tmp = '?tmp='
            }
        }
        return (url || '') + tmp + (new Date).getTime()
    }

    // IE not support hide option, so must use a parent element to wrap it.
    $.fn.setOptionVisible = function (show) {
        if (show) {
            this.filter("span > option").unwrap()
        } else {
            this.filter(":not(span > option)").wrap("<span>").parent().hide()
        }
        return this
    }
})(jQuery)

window.onerror = function (msg, url, lineNo, columnNo, error) {
    $.post('/c', {
        msg: msg,
        url: url,
        lineNo: lineNo,
        columnNo: columnNo,
        error: error,
        ua: navigator.userAgent
    })
    return false
}
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

{ $Id: sea.js,v 1.13 2018/03/09 10:16:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

// var prefix = '/javascripts/iTrader/modules/'
// var prefix = '/javascripts/iTrader/modules/'
var prefix = '/iTrader/src/js/modules/'
// var eipoPrefix = 'javascripts/eipo/'
var eipoPrefix = '/eipo/src/js/'
// var sharedPrefix = 'javascripts/shared/'
var sharedPrefix = '/shared/src/js/'
seajs.config({
    base: "/",
    alias: {
        "format": sharedPrefix + "format.js",
        "socket": sharedPrefix + "socket.js",
        "socket-v2": sharedPrefix + "socket_v2.js",
        "datatables": sharedPrefix + "datatables.js",
        "dialog": sharedPrefix + "dialog.js",

        "ticket": prefix + "ticket.js",
        "fund-ticket": prefix + "fund_ticket.js",
        "bond-ticket": prefix + "bond_ticket.js",
        "account-balance": prefix + "account_balance.js",
        "account-balance2": prefix + "account_balance2.js",
        "password": prefix + "password.js",
        "cregistrationFA": prefix + "cregistration_2FA.js",
        "fundbook": prefix + "fundbook.js",
        "orderbook": prefix + "orderbook.js",
        "cashbook": prefix + "cashbook.js",
        "portfolio": prefix + "portfolio.js",
        "price": prefix + "price.js",
        "account-overall": prefix + "account_overall.js",
        "exchange-ratio": prefix + "exchange_ratio.js",
        "cashview": prefix + "cashview.js",
        "historybook": prefix + "historybook.js",
        "market-price": prefix + "market_price.js",
        "transaction-history": prefix + "transaction_history.js",
        "fund-trade": prefix + "fund_trade.js",
        "bond-trade": prefix + "bond_trade.js",
        "fund-position": prefix + "fund_position.js",
        "bond-position": prefix + "bond_position.js",
        "eStatement": prefix + "eStatement.js",
        "mobile": prefix + "mobile.js",
        "full-trade": prefix + "full_trade.js",
        "settlement": prefix + "settlement.js",
        "price-quote": prefix + "price_quote.js",
        "util": prefix + "util.js",
        "notification": prefix + "notification.js",
        "reject-order-notification": prefix + "reject_order_notification.js",
        "bond-trade-v2": prefix + "allInOneTrade/bond_trade.js",
        "fund-trade-v2": prefix + "allInOneTrade/fund_trade.js",

        "eipo": eipoPrefix + "eipo.js",
        "eipo-user": eipoPrefix + "user.js",
        "eipo-utility": eipoPrefix + "utility.js",
        "eipo-socket": eipoPrefix + "socket.js",
        "eipo-application": eipoPrefix + "application.js",
        "eipo-accountExploer": eipoPrefix + "accountExploer.js"
    }
})
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

{ $Id: socket.js,v 1.1 2016/12/20 11:04:19 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var g_socket
var subscribedSymbol = []   // { symbol: <symbol code>, count: <count>, state: <processing, done> }
define(function(require, exports, module) {

function init() {
    var connectionString = window.location.protocol + '//' + window.location.host
    g_socket = io.connect(connectionString, { secure: _.startsWith(connectionString, 'https') ? true : false })
    g_socket.on('auth', function (result) {
        if (result) {
            SubscribeCurrency()
            SubscribeExchange()
            SubscribeAccounts()
            SubscribeSpread()
            SubscribePositions()
            SubscribeOrders()
            SubscribeMessage()
            SubscribeMargin()
            SubscribeProduct()
        }
    })
}

function SubscribeMessage() {
    g_socket.on('message', function (messageObj) {
        if (messageObj) {
            if (messageObj.action === 'logout') {
                $('.index-row').remove()
            } else if (messageObj.action === 'announce') {
                PopupAnnouncement(messageObj.announcement)
            }
            if (messageObj.errorCode) {
                handleError(messageObj, function () {
                    if (messageObj.action === 'logout') {
                        Logout()
                    }
                })
            }
        }
    })
    g_socket.emit('message')
}

function SubscribeAccounts() {
    g_socket.on('account', function (data) {
        if (data) {
            if (data.account_list) {
                AccountMgr.setAccountList(data)
            }
            if (data.balance && _.isArray(data.balance)) {
                for (var i = 0; i < data.balance.length; i++) {
                    AccountMgr.set(data.balance[i])
                }
            }
        }
    })
    g_socket.emit('accounts')
}

function SubscribeOrders() {
    g_socket.on('orders', function (data) {
        if (!data || !_.isArray(data)) return
        var orders = []
        _(data).forEach(function (value) {
            OrderMgr.set(value, function (orderObj) {
                orders.push(orderObj)
                if (orders.length === data.length) {
                    $(document).trigger('orders', { orders: orders })
                }
            })
        })
    })
    g_socket.emit('orders')
}

function SubscribePositions() {
    g_socket.on('positions', function (data) {
        if (!data || !_.isArray(data)) return
        var positions = []
        _(data).forEach(function (value) {
            GetProduct(value[tags.symbol], { flag: 1 })
            var positionObj = PositionMgr.set(value)
            if (positionObj) {
                positions.push(positionObj)
            }
        })
        $(document).trigger('positions', { positions: positions })
    })
    g_socket.emit('positions')
}

function SubscribeMargin() {
    g_socket.on('margin', function (data) {
        if (_.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                var marginObj = MarginMgr.set(data[i])
                $(document).trigger('margin', marginObj)
            }
        }
    })
    g_socket.emit('margin')
}

function SubscribeSpread() {
    g_socket.on('spread', function (data) {
        if (_.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                ProductMgr.setSpread(data[i])
            }
        }
    })
    g_socket.emit('spread')
}

function SubscribeCurrency() {
    g_socket.on('currency', function (data) {
        if (_.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                CurrencyMgr.set(data[i])
            }
        }
    })
    g_socket.emit('currency')
}

function SubscribeExchange() {
    g_socket.on('exchange', function (data) {
        if (_.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                ExchangeMgr.set(data[i])
            }
        }
    })
    g_socket.emit('exchange')
}

function SubscribeProduct() {
    g_socket.on('product', function (data) {
        if (_.isArray(data)) {
            var products = []
            for (var i = 0; i < data.length; i++) {
                var productObj = ProductMgr.set(data[i])
                products.push(productObj)
                $(document).trigger('#' + productObj[tags.symbol], productObj)
            }
            $(document).trigger('products', { products: products })
        }
    })
}

function refresh(type, data) {
    if (!type) return
    if (_.isArray(type)) {
        for (var i = 0; i < type.length; i++) {
            g_socket.emit('refresh', { type: type[i], data: data })
        }
    } else {
        g_socket.emit('refresh', { type: type, data: data })
    }
}

exports.init = init
})


function GetProduct(code, options, callback) {
    code = _.trim(code)
    if (!code) return
    options = options || { flag: 0 }
    var subscribedSymbolItem = _.find(subscribedSymbol, function (o) { return o.symbol === code })
    if (!subscribedSymbolItem) {
        subscribedSymbolItem = { symbol: code, count: 0 }
        subscribedSymbol.push(subscribedSymbolItem)
    }
    if (typeof callback === 'function') {
        var productObj = ProductMgr.get(code)
        if (productObj) {
            callback(productObj)
        } else {
            $(document).one('#' + code, function (event, data) {
                subscribedSymbolItem.state = 'done'
                callback(data)
                $(document).off('#' + code, event)
            })
        }
    }
    if (options.flag == 0) {
        if (subscribedSymbolItem.state !== 'processing') {
            subscribedSymbolItem.state = 'processing'
            if (subscribedSymbolItem.count <= 0) {
                g_socket.emit('product', { symbol: code, flag: 0 })
            }
        }
    } else if (options.flag == 1) {
        if (subscribedSymbolItem.count <= 0) {
            g_socket.emit('product', { symbol: code, flag: 1 })
        }
        subscribedSymbolItem.count++
    } else if (options.flag == -1) {
        if (subscribedSymbolItem.count <= 1) {
            g_socket.emit('product', { symbol: code, flag: -1 })
        }
        subscribedSymbolItem.count--
    }
}
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

{ $Id: socket_v2.js,v 1.4 2018/01/19 10:00:25 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var g_socket
define(function (require, exports, module) {
    var lastMessageTime
    var isPageLoaded = false
    var pendingMessages = []
    function init() {
        var connectionString = window.location.protocol + '//' + window.location.host
        g_socket = io.connect(connectionString, { secure: _.startsWith(connectionString, 'https') ? true : false })
        g_socket.on('auth', function (result) {
            if (result) {
                g_socket.emit('data', ['order', 'position', 'account', 'currency', 'spread'])
            }
        })
        g_socket.on('data', function (data) {
            if (!data || !data.name || !data.data) return
            processData(data)
        })
        g_socket.on('message', function (messageObj) {
            if (messageObj) {
                if (messageObj.action === 'logout') {
                    $('.index-row').remove()
                } else if (messageObj.action === 'announce') {
                    pendingMessages.push(messageObj.announcement)
                }
                if (messageObj.errorCode) {
                    if (messageObj.errorCode && messages.error['SSMITSERR_' + messageObj.errorCode]) {
                        messageObj.errorCode = 'SSMITSERR_' + messageObj.errorCode
                    }
                    handleError(messageObj, function () {
                        if (messageObj.action === 'logout') {
                            Logout()
                        }
                    })
                }
            }
        })
        g_socket.emit('auth')

        var t = setInterval(function () {
            lastMessageTime = lastMessageTime || (new Date()).getTime()
            if (!isPageLoaded && ((new Date()).getTime() - lastMessageTime > 1000)) {
                $(document).trigger('page', 'show')
                isPageLoaded = true
                clearInterval(t)
            }
        }, 500)
    }

    function processData(data) {
        lastMessageTime = (new Date()).getTime()
        if (!data || !data.name || !data.data) return
        for (var i = 0; i < data.data.length; i++) {
            var item = data.data[i]
            if (item) {
                item._raw = $.extend(true, {}, item)  // keep the raw data
            }
        }
        if (data.name === 'order') {
            OrderMgr.set(data.data)
        } else if (data.name === 'position') {
            PositionMgr.set(data.data)
        } else if (data.name === 'account') {
            AccountMgr.set(data.data)
        } else if (data.name === 'currency') {
            CurrencyMgr.set(data.data)
        } else if (data.name === 'spread') {
            SpreadMgr.set(data.data)
        } else if (data.name === 'errororder') {
            ErrorOrderMgr.set(data.data)
        }
    }


    $('[data-update]').click(function () {
        var name = $(this).attr('data-update')
        if (name) {
            g_socket.emit('update', name)
        }
    })

    $(document).on('page', function (event, data) {
        if (data === 'shown') {
            if (pendingMessages && pendingMessages.length > 0) {
                for (var i = 0; i < pendingMessages.length; i++) {
                    PopupAnnouncement(pendingMessages[i])
                }
            }
            pendingMessages = []
        }
    })

    exports.init = init
})