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

{ $Id: user.js,v 1.21 2018/03/09 10:16:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var login_form
var login_username
var login_password
var login_submit
var login_alert
var login_alert_message
var pinArray
var sessionObj
var resendTimer
var tokenCode
var isNewMode = false
var isSecondaryType = false
var currentTokenType
var sessionID
var reqOTPData
$(function () {
    $.get('/iTrader/initialize/tags', function (data) {
        tags = data
        InitializeLogin()
        var errorCode = $('#login-error-code').val()
        if (errorCode) {
            handleError(errorCode, function () {
                window.location.href = '/'
            })
        }
    })
})

function InitializeLogin() {
    login_form = $('#login-form')
    login_username = $('#login-username')
    login_password = $('#login-password')
    login_submit = $('#login-submit')
    login_alert = $('#login-alert')
    login_alert_message = $('#login-message')
    validateForm(login_form, {
        submitHandler: function (form) {
            var type = login_submit.val()
            if (type === 'pin') {
                VerifyPIN()
            } else if (type === 'token') {
                VerifyToken()
            } else if (type === 'requestOTP') {
                var phonemail = $('#phonemail-listCode')
                var contSelect = phonemail.find('select')
                var value = contSelect.find("option:selected").val()
                contSelect.change(function () {
                    value = $(this).val()
                })
                HandleRequest(value)
            } else {
                Login()
            }
        },
    })
    ForgetPassword()
    login_username.InputAutoUpper()
    InitializePin()
    $(document).translate()
}

function InitializePin() {
    $('.pin-input').keypress(function () {
        setTimeout(function () {
            $('.pin-input.active').each(function () {
                if (!$(this).val()) {
                    $(this).focus()
                    return false
                } else if ($(this).val().length > 1) {
                    var value = $(this).val()
                    $(this).val(value.substr(value.length - 1, 1))
                }
            })
        }.bind(this), 1)
    })
    $('.pin-input').focus(function () {
        $(this).val('')
    })
}

function Login() {
    login_submit.attr('disabled', 'disabled')
    getClientIP(function (ip, location) {
        $.ajax({
            type: 'post',
            url: '/iTrader/user/login',
            data: login_form.serialize() + (ip ? '&clientIP=' + ip : '') + (location ? '&location=' + location : ''),
            success: function (result) {
                login_submit.removeAttr('disabled')
                if (result) {
                    if (result.error) {
                        var errObj = result.error
                        var code = errObj[tags.errorCode] || errObj[tags.minorCode] || errObj.errorCode
                        var message = messages.error['SSMITSERR_' + code] || messages.error[code] || errObj[tags.freeText]
                        if (errObj.sessionID) {
                            seajs.use('password', function (pwd) {
                                pwd.change({ sessionID: errObj.sessionID }, function (res) {
                                    login_password.val(res.password)
                                    login_form.submit()
                                })
                            })
                        } else {
                            login_alert.removeClass('hidden')
                            login_alert_message.text(message)
                            $('.captcha-group img').trigger('click')
                        }
                    } else {
                        if (result && result.data) {
                            sessionObj = result.data
                            if (sessionObj['130'] && sessionObj['130'] == '0') {
                                console.log(sessionObj)
                                seajs.use('dialog', function (dialog) {
                                    dialog.showMessage({
                                        title: messages.login_2FA_registration_title.text,
                                        closable: false,
                                        closeByBackdrop: false,
                                        closeByKeyboard: false,
                                        buttonNameList: ['relogin', 'resend'],
                                        message: function () {
                                            var box = $('<div>', { class: "col-lg-12 col-md-12 col-xs-12" })
                                            var msg = $('<p>', { class: "" })
                                            msg.append(messages.login_2FA_registration_message_eBrokerKey.text.format(maskEmailPhone(sessionObj['81'])))
                                            var sendP = '<p>' + messages.login_2FA_registration_message_time.text.format(maskEmailPhone(sessionObj['131'])) + '</p>'
                                            msg.append(sendP)
                                            box.append(msg)
                                            return box
                                        },
                                        callback: function (button) {
                                            if (button.name === 'relogin') {
                                                window.location.href = '/iTrader/user/logout'
                                            }
                                            if (button.name === 'resend') {
                                                seajs.use('cregistrationFA', function (dialog) {
                                                    dialog.InitResendBtn(sessionObj.sessionID)
                                                })
                                            }
                                        }
                                    })
                                })
                            }
                            var tokenType = sessionObj['78']
                            if (!tokenType) {
                                isNewMode = false
                                if (sessionObj['116']) {
                                    HandlePINToken()
                                } else {
                                    PassLogin()
                                }
                            } else {
                                isNewMode = true
                                switchTo(tokenType)
                            }
                        }
                    }
                }
            },
            error: function (err, callback) {
                login_submit.removeAttr('disabled')
                handleError(err, callback)
            }
        })
    })
}

function HandlePINToken() {
    PassOneStep()
    login_alert.addClass('hidden')
    login_alert_message.text('')
    login_submit.text(messages.login_btn_pin.text)
    login_submit.val(isNewMode ? 'token' : 'pin')
    var container = $('#verify-pin')
    container.removeClass('hidden')
    pinArray = sessionObj['116'].split(',')
    $('.pin-help-text').each(function () {
        $(this).text($(this).text())
    })
    for (var i = 0; i < pinArray.length; i++) {
        var position = Number(pinArray[i]) - 1
        $($('.pin-input')[position]).addClass('active').removeAttr('disabled').css('visibility', 'visible')
        $($('.pin-help-text')[position]).css('visibility', 'visible')
    }
    $('.pin-input.active:first').focus()
    TransformTokenType(container)
}

function HandleEmailToken() {
    var flag = 300
    var phonemailList = []
    for (var i = 200; i < flag; i++) {
        if (!sessionObj[i]) continue
        phonemailList.push(sessionObj[i])
    }
    if (phonemailList.length > 1) {
        HandleMultiToken(phonemailList)
    } else {
        PassOneStep()
        login_submit.text(messages.login_btn_email.text)
        login_submit.val('token')
        var container = $('#verify-email-code')
        tokenCode = container.find('input')
        if (sessionObj && sessionObj['81']) {
            $('#login-email-address').text('({0})'.format(maskEmailPhone(sessionObj['81'])))
        }
        InitResendOTP(container)
        TransformTokenType(container)
    }
}

function HandleMultiToken(phonemailList) {
    var phonemail = $('#phonemail-listCode')
    var loginBtn = $('#login-submit')
    var contSelect = phonemail.find('select')
    loginBtn.addClass('requestOTP')
    loginBtn.val('requestOTP')
    loginBtn.text(messages.login_btn_requestOTP.text)
    phonemail.removeClass('hidden')
    contSelect.empty()
    for (var p in phonemailList) {
        contSelect.append("<option value='" + phonemailList[p] + "'>" + maskEmailPhone(phonemailList[p]) + "</option>")
    }
}

function HandleSMSToken() {
    var flag = 300
    var phonemailList = []
    for (var i = 200; i < flag; i++) {
        if (!sessionObj[i]) continue
        phonemailList.push(sessionObj[i])
    }
    if (phonemailList.length > 1) {
        HandleMultiToken(phonemailList)
    } else {
        PassOneStep()
        login_submit.text(messages.login_btn_sms.text)
        login_submit.val('token')
        var container = $('#verify-SMS-code')
        tokenCode = container.find('input')
        if (sessionObj && sessionObj['81']) {
            $('#login-phone-number').text('({0})'.format(maskEmailPhone(sessionObj['81'])))
        }
        InitResendOTP(container)
        TransformTokenType(container)
    }

}

function HandleRequest(value) {
    if (!value) return
    var requestOTPData = {
        tokenType: sessionObj[78] || '',
        sessionID: sessionObj.sessionID,
        valueBak: value
    }
    $('#phonemail-listCode').addClass('hidden')
    PassOneStep()
    login_submit.text(messages.login_btn_token.text)
    login_submit.val('token')
    var em = value.indexOf('@')
    if (em > -1) {
        requestOTPData.notifyNumber = value
        var container = $('#verify-email-code')
        tokenCode = container.find('input')
        $('#login-email-address').text('({0})'.format(maskEmailPhone(value)))
    } else {
        var idx = value.indexOf('-')
        requestOTPData.countryCode = value.substr(0, idx)
        requestOTPData.notifyNumber = value.substr(idx + 1)
        var container = $('#verify-SMS-code')
        tokenCode = container.find('input')
        $('#login-phone-number').text('({0})'.format(maskEmailPhone(value)))
    }
    reqOTPData = requestOTPData
    requestOTP()
    InitResendOTP(container)
}

function requestOTP() {
    if (reqOTPData) {
        $.ajax({
            type: 'post',
            url: '/iTrader/security/requestOTP',
            data: reqOTPData,
            success: function (result) {
                $('.login-messageid').text('')
                $('.login-sendtime').text('')
                $('.login-phone-resendtime').text('')
                if (result && result.data) {
                    if (result.data[33]) {
                        $('.login-sendtime').text(messages.login_verify_SMS_remark_time.text + ' ({0})'.format(result.data[33]))
                    }
                    if (result.data[90]) {
                        $('.login-resendtime').text(messages.login_verify_SMS_remark_resendtime.text + ' ({0})'.format(result.data[90]))
                        if (Number(result.data[90]) <= 0) {
                            $('.resend-btn').css('cursor', 'not-allowed').attr('disabled', 'disabled')
                        }
                    }

                    if (result.data[91]) {
                        $('.login-messageid').text(messages.login_verify_SMS_remark_messageid.text + ' ({0})'.format(result.data[91]))
                    }
                } else {
                    if (result && result.error && result.error[39]) {
                        result.error[39] = 'SSMITSERR_' + result.error[39]
                    }
                    handleError(result.error)
                }

            },
            error: handleError
        })
    }

}

function TransformTokenType(container) {
    if (!container) return
    if (!Number(sessionObj[85])) return
    if (sessionObj[85] === sessionObj[78]) return
    var secondTokenType
    if (!isSecondaryType) {
        secondTokenType = sessionObj[85]
    } else {
        secondTokenType = sessionObj[78]
    }
    container.find('.isTransForm').remove()
    if (!messages['login_swichTokenType_' + secondTokenType] || !messages['login_swichTokenType_' + secondTokenType].text) return
    var secondaryLink = $('<a>', { text: messages['login_swichTokenType_' + secondTokenType].text, href: 'javascript:void(0)', class: 'blue-link isTransForm', 'secondTokenType': secondTokenType })
    container.find('p').append(secondaryLink)
    secondaryLink.click(function () {
        clearInterval(resendTimer)
        if (isSecondaryType) {
            isSecondaryType = false
        } else {
            isSecondaryType = true
        }
        container.addClass('hidden')
        currentTokenType = secondaryLink.attr('secondTokenType')
        switchTo(currentTokenType)
        ResendOTP()
    })
}

function InitResendOTP(container) {
    clearInterval(resendTimer)
    var interval = 5//Number(sessionObj['80'])
    container.removeClass('hidden')
    if (interval) {
        container.find('.resend-btn').text(messages.login_resend_code.text + '({0}s)'.format(interval)).removeAttr('ready')
        resendTimer = setInterval(function () {
            interval--
            if (interval <= 0) {
                container.find('.resend-btn').text(messages.login_resend_code.text).attr('ready', true)
            } else {
                container.find('.resend-btn').text(messages.login_resend_code.text + '({0}s)'.format(interval)).removeAttr('ready')
            }
        }, 1000)
    }
    container.find('.resend-btn').click(function () {
        if ($(this).attr('ready') && $(this).attr('disabled') !== 'disabled') {
            $(this).removeAttr('ready')
            ResendOTP()
            InitResendOTP(container)
        }
    })
}

function ResendOTP() {
    if (currentTokenType == '2' || currentTokenType == '3') {
        var postData
        if (isSecondaryType) {
            postData = GetPostData({ secondTokenType: sessionObj[85] })
        } else {
            postData = GetPostData()
        }
        $.ajax({
            type: 'post',
            url: '/iTrader/security/resendOTP',
            data: postData,
            success: function (result) {
                $('.login-messageid').text('')
                $('.login-sendtime').text('')
                $('.login-phone-resendtime').text('')
                if (result && result.data) {
                    console.log(result.data)
                    if (result.data[33]) {
                        $('.login-sendtime').text(messages.login_verify_SMS_remark_time.text + ' ({0})'.format(result.data[33]))
                    }
                    if (result.data[90]) {
                        $('.login-resendtime').text(messages.login_verify_SMS_remark_resendtime.text + ' ({0})'.format(result.data[90]))
                        if (Number(result.data[90]) <= 0) {
                            $('.resend-btn').css('cursor', 'not-allowed').attr('disabled', 'disabled')
                        }
                    }
                    $('.resend-btn').css('cursor', 'not-allowed').attr('disabled', 'disabled')
                    if (result.data[91]) {
                        $('.login-messageid').text(messages.login_verify_SMS_remark_messageid.text + ' ({0})'.format(result.data[91]))
                    }
                } else {
                    if (result && result.error && result.error[39]) {
                        result.error[39] = 'SSMITSERR_' + result.error[39]
                    }
                    handleError(result.error)
                }
            },
            error: handleError
        })
    }
}

function HandleToken() {
    PassOneStep()
    login_submit.text(messages.login_btn_token.text)
    login_submit.val('token')
    var container = $('#verify-token-code')
    tokenCode = container.find('input')
    container.removeClass('hidden')
    TransformTokenType(container)

}

function HandleEBSToken() {
    PassOneStep()
    login_submit.text(messages.login_btn_token.text)
    login_submit.val('token')
    var container = $('#verify-EBSToken-code')
    tokenCode = container.find('input')
    container.removeClass('hidden')
    VerifyEBSLogin(container)
    TransformTokenType(container)
}

function switchTo(tokenType) {
    currentTokenType = tokenType
    switch (tokenType) {
        case '-1': SelectHandle(); break
        case '0': PassLogin(); break
        case '1': HandlePINToken(); break
        case '2': HandleEmailToken(); break
        case '3': HandleSMSToken(); break
        case '4': HandleToken(); break
        case '5': HandleEBSToken(); break
        default: break
    }
}

function ResendDactcode(sessionID) {
    var data = {}
    data.sessionID = sessionID
    $.ajax({
        type: 'post',
        url: '/iTrader/security/resendActCode',
        data: data,
        success: function (result) {
            if (result && result.error) {
                if (result && result.error && result.error[39]) {
                    result.error[39] = 'SSMITSERR_' + result.error[39]
                }
                handleError(result.error)
            } else {
                if (result && result.data) {
                    alert('ok!')
                }
            }
        },
        error: handleError
    })
}

function VerifyEBSLogin(container) {
    $.ajax({
        type: 'post',
        url: '/iTrader/user/login',
        data: GetPostData({ type: 'querylogin' }),
        success: function (result) {
            if (result.error) {
                if (result.error[39] == 75) return
                if (result.error[39]) {
                    result.error.errorCode = result.error[39]
                }
                ShowErrorMessage(result.error)
                login_submit.text(messages.login_btn_verifyfail.text)
                login_submit.attr('isNeedRefresh', true)
                login_submit.click(function () {
                    var isNeedRefresh = login_submit.attr('isNeedRefresh')
                    if (isNeedRefresh) {
                        window.location.href = '/'
                    }
                })
            } else {
                PassLogin()
            }
        },
        error: function (err, callback) {
            VerifyEBSLogin()
        }
    })
}

function VerifyPIN() {
    if (!pinArray && pinArray < 1) return
    $('.pin-input.active').each(function () {
        $(this).attr('disabled', 'disabled')
    })
    login_submit.attr('disabled', 'disabled')
    $.ajax({
        type: 'post',
        url: '/iTrader/security/pin/verify',
        data: GetPostData(),
        success: function (result) {
            login_submit.removeAttr('disabled')
            if (result) {
                if (result.error) {
                    ShowErrorMessage(result.error)
                } else {
                    PassLogin()
                }
            }
            $('.pin-input.active').each(function () {
                $(this).removeAttr('disabled').val('')
            })
            $('.pin-input.active:first').focus()
        },
        error: function (err, callback) {
            login_submit.removeAttr('disabled')
            handleError(err, callback)
        }
    })
}

function VerifyToken() {
    if (tokenCode && !tokenCode.val()) return   // if tokenCode, must have value
    $.ajax({
        type: 'post',
        url: '/iTrader/user/login',
        data: GetPostData({ type: 'verify' }),
        success: function (result) {
            if (result) {
                if (result.error) {
                    ShowErrorMessage(result.error)
                } else {
                    PassLogin()
                }
            }
        },
        error: function (err, callback) {
            login_submit.removeAttr('disabled')
            handleError(err, callback)
        }
    })
}

function ShowErrorMessage(error) {
    if (!error) return
    if (error.errorCode) {
        error.errorCode = 'SSMITSERR_' + error.errorCode
    }
    var message = getErrorMessage(error)
    if (message) {
        login_alert.removeClass('hidden')
        login_alert_message.text(message)
    }
}

function PassOneStep() {
    login_username.attr('readonly', true)
    login_password.attr('readonly', true)
    $('.captcha-group').addClass('hidden')
}

function SelectHandle() {
    if (!sessionObj) return
    var options = {}
    options.sessionID = sessionObj.sessionID//sessionObj[0]
    options.cmd = 'regtoken'
    options.sessionObj = sessionObj
    console.log(options)
    seajs.use('cregistrationFA', function (chgist) {
        chgist.register2FA(options)
    })
}

function PassLogin() {
    if (!sessionObj) return
    sessionStorage.clear()
    if (sessionObj.pwdExpiryPromptDays >= 0) {
        seajs.use('dialog', function (dialog) {
            dialog.alertMessage({
                message: messages.login_pwd_expiry_prompt.text.format(sessionObj.pwdExpiryPromptDays),
                onclose: function (dialog) {
                    dialog.close()
                    navigate('/iTrader/risk/disclosure')
                }
            })
        })

    } else {
        navigate('/iTrader/risk/disclosure')
    }
}

function GetPostData(options) {
    var pin = ''
    if (pinArray && pinArray.length > 0) {
        for (var i = 0; i < pinArray.length; i++) {
            var position = Number(pinArray[i]) - 1
            pin += $($('.pin-input')[position]).val() + (i + 1 !== pinArray.length ? ',' : '')
        }
    }
    var data = login_form.serialize() + '&tokenType=' + sessionObj['78']
    if (pin) {
        data += (isNewMode ? '&tokenCode=' : '&pin=') + pin
    }
    if (tokenCode) {
        data += tokenCode ? ('&tokenCode=' + tokenCode.val()) : ''
    }
    if (sessionObj && sessionObj.sessionID) {
        data += '&sessionID=' + sessionObj.sessionID
    }
    if (options) {
        for (var p in options) {
            data += '&' + p + '=' + options[p]
        }
    }
    return data
}

function getClientIP(callback) {
    if (!callback) return
    var getCLientIPURL = $("#login-get-client-ip-url").val()
    if (!getCLientIPURL) {
        callback()
    } else {
        $.ajax({
            url: getCLientIPURL,
            type: 'GET',
            cache: false,
            success: function (data) {
                var ip = ''
                var location = ''
                if (data) {
                    if (typeof data === 'object') {
                        ip = data.ip || ''
                        location = data.location || ''
                    } else {
                        var first = data.indexOf('[') + 1
                        var last = data.indexOf(']')
                        var addressFirst = data.lastIndexOf('[') + 1
                        var addressLast = data.lastIndexOf(']')
                        if (last > first && first > 0) {
                            ip = data.substring(first, last)
                        } else {
                            ip = data
                        }
                        if (addressLast > addressFirst && addressFirst > 0) {
                            location = data.substring(addressFirst, addressLast)
                        }
                    }
                }
                callback(ip, location)
            },
            error: function () {
                callback()
            }
        })
    }
}

function ForgetPassword() {
    $('#login-forget-password').click(function () {
        var url = $(this).attr('data-url')
        seajs.use('password', function (pwd) {
            pwd.reset({ url: url }, function (res) {
                login_password.val(res.password)
                login_form.submit()
            })
        })
    })
}

seajs.use('mobile', function (mo) {
    mo.init()
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