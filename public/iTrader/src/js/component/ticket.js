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

{ $Id: ticket.js,v 1.17 2016/10/27 08:41:18 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var ticket_panel
var ticket_form
var ticket_form_data
var ticket_select_exchange
var ticket_input_Price
var ticket_input_Quantity
var ticket_input_SymbolCode
var ticket_input_SymbolName
var ticket_select_OrderType
var ticket_select_tif
var ticket_gtd_addon
var ticket_btn_buy_side
var ticket_btn_sell_side
var ticket_order_side

var ticket_valid_symbol_code
var ticket_gtd_date
var ticket_order_type_options
var ticket_tif_options

function OrderTicket_Initialize() {
    ticket_panel = $('#ticket-panel')
    if (ticket_panel.length <= 0) return
    ticket_form = $('#ticket-form')
    ticket_select_exchange = $('#ticket-select-exchange')
    ticket_input_Price = $('#ticket-input-price')
    ticket_input_Quantity = $('#ticket-input-quantity')
    ticket_input_SymbolCode = $('#ticket-input-symbol-code')
    ticket_input_SymbolName = $('#ticket-input-sysbol-name')
    ticket_select_OrderType = $('#ticket-order-type')
    ticket_select_tif = $('#ticket-order-tif')
    ticket_gtd_addon = $('#ticket-gtd-addon')
    ticket_btn_buy_side = $('#ticket-btn-buy-side')
    ticket_btn_sell_side = $('#ticket-btn-sell-side')

    ticket_select_OrderType.popover({ html: true, trigger: 'manual', title: messages.ticket_stop_price_title.text })
    ticket_input_SymbolCode.blur(function () {
        TicketSymbol_Update()
    })
    ticket_select_exchange.change(function () {
        Ticker_OrderType_Filter()
        ticket_select_OrderType.trigger('change')
        ticket_select_tif.trigger('change')
        TicketSymbol_Update()
    })
    ticket_input_SymbolCode.change(function () {
        ticket_valid_symbol_code = ''
        ticket_input_Quantity.val('')
        TicketPrice_Set()
    })

    ticket_input_Price.blur(function () {
        TicketMaxBuySell_Calculate()
    })

    ticket_select_OrderType.change(function () {
        if (ticket_select_OrderType.val() === 'market' || ticket_select_OrderType.val() === 'auction') {
            ticket_input_Price.attr('disabled', 'disabled')
            TicketPrice_Set()
            ticket_select_tif.val('day')
            ticket_select_tif.attr('disabled', 'disabled')
            ticket_select_tif.trigger('change')
        } else {
            ticket_input_Price.removeAttr('disabled')
            ticket_select_tif.removeAttr("disabled")
            TicketPrice_Set(ticket_input_Price.val())
        }
        if (ticket_select_OrderType.val() === 'stopLimit') {
            $('#ticket-stop-price-hint').removeClass('hidden')
            ticket_select_OrderType.on('popover-show', function () {
                ticket_select_OrderType.popover('show')
                TicketSpinner_Set()
                $('#ticket-input-stop-price').val($('#ticket-stop-price').text() || '')
                $('#ticket-input-stop-price').blur(function () {
                    $(document).one('click', function () {
                        $('#ticket-stop-price').text($('#ticket-input-stop-price').val() || '0.00')
                        ticket_select_OrderType.popover('toggle')
                    })
                }).keypress(function (e) {
                    if (e.which == 13) {
                        e.preventDefault()
                    }
                })
                $('.popover-content').click(function (event) {
                    event.stopPropagation()
                })
            })
            ticket_select_OrderType.trigger('popover-show')
            $('#ticket-stop-price').click(function () {
                ticket_select_OrderType.trigger('popover-show')
                $('#ticket-input-stop-price').focus()
            })
        } else {
            $('#ticket-stop-price-hint').addClass('hidden')
            ticket_select_OrderType.popover('hide')
        }
    })

    ticket_select_tif.change(function () {
        if (ticket_select_tif.val().indexOf('gtd') >= 0) {
            ticket_gtd_addon.removeClass('hidden')
        } else {
            ticket_gtd_addon.addClass('hidden')
        }
    })

    TicketSpinner_Set()
    TicketGTD_Pick()
    TicketOrder_Calculate()
    Ticket_ApplyShortcut()

    ticket_panel.on('add', function (event, symbolObj) {
        TicketSymbol_Input(symbolObj)
    })

    $(document).on('account', function () {
        setTimeout(function () {
            TicketMaxBuySell_Calculate()
        }, 500)
    })
    $(document).on('position-quantity-update', function () {
        TicketMaxBuySell_Calculate()
    })
    $(document).on('exchange', function () {
        TicketExchange_Select()
        Ticker_OrderType_Filter()
        ticket_select_OrderType.trigger('change')
        ticket_select_tif.trigger('change')
    })
}

function TicketPrice_Set(price) {
    price = price || ''
    if (ticket_input_Price.attr('disabled')) {
        price = '0'
    } else {
        price = price === '0' ? '' : price
    }
    ticket_input_Price.val(price)
    return ticket_input_Price
}

function TicketSymbol_Update() {
    current.symbol = ticket_input_SymbolCode.val()
    ticket_input_SymbolCode.val(ExchangeRule_Apply(ticket_input_SymbolCode.val()))
    ticket_valid_symbol_code = ''
    ticket_input_SymbolName.html('')
    $('#ticket-lot-size').parent().addClass('hidden')
    $('#ticket-max-buy-sell-hint').addClass('hidden')
    $('#ticket-currency-hint').text('')
    var code = ticket_input_SymbolCode.val()
    if (code) {
        ticket_input_SymbolName.addClass('text-danger')
        ticket_input_SymbolName.text(messages.ticket_message_invalid_symbol.text).attr('title', '')
        GetProduct(code, { flag: 0 }, function (productObj) {
            if (productObj) {
                if (productObj[tags.symbol] !== ticket_input_SymbolCode.val()) return
                if (productObj[tags.exchange] !== ticket_select_exchange.val()) return
                ticket_valid_symbol_code = code
                ticket_input_SymbolName.removeClass('text-danger')
                var symbolName = productObj.symbolName || productObj[tags.account] || ''  // symbol name -> short name -> ''
                ticket_input_SymbolName.text(symbolName)
                ticket_input_SymbolName.attr('title', symbolName)
                $('#ticket-currency-hint').text(productObj[tags.currency] || '')
                current.symbol = code
                $('#ticket-lot-size').text($._format.quantity(productObj[tags.lotSize])).parent().removeClass('hidden')
                $('#ticket-max-buy-sell-hint').removeClass('hidden')
                TicketMaxBuySell_Calculate()
                $(document).trigger('ticket-added', productObj)
            }
        })
    }
}

function TicketSymbol_Input(symbolObj) {
    if (typeof (symbolObj) === 'object') {
        if (symbolObj.exchange) {
            ticket_select_exchange.val(symbolObj.exchange)
            $('.custom-options').selectric('refresh')
        }
        ticket_input_SymbolCode.val(symbolObj.symbol).focus()
        setTimeout(function () {
            TicketPrice_Set(symbolObj.price).focus()
            if (typeof (symbolObj.quantity) !== 'undefined') {
                ticket_input_Quantity.val(symbolObj.quantity).focus()
            }
        }, 50)
    }
}

function TicketExchange_Select() {
    $('.custom-options').selectric({
        optionsItemBuilder: function (itemData, element, index) {
            return '<i class="icon-margin flag-icon ' + (ExchangeMgr.exchange_flag[itemData.value] || '') + '"></i>' + $._map.exchange(itemData.value)
        },
        labelBuilder: function (currItem) {
            return '<i class="icon-margin flag-icon ' + (ExchangeMgr.exchange_flag[currItem.value] || '') + '"></i>' + $._map.exchange(currItem.value)
        }
    })
}

function TicketGTD_Pick() {
    $('#ticket-gtd-picker').datepicker({
        startDate: "today",
        todayHighlight: true,
        autoclose: true
    }).on('changeDate', function () {
        var ticket_gtd_date = $(this).datepicker('getDate')
        $('#ticket-gtd-option').text(messages.oms.order_tif_gtd_pre + ' [' + moment(ticket_gtd_date).format('MM/DD/YY') + ']')
        $('#ticket-gtd-option').val('gtd:' + moment(ticket_gtd_date).format('YYYY/MM/DD'))
    })
}

function TicketSpinner_Set() {
    $('.price-spinner:not(.spinner-done)').spinner({
        min: 0, precision: 10, // set precision larger to make value correct after round
        step: function (dir) {
            var spreadValue = Number(ProductMgr.getSpreadValue(current.symbol, this.oldValue))
            var value
            if (dir === 'up') {
                value = Math.ceil(this.oldValue / spreadValue) * spreadValue
                return Math.abs(value - this.oldValue) < 0.0001 ? spreadValue : value - this.oldValue
            } else {
                value = Math.floor(this.oldValue / spreadValue) * spreadValue
                return Math.abs(value - this.oldValue) < 0.0001 ? spreadValue : this.oldValue - value
            }
        }
    }).spinner('changing', function (e, newVal, oldVal) {
        var precision = ProductMgr.getSpreadPrecision(current.symbol, newVal)
        $(this).val($.number(newVal, precision, '.', ''))
    })
    $('.quantity-spinner:not(.spinner-done)').spinner({
        min: 0, step: function (dir) {
            var lotSize = ProductMgr.getLotSize(current.symbol)
            var value
            if (dir === 'up') {
                value = Math.ceil(this.oldValue / lotSize) * lotSize
                return Math.abs(value - this.oldValue) < 0.0001 ? lotSize : value - this.oldValue
            } else {
                value = Math.floor(this.oldValue / lotSize) * lotSize
                return Math.abs(value - this.oldValue) < 0.0001 ? lotSize : this.oldValue - value
            }
        }
    })
    $('.price-spinner:not(.spinner-done),.quantity-spinner:not(.spinner-done)').find('input').each(function () {
        if (!Number($(this).val())) {
            $($(this).val(''))
        }
    })
    $('.price-spinner:not(spinner-done) input').blur(function () {
        var price = Number($(this).val())
        if (isNaN(price)) return
        var precision = price == 0 ? 0 : ProductMgr.getSpreadPrecision(current.symbol, price)
        $(this).val($.number(price, precision, '.', ''))
    })
    $('.price-spinner,.quantity-spinner').addClass('spinner-done')   // prevent to initialize spinner repeatedly
}

function ExchangeRule_Apply(value) {
    var exchange = ticket_select_exchange.val()
    if (initial_data.exchange_rule && initial_data.exchange_rule[exchange]) {
        var ruleObj = initial_data.exchange_rule[exchange]
        if (ruleObj.rule && exchangeRules[ruleObj.rule]) {
            value = exchangeRules[ruleObj.rule](value, ruleObj.options)
        }
    }
    return value
}

function TicketForm_Reset() {
    // ticket_input_Price.removeAttr('disabled')
    // ticket_select_tif.removeAttr("disabled")
    // ticket_input_SymbolName.html('&nbsp;')
    document.getElementById("ticket-form").reset()
    // ticket_gtd_addon.addClass('hidden')
    // ticket_select_OrderType.popover('hide')
    // ticket_gtd_date = ''
    // $('.custom-options').selectric('refresh')
    // $('#ticket-lot-size').parent().addClass('hidden')
    // $('#ticket-max-buy-sell-hint').addClass('hidden')
    $('#ticket-stop-price-hint').addClass('hidden')
    $('#ticket-stop-price').text('0.00')
    $('#ticket-gtd-option').text(messages.oms.order_tif_gtd)
    $('#ticket-gtd-option').val('gtd')
    // $('#ticket-currency-hint').text('')
    ticket_select_OrderType.trigger('change')
    ticket_select_tif.trigger('change')
    TicketSymbol_Update()
}

function TicketMaxBuySell_Calculate() {
    $('#ticket-max-buy').text($._format.quantity(GetMaxBuy(ticket_valid_symbol_code, ticket_input_Price.val())))
    $('#ticket-max-sell').text($._format.quantity(GetMaxSell(ticket_valid_symbol_code)))
}

function TicketOrder_Calculate() {
    ticket_btn_buy_side.click(function () {
        ticket_order_side = 0
    })
    ticket_btn_sell_side.click(function () {
        ticket_order_side = 1
    })
    validateForm(ticket_form, {
        submitHandler: function (form) {
            if (!ticket_valid_symbol_code) return
            if (initial_data.ticket && initial_data.ticket.allowZeroPrice === false) {
                if (!ticket_input_Price.attr('disabled') && Number(ticket_input_Price.val()) == 0) return
            }
            var stopPrice = Number($('#ticket-stop-price').text())
            if (ticket_select_OrderType.val() === 'stopLimit' && stopPrice <= 0) return
            if (ticket_select_tif.val() === 'gtd' && !ticket_gtd_date) return
            ticket_form_data = $(form).serialize() + '&side=' + ticket_order_side + '&account=' + current.account + '&stopPrice=' + stopPrice
            if (ticket_order_side === 0) {
                ticket_btn_buy_side.addClass('disabled')
            } else if (ticket_order_side === 1) {
                ticket_btn_sell_side.addClass('disabled')
            }
            $.ajax({
                type: 'post',
                url: '/iTrader/order/calculate',
                data: ticket_form_data,
                success: function (result) {
                    if (result.error) {
                        handleError(result.error)
                    } else {
                        TicketOrder_Add(result.data)
                    }
                    ticket_btn_buy_side.removeClass('disabled')
                    ticket_btn_sell_side.removeClass('disabled')
                },
                error: function (err) {
                    handleError(err)
                    ticket_btn_buy_side.removeClass('disabled')
                    ticket_btn_sell_side.removeClass('disabled')
                }
            })
        },
        errorClass: 'error',
        validClass: 'success',
    })
}

function TicketOrder_Add(orderObj) {
    if (!orderObj || !orderObj[tags.userRef] || isNaN(orderObj[tags.side])) return
    showMessage({
        title: messages.ticket_order_add_confirmation_title.text + AccountMgr.current_account,
        type: orderObj[tags.side] == '0' ? BootstrapDialog.TYPE_SUCCESS : BootstrapDialog.TYPE_DANGER,
        load: {
            url: '/iTrader/order/add?ref=' + orderObj[tags.userRef], callback: function (dialog) {
                dialog.$modal.format()
                dialog.$modal.translate()
                dialog.$modal.find('[data-format=price]').each(function () {
                    $(this).text($._format.price($(this).text(), ProductMgr.getSpreadPrecision(current.symbol, $(this).text())))
                })
            }
        },
        buttonNameList: ['submit', 'close'],
        callback: function (button, dialog) {
            if (button.name === 'close') {
                dialog.close()
            } else if (button.name === 'submit') {
                var addOrderForm = $('#add-order-form')
                validateForm(addOrderForm, {
                    submitHandler: function () {
                        var input_password = addOrderForm.find('[name=password]')
                        var form_data = ticket_form_data + '&cmd=add'
                        if (input_password.length > 0) {
                            form_data += '&password=' + input_password.val()
                        }
                        dialog.close()
                        TicketOrder_Submit(form_data, function (result) {
                            if (result.error) {
                                handleError(result.error, function () {
                                    if (result.error.showCBBCAgreement) {
                                        showMessage({
                                            title: messages.dialog_cbbc_agreement_title.text,
                                            buttonNameList: ['agree', 'reject'],
                                            load: { url: '/html/CBBCArgeement_' + lang + '.html' },
                                            callback: function (button, dialog) {
                                                var btnID = button.attr('id')
                                                if (btnID === 'btn-reject') {
                                                    dialog.close()
                                                } else if (btnID === 'btn-agree') {
                                                    dialog.close()
                                                    TicketOrder_SaveCBBCAgreement()
                                                }
                                            },
                                            onshow: function (dialog) {
                                                dialog.getModalBody().css('max-height', '450px')
                                            }
                                        })
                                    }
                                })
                            } else {
                                alertMessage({
                                    title: messages.dialog_information_title.text,
                                    message: messages.order_confirmation_order_submitted_message.text
                                })
                            }
                        })
                    }
                })
                if (addOrderForm.valid()) {
                    addOrderForm.submit()
                }
            }
        }
    })
}

function TicketOrder_Change(orderNo) {
    var order = OrderMgr.get(orderNo)
    if (!order) return
    showMessage({
        title: messages.ticket_order_change_confirmation_title.text + order[tags.account],
        type: order[tags.side] == '0' ? BootstrapDialog.TYPE_SUCCESS : BootstrapDialog.TYPE_DANGER,
        load: {
            url: '/iTrader/order/change?orderNo=' + orderNo + '&tempNo=' + new Date().getTime(), callback: function (dialog) {
                current.symbol = $('#change-confirmation-symbol').text()
                $('#order-change-gtd').datepicker({
                    startDate: "today",
                    todayHighlight: true,
                    autoclose: true,
                    format: 'yyyy/mm/dd'
                })
                dialog.$modal.format()
                dialog.$modal.translate()
                TicketSpinner_Set()
                dialog.$modal.find('[data-format=price]').each(function () {
                    var oriPrice = $(this).val() || $(this).text()
                    var precision = ProductMgr.getSpreadPrecision(current.symbol, oriPrice)
                    var price = $._format.price(oriPrice, precision)
                    $(this).val(price)
                    $(this).text(price)
                })
            }
        },
        buttonNameList: ['submit', 'close'],
        callback: function (button, dialog) {
            if (button.name === 'close') {
                dialog.close()
            } else if (button.name === 'submit') {
                var changeOrderForm = $('#change-order-form')
                validateForm(changeOrderForm, {
                    submitHandler: function () {
                        var inputs = changeOrderForm.find('[data-format=price]')
                        if (inputs.length > 1) {
                            if (initial_data.ticket && initial_data.ticket.allowZeroPrice === false) {
                                if (Number($(inputs[1]).val()) == 0) return
                            }
                        }
                        var form_data = changeOrderForm.serialize() + '&cmd=change'
                        dialog.close()
                        TicketOrder_Submit(form_data, function (result) {
                            if (result.error) {
                                handleError(result.error)
                            } else {
                                alertMessage({
                                    title: messages.dialog_information_title.text,
                                    message: messages.order_confirmation_order_change_submitted_message.text
                                })
                            }
                        })
                    }
                })
                if (changeOrderForm.valid()) {
                    changeOrderForm.submit()
                }
            }
        },
        onhide: function (dialog) {
            current.symbol = ticket_input_SymbolCode.val()
        }
    })
}

function TicketOrder_Cancel(orderNo) {
    var order = OrderMgr.get(orderNo)
    if (!order) return
    showMessage({
        title: messages.ticket_order_cancel_confirmation_title.text + order[tags.account],
        type: order[tags.side] == '0' ? BootstrapDialog.TYPE_SUCCESS : BootstrapDialog.TYPE_DANGER,
        load: {
            url: '/iTrader/order/cancel?orderNo=' + orderNo + '&tempNo=' + new Date().getTime(), callback: function (dialog) {
                current.symbol = $('#cancel-confirmation-symbol').text()
                dialog.$modal.format()
                dialog.$modal.translate()
                dialog.$modal.find('[data-format=price]').each(function () {
                    $(this).text($._format.price($(this).text(), ProductMgr.getSpreadPrecision(current.symbol, $(this).text())))
                })
            }
        },
        buttonNameList: ['submit', 'close'],
        callback: function (button, dialog) {
            if (button.name === 'close') {
                dialog.close()
            } else if (button.name === 'submit') {
                var cancelOrderForm = $('#cancel-order-form')
                validateForm(cancelOrderForm, {
                    submitHandler: function () {
                        var form_data = cancelOrderForm.serialize() + '&cmd=cancel'
                        dialog.close()
                        TicketOrder_Submit(form_data, function (result) {
                            if (result.error) {
                                handleError(result.error)
                            } else {
                                alertMessage({
                                    title: messages.dialog_information_title.text,
                                    message: messages.order_confirmation_order_cancel_submitted_message.text
                                })
                            }
                        })
                    }
                })
                if (cancelOrderForm.valid()) {
                    cancelOrderForm.submit()
                }
            }
        },
        onhide: function () {
            current.symbol = ticket_input_SymbolCode.val()
        }
    })
}

function TicketOrder_Submit(data, callback) {
    $.ajax({
        type: 'post',
        url: '/iTrader/order/submit',
        data: data,
        success: callback,
        error: handleError
    })
}

function TicketOrder_SaveCBBCAgreement() {
    $.ajax({
        type: 'post',
        url: '/iTrader/message/agreement',
        data: { name: 'SaveCBBCAgreementFlag', value: 1, _csrf: $('[name=_csrf]').attr('value') },
        success: function (res) {
            if (res.error) {
                layer.msg(getErrorMessage(res.error))
            }
        },
        error: function (err) {
            layer.msg(getErrorMessage(err))
        }
    })
}

function Ticket_ApplyShortcut() {
    function addShortcut(key, callback) {
        if (!key) return
        var num = Number(key)
        if (isNaN(num)) {
            shortcut.add(key, callback)
        } else {
            shortcut.add('', callback, { keycode: num })
        }
    }
    var shortcutSection = initial_data.views.trade.ticket.shortcut
    if (!shortcutSection || !shortcutSection.enable) return
    addShortcut(shortcutSection.buy, function () {
        ticket_order_side = 0
        ticket_form.submit()
    })
    addShortcut(shortcutSection.sell, function () {
        ticket_order_side = 1
        ticket_form.submit()
    })
    addShortcut(shortcutSection.reset, function () {
        TicketForm_Reset()
    })
    addShortcut(shortcutSection.refresh, function () {
        if (refresh) {
            refresh(['account', 'product'])
        }
    })
    addShortcut(shortcutSection.tabUp, function () {
        var focusElement = $(':focus')
        if (focusElement && focusElement.length > 0) {
            var currentTabIndex = Number(focusElement.attr('tabindex'))
            if (currentTabIndex > 1 && currentTabIndex <= 8) {
                $('[tabindex=' + (currentTabIndex - 1) + ']').focus()
            }
        }
    })
    addShortcut(shortcutSection.tabDown, function () {
        var focusElement = $(':focus')
        if (focusElement && focusElement.length > 0) {
            var currentTabIndex = Number(focusElement.attr('tabindex'))
            if (currentTabIndex >= 1 && currentTabIndex < 8) {
                $('[tabindex=' + (currentTabIndex + 1) + ']').focus()
            }
        }
    })
}

function Ticker_OrderType_Filter() {
    function fn(select, val) {
        if (!select || !val) return
        for (var i = 0; i < select.length; i++) {
            if ($(select[i]).val().indexOf(val) === 0) return select[i]
        }
    }
    if (!ticket_order_type_options) {
        ticket_order_type_options = ticket_select_OrderType.find('option')
    }
    if (!ticket_tif_options) {
        ticket_tif_options = ticket_select_tif.find('option')
    }
    var exchange = ticket_select_exchange.val()
    if (!exchange) return
    ticket_select_OrderType.find('option').remove()
    for (var i = 0; i < ExchangeMgr.exchange_orderType[exchange].length; i++) {
        var type = ExchangeMgr.exchange_orderType[exchange][i]
        ticket_select_OrderType.append(fn(ticket_order_type_options, type) || '')
    }
    ticket_select_OrderType.get(0).selectedIndex = 0

    ticket_select_tif.find('option').remove()
    for (var i = 0; i < ExchangeMgr.exchange_tif[exchange].length; i++) {
        var tif = ExchangeMgr.exchange_tif[exchange][i]
        ticket_select_tif.append(fn(ticket_tif_options, tif) || '')
    }
    ticket_select_tif.get(0).selectedIndex = 0
}