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