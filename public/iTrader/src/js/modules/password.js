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

{ $Id: password.js,v 1.4 2017/11/06 09:34:04 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'change_password'
    var dialog = require('dialog')

    function change(options, callback) {
        var sessionID = ''
        if (options && options.sessionID) {
            sessionID = 'sessionID=' + options.sessionID
        }
        var change_password_panel
        var change_password_form
        dialog.showMessage({
            title: messages.change_password_title.text,
            closeByBackdrop: false,
            closeByKeyboard: false,
            load: {
                url: '/iTrader/security/password/change/?' + sessionID + '&tempNo=' + new Date().getTime(), callback: function () {
                    change_password_panel = $('#change-password-panel')
                    change_password_form = $('#change-password-form')
                    if (sessionID) {
                        change_password_form.find('[name=sessionID]').val(options.sessionID)
                    }
                    change_password_panel.translate()
                    validateForm(change_password_form, {
                        errorPlacement: function (error, element) {
                            error.appendTo(element.parent("div"))
                        },
                        showErrors: function (errorMap, errorList) {
                            if (errorList && errorList.length) {
                                for (var i = 0; i < errorList.length; i++) {
                                    var item = errorList[i]
                                    if (item && item.message && item.message.error) {
                                        if (item.message.error[39] && String(item.message.error[39]).indexOf('SSMITSERR_') < 0) {
                                            item.message.error[39] = 'SSMITSERR_' + item.message.error[39]
                                        }
                                        item.message = getErrorMessage(item.message.error)
                                    }
                                }
                            }
                            this.defaultShowErrors()
                        },
                        submitHandler: function (form) {
                            $.ajax({
                                type: 'post',
                                url: '/iTrader/security/password/change',
                                data: change_password_form.serialize(),
                                success: function (result) {
                                    if (result && result.error) {
                                        if (result && result.error && result.error[tags.errorCode]) {
                                            result.error[tags.errorCode] = 'SSMITSERR_' + result.error[tags.errorCode]
                                        }
                                        handleError(result.error)
                                    } else {
                                        result.password = $('[name=new_password]').val()
                                        dialog.alertMessage({
                                            title: messages.dialog_information_title.text,
                                            message: messages.change_password_success_message.text,
                                            onclose: function (dialog) {
                                                dialog.close()
                                                if (callback) {
                                                    callback(result)
                                                }
                                            }
                                        })
                                    }
                                },
                                error: handleError
                            })
                        },
                    })
                }
            },
            buttonNameList: ['submit', 'reset'],
            callback: function (button, dialog) {
                if (button.name === 'submit') {
                    if (change_password_form.valid()) {
                        change_password_form.submit()
                        dialog.close()
                    }
                } else if (button.name === 'reset') {
                    document.getElementById("change-password-form").reset()
                    change_password_form.find('label.has-error').remove()
                    change_password_form.find('.has-success, .has-error').each(function () {
                        $(this).removeClass('has-success').removeClass('has-error')
                    })
                }
            }
        })
    }

    function reset(options, callback) {
        if (!options || !callback) return
        var url = options.url
        if (!url) return
        var lang = 'EN'
        var langTag = $('html').attr('lang')
        if (langTag == 'zh-CN') {
            lang = 'ZH-CN'
        } else if (langTag === 'zh-HK') {
            lang = 'ZH-HK'
        }
        url += (url.indexOf('?') < 0 ? "?" : '&') + 'CULTURE=' + lang
        dialog.showMessage({
            closeByBackdrop: false,
            closeByKeyboard: false,
            title: messages.login_forget_password_title.text,
            message: "<iframe src='{0}' frameborder='0' height='450px' width='100%'></iframe>".format(url),
        })
    }

    exports.change = change
    exports.reset = reset
})