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

{ $Id: user.js,v 1.1 2016/12/20 11:04:19 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


define(function (require, exports, module) {
    var utility = require('eipo-utility')
    var form = $('#login-form')
    var loginBtn = $('#login-submit')
    var usernameInput = form.find('input[name=username]')
    var passwordInput = form.find('input[name=password]')
    $('#eipo-container').translate('eipo')

    loginBtn.click(function () {
        if (!usernameInput.val()) {
            usernameInput.focus()
            return
        }
        if (!passwordInput.val()) {
            passwordInput.focus()
            return
        }
        $(this).attr('disabled', 'disabled')
        $.post('/eipo/user/login', form.serialize(), function (data) {
            if (data) {
                if (data.error) {
                    utility.alertError(data.error)
                } else if (data.data == true) {
                    window.location.href = '/'
                }
            }
            $(this).removeAttr('disabled')
        }.bind(this))
    })

    utility.upperCaseInput()

    form.find('input').on('keypress', function (e) {
        if (e.keyCode === 13) {
            loginBtn.trigger('click')
        }
    })
})
