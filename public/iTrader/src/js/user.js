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