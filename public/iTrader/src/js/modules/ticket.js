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

{ $Id: ticket.js,v 1.31 2018/02/27 05:27:02 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'ticket'
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
    var ticket_otc_flag
    var bond_input_quantity

    var currentProduct
    var TicketFund = require('fund-ticket')
    var TicketBond = require('bond-ticket')
    var isMobile = require('mobile').GetIsMobile()
    var FullTrade = require('full-trade')
    var Util = require('util')

    init()
    TicketFund.init(initial_data.ticket)
    TicketBond.init(initial_data.ticket)

    function init() {
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
        ticket_otc_flag = $('#ticket-otc-flag')
        ticket_search_btn = $('#ticket-search')
        bond_input_quantity = $('.bond-input-quantity')

        ticket_input_SymbolCode.blur(function () {
            updateSymbol()
        })
        ticket_select_exchange.change(function () {
            changeTicketMode(null, ticket_select_exchange.val())
            filterOrderTypeTif()
            ticket_select_OrderType.trigger('change')
            ticket_select_tif.trigger('change')
            updateSymbol()
        })
        $('#ticket-search').click(function () {
            SearchProduct_Search(ticket_select_exchange.val(), null, { 'type': 1 })
        })
        ticket_input_SymbolCode.change(function () {
            ticket_valid_symbol_code = ''
            ticket_input_Quantity.val('')
            setPrice()
        })

        ticket_input_SymbolCode.on('input', function () {
            $(this).val($(this).val().toUpperCase())
        })

        ticket_input_Price.blur(function () {
            calcMaxBuySell()
        })

        ticket_select_OrderType.change(function () {
            var orderType = ticket_select_OrderType.val()
            if (orderType === 'market' || orderType === 'auction') {
                ticket_input_Price.attr('disabled', 'disabled')
                setPrice()
                ticket_select_tif.val('day')
                ticket_select_tif.attr('disabled', 'disabled')
                ticket_select_tif.trigger('change')
            } else if (orderType === 'auctionLimit') {
                ticket_input_Price.removeAttr('disabled')
                setPrice(ticket_input_Price.val())
                ticket_select_tif.val('day')
                ticket_select_tif.attr('disabled', 'disabled')
                ticket_select_tif.trigger('change')
            } else {
                ticket_input_Price.removeAttr('disabled')
                ticket_select_tif.removeAttr("disabled")
                setPrice(ticket_input_Price.val())
            }
            if (orderType === 'stopLimit') {
                ticket_select_OrderType.parent('div').addClass("col-sm-6").removeClass("col-sm-12")
                $('#ticket-stop-price-container').removeClass('hidden')
                $('#ticket-input-stop-price').val('').focus()
            } else {
                ticket_select_OrderType.parent('div').addClass("col-sm-12").removeClass("col-sm-6")
                $('#ticket-stop-price-container').addClass('hidden')
            }
            if (orderType === 'specialLimit') {
                // ticket_select_tif.find('[value=fak]').addClass('hidden')  // hide function not work in IE
                // ticket_select_tif.find('[value=fok]').addClass('hidden')
                ticket_select_tif.find('[value=fak]').attr('disabled', 'disabled').setOptionVisible(false)
                ticket_select_tif.find('[value=fok]').attr('disabled', 'disabled').setOptionVisible(false)
                ticket_select_tif.get(0).selectedIndex = 0
            } else {
                // ticket_select_tif.find('[value=fak]').removeClass('hidden')
                // ticket_select_tif.find('[value=fok]').removeClass('hidden')
                ticket_select_tif.find('[value=fak]').attr('disabled', false).setOptionVisible(true)
                ticket_select_tif.find('[value=fok]').attr('disabled', false).setOptionVisible(true)
            }
            calcMaxBuySell()
        })

        ticket_select_tif.change(function () {
            if (ticket_select_tif.val().indexOf('gtd') >= 0) {
                ticket_gtd_addon.removeClass('hidden')
            } else {
                ticket_gtd_addon.addClass('hidden')
            }
        })

        setSpinner(ticket_panel)
        initGTDPicker()
        calcOrder()
        applyShortcut()
        changeTicketMode(null, ticket_select_exchange.val())

        // postmessage event
        window.addEventListener('message', function (event) {
            if (event.data && event.data.name === 'copy-symbol') {
                if (event.data.exchange) {
                    setExchange(event.data.exchange)
                }
                inputSymbol(event.data)
            }
        }, false)

        // events
        $('.ticket-btn-reset').on('click', function () {
            resetForm()
        })

        AccountMgr.on(function () {
            setTimeout(function () {
                calcMaxBuySell()
            }, 500)
        })
        PositionMgr.on(function () {
            calcMaxBuySell()
        })

        ExchangeMgr.on(function () {
            initExchangeList()
            filterOrderTypeTif()
            ticket_select_OrderType.trigger('change')
            ticket_select_tif.trigger('change')
        })
        initExchangeList()
        filterOrderTypeTif()
        $(document).translate()
    }

    function setPrice(price) {
        price = price || ''
        if (ticket_input_Price.attr('disabled')) {
            price = '0'
        } else {
            price = price === '0' ? '' : price
        }
        ticket_input_Price.val(price)
        return ticket_input_Price
    }

    function updateSymbol() {
        current.symbol = ticket_input_SymbolCode.val()
        ticket_input_SymbolCode.val(applyExchangeRule(ticket_input_SymbolCode.val()))
        ticket_valid_symbol_code = ''
        ticket_input_SymbolName.html('')
        $('#ticket-lot-size').parent().addClass('hidden')
        $('#ticket-max-buy-sell-hint').addClass('hidden')
        $('#ticket-max-buy').text('')
        $('#ticket_max_sell').text('')
        $('#ticket-currency-hint').text('')
        var code = ticket_input_SymbolCode.val()
        TicketFund.clear()
        TicketBond.clear()
        currentProduct = null
        if (code) {
            ticket_input_SymbolName.addClass('text-danger')
            ticket_input_SymbolName.text(messages.ticket_message_invalid_symbol.text).attr('title', '')
            ProductMgr.get(code, function (productObj) {
                if (productObj) {
                    if (productObj[20]) {
                        var isAShare = ExchangeMgr.exchange_isAShare[productObj[20]]
                        var tickBCAN = $('.account-BCAN')
                        if (isAShare) {
                            if (AccountMgr.BCAN) {
                                var selectBCAN = $('<select>', { class: 'form-control act-BCAN', name: 'BCAN' })
                                selectBCAN.css({'padding':'0 10px', 'height':'22px', 'font-size': '12px', 'max-width': '120px'})
                                var actBCAN = AccountMgr.BCAN
                                if (actBCAN.length == 1) {
                                    tickBCAN.empty()
                                } else if (actBCAN.length > 1) {
                                    tickBCAN.empty()
                                    tickBCAN.attr('class', 'account-BCAN')
                                    tickBCAN.css('display', 'inline-block')
                                    for (var p in actBCAN) {
                                        var option = $('<option>', { value: actBCAN[p], text: messages.ticket_input_BCAN.text + ' [' + actBCAN[p] + ']' })
                                        selectBCAN.append(option)
                                    }
                                    tickBCAN.append(selectBCAN)
                                } else {
                                    tickBCAN.empty()
                                }
                            }
                        } else {
                            tickBCAN.empty()
                            tickBCAN.attr('class', 'account-BCAN')
                        }
                    }
                    if (productObj[tags.symbol] !== ticket_input_SymbolCode.val().trim()) return
                    if (!ExchangeMgr.exchanges || ExchangeMgr.exchanges.indexOf(productObj[tags.exchange]) < 0) return
                    if (productObj[tags.exchange] !== ticket_select_exchange.val()) {
                        setExchange(productObj[tags.exchange])
                    }
                    ticket_valid_symbol_code = code
                    ticket_input_SymbolName.removeClass('text-danger')
                    var symbolName = productObj.symbolName || productObj.shortName || ''  // symbol name -> short name -> ''
                    ticket_input_SymbolName.text(symbolName)
                    ticket_input_SymbolName.attr('title', symbolName)
                    $('#ticket-currency-hint').text(productObj[tags.currency] || '')
                    current.symbol = code
                    $('#ticket-lot-size').text($._format.quantity(productObj[tags.lotSize])).parent().removeClass('hidden')
                    $('#ticket-max-buy-sell-hint').removeClass('hidden')
                    calcMaxBuySell()
                    changeTicketMode(productObj)
                    currentProduct = productObj
                    $(document).trigger('ticket-added', productObj)
                }
            })
        }
    }

    function inputSymbol(symbolObj) {
        if (typeof (symbolObj) === 'object') {
            if (symbolObj.exchange) {
                setExchange(symbolObj.exchange)
            }
            ticket_input_SymbolCode.val(symbolObj.symbol).focus()
            if (symbolObj.symbol) {
                setTimeout(function () {
                    ticket_input_SymbolCode.trigger('blur')
                    setPrice(symbolObj.price).focus()
                    if (typeof (symbolObj.quantity) !== 'undefined') {
                        ticket_input_Quantity.val(symbolObj.quantity).focus()
                    }
                }, 50)
            }
        }
    }

    function initExchangeList() {
        if (isMobile) {
            ticket_select_exchange.find('option').each(function () {
                $(this).text($._map.exchange($(this).val()))
            })
        } else {
            $('.custom-options').selectric({
                disableOnMobile: true,
                optionsItemBuilder: function (itemData, element, index) {
                    return '<i class="icon-margin flag-icon ' + (ExchangeMgr.exchange_flag[itemData.value] || '') + '"></i>' + $._map.exchange(itemData.value)
                },
                labelBuilder: function (currItem) {
                    return '<i class="icon-margin flag-icon ' + (ExchangeMgr.exchange_flag[currItem.value] || '') + '"></i>' + $._map.exchange(currItem.value)
                }
            })
        }
    }

    function initGTDPicker() {
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

    function setSpinner(container, obj) {
        container.find('.price-spinner:not(.spinner-done)').spinner({
            min: 0, precision: 10, // set precision larger to make value correct after round
            step: function (dir) {
                var symbolObj = obj || currentProduct
                if (!symbolObj) return 0
                var spreadValue = Number(SpreadMgr.getSpreadValue(symbolObj, this.oldValue))
                if (!spreadValue) return 0
                var value
                if (dir === 'up') {
                    value = Math.ceil(this.oldValue / spreadValue) * spreadValue
                    return (Number(Math.abs(value - this.oldValue) < 0.0001 ? spreadValue : value - this.oldValue)).toString()
                } else {
                    value = Math.floor(this.oldValue / spreadValue) * spreadValue
                    return (Number(Math.abs(value - this.oldValue) < 0.0001 ? spreadValue : this.oldValue - value)).toString()
                }
            }
        }).spinner('changing', function (e, newVal, oldVal) {
            var symbolObj = obj || currentProduct
            if (!symbolObj) return
            $(this).val(getDisplayPrice(newVal, 'order', symbolObj).replace(/,/g, ''))
            calcMaxBuySell()
        })
        container.find('.price-spinner:not(.spinner-done) input').each(function () {
            var symbolObj = obj || currentProduct
            if (!symbolObj) return
            $(this).val(getDisplayPrice($(this).val(), 'order', symbolObj).replace(/,/g, ''))
        })
        container.find('.quantity-spinner:not(.spinner-done)').spinner({
            min: 0, step: function (dir) {
                var symbolObj = obj || currentProduct
                var lotSize = (symbolObj ? symbolObj[24] : 0) || 0
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
        container.find('.price-spinner:not(.spinner-done),.quantity-spinner:not(.spinner-done)').find('input').each(function () {
            if (!Number($(this).val())) {
                $($(this).val(''))
            }
        })
        container.find('.price-spinner:not(spinner-done) input').blur(function () {
            var symbolObj = obj || currentProduct
            if (!symbolObj) return
            var price = Number($(this).val())
            if (isNaN(price) || price === 0) {
                $(this).val('')
                return
            }
            $(this).val(getDisplayPrice(price, 'order', symbolObj).replace(/,/g, ''))
        })
        container.find('.price-spinner,.quantity-spinner').addClass('spinner-done')   // prevent to initialize spinner repeatedly
    }

    function applyExchangeRule(value) {
        var exchange = ticket_select_exchange.val()
        if (initial_data.exchange_rule && initial_data.exchange_rule[exchange]) {
            var ruleObj = initial_data.exchange_rule[exchange]
            ruleObj.rule = ruleObj.rule || 'default'
            if (ruleObj.rule && exchangeRules[ruleObj.rule]) {
                value = exchangeRules[ruleObj.rule](value, ruleObj.options)
            }
        }
        return value
    }

    function resetForm() {
        inputSymbol({ symbol: '' })
        updateSymbol()
        TicketFund.clear()
        TicketBond.clear()
        ticket_input_SymbolCode.val('')
        ticket_input_Price.val('')
        ticket_input_Quantity.val('')
        bond_input_quantity.val('')
        ticket_input_SymbolName.html('&nbsp;')
        $('#ticket-gtd-option').text(messages.oms.order_tif_gtd)
        $('#ticket-gtd-option').val('gtd')
        ticket_select_OrderType.popover('hide')
        filterOrderTypeTif()
        ticket_select_OrderType.trigger('change')
        ticket_select_tif.trigger('change')
        ticket_input_SymbolCode.focus()
    }

    function calcMaxBuySell() {
        if (ticket_input_Price.attr('disabled') || ticket_input_Price.val() == 0) {
            $('#ticket-max-buy').text('')
        } else {
            GetMaxBuy(ticket_valid_symbol_code, ticket_input_Price.val(), function (maxbuy) {
                $('#ticket-max-buy').text($._format.quantity(maxbuy))
            })
        }
        $('#ticket-max-sell').text($._format.quantity(GetMaxSellSync(ticket_valid_symbol_code)))
    }

    function calcOrder() {
        var title
        ticket_btn_buy_side.click(function () {
            ticket_order_side = 0
            $('#ticket-side').val(0)
        })
        ticket_btn_sell_side.click(function () {
            ticket_order_side = 1
            $('#ticket-side').val(1)
        })
        validateForm(ticket_form, {
            submitHandler: function (form) {
                if (!currentProduct) return
                if (!ticket_valid_symbol_code) return
                if (ticket_form.find('[name=symbol]').val() != currentProduct[0]) {
                    ticket_form.find('[name=symbol]').blur()
                    return
                }
                if (ticket_order_side == 0) {
                    if (ticket_btn_buy_side.attr('disabled')) return
                } else {
                    if (ticket_btn_sell_side.attr('disabled')) return
                }
                ticket_btn_sell_side.attr('disabled', 'disabled')
                ticket_btn_buy_side.attr('disabled', 'disabled')
                var productType = currentProduct[22]
                var transfee = currentProduct['3407']

                ticket_form_data = $(form).serialize() + '&account={0}&productType={1}&transFee={2}'.format(current.account, productType, transfee)
                if (IsOTCFund(currentProduct)) {
                    TicketFund.popupFundDisclaimer(function (res) {
                        if (res) {
                            submitCalcorder(ticket_form_data, { confirmBoxTitle: messages.order_confirmation_fund_title.text })
                        }
                        handleAfterSubmitCalc()
                    })
                } else if (IsOTCBond(currentProduct)) {
                    TicketBond.popupBondDisclaimer(function (res) {
                        if (res) {
                            submitCalcorder(ticket_form_data, { confirmBoxTitle: messages.order_confirmation_bond_title.text })
                        }
                        handleAfterSubmitCalc()
                    })
                } else {
                    var isValid = true
                    if (initial_data.ticket && initial_data.ticket.allowZeroPrice === false) {
                        if (!ticket_input_Price.attr('disabled') && Number(ticket_input_Price.val()) == 0) isValid = false
                    }
                    var stopPrice = Number($('#ticket-input-stop-price').val())
                    if (ticket_select_OrderType.val() === 'stopLimit' && stopPrice <= 0) isValid = false
                    if (ticket_select_tif.val() === 'gtd' && !ticket_gtd_date) isValid = false

                    ticket_form_data += '&stopPrice=' + stopPrice
                    if (isValid) {
                        submitCalcorder()
                    } else {
                        handleAfterSubmitCalc()
                    }
                }
            },
            errorClass: 'error',
            validClass: 'success',
        })
    }

    function handleAfterSubmitCalc() {
        if (!ticket_btn_buy_side) return
        ticket_btn_buy_side.removeAttr('disabled')
        ticket_btn_sell_side.removeAttr('disabled')
        if (initial_data.ticket.clearAfterSubmit) {
            resetForm()
        }
    }

    function submitCalcorder(postData, options) {
        ticket_form_data = postData || ticket_form_data
        options = options || {}
        var dataObj = {
            title: options.title
        }
        if (!options.addOrder) {
            options.addOrder = addOrder
        }
        var a = ticket_form_data.split('&')
        for (var i = 0; i < a.length; i++) {
            var tagValue = a[i].split('=')
            dataObj[tagValue[0]] = tagValue[1]
        }
        $.ajax({
            type: 'post',
            url: '/iTrader/order/calculate',
            data: ticket_form_data,
            success: function (result) {
                if (result.error) {
                    handleBondFundError(result)
                    handleError(result.error, function () {
                        handleAfterSubmitCalc()
                    })
                } else if (result.data) {
                    if (!result.data.isNeedConfirm) {
                        options.addOrder(result.data)
                    } else {
                        dataObj.result = result.data.isNeedConfirm
                        dataObj.confirmBoxTitle = options.confirmBoxTitle
                        handleBondFundConfirm(dataObj, function (isConfirm) {
                            if (isConfirm) {
                                options.addOrder(result.data)
                            }
                        })
                    }
                }
            },
            error: function (err) {
                handleError(err, function () {
                    handleAfterSubmitCalc()
                })
            }
        })
    }

    function handleBondFundError(result) {
        if (result && result.error) {
            var errorCode = result.error.errorCode
            if (errorCode === 'DCFUND006') {
                if (result.error.parameters && result.error.parameters.length > 0) {
                    result.error.parameters[0] = $._format.amount(result.error.parameters[0])
                }
            }
        }
    }

    function handleBondFundConfirm(obj, callback) {
        function handler() {
            if (!data || data.length <= 0) return callback(true)
            var r = false
            var item = data[0]
            data.splice(0, 1)
            if (item && item.errorCode) {
                var message = ''
                if (item.parameters && item.parameters.length > 1) {
                    if (item.errorCode === 'DCFUND013') {
                        message = '<div>' + messages.error[item.errorCode].cformat($._format.amount(item.parameters[0]), $._format.amount(item.parameters[1])) + '</div>'
                    } else if (item.errorCode === 'DCFUND009') {
                        message = '<div>' + messages.error[item.errorCode].cformat(item.parameters[0], item.parameters[1]) + '</div>'
                    }
                } else if (item.errorCode === 'DCFUND014') {
                    message = messages.error.DCFUND014
                }
                showMessage({
                    title: obj.confirmBoxTitle || '',
                    type: BootstrapDialog.TYPE_WARNING,
                    buttonNameList: ['sure', 'cancel'],
                    message: message,
                    onshown: function () {
                        checkDisclosureRequired()
                    },
                    callback: function (button, dialog) {
                        var btnID = button.attr('id')
                        if (btnID === 'btn-sure') {
                            r = true
                        }
                        dialog.close()
                        return
                    },
                    onhidden: function () {
                        if (r) {
                            handler()
                        } else {
                            callback(false)
                        }
                    }
                })
            } else {
                handler()
            }
        }
        callback = callback || {}
        if (!obj && !obj.data) {
            return callback(true)
        }
        var data = obj.result
        if (!IsArray(data)) {
            data = [data]
        }
        handler(callback)
    }

    function addOrder(orderObj) {
        if (!orderObj || !orderObj[tags.userRef] || isNaN(orderObj[tags.side])) return
        showMessage({
            title: messages.ticket_order_add_confirmation_title.text + AccountMgr.current_account,
            type: orderObj[tags.side] == '0' ? BootstrapDialog.TYPE_SUCCESS : BootstrapDialog.TYPE_DANGER,
            load: {
                url: '/iTrader/order/add?ref=' + orderObj[tags.userRef], callback: function (dialog) {
                    Util.FormatOrderInfo(orderObj[0], dialog.$modal)
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
                            submitOrder(form_data, function (result) {
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
                                                        saveCBBCAgreement()
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
            },
            onhidden: function () {
                handleAfterSubmitCalc()
            }
        })
    }

    function changeOrder(orderNo) {
        var order = OrderMgr.get(orderNo)
        if (!order) return
        showMessage({
            title: messages.ticket_order_change_confirmation_title.text + order[tags.account],
            type: order[tags.side] == '0' ? BootstrapDialog.TYPE_SUCCESS : BootstrapDialog.TYPE_DANGER,
            load: {
                url: '/iTrader/order/change?orderNo=' + orderNo, callback: function (dialog) {
                    current.symbol = $('#change-confirmation-symbol').attr('data-symbol')
                    $('#order-change-gtd').datepicker({
                        startDate: "today",
                        todayHighlight: true,
                        autoclose: true,
                        format: 'yyyy/mm/dd'
                    })
                    Util.FormatOrderInfo(order[0], dialog.$modal, function (data) {
                        setSpinner(dialog.$modal, data)
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
                            var inputs = changeOrderForm.find('[name=changePrice]')
                            if (inputs.length > 1) {
                                if (initial_data.ticket && initial_data.ticket.allowZeroPrice === false) {
                                    if (Number($(inputs[1]).val()) == 0) return
                                }
                            }
                            var form_data = changeOrderForm.serialize() + '&cmd=change'
                            dialog.close()
                            submitOrder(form_data, function (result) {
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
                if (ticket_input_SymbolCode) {
                    current.symbol = ticket_input_SymbolCode.val()
                }
            }
        })
    }

    function cancelOrder(orderNo) {
        var order = OrderMgr.get(orderNo)
        if (!order) return
        showMessage({
            title: messages.ticket_order_cancel_confirmation_title.text + order[tags.account],
            type: order[tags.side] == '0' ? BootstrapDialog.TYPE_SUCCESS : BootstrapDialog.TYPE_DANGER,
            load: {
                url: '/iTrader/order/cancel?orderNo=' + orderNo, callback: function (dialog) {
                    Util.FormatOrderInfo(order[0], dialog.$modal)
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
                            submitOrder(form_data, function (result) {
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
                if (ticket_input_SymbolCode) {
                    current.symbol = ticket_input_SymbolCode.val()
                }
            }
        })
    }

    function submitOrder(data, callback) {
        $.ajax({
            type: 'post',
            url: '/iTrader/order/submit',
            data: data,
            success: callback,
            error: handleError
        })
    }

    function saveCBBCAgreement() {
        $.ajax({
            type: 'post',
            url: '/iTrader/message/agreement',
            data: { name: 'SaveCBBCAgreementFlag', value: 1, _csrf: $('[name=_csrf]').attr('value') },
            success: function (res) {
                if (res.error) {
                    layer.msg(getErrorMessage(res.error))
                }
            },
            error: handleError
        })
    }

    function applyShortcut() {
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
            $('#ticket-side').val(0)
            ticket_order_side = 0
            ticket_form.submit()
        })
        addShortcut(shortcutSection.sell, function () {
            $('#ticket-side').val(1)
            ticket_order_side = 1
            ticket_form.submit()
        })
        addShortcut(shortcutSection.reset, function () {
            resetForm()
        })
        addShortcut(shortcutSection.refresh, function () {
        })
        addShortcut(shortcutSection.tabUp, function () {
            var focusElement = $(':focus')
            if (focusElement && focusElement.length > 0) {
                var currentTabIndex = Number(focusElement.attr('tabindex'))
                for (var i = currentTabIndex; i > 0; i--) {
                    var lastElement = $('[tabindex=' + (i - 1) + ']')
                    if (lastElement.length > 0 && !lastElement.attr('disabled')) {
                        lastElement.focus()
                        break
                    }
                }
            }
        })
        addShortcut(shortcutSection.tabDown, function () {
            var focusElement = $(':focus')
            if (focusElement && focusElement.length > 0) {
                var currentTabIndex = Number(focusElement.attr('tabindex'))
                for (var i = currentTabIndex; i <= 8; i++) {
                    var lastElement = $('[tabindex=' + (i + 1) + ']')
                    if (lastElement.length > 0 && !lastElement.attr('disabled')) {
                        lastElement.focus()
                        break
                    }
                }
            }
        })
    }

    function filterOrderTypeTif() {
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
        if (!exchange || !ExchangeMgr || !ExchangeMgr.exchange_orderType[exchange] || !ExchangeMgr.exchange_tif[exchange]) return
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

    function setExchange(exchange) {
        if (exchange) {
            ticket_select_exchange.val(exchange)
            $('.custom-options').selectric('refresh')
            ticket_select_exchange.trigger('change')
        }
    }

    function changeTicketMode(productObj, exchange) {
        $('.ticket-mode-stock,.ticket-mode-bond,.ticket-mode-fund,.ticket-mode-disabled-fund,.ticket-mode-disabled-bond').addClass('hidden')
        if (IsOTCFund(productObj) || exchange === 'FUND') {
            if (!initial_data.views.trade.ticket.disableFundTicket) {
                $('.ticket-mode-fund').removeClass('hidden')
            } else {
                $('.ticket-mode-disabled-fund').removeClass('hidden')
            }
            ticket_otc_flag.val(1)
        } else if (IsOTCBond(productObj) || exchange === 'BOND') {
            if (!initial_data.views.trade.ticket.disableBondTicket) {
                $('.ticket-mode-bond').removeClass('hidden')
            } else {
                $('.ticket-mode-disabled-bond').removeClass('hidden')
            }
            ticket_otc_flag.val(1)
        } else {
            $('.ticket-mode-stock').removeClass('hidden')
            ticket_otc_flag.val(0)
        }
        // symbol input element focus
        if (!ticket_input_SymbolCode.val()) {
            ticket_input_SymbolCode.focus()
        }
    }


    function checkDisclosureRequired() {
        var submitBtn = $('[required-accept-disclosure]').parents('.modal-content').find('#btn-sure')
        submitBtn.attr('disabled', true)
        $('[required-accept-disclosure]').click(function () {
            var isChecked = $(this).get(0).checked
            submitBtn.attr('disabled', !isChecked)
        })
    }


    exports.init = init
    exports.inputSymbol = inputSymbol
    exports.calcOrder = calcOrder
    exports.addOrder = addOrder
    exports.changeOrder = changeOrder
    exports.cancelOrder = cancelOrder
    exports.submitCalcorder = submitCalcorder
})