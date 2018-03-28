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

{ $Id: oms.js,v 1.22 2018/02/28 03:51:00 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

function GetOptions(orderObj) {
    var ordConst = initial_data.ordConst
    var options = ''
    if (orderObj) {
        var instruction = orderObj[tags.instruct]
        var instruction1 = orderObj[tags.instruct1]
        var instruction2 = orderObj[tags.instruct2]
        var instruction3 = orderObj[tags.instruct3]
        var instruction4 = orderObj[tags.instruct4]


        if ((instruction & ordConst.omsOrderMarket) !== 0) {
            options += messages.oms.order_type_market + ';'
        }
        if ((instruction & ordConst.omsOrderPreOpen) !== 0) {
            if (Number(orderObj['3']) == 0) {
                options += messages.oms.order_type_auction + ';'
            } else {
                options += messages.oms.order_type_auctionLimit + ';'
            }
        }
        if ((instruction & ordConst.omsOrderEnhancedLimit) !== 0) {
            options += messages.oms.order_type_enhancedLimit + ';'
        }
        if ((instruction & ordConst.omsOrderStopLimit) !== 0) {
            var stopPriceStr = getDisplayPrice(orderObj[41], 'order', orderObj)
            options += '{0} [{1}:{2}];'.format(messages.oms.order_type_stopLimit, messages.ticket_stop_price.text, stopPriceStr)
        }
        if ((instruction & ordConst.omsOrderFAK) !== 0) {
            options += messages.oms.order_tif_fak + ';'
        }
        if ((instruction & ordConst.omsOrderFOK) !== 0) {
            options += messages.oms.order_tif_fok + ';'
        }
        if ((instruction & ordConst.omsOrderGTC) !== 0) {
            if (orderObj[tags.expirationDate]) {
                options += '{0} [{1}];'.format(messages.oms.order_tif_gtd, orderObj[tags.expirationDate])
            } else {
                options += messages.oms.order_tif_gtc + ';'
            }
        }

        if (orderObj.transFee || orderObj.transFee == 0) {
            options += '{0}{1};'.format('TRANSFEE: ', $._format.percentage(orderObj.transFee, 2))
        }
    }
    return options
}

function IsOTCFund(productObj) {
    if (productObj && productObj['22'] == 10 && productObj['1508'] == 1) return true
}

function IsOTCBond(productObj) {
    if (productObj && productObj['22'] == 6 && productObj['1508'] == 1) return true
}

function GetMaxBuy(symbol, price, callback) {
    var max_buy = 0
    var balanceObj = {}
    if (symbol && price) {
        ProductMgr.get(symbol, function (productObj) {
            if (!productObj) return callback(0)
            var currency = productObj[tags.currency] || CurrencyMgr.base_currency
            var isMulti = CurrencyMgr.currencyMode
            if (isMulti) {
                var currencyList = CurrencyMgr.currency_list
                if (currencyList) {
                    for (var i = 0; i < currencyList.length; i++) {
                        if (currencyList[i].currency == currency) {
                            var isConvertible = currencyList[i].isConvertible
                            if (!isConvertible) {
                                balanceObj = AccountMgr.get(current.account, currency)
                            }
                            else {
                                balanceObj = AccountMgr.get(current.account, null)
                            }
                        }
                    }
                }
            } else {
                balanceObj = AccountMgr.get(current.account, null)
            }
            if (balanceObj && productObj) {
                var tradingLimit = balanceObj[initial_data.keyTags.tradingLimit] || 0
                if (initial_data.bankBalanceMode) {
                    tradingLimit = balanceObj.netAssetValue
                }
                var lotSize = productObj[24] || 0
                if (tradingLimit && lotSize) {
                    var currencyObj = CurrencyMgr.get(productObj[tags.currency])
                    if (currencyObj && currencyObj.ratio) {
                        tradingLimit = tradingLimit / currencyObj.ratio
                        max_buy = Math.floor(tradingLimit / price / lotSize) * lotSize
                    }
                }
            }
            return callback(max_buy >= 0 ? max_buy : 0)
        })
    } else {
        callback(0)
    }
}

function GetMaxSellSync(symbol) {
    if (!symbol) return
    var max_sell = 0
    var positions = PositionMgr.get({ symbol: symbol, account: current.account })
    if (positions && positions.length > 0) {
        max_sell = positions[0][tags.quantity] - (positions[0].queueQuantity || 0)
        if (ExchangeMgr.exchange_isDayTrade && ExchangeMgr.exchange_isDayTrade[positions[0]['20']])
            max_sell -= positions[0].todayBuyQuantity
    }
    return max_sell >= 0 ? max_sell : 0
}

function IsOutstandingStatus(status) {
    if (status == 1 || status == 2 || status == 100 || status == 8) {
        return true
    }
}

// all non-cash account will treat as margin account that maybe has accept value
function IsMarginAccount(account) {
    if (typeof AccountMgr === 'undefined') return true
    if (account && AccountMgr && AccountMgr.account_info_list && AccountMgr.account_info_list[account] && AccountMgr.account_info_list[account].margin_type == 0) {
        return false
    }
    return true
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

{ $Id: common.js,v 1.30 2018/03/09 10:16:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

// global variable
var lang
var initial_data
var tags
var NotApplicableValue = 'N/A'
var openWindows = []
var current = {
    symbol: '',
    account: '',
    currency: '',
}

$(function () {
    lang = ($('html').attr('lang') || 'en-US')
    InitializeSite()

    $(window).unload(function () {
        for (var i = 0; i < openWindows.length; i++) {
            openWindows[i].close()
        }
    })
    changeTheme()
    HandlerLoadPage()

    // localization for jquery-validation
    if (lang === 'zh-HK') {
        $.getScript('/javascripts/jquery-validation/localization/messages_zh_TW.js')
    } else if (lang === 'zh-CN') {
        $.getScript('/javascripts/jquery-validation/localization/messages_zh.js')
    }
})

function initialize(callback) {
    $.get('/iTrader/initialize', function (data) {
        initial_data = data
        tags = data.tags
        InitializeLanguage()
        manualVerifySession()
        $.get('/iTrader/account', function (data) {
            if (!data || !data.data) return
            ExchangeMgr.set(data.data.tradeExchange)
            AccountMgr.setAcctInfo(data.data)
            CurrencyMgr.setInfo(data.data.currencyInfo)
            callback()
            if (data.data.forceReLogin) {
                window.location.href = '/iTrader/user/logout'
            }
        })
    })
}

function InitializeLanguage() {
    $('#nav_language').on('change', function (event, key) {
        window.location.search = 'lang=' + key
    })
    var data = [{ key: lang, value: messages['lang_' + lang].text }]
    for (var i = 0; i < initial_data.languages.length; i++) {
        if (!_.find(data, function (o) { return o.key === initial_data.languages[i] })) {
            data.push({ key: initial_data.languages[i], value: messages['lang_' + initial_data.languages[i]].text })
        }
    }
    DropdownGroupBind($('#nav_language-dropdown'), data)
}

function InitializeSite() {
    if (typeof AccountMgr === 'undefined') return
    AccountMgr.on(function (data) {
        if (!data || !data.account_list || data.account_list.length <= 0) return
        current.account = data.account_list[0]
        AccountMgr.current_account = data.account_list[0]

        $('.nav_current_account').each(function () { $(this).text(data.account_list[0]) })
        var list = []
        for (var i = 0; i < data.account_list.length; i++) {
            list.push({ key: data.account_list[i], value: data.account_list[i] })
        }
        DropdownGroupBind($('#nav_accounts_dropdown'), list)
    })

    $('#nav_account').on('change', function (event, key) {
        current.account = key
        AccountMgr.current_account = key
        $('.nav_current_account').each(function () { $(this).text(key) })
    })
}

/* Begin popup, dialog, navigation ======================================================= */
function popupWindow(url, options) {
    if (!options) {
        options = {}
    }
    if (options.multi_language == true || options.multi_language === 'yes') {
        var index = url.lastIndexOf('.')
        if (index >= 0) {
            url = url.substring(0, index) + '_' + lang + url.substring(index)
        }
    }
    var height = options.height || 750,
        width = options.width || 600,
        top = options.top || 0,
        left = options.left || 0,
        menubar = options.menubar || 'no',
        toolbar = options.toolbar || 'no',
        scrollbars = options.scrollbars || 'yes',
        resizable = options.resizable || 'yes',
        location = options.location || 'no',
        status = options.status || 'no',
        name = options.name || url
    var parameters = 'height=' + height + ',width=' + width + ',top=' + top + ',left=' + left + ',toolbar=' + toolbar + ',menubar=' + menubar + ',scrollbars=' + scrollbars + ',resizable=' + resizable + ',location=' + location + ',status=' + status
    var openWindow = window.open(url, name, parameters)
    openWindows.push(openWindow)
    return openWindow
}

function PopupMarketDataWindow(name, options) {
    var url = ''
    options = options || {}
    if (name === 'local') {
        url = '/iTrader/product/search'
        options.name = 'Symbol Search'
    } else {
        url = '/iTrader/product/market?name=' + name
        options.name = name + ' Market Price'
    }
    options.width = options.width || 800
    options.height = options.height || 700
    options.left = window.screen.availWidth - 10 - options.width
    options.status = 'yes'
    popupWindow(url, options)
}

function PopupeStatementWindow(name, options) {
    options = options || {}
    var url = '/itrader/estatement'
    options.name = 'estatement'
    options.width = options.width || 800
    options.height = options.height || 700
    options.left = window.screen.availWidth - 10 - options.width
    options.status = 'yes'
    popupWindow(url, options)
}

function PopupAnnouncement(announcement) {
    if (announcement) {
        if (announcement.type === 'window') {
            var options = {}
            var url = announcement.url
            options.multi_language = announcement.multi_language
            options.width = 800
            options.height = 400
            options.top = (window.screen.availHeight - 30 - options.height) / 2
            options.left = (window.screen.availWidth - 10 - options.width) / 2
            popupWindow(url, options)
        } else {
            var url = announcement.multi_language ? getMultiLanguageURL(announcement.url) : announcement.url
            alertMessage({
                title: messages.announcement_title.text,
                message: $('<div></div>').load(url)
            })
        }
    }
}

function getMultiLanguageURL(url) {
    var resUrl = ''
    if (typeof url === 'string') {
        resUrl = url
    } else if (typeof url === 'object') {
        if (url.multi_language === false) return url.url
        resUrl = url.url
    }
    if (resUrl) {
        var index = resUrl.lastIndexOf('.')
        if (index >= 0) {
            resUrl = resUrl.substring(0, index) + '_' + lang + resUrl.substring(index)
        }
        return resUrl
    }
}

function validateForm(form, options) {
    form.validate({
        submitHandler: options.submitHandler,
        highlight: options.highlight || function (element, errorClass, validClass) {
            $(element).closest('.form-group').addClass(errorClass).removeClass(validClass).removeClass('control-label')
        },
        unhighlight: options.unhighlight || function (element, errorClass, validClass) {
            $(element).closest('.form-group').removeClass(errorClass).addClass(validClass).removeClass('control-label')
        },
        errorPlacement: options.errorPlacement || function (error, element) {
        },
        showErrors: options.showErrors,
        errorClass: typeof (options.errorClass) === 'undefined' ? 'has-error control-label' : options.errorClass,
        validClass: typeof (options.validClass) === 'undefined' ? 'has-success' : options.validClass,
        rules: options.rules || rules,
    })
}

function handleError(err, callback) {
    if (err && typeof err === 'object') {
        if (err.errorCode && err.parameters && err.parameters.length >= 2) {
            if (err.errorCode !== 'DCFUND009') {
                err.parameters[0] = $._format.pattern(err.parameters[0], initial_data.format.bond_unit)
                err.parameters[1] = $._format.pattern(err.parameters[1], initial_data.format.bond_unit)
            }
        }
    }
    var errMsg = getErrorMessage(err)
    alertError({ message: errMsg, onhide: callback })
}

function getErrorMessage(err) {
    var errMsg
    if (err) {
        if (typeof (err) === 'string') {
            errMsg = messages.error[err] || err
        } else if (typeof (err) === 'object') {
            var minorCode = err.minorCode || err[tags.minorCode]
            var errorCode = err.errorCode || err[tags.errorCode]
            var errorMsg = err.errorMsg || err.freeText || err[tags.freeText]
            errMsg = errorMsgMapping(err) || messages.error[minorCode] || messages.error[errorCode] || errorMsg
            if (!errMsg) {
                if (err.status) {
                    if (err.status == 401) {
                        navigate()
                    } else if (err.status == 403) {
                        if (err.responseJSON && err.responseJSON.errorCode) {
                            errMsg = messages.error[err.responseJSON.errorCode]
                        }
                        errMsg = errMsg || err.statusText
                    } else if (err.status == 503) {
                        errMsg = messages.error.I_10002
                    } else if (err.statusText) {
                        errMsg = err.statusText
                    } else {
                        errMsg = messages.error.I_10004
                    }
                }
            }
            if (errMsg && err.parameters && err.parameters.length > 0) {
                errMsg = errMsg.cformat(err.parameters)
            }
        }
    }
    return errMsg || messages.error.I_10004
}

// new error mode
function errorMsgMapping(temp1) {
    function converot(type, value) {
        if (!type || !value) return
        if (type === 'd') {
            return $._format.pattern(value, '#,##0.00######')
        } else if (type === 'n') {
            return $._format.quantity(value)
        } else {
            return value
        }
    }
    if (!temp1 || !temp1[tags.compSystemRef] || !temp1[tags.compSystemRef][tags.minorCode]) return
    var errorMsg = ''
    var minorCodeArray = temp1[tags.compSystemRef][tags.minorCode].split(':')
    for (var i = 0; i < minorCodeArray.length; i++) {
        var minorCode = minorCodeArray[i]
        var errorMsgTemplate = messages.error[minorCode]
        if (errorMsgTemplate) {
            var minorCodeValue = temp1[tags.compSystemRef][minorCode]
            if (!minorCodeValue) continue
            var minorCodeValueArray = minorCodeValue.split(':')
            var minorCodeValueFormatArray = []
            for (var j = 0; j < minorCodeValueArray.length; j++) {
                if (minorCodeValueArray[j].length > 1) {
                    minorCodeValueFormatArray.push(converot(minorCodeValueArray[j].substr(0, 1), minorCodeValueArray[j].substring(1, minorCodeValueArray[j].length)))
                }
            }
            errorMsg += errorMsgTemplate.cformat(minorCodeValueFormatArray) + '<br />'
        }
    }
    return errorMsg
}


function navigate(path) {
    path = path || '/'
    location.href = path
}

function changeTheme() {
    $('[data-theme]').click(function () {
        var theme = $(this).attr('data-theme')
        if (theme) {
            var exdate = new Date()
            exdate.setDate(exdate.getDate() + 365)
            document.cookie = 'theme=' + theme + ';expires=' + exdate.toGMTString() + ';path=/'
            window.location.reload()
        }
    })
}

/* End popup, dialog, navigation ======================================================= */

function Logout() {
    for (var i = 0; i < openWindows.length; i++) {
        if (openWindows[i]) {
            openWindows[i].close()
        }
    }
    navigate('/iTrader/user/logout')
}

/* Begin UI component ======================================================= */

function NavDropdownBind(element, data) {
    var text_element = element.find('.dropdown-text')
    var list_element = element.find('.dropdown-list')
    if (text_element.length <= 0 || list_element.length <= 0) return
    text_element = $(text_element[0])
    list_element = $(list_element[0])
    if (_.isArray(data) && data.length > 0) {
        text_element.text(data[0].value)
        list_element.empty()
    }
}

function DropdownGroupBind(element, data) {
    if (!element || !data || data.length <= 0) return
    var text_element = element.find('.dropdown-group-text')
    var list_element = element.find('.dropdown-group-list')
    if (text_element.length <= 0 || list_element.length <= 0) return
    text_element = $(text_element[0])
    list_element = $(list_element[0])
    if (_.isArray(data) && data.length > 0) {
        list_element.empty()
        text_element.text(data[0].value)
        for (var i = 0; i < data.length; i++) {
            var a_element = $("<a href='javascript:void(0)' data-key='" + data[i].key + "'>" + data[i].value + "</a>")
            var li_element = $("<li></li>").append(a_element)
            list_element.append(li_element)
            if (data[i].value === text_element.text()) {
                li_element.hide()
            }
            a_element.click(function () {
                list_element.find('li').show()
                text_element.text($(this).text())
                $(this).parent().hide()
                text_element.trigger('change', $(this).attr('data-key'))
            })
        }
    }
}
/* End UI component ======================================================= */


function PopupUserSetting(options, callback) {
    showMessage({
        title: messages.user_setting_title.text,
        load: {
            url: '/iTrader/account/setting/' + '?tempNo=' + new Date().getTime(), callback: function (dialog) {
                dialog.getModalBody().translate()
            }
        },
        buttonNameList: ['submit', 'close'],
        callback: function (button, dialog) {
            if (button.name === 'close') {
                dialog.close()
            } else if (button.name === 'submit') {
                $.ajax({
                    type: 'post',
                    url: '/iTrader/account/setting',
                    data: $('#user-setting-form').serialize(),
                    success: function (result) {
                        if (result) {
                            if (result.error) {
                                handleError(result.error)
                            } else if (result.data) {
                                layer.msg(messages.user_setting_msg.text)
                            }
                        }
                    },
                    error: handleError
                })
                dialog.close()
            }
        }
    })
}

function GetSymbolName(obj) {
    if (obj) {
        var lang = $('html').attr('lang') || 'en-US'
        if (lang === 'zh-CN') {
            return obj[505] || obj[21] || obj.shortName
        } else if (lang === 'zh-HK') {
            return obj[36] || obj[21] || obj.shortName
        } else {
            return obj[21] || obj.shortName
        }
    }
    return ''
}

function GetShortSymbolName(obj) {
    if (obj) {
        var lang = $('html').attr('lang') || 'en-US'
        if (lang === 'zh-CN') {
            return obj[505] || obj.shortName || obj[21]
        } else if (lang === 'zh-HK') {
            return obj[36] || obj.shortName || obj[21]
        } else {
            return obj.shortName || obj[21]
        }
    }
    return ''
}

function HandlerLoadPage() {
    $(document).on('page', function (event, data) {
        if (data === 'show') {
            $('.loaders').remove()
            $('body').removeClass('loader-container')
            $($('.hide')[0]).removeClass('hide')
            $(document).trigger('page', 'shown')
        }
    })
}

function getDisplayPrice(price, type, options) {
    if (isNaN(price)) return price
    if (Number(price) === 0) return 0
    var type = type || 'market'
    var displayRatio = options.displayRatio || options[1504] || 1
    price = displayRatio * price
    var ticksize = SpreadMgr.getSpreadPrecision(options, price)
    var patternsuffix = ''
    if (type == 'market') {
        price = $._format.price(price, ticksize)
    } else if (type == 'order') {
        for (var i = 0; i < 8; i++) {
            if (i < ticksize) patternsuffix += '0'
            else patternsuffix += '#'
        }
        price = $._format.price(price, '#,##0.' + patternsuffix)
    } else if (type === 'avg') {
        for (var i = 0; i < 8; i++) {
            if (i <= ticksize) patternsuffix += '0'
            else patternsuffix += '#'
        }
        price = $._format.price(price, '#,##0.' + patternsuffix)
    }
    return price
}

function manualVerifySession() {
    if (!initial_data || !initial_data.manualVerifyInterval || initial_data.manualVerifyInterval <= 0) return
    var hasVerifySession = false
    $(document).click(function () {
        hasVerifySession = true
    })
    $(document).keypress(function () {
        hasVerifySession = true
    })
    setInterval(function () {
        if (hasVerifySession) {
            $.post('/iTrader/user/verifySession', function () {
                hasVerifySession = false
            })
        }
    }, 1000 * initial_data.manualVerifyInterval)
}

function maskEmailPhone(str) {
    if (!str) return ''
    var index = str.indexOf('@')
    if (index > 0) {
        var address = str.substring(0, index)
        if (address.length > 6) return str.replace(address, address.substr(0, 3) + '****' + address.substr(-3))
        else if (address.length > 2) return str.replace(address, '****' + address.substr(-2))
        else return str
    } else {
        var prefix = ''
        index = str.indexOf('-')
        if (index > 0) {
            prefix = str.substr(0, index + 1)
        }
        if (str.length > 4) return prefix + '*****' + str.substr(-4)
        else if (str.length > 2) return prefix + '*****' + str.substr(-2)
        else return str
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

{ $Id: socket.js,v 1.10 2016/10/27 08:41:17 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var g_socket
var subscribedSymbol = []   // { symbol: <symbol code>, count: <count>, state: <processing, done> }

function SocketIO_Initialize() {
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

{ $Id: data.js,v 1.43 2018/02/02 07:57:38 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var OrderMgr = {
    orders: {},
    callbackList: [],
    get: function (orderNo) {
        for (var o in this.orders) {
            var orderObj = this.orders[o]
            if (orderObj[6] == orderNo) return orderObj
        }
    },
    set: function (orderList) {
        if (!orderList) return
        var callbackData = []
        for (var i = 0; i < orderList.length; i++) {
            var oo = orderList[i]
            if (!oo || !oo._id) continue
            if (oo.switchID) oo._id = oo.switchID   // swithc id is the key of fund switch order
            var orderObj = this.orders[oo._id] || {}
            this.orders[oo._id] = this.orders[oo._id] || {}
            for (var o in oo) {
                orderObj[o] = oo[o]
            }
            this.parse(oo, orderObj)
            this.orders[oo._id] = orderObj
            callbackData.push(this.orders[oo._id])
        }
        for (var i = 0; i < this.callbackList.length; i++) {
            var cb = this.callbackList[i]
            cb(callbackData)
        }
        return orderList
    },
    on: function (cb) {
        if (typeof cb !== 'function') return
        var callbackData = []
        for (var o in this.orders) {
            callbackData.push(this.orders[o])
        }
        cb(callbackData)
        this.callbackList = this.callbackList || []
        this.callbackList.push(cb)
    },
    parse: function (srcObj, destObj) {
        if (!srcObj) return
        if (!destObj) {
            destObj = srcObj  // if no dest obj specified, use the original one(src order)
        }
        var rawData = {
            "11": srcObj[11]
        }
        var side = srcObj[11]
        if (srcObj.voucherType === 'cash') {
            side = rawData[11] == '1' ? 2 : 3
        } else if (srcObj.voucherType === 'security') {
            side = rawData[11] == '1' ? 3 : 2
        }
        // use the last order's value
        destObj[25] = srcObj[25]
        destObj[11] = $._map.side(side)
        destObj[5] = $._map.status(srcObj[5])
        destObj[400] = $._map.source(srcObj[400])
        destObj.symbolName = GetSymbolName(srcObj)
        destObj.shortName = GetShortSymbolName(srcObj)
        destObj.options = GetOptions(destObj)
        if (destObj.voucherType !== 'cash') {
            destObj[3] = getDisplayPrice(destObj[3], 'order', srcObj)
        } else {
            destObj[3] = $._format.amount(srcObj[3])
        }
        destObj[42] = getDisplayPrice(destObj[42], 'avg', srcObj)
        if (srcObj.voucherType === 'cash') {
            destObj[3] = srcObj[3]
        } else if (IsOTCFund(srcObj)) {
            if (rawData[11] == 0) {
                destObj[3] = $._format.amount(srcObj[3])
                destObj[4] = Number.NaN
                destObj[11] = $._map.side(4)
            } else {
                destObj[3] = Number.NaN
                destObj[11] = $._map.side(5)
            }
            if (!destObj.investAmount || destObj.investAmount != 0) {
                destObj.investAmount = Number.NaN
            }
            if (srcObj.switchID) {
                destObj[6] = srcObj.switchID
                destObj[11] = $._map.side(6)
                destObj[4] = Number.NaN
                destObj[3] = Number.NaN
                destObj.investAmount = Number.NaN
                destObj[0] = messages.NotApplicableValue.text
                destObj[23] = messages.NotApplicableValue.text
                destObj.FundSwitchOrderList = destObj.FundSwitchOrderList
            }
        } else if (IsOTCBond(srcObj)) {
            destObj[3] = $._format.price(srcObj[3], '#,##0.00######')
        }
        return destObj
    }
}

var ErrorOrderMgr = {
    errorList: [],
    callbackList: [],
    set: function (data) {
        if (!data || data.length <= 0) return
        this.errorList = data
        for (var i = 0; i < this.callbackList.length; i++) {
            var cb = this.callbackList[i]
            cb(data)
        }
    },
    on: function (cb) {
        if (typeof cb !== 'function') return
        if (this.errorList && this.errorList.length > 0) {
            cb(this.errorList)
        }
        this.callbackList = this.callbackList || []
        this.callbackList.push(cb)
    }
}

var PositionMgr = {
    positions: {},
    pendingPositions: [],  // pending position list, for emit
    lastMessageDatetime: null,  // to defined all message received
    callbackList: [],
    init: function () {
        var that = this
        setInterval(function () {
            that.lastMessageDatetime = that.lastMessageDatetime || (new Date()).getTime()
            if (!that.pendingPositions || that.pendingPositions.length <= 0) return
            if ((new Date()).getTime() - that.lastMessageDatetime > 500) {
                for (var i = 0; i < that.callbackList.length; i++) {
                    var cb = that.callbackList[i]
                    cb(that.pendingPositions)
                }
                that.pendingPositions = []
            }
        }, 500)
    },
    get: function (options) {
        options = options || {}
        var res = []
        for (var p in this.positions) {
            var obj = this.positions[p]._raw
            if (options.account && options.account !== obj[10]) continue
            if (options.symbol && options.symbol !== obj[0]) continue
            if (options.exchange && options.exchange !== obj[20]) continue
            res.push(this.positions[p])
        }
        return res
    },
    set: function (positionList) {
        if (!positionList || positionList.length <= 0) return
        for (var i = 0; i < positionList.length; i++) {
            var po = positionList[i]
            if (!po || !po._id) continue
            this.positions[po._id] = this.positions[po._id] || {}
            for (var p in po) {
                this.positions[po._id][p] = po[p]
            }
            this.positions[po._id][31] = getDisplayPrice(po[31], 'market', po)
            this.positions[po._id].costPrice = getDisplayPrice(po.costPrice, 'avg', po)
            this.positions[po._id].marketValue = po.marketValue === Number.MIN_SAFE_INTEGER ? Number.NaN : po.marketValue
            this.positions[po._id].acceptValue = po.acceptValue === Number.MIN_SAFE_INTEGER ? Number.NaN : po.acceptValue
            this.positions[po._id].market = $._map.exchange(po[20])
            var account = po[10]
            if (IsMarginAccount(account)) {
                if (po.acceptValue == Number.NaN) {
                    this.positions[po._id].acceptValue = 0  // v1.3.2 margin account cannot display N/A
                }
            } else if (!initial_data.forceShowAcceptValue) {
                this.positions[po._id].acceptValue = Number.NaN
            }
            this.pendingPositions.push(this.positions[po._id])
        }
        AccountMgr.updateAcctInfo()
    },
    on: function (cb) {
        if (typeof cb !== 'function') return
        var callbackData = []
        for (var p in this.positions) {
            callbackData.push(this.positions[p])
        }
        cb(callbackData)
        this.callbackList = this.callbackList || []
        this.callbackList.push(cb)
    }
}
PositionMgr.init()

var ExchangeMgr = {
    current_exchange: '',
    exchanges: [],
    exchange_flag: {},
    exchange_orderType: {},
    exchange_tif: {},
    exchange_isDayTrade: {},
    exchange_isPriceQuote: {},
    exchange_isAShare: {},
    callbackList: [],
    set: function (exchangeList) {
        if (!exchangeList) return
        for (var e in exchangeList) {
            var exchangeObj = exchangeList[e]
            if (!exchangeObj) continue
            this.exchange_flag[e] = exchangeObj.icon || ''
            this.exchange_orderType[e] = exchangeObj.type || []
            this.exchange_tif[e] = exchangeObj.tif || []
            this.exchange_isDayTrade[e] = exchangeObj.isDayTrade
            this.exchange_isAShare[e] = exchangeObj.isAShare
            this.exchange_isPriceQuote[e] = exchangeObj.isPriceQuote
            if (this.exchanges.indexOf(e) < 0) {
                this.exchanges.push(e)
            }
        }
        for (var i = 0; i < this.callbackList.length; i++) {
            var cb = this.callbackList[i]
            cb({ exchanges: this.exchanges })
        }
    },
    on: function (cb) {
        if (typeof cb !== 'function') return
        cb({ exchanges: this.exchanges })
        this.callbackList = this.callbackList || []
        this.callbackList.push(cb)
    }
}

var CurrencyMgr = {
    currencyMode: '',
    base_currency: '',
    currency_list: [],
    get: function (currency) {
        for (var i = 0; i < this.currency_list.length; i++) {
            if (this.currency_list[i].currency === currency) {
                return this.currency_list[i]
            }
        }
    },
    set: function (currencyList) {
        if (!currencyList || currencyList.length <= 0) return
        for (var i = 0; i < currencyList.length; i++) {
            var currencyObj = currencyList[i]
            if (currencyObj.currency_list) {
                setToArray(currencyObj.currency_list, this.currency_list, 'currency')
            }
        }
    },
    setInfo: function (currencyInfo) {
        if (!currencyInfo) return
        this.currencyMode = currencyInfo.currencyMode
        this.base_currency = currencyInfo.baseCurrency
        this.set(currencyInfo.currencList)
    }
}

var AccountMgr = {
    current_account: '',
    account_list: [],
    account_info_list: {},
    account_balance_list: [],
    BCAN: [],
    callbackList: [],
    get: function (account, currency) {
        var accountObj = _.find(this.account_balance_list, function (a) {
            return a.account === account && a.currency === currency
        })
        var baseAccountObj = _.find(this.account_balance_list, function (a) {
            return a.account === account && a.currency === null
        })
        if (baseAccountObj && currency && CurrencyMgr.currencyMode === 'single') {
            var cloneAccountObj = {}
            $.extend(cloneAccountObj, baseAccountObj.data)
            for (var p in cloneAccountObj) {
                if (typeof cloneAccountObj[p] === 'number' && cloneAccountObj[p] != Number.NaN) {
                    if (CurrencyMgr.get(currency)) {
                        cloneAccountObj[p] = cloneAccountObj[p] / (CurrencyMgr.get(currency).ratio || 1)
                    }
                }
            }
            return cloneAccountObj
        } else {
            return accountObj ? accountObj.data : (baseAccountObj ? baseAccountObj.data : null)
        }
    },
    set: function (accountDataList) {
        if (!accountDataList || accountDataList.length <= 0) return
        for (var i = 0; i < accountDataList.length; i++) {
            var obj = accountDataList[i]
            if (obj[1120]) {
                obj.interestAccrualWithDate = obj[1120]
                if (obj[1121] && !isNaN(obj[1121])) {
                    var d = moment((obj[1121] - 25569) * 24 * 60 * 60 * 1000).format('DDMMM')   // 25569 = 1970.01.01 - 1899.12.30
                    obj.interestAccrualWithDate += '({0})'.format(d)
                }
            }
            var balanceObj
            if (typeof obj.account_list !== 'undefined') {
                this.account_list = obj.account_list
                this.account_info_list = obj.account_info_list
                this.account_multi_currency_CB = obj.account_multi_currency_CB
            } else {
                balanceObj = { _id: obj[10] + '#' + obj[23], account: obj[10], currency: obj[23], base: CurrencyMgr.base_currency, data: obj }
                setToArray([balanceObj], this.account_balance_list, '_id')
            }
            for (var j = 0; j < this.callbackList.length; j++) {
                var cb = this.callbackList[j]
                cb({
                    account_list: obj.account_list,
                    account_info_list: obj.account_info_list,
                    account_multi_currency_CB: obj.account_multi_currency_CB,
                    balance: balanceObj
                })
            }
        }
    },
    setAcctInfo: function (info) {
        if (!info) return
        this.account_list = info.accounts || []
        this.account_info_list = info.accountsInfo
        this.account_multi_currency_CB = info.accountMultiCurrencyCB
        this.BCAN = info.BCAN
        for (var j = 0; j < this.callbackList.length; j++) {
            var cb = this.callbackList[j]
            cb({
                account_list: this.account_list,
                account_info_list: this.account_info_list,
                account_balance_list: this.account_balance_list
            })
        }
    },
    updateAcctInfo: function () {
        for (var i = 0; i < this.account_balance_list.length; i++) {
            var balanceObj = this.account_balance_list[i]
            balanceObj = balanceObj.data
            var account = balanceObj[10]
            var unrealizedPL = 0
            var realizedPL = 0
            var totalBuy = 0
            var totalSell = 0
            var marketValue = 0
            var acceptValue = 0
            var hasMarketValueFlag = false
            var hasAcceptValueFlag = false
            var positions = PositionMgr.get()
            for (var j = 0; j < positions.length; j++) {
                var positionObj = positions[j]
                if (positionObj[10] !== balanceObj[10]) continue
                var ratio = 0
                if (balanceObj[23]) {
                    if (balanceObj[23] == positionObj[23]) {
                        ratio = 1
                    }
                } else {
                    var currencyObj = CurrencyMgr.get(positionObj[23])
                    ratio = currencyObj ? currencyObj.ratio : 1
                }
                unrealizedPL += (positionObj.unrealizedPL || 0) * ratio
                realizedPL += (positionObj.realizedPL || 0) * ratio
                marketValue += (positionObj.marketValue || 0) * ratio
                acceptValue += (positionObj.acceptValue || 0) * ratio
                if (positionObj.trades) {
                    for (var p in positionObj.trades) {
                        var trade = positionObj.trades[p]
                        if (trade.voucherType === 'security') continue
                        if (trade[tags.side] == 0) {
                            totalBuy += trade[tags.price] * trade[tags.quantity] * ratio
                        } else if (trade[tags.side] == 1) {
                            totalSell += trade[tags.price] * trade[tags.quantity] * ratio
                        }
                    }
                }
                if (!hasMarketValueFlag && !isNaN(positionObj.marketValue)) {  // all market value is NaN, account's market value should be NA
                    hasMarketValueFlag = true
                }
                if (!hasAcceptValueFlag && !isNaN(positionObj.acceptValue)) {
                    hasAcceptValueFlag = true
                }
            }
            balanceObj.cashBalance = balanceObj[initial_data.keyTags.cashBalance] || 0
            balanceObj.tradingLimit = balanceObj[initial_data.keyTags.tradingLimit] || 0
            balanceObj.marketValue = marketValue
            balanceObj.acceptValue = acceptValue
            balanceObj.unrealizedPL = unrealizedPL
            balanceObj.realizedPL = realizedPL
            balanceObj.totalBuy = totalBuy
            balanceObj.totalSell = totalSell
            balanceObj.totalNet = balanceObj.totalSell - balanceObj.totalBuy
            balanceObj['-totalNet'] = -balanceObj.totalNet
            balanceObj.totalBuySell = Math.abs(balanceObj.totalBuy) + Math.abs(balanceObj.totalSell)
            balanceObj.totalPortfolioValue = balanceObj.cashBalance + marketValue
            balanceObj.netAssetValue = balanceObj.totalPortfolioValue
            if (initial_data.bankBalanceMode) {  // v1.3.5  ), if Trading Limit >= 0 then Net Asset Value = Bank Balance + Trading Limit, else Net Asset Value = Bank Balance
                if (balanceObj.tradingLimit >= 0) {
                    balanceObj.netAssetValue = (balanceObj.tradingLimit + (balanceObj.bankBalance || 0)) || 0
                } else {
                    balanceObj.netAssetValue = balanceObj.bankBalance || 0
                }
            }
            if (!hasMarketValueFlag) {
                balanceObj.marketValue = Number.NaN
            }
            if (!hasAcceptValueFlag) {
                balanceObj.acceptValue = Number.NaN
            }
        }
    },
    on: function (cb) {
        if (typeof cb !== 'function') return
        cb({
            account_list: this.account_list,
            account_info_list: this.account_info_list,
            account_balance_list: this.account_balance_list
        })
        this.callbackList = this.callbackList || []
        this.callbackList.push(cb)
    }
}

var ProductMgr = {
    products: {},
    get: function (code, callback) {
        if (!code) return
        callback = callback || function () { }
        var that = this
        if (this.products[code]) {
            return callback(this.products[code])
        } else {
            $.get('/iTrader/product?symbol=' + code, function (result) {
                var data = result.data
                if (data && data[0]) {
                    that.products[data[0]] = data
                    return callback(data)
                } else {
                    return callback()
                }
            })
        }
    }
}

var SpreadMgr = {
    spreadList: {},
    set: function (spreads) {
        if (!spreads || spreads.length <= 0) return
        for (var i = 0; i < spreads.length; i++) {
            var spread = spreads[i]
            if (spread[0] && spread[73]) {
                this.spreadList[spread[0]] = spread[73].split(',')
            }
        }
    },
    getSpreadValue: function (options, price) {
        var spreadValue = ''
        var displayRatio = 1
        var name = ''
        if (typeof options === 'object') {
            name = options[73] || options.spread
            displayRatio = options[1504] || options.displayRatio || 1
        } else if (typeof options === 'string') {
            name = options
        }
        price = price / displayRatio
        var spreadArray = this.spreadList[name]
        if (spreadArray) {
            for (var i = 0; i < spreadArray.length; i = i + 2) {
                if (Number(spreadArray[i]) > price) {
                    spreadValue = spreadArray[i + 1]
                    break
                }
            }
            spreadValue = spreadValue || spreadArray[spreadArray.length - 1] || 0.001
        }
        return Number(spreadValue * displayRatio).toString()
    },
    getSpreadPrecision: function (name, price) {
        var spreadValue = this.getSpreadValue(name, price)
        if (spreadValue) {
            spreadValue = Number(spreadValue).toString()
            return spreadValue.length - spreadValue.indexOf('.') - 1
        }
        return 3
    },
}

var MarginMgr = {
    marginList: [],
    callbackList: [],
    get: function (account, symbol) {
        return _.find(this.marginList, function (o) {
            return o[tags.symbol] === symbol && o[tags.account] === account
        })
    },
    set: function (marginObj) {
        if (!marginObj) return
        if (marginObj[tags.symbol] && marginObj[tags.account]) {
            _.remove(this.marginList, function (o) {
                return o[tags.symbol] === marginObj[tags.symbol] && o[tags.account] === marginObj[tags.account]
            })
            this.marginList.push(marginObj)
        }
        return marginObj
    },
}

function setToArray(srcData, destData, key) {
    if (!srcData || !destData) return
    for (var i = 0; i < srcData.length; i++) {
        var idx = -1
        for (var j = 0; j < destData.length; j++) {
            if (key && destData[j][key] == srcData[i][key]) {
                idx = j
            }
        }
        if (idx >= 0) {
            destData[idx] = srcData[i]
        } else {
            destData.push(srcData[i])
        }
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

{ $Id: rules.js,v 1.4 2017/11/06 09:34:03 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

if (jQuery && jQuery.validator) {
    jQuery.validator.addMethod('notEqualTo', function (value, element, param) {
        return value != $(param).val()
    }, $.validator.format('cannot be the same'))
}

var rules = {
    name: "required",
    username: {
        required: true
    },
    password: {
        required: true
    },
    pin: {
        required: true,
        maxlength: 1
    },
    new_password: {
        required: true,
        remote: {
            url: '/iTrader/security/password/validate',
            type: 'post',
            data: {
                _csrf: function () {
                    return $('[name=new_password]').closest('form').find('[name=_csrf]').val()
                },
                sessionID: function () {
                    return $('[name=new_password]').closest('form').find('[name=sessionID]').val()
                },
                mode: 1
            }
        }
    },
    confirm_password: {
        required: true,
        equalTo: '[name=new_password]'
    },
    email: {
        required: true,
        email: true
    },
    amount: {
        required: true,
        number: true
    },
    account_in: {
        required: true,
        notEqualTo: '#cash-transfer-account-out'
    },
    account_out: {
        required: true,
        notEqualTo: '#cash-transfer-account-in'
    }
}

var exchangeRules = {
    default: function (value, options) {
        return this.handleOptions(value, options)
    },
    zerofill: function (value, options) {
        if (value && options && typeof (options.size) === 'number') {
            if (!isNaN(value)) {
                value = value.toString()
                while (value.length < options.size) {
                    value = '0' + value
                }
            }
        }
        return this.handleOptions(value, options)
    },

    suffix: function (value, options) {
        if (value && options) {
            if (options.suffix && !value.toUpperCase().endWith(options.suffix.toUpperCase())) {
                value += options.suffix
            }
        }
        return this.handleOptions(value, options)
    },

    handleOptions: function (value, options) {
        if (options.case === 'upper') {
            value = value.toUpperCase()
        } else if (options.case === 'lower') {
            value = value.toLowerCase()
        }
        return value
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

{ $Id: dialog.js,v 1.11 2016/11/22 10:25:18 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

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
            default:
                break
        }
        if (button.id) {
            buttons.push(button)
        }
    }
    return buttons
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

{ $Id: settlement.js,v 1.12 2018/01/19 10:00:22 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var settlement_form
var accountInfoList = {}
var bankDetailList = {}
var imageFile
var account
var element_method
var settlement_input_symbolCode
var payment_input
var swiftCode
var withBalance
var xQuantity
var scrip
var settlementWarningMessage
function Settlement_Initialize() {
    settlement_form = $('#settlement-form')
    settlement_input_symbolCode = $('.productCode')
    account = AccountMgr.current_account
    payment_input = $('[name=payment_input]')
    swiftCode = $('.cd-swift-code')
    withBalance = $('.with-balance')
    xQuantity = $('[name=x_quantity]')
    scrip = $('[name=scrip]')
    settlementWarningMessage = $('#settlement-warning-message')
    $.get('/iTrader/message/detail', function (options) {
        accountInfoList = options.accountInfoList
        bankDetailList = options.bankDetailList
        imageFile = options.imageFile
        if (!imageFile) {
            $('.visible-CD-CQE').remove()
            $('.visible-CDE').remove()
        }
        var acctObj = accountInfoList[account]
        for (var i in acctObj) {
            var acctName = acctObj[i][0]
            var acctID = acctObj[i][1]
            $('.cw-select-bank').append($('<option>', { 'value': acctName, text: acctName }))
        }
        for (var k in bankDetailList) {
            var bankData = bankDetailList[k]
            $('.cd-bank-name').append($('<option>', { 'value': bankData[0], text: bankData[0] }))
        }
        $('[name=payment_type]').change(function () {
            if ($(this).val() == 'DVP') {
                payment_input.removeAttr('readonly')
                payment_input.attr('required', 'required')
            } else {
                payment_input.attr('readOnly', 'readOnly')
                payment_input.removeAttr('required')
                $(this).parents('.has-error').removeClass('has-error')
                payment_input.val('')
            }
        })
        settlement_input_symbolCode.on('input', function () {
            $(this).val($(this).val().toUpperCase())
        })
        settlement_input_symbolCode.blur(function () {
            var instruction = $("input:radio[name='instruction']:checked").val()
            var selected_method = $("input:radio[name='method']:checked").val()
            var that = this
            $(that).val(applyProductRule($(that).val()))
            var code = $(that).val()
            $('.sd-productName').val('')
            $('.si-productName').val('')
            $('.si-holding').val('')
            $('.pw-productName').val('')
            $('.pw-holding').val('')
            $.get('/iTrader/product?symbol=' + code + '&ISINCode=1', function (result) {
                var data = result.data
                if (data) {
                    var productName = data['symbolName']
                    var symbol = data[0]
                    var holding = GetMaxSellSync(symbol)
                    $(that).val(symbol)
                    if (instruction == 'SD') {
                        $('.sd-productName').val(productName)
                    } else {
                        if (IsOTCBond(data) || IsOTCFund(data)) {
                            settlementWarningMessage.text(messages.settlement_product_warning.text)
                            return
                        }
                        if (selected_method == 'SI') {
                            $('.si-productName').val(productName)
                            $('.si-holding').val($._format.quantity(holding))
                        } else {
                            $('.pw-productName').val(productName)
                            $('.pw-holding').val($._format.quantity(holding))
                        }
                    }
                    settlementWarningMessage.text('')
                } else {
                    settlementWarningMessage.text(messages.settlement_product_warning.text)
                }
            })
        })
        $('.cw-currency').change(function () {
            var currency = $(this).find('option:selected').val()
            var acctObj = AccountMgr.get(account, currency)
            if (currency) {
                if (CurrencyMgr.currencyMode === 'multi' && acctObj[23] != currency) {
                    acctObj[700] = 0
                }
                if (acctObj[700] || acctObj[700] === 0) {
                    withBalance.text(currency + ' ' + $._format.amount(acctObj[700]))
                    withBalance.parents('.detail').removeClass('hidden')
                } else {
                    withBalance.parents('.detail').addClass('hidden')
                }
            }
        })

        $('.cd-currency').change(function () {
            var currency = $(this).find('option:selected').val()
            var acctObj = AccountMgr.get(account, currency)
            var cashBalanceTag = initial_data.keyTags.cashBalance
            var tradingLimitTag = initial_data.keyTags.tradingLimit
            if (CurrencyMgr.currencyMode === 'multi' && acctObj[23] != currency) {
                acctObj[cashBalanceTag] = 0
            }
            $('.cashBalance').text(currency + ' ' + $._format.amount(acctObj[cashBalanceTag]))
            $('.pur-stock').text(currency + ' ' + $._format.amount(acctObj[tradingLimitTag]))
            if (acctObj[1206] || acctObj[1206] === 0) {
                $('.pur-fullTrade').text(currency + ' ' + $._format.amount((acctObj[1206])))
                $('.pur-fullTrade').parents('.help-block').removeClass('hidden')
            } else {
                $('.pur-fullTrade').parents('.help-block').addClass('hidden')
            }
        })

        $('.cw-select-bank').change(function () {
            var acctName = $(this).find('option:selected').val()
            if (accountInfoList[account]) {
                var acctID = accountInfoList[account][acctName][1]
                $('.cw-bank-number').val(acctID)
            }
        })
        $('.cd-bank-name').change(function () {
            var bankAliasName = $(this).find('option:selected').val()
            var bankData = bankDetailList[bankAliasName]
            if (!bankData) return
            var bankName = ''
            var lang = $('html').attr('lang')
            if (lang == 'en-US') {
                bankName = bankData[4]
            } else if (lang == 'zh-CN') {
                bankName = bankData[5]
            } else {
                bankName = bankData[6]
            }
            $('.cd-alias-name').text(bankName)
            if (bankData[1]) {
                swiftCode.text(bankData[1])
                swiftCode.parent().removeClass('hidden')
            } else {
                swiftCode.parent().addClass('hidden')
            }
            $('.cd-ac-number').text(bankData[2])
            $('.cd-ac-name').text(bankData[3])
        })
        scrip.change(function () {
            if ($(this).val()) {
                xQuantity.attr('required', true)
            } else {
                xQuantity.attr('required', false)
            }
        })
        xQuantity.change(function () {
            if ($(this).val()) {
                scrip.attr('required', true)
            } else {
                scrip.attr('required', false)
            }
        })
    })
    $(".form-datetime").datepicker({
        format: "dd/mm/yyyy",
        autoclose: true,
        startDate: "today",
        todayHighlight: true,
    })
    $($('[name=instruction]')[0]).attr('checked', true)
    SettlementSelectChanged()

    $('[name=instruction]').change(function () {
        var selected_method = $("input:radio[name='method']:checked")
        if (selected_method && selected_method.length > 0) {
            selected_method.attr('checked', false)
        }
        SettlementSelectChanged()
    })

    $('[name=method]').change(function () {
        SettlementSelectChanged()
    })

    // $('.input-amount').each(function () {
    //     $(this).InputFormat({
    //         format: function (value) {
    //             return $._format.quantity(value)
    //         }
    //     })
    // })

    settlement_form.translate()
}

function applyProductRule(value) {
    if (initial_data.exchange_rule && initial_data.exchange_rule.SEHK) {
        var ruleObj = initial_data.exchange_rule.SEHK
        ruleObj.rule = ruleObj.rule || 'default'
        if (ruleObj.rule && exchangeRules[ruleObj.rule]) {
            value = exchangeRules[ruleObj.rule](value, ruleObj.options)
        }
    }
    return value
}

function SettlementSelectChanged() {
    settlementWarningMessage.text('')
    $('.settlement_method').each(function () {
        $(this).addClass('hidden')
    })
    $('.settlement_detail').each(function () {
        $(this).addClass('hidden')
    })
    $('.special_detail').each(function () {
        $(this).addClass('hidden')
    })
    var selected_instruction = $("input:radio[name='instruction']:checked")
    if (selected_instruction && selected_instruction.length > 0) {
        $('#settlement_method_' + selected_instruction.val()).removeClass('hidden')
        var selected_method = $("input:radio[name='method']:checked")
        if (selected_method && selected_method.length > 0) {
            element_method = $('#settlement_detail_' + selected_instruction.val() + '_' + selected_method.val())
            if ((!element_method || element_method.length <= 0)) {
                if (selected_method.val().indexOf('E') > -1 && selected_instruction.val() == 'CD') {
                    element_method = $('#settlement_detail_CDE')
                }
            }
            if (!element_method || element_method.length <= 0) {
                element_method = $('#settlement_detail_' + selected_instruction.val())
            }
            if (!element_method || element_method.length <= 0) {
                element_method = $('#settlement_detail_SD_SW_' + selected_method.val())
            }
            if (!element_method || element_method.length <= 0) {
                element_method = $('#settlement_detail_CD_CW')
            }
            if (!element_method || element_method.length <= 0) {
                element_method = $('#settlement_detail_SD_SW')
            }
            element_method.removeClass('hidden')
        }
        $('.cd-currency').trigger('change')
        $('.cw-select-bank').trigger('change')
        $('.cw-currency').trigger('change')
        $('.cd-bank-name').trigger('change')
        $($(element_method).find('.visible-' + selected_instruction.val() + '-' + selected_method.val())).removeClass('hidden')
    }
}

function fileChange(target) {
    if (!target.value) return
    var filetypes = [".jpg", ".jpeg", ".png"]
    var filepath = target.value
    settlementWarningMessage.text('')
    if (filepath) {
        var isnext = false
        var fileend = filepath.substring(filepath.indexOf("."))
        if (filetypes && filetypes.length > 0) {
            for (var i = 0; i < filetypes.length; i++) {
                if (filetypes[i].toUpperCase() == fileend.toUpperCase()) {
                    isnext = true
                    break
                }
            }
        }
        if (!isnext) {
            settlementWarningMessage.text(messages.settlement_file_check.text)
            target.value = ""
            return false
        }
    } else {
        return false
    }
}

function SettlementInstruction() {
    showMessage({
        title: messages.settlement_instruction_title.text,
        closeByBackdrop: false,
        load: {
            url: '/iTrader/message/settlement', callback: function () {
                Settlement_Initialize()
            }
        },
        buttonNameList: ['submit', 'reset', 'close'],
        callback: function (button, dialog) {
            if (button.name === 'submit') {
                var amount = element_method.find('[name=amount]').val().replace(/,/g, '')
                var scrip = element_method.find('[name=scrip]').val()
                var xQuantity = element_method.find('[name=x_quantity]').val()
                if (amount && scrip && xQuantity && amount != scrip * xQuantity) {
                    settlementWarningMessage.text(messages.settlement_SW_check.text)
                    return
                }
                settlementWarningMessage.text('')
                validateForm(settlement_form, {
                    submitHandler: function (form) {
                        var formData = new FormData(settlement_form[0])
                        formData.append('account', account)
                        dialog.close()
                        $.ajax({
                            type: 'post',
                            url: '/iTrader/message/settlement',
                            data: formData,
                            cache: false,
                            processData: false,
                            contentType: false,
                            success: function (result) {
                                if (result) {
                                    if (result.error) {
                                        handleError(result.error)
                                    } else {
                                        alertMessage({ message: messages.settlement_message_success.text + result.data.messageRefId })
                                    }
                                } else {
                                    handleError()
                                }
                            },
                            error: handleError
                        })
                    },
                    validClass: ''
                })
                if (settlement_form.valid()) {
                    if (button.text() === messages.btn_submit.text) {
                        button.text(messages.btn_sure.text)
                        $('#settlement-form .alert').removeClass('hidden')
                        $('#settlement-form :input').attr("disabled", "disabled")
                        var btn_1 = dialog.getButton('btn-reset')
                        if (btn_1 && btn_1.length > 0) {
                            btn_1.text(messages.btn_cancel.text)
                        }
                    } else if (button.text() === messages.btn_sure.text) {
                        $('#settlement-form .hidden').remove()
                        $('#settlement-form :input').removeAttr("disabled")
                        settlement_form.submit()

                        dialog.close()
                    }
                }
            }
            else if (button.name === 'reset') {
                if (button.text() === messages.btn_reset.text) {
                    document.getElementById("settlement-form").reset()
                    $('[name=instruction]').trigger('change')
                    $('[name=method]').trigger('change')
                    settlement_form.find('.has-success, .has-error').each(function () {
                        $(this).removeClass('has-success').removeClass('has-error')
                    })
                } else if (button.text() === messages.btn_cancel.text) {
                    $('#settlement-form .alert').addClass('hidden')
                    $('#settlement-form :input').removeAttr("disabled")
                    var btn_1 = dialog.getButton('btn-reset')
                    if (btn_1 && btn_1.length > 0) {
                        btn_1.text(messages.btn_reset.text)
                    }
                    var btn_2 = dialog.getButton('btn-submit')
                    if (btn_2 && btn_2.length > 0) {
                        btn_2.text(messages.btn_submit.text)
                    }
                }
            } else if (button.name === 'close') {
                dialog.close()
            }
        }
    })
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

{ $Id: cash_transfer.js,v 1.8 2017/05/22 09:28:53 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var cash_transfer_form
function CashTransferChanged() {
    var accountData = AccountMgr.get($('#cash-transfer-account-out').val(), $('#cash-transfer-currency').val())
    $('#cash-transfer-available-amount').text('')
    $('#cash-transfer-available-amount').text($._format.amount(accountData ? accountData[tags.cashBalance] : 0))
    cash_transfer_form.translate()
}

function InitializeCashTransfer() {
    cash_transfer_form = $('#cash-transfer-form')
    $('#cash-transfer-currency').change(function () {
        CashTransferChanged()
    })
    $('#cash-transfer-account-out').change(function () {
        CashTransferChanged()
    })
}

function TransferCash() {
    showMessage({
        title: messages.cash_transfer_title.text,
        load: {
            url: '/iTrader/account/transfer', callback: function () {
                InitializeCashTransfer()
                CashTransferChanged()
            }
        },
        buttonNameList: ['submit', 'reset'],
        callback: function (button, dialog) {
            if (button.name === 'submit') {
                validateForm(cash_transfer_form, {
                    submitHandler: function (form) {
                        $.ajax({
                            type: 'post',
                            url: '/iTrader/account/transfer',
                            data: cash_transfer_form.serialize(),
                            success: function (result) {
                                if (result.error) {
                                    handleError(result.error)
                                } else {
                                    alertMessage({ message: messages.cash_transfer_success_message.text })
                                }
                            },
                            error: handleError
                        })
                    },
                    validClass: ''
                })
                if (cash_transfer_form.valid()) {
                    if (button.text() === messages.btn_submit.text) {
                        button.text(messages.btn_sure.text)
                        $('#cash-transfer-form .alert').removeClass('hidden')
                        $('#cash-transfer-form :input').attr("disabled", "disabled")
                        var btn_1 = dialog.getButton('btn-reset')
                        if (btn_1 && btn_1.length > 0) {
                            btn_1.text(messages.btn_cancel.text)
                        }
                    } else if (button.text() === messages.btn_sure.text) {
                        $('#cash-transfer-form .hidden').remove()
                        $('#cash-transfer-form :input').removeAttr("disabled")
                        cash_transfer_form.submit()
                        dialog.close()
                    }
                }
            } else if (button.name === 'reset') {
                if (button.text() === messages.btn_reset.text) {
                    document.getElementById("cash-transfer-form").reset()
                    cash_transfer_form.find('.has-success, .has-error').each(function () {
                        $(this).removeClass('has-success').removeClass('has-error')
                    })
                } else if (button.text() === messages.btn_cancel.text) {
                    $('#cash-transfer-form .alert').addClass('hidden')
                    $('#cash-transfer-form :input').removeAttr("disabled")
                    button.text(messages.btn_reset.text)
                    var btn_2 = dialog.getButton('btn-submit')
                    if (btn_2 && btn_2.length > 0) {
                        btn_2.text(messages.btn_submit.text)
                    }
                }
            }
        }
    })
}