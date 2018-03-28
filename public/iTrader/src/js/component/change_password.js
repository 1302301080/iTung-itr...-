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

{ $Id: change_password.js,v 1.6 2016/10/27 08:41:17 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var change_password_panel
var change_password_form

function ChangePassword(options, callback) {
    var sessionID = ''
    if (options && options.sessionID) {
        sessionID = 'sessionID=' + options.sessionID
    }
    showMessage({
        title: messages.change_password_title.text,
        load: {
            url: '/iTrader/security/password/change/?' + sessionID + '&tempNo=' + new Date().getTime(), callback: function () {
                change_password_panel = $('#change-password-panel')
                change_password_form = $('#change-password-form')
                if (sessionID) {
                    change_password_form.find('[name=sessionID]').val(options.sessionID)
                }
                change_password_panel.translate()
                validateForm(change_password_form, {
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
                                    result.password = $('#password').val()
                                    alertMessage({
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
                change_password_form.find('.has-success, .has-error').each(function () {
                    $(this).removeClass('has-success').removeClass('has-error')
                })
            }
        }
    })
}
