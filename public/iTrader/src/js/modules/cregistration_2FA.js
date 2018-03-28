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

{ $Id: cregistration_2FA.js,v 1.1 2018/03/09 10:16:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var dialog = require('dialog')

    var resendTimer
    var sessionObj = {}
    var sessionBak = {}

    function register2FA(options) {
        options = options || {}
        var regist = {}
        regist.sessionID = options.sessionID
        regist.cmd = options.cmd
        dialog.showMessage({
            title: messages.login_2FA_registration_title.text,
            closeByBackdrop: false,
            closeByKeyboard: false,
            load: {
                url: '/iTrader/security/2FARegistration?sessionID=' + (regist.sessionID || ''),
                callback: function () {
                    $(".token-list input:radio").click(function () {
                        var tokenValue = $(this).val()
                        if (tokenValue == 'ebrokerkey') {
                            $('.delivery-method').removeClass('hidden')
                            var value = $(".delivery-list input[name='delivery']:checked").val()
                            regist.tokenType = 5
                            regist.deliveryMethod = value
                            $('.delivery-list input:radio').click(function () {
                                regist.deliveryMethod = $(".delivery-list input[name='delivery']:checked").val()
                            })
                        } else {
                            $('.delivery-method').addClass('hidden')
                            regist.tokenType = tokenValue
                            regist.deliveryMethod = ''
                        }
                    })
                    $(document).translate()
                }
            },
            buttonNameList: ['submit', 'close'],
            callback: function (button, dialog) {
                if (button.name === 'submit') {
                    submit2FARegistration(regist)
                    dialog.close()
                } else if (button.name === 'close') {
                    dialog.close()
                }
            }
        })
    }

    function submit2FARegistration(data) {
        sessionBak = data
        $.ajax({
            type: 'post',
            url: '/iTrader/security/2FARegistration',
            data: data,
            success: function (result) {
                if (result && result.error) {
                    if (result && result.error && result.error[39]) {
                        result.error[39] = 'SSMITSERR_' + result.error[39]
                    }
                    handleError(result.error)
                } else {
                    if (result && result.data) {
                        sessionObj = result.data
                        dialog.showMessage({
                            title: messages.login_2FA_registration_title.text,
                            buttonNameList: sessionBak.tokenType == '5' ? ['relogin', 'resend'] : ['relogin'],
                            closable: false,
                            closeByBackdrop: false,
                            closeByKeyboard: false,
                            message: updateMessageInfo(sessionBak.tokenType),
                            onshown: function () {
                                if (sessionBak.tokenType == '5') {
                                    InitResendBtn(false)
                                }
                            },
                            callback: function (button) {
                                if (button.name === 'relogin') {
                                    window.location.href = '/iTrader/user/logout'
                                }
                                if (button.name === 'resend') {
                                    InitResendBtn(data.sessionID)
                                }
                            }
                        })
                    }
                }
            },
            error: handleError
        })
    }

    function updateMessageInfo(data) {
        if (!data) return
        var box = $('<div>', { class: "col-lg-12 col-md-12 col-xs-12" })
        var msg = $('<p>', { class: "" })
        if (data != '5') {
            msg.append(messages.login_2FA_registration_message.text.format(maskEmailPhone(sessionObj['81'])))
        } else {
            msg.append(messages.login_2FA_registration_message_eBrokerKey.text.format(maskEmailPhone(sessionObj['81'])))
            var sendP = '<p>' + messages.login_2FA_registration_message_time.text.format(maskEmailPhone(sessionObj['131'])) + '</p>'
            msg.append(sendP)
        }
        box.append(msg)
        return box
    }

    function InitResendBtn(sessionID) {
        var btn = $('#btn-resend')
        var interval = sessionObj['80'] ? Number(sessionObj['80']) : 60
        if (interval == null || interval == undefined) return
        if (sessionID) {
            resendActcode(sessionID)
        }
        btn.attr('disabled', 'disabled')
        btn.text(messages.btn_resend.text + '({0}s)'.format(interval)).removeAttr('ready')
        resendTimer = setInterval(function () {
            interval--
            if (interval <= 0) {
                clearInterval(resendTimer)
                btn.removeAttr('disabled')
                btn.text(messages.btn_resend.text).attr('ready', true)
            } else {
                btn.text(messages.btn_resend.text + '({0}s)'.format(interval)).removeAttr('ready')
            }
        }, 1000)
    }

    function resendActcode(sessionID) {
        var data = {}
        data.sessionID = sessionID || ''
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
                        console.log(result.data)
                    }
                }
            },
            error: handleError
        })
    }

    exports.register2FA = register2FA
    exports.InitResendBtn = InitResendBtn
})

